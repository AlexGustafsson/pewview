package server

import (
	"context"
	"fmt"
	"math"
	"net/http"
	"os"
	"time"

	"github.com/AlexGustafsson/pewview/internal/consumer"
	"github.com/AlexGustafsson/pewview/internal/location"
	v1 "github.com/AlexGustafsson/pewview/internal/server/api/v1"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	log "github.com/sirupsen/logrus"
	"golang.org/x/sync/errgroup"
)

// Server is the core PewView server
type Server struct {
	Consumers         []consumer.Consumer
	LocationProviders *location.ProviderSet

	WebRoot    string
	WebAddress string
	WebPort    int

	MetricsConfiguration *v1.MetricsConfiguration

	api    *v1.API
	Window float64
}

func (server *Server) startWeb() error {
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

	log.WithFields(log.Fields{"Type": "Web"}).Infof("Listening on TCP %v:%v", server.WebAddress, server.WebPort)
	return httpServer.ListenAndServe()
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
func (server *Server) Start(ctx context.Context) error {
	log.Info("Starting PewView")

	errorGroup, _ := errgroup.WithContext(ctx)

	for _, consumer := range server.Consumers {
		errorGroup.Go(consumer.Listen)
	}

	errorGroup.Go(server.startWeb)

	// Wait for all consumers to be started, returns the first error (if any)
	return errorGroup.Wait()
}
