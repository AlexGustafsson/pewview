package pewview

import (
	"context"
	"fmt"
	"github.com/AlexGustafsson/pewview/geoip"
	"github.com/AlexGustafsson/pewview/pewview/api/v1"
	goflow "github.com/cloudflare/goflow/v3/utils"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	log "github.com/sirupsen/logrus"
	"golang.org/x/sync/errgroup"
	"math"
	"net/http"
	"os"
	"time"
)

// Server is the core PewView server
type Server struct {
	Address string
	Workers int

	// NetFlow v9 / IPFIX
	EnableIPFIX  bool
	IPFIXAddress string
	IPFIXPort    int
	ipfix        *goflow.StateNetFlow

	// NetFlow v5 / IPFIX
	EnableNetFlow  bool
	NetFlowAddress string
	NetFlowPort    int
	netFlow        *goflow.StateNFLegacy

	// SFlow
	EnableSFlow  bool
	SFlowAddress string
	SFlowPort    int
	sFlow        *goflow.StateSFlow

	transport *Transport

	GeoIP geoip.GeoIP

	WebRoot    string
	WebAddress string
	WebPort    int

	MetricsConfiguration *v1.MetricsConfiguration

	api    *v1.API
	Window float64
}

func (server *Server) startIPFIX(errorGroup *errgroup.Group) {
	server.ipfix = &goflow.StateNetFlow{
		Transport: server.transport,
		Logger:    log.StandardLogger(),
	}

	errorGroup.Go(func() error {
		log.WithFields(log.Fields{"Type": "IPFIX"}).Infof("Listening on UDP %v:%v", server.Address, server.IPFIXPort)

		return server.ipfix.FlowRoutine(server.Workers, server.IPFIXAddress, server.IPFIXPort, false)
	})
}

func (server *Server) startNetFlow(errorGroup *errgroup.Group) {
	server.netFlow = &goflow.StateNFLegacy{
		Transport: server.transport,
		Logger:    log.StandardLogger(),
	}

	errorGroup.Go(func() error {
		log.WithFields(log.Fields{"Type": "NetFlow"}).Infof("Listening on UDP %v:%v", server.Address, server.NetFlowPort)
		return server.netFlow.FlowRoutine(server.Workers, server.NetFlowAddress, server.NetFlowPort, false)
	})
}

func (server *Server) startSFlow(errorGroup *errgroup.Group) {
	server.sFlow = &goflow.StateSFlow{
		Transport: server.transport,
		Logger:    log.StandardLogger(),
	}

	errorGroup.Go(func() error {
		log.WithFields(log.Fields{"Type": "sFlow"}).Infof("Listening on UDP %v:%v", server.Address, server.SFlowPort)
		return server.sFlow.FlowRoutine(server.Workers, server.SFlowAddress, server.SFlowPort, false)
	})
}

func (server *Server) startWeb(errorGroup *errgroup.Group) {
	router := mux.NewRouter()

	// APIv1
	server.api = v1.NewAPI(router.PathPrefix("/api/v1").Subrouter(), server.Window)
	server.api.MetricsConfiguration = server.MetricsConfiguration

	// Static files
	router.PathPrefix("/").Handler(http.FileServer(http.Dir(server.WebRoot)))

	httpServer := &http.Server{
		Handler:      handlers.CompressHandler(handlers.CombinedLoggingHandler(os.Stdout, router)),
		Addr:         fmt.Sprintf("%v:%v", server.WebAddress, server.WebPort),
		WriteTimeout: 5 * time.Second,
		ReadTimeout:  5 * time.Second,
	}

	errorGroup.Go(func() error {
		log.WithFields(log.Fields{"Type": "Web"}).Infof("Listening on TCP %v:%v", server.Address, server.WebPort)
		return httpServer.ListenAndServe()
	})
}

func (server *Server) handleState(state *State) {
	log.Infof("Got state with %v connections between %v and %v", len(state.Connections), state.Start, state.End)
	bucket := v1.NewBucket(uint64(time.Now().Unix())-uint64(state.Window), state.Window)
	for _, connection := range state.Connections {
		if !connection.SourceLocation.HasCoordinates() || !connection.DestinationLocation.HasCoordinates() {
			log.Debugf("Skipping connectiong with missing location")
			continue
		}

		bytes := uint64(0)
		for _, message := range connection.Messages {
			bytes += message.Bytes
		}

		v1connection := &v1.Connection{
			VisibleOrigin:   math.Max(float64(connection.Start.Unix())-float64(bucket.Origin), 0),
			VisibleDuration: connection.Duration().Seconds(),
			Metrics: &v1.Metrics{
				Bytes:              bytes,
				SourceAddress:      connection.SourceAddress,
				SourcePort:         connection.SourcePort,
				DestinationAddress: connection.DestinationAddress,
				DestinationPort:    connection.DestinationPort,
			},
		}

		if connection.SourceLocation != nil {
			v1connection.Source = v1.NewCoordinate(connection.SourceLocation.Latitude, connection.SourceLocation.Longitude)
		}

		if connection.DestinationLocation != nil {
			v1connection.Destination = v1.NewCoordinate(connection.DestinationLocation.Latitude, connection.DestinationLocation.Longitude)
		}

		bucket.AddConnection(v1connection)
	}
	server.api.AddBucket(bucket)
}

// Start the server using the configured values
func (server *Server) Start() error {
	if server.Workers <= 0 {
		server.Workers = 1
	}

	server.transport = NewTransport(server, server.Window)
	server.transport.Callback = server.handleState

	log.Info("Starting PewView")

	errorGroup, _ := errgroup.WithContext(context.Background())

	// Initialize IPFIX / NetFlow v9
	if server.EnableIPFIX {
		server.startIPFIX(errorGroup)
	}

	// NetFlow v5
	if server.EnableNetFlow {
		server.startNetFlow(errorGroup)
	}

	if server.EnableSFlow {
		server.startSFlow(errorGroup)
	}

	server.startWeb(errorGroup)

	// Wait for all consumers to be started, returns the first error (if any)
	err := errorGroup.Wait()
	if err != nil {
		log.Errorf("Error: Unable to start server: %v", err)
		return fmt.Errorf("unable to start server")
	}

	return nil
}
