package pewview

import (
	"context"
	"fmt"
	"github.com/AlexGustafsson/pewview/geoip"
	goflow "github.com/cloudflare/goflow/v3/utils"
	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
	"golang.org/x/sync/errgroup"
	"net/http"
)

// Server is the core PewView server
type Server struct {
	Address string
	Workers int

	// NetFlow v9 / IPFIX
	EnableIPFIX bool
	IPFIXPort   int
	ipfix       *goflow.StateNetFlow

	// NetFlow v5 / IPFIX
	EnableNetFlow bool
	NetFlowPort   int
	netFlow       *goflow.StateNFLegacy

	// SFlow
	EnableSFlow bool
	SFlowPort   int
	sFlow       *goflow.StateSFlow

	transport goflow.Transport

	GeoIP geoip.GeoIP

	WebRoot  string
	WebPort  int
	upgrader *websocket.Upgrader
	hub      *Hub
}

func (server *Server) startIPFIX(errorGroup *errgroup.Group) {
	server.ipfix = &goflow.StateNetFlow{
		Transport: server.transport,
		Logger:    log.StandardLogger(),
	}

	errorGroup.Go(func() error {
		log.WithFields(log.Fields{"Type": "IPFIX"}).Infof("Listening on UDP %v:%v", server.Address, server.IPFIXPort)

		return server.ipfix.FlowRoutine(server.Workers, server.Address, server.IPFIXPort, false)
	})
}

func (server *Server) startNetFlow(errorGroup *errgroup.Group) {
	server.netFlow = &goflow.StateNFLegacy{
		Transport: server.transport,
		Logger:    log.StandardLogger(),
	}

	errorGroup.Go(func() error {
		log.WithFields(log.Fields{"Type": "NetFlow"}).Infof("Listening on UDP %v:%v", server.Address, server.NetFlowPort)
		return server.netFlow.FlowRoutine(server.Workers, server.Address, server.NetFlowPort, false)
	})
}

func (server *Server) startSFlow(errorGroup *errgroup.Group) {
	server.sFlow = &goflow.StateSFlow{
		Transport: server.transport,
		Logger:    log.StandardLogger(),
	}

	errorGroup.Go(func() error {
		log.WithFields(log.Fields{"Type": "sFlow"}).Infof("Listening on UDP %v:%v", server.Address, server.SFlowPort)
		return server.sFlow.FlowRoutine(server.Workers, server.Address, server.SFlowPort, false)
	})
}

func (server *Server) serveWebSocket(response http.ResponseWriter, request *http.Request) {
	log.WithFields(log.Fields{"Type": "Web"}).Debugf("upgrading incoming websocket")
	connection, err := server.upgrader.Upgrade(response, request, nil)
	if err != nil {
		log.WithFields(log.Fields{"Type": "Web"}).Errorf("Error: could not upgrade connection: %v", err)
		return
	}

	client := RegisterClient(connection, server.hub)
	client.send <- []byte("Hello, Client!")
}

func (server *Server) startWeb(errorGroup *errgroup.Group) {
	server.upgrader = &websocket.Upgrader{}
	server.hub = NewHub()
	go server.hub.Run()

	fileServer := http.FileServer(http.Dir(server.WebRoot))
	http.Handle("/", fileServer)

	http.HandleFunc("/ws", func(response http.ResponseWriter, request *http.Request) {
		server.serveWebSocket(response, request)
	})

	errorGroup.Go(func() error {
		log.WithFields(log.Fields{"Type": "Web"}).Infof("Listening on TCP %v:%v", server.Address, server.WebPort)
		address := fmt.Sprintf("%v:%v", server.Address, server.WebPort)
		return http.ListenAndServe(address, nil)
	})
}

// Start the server using the configured values
func (server *Server) Start() error {
	if server.Workers <= 0 {
		server.Workers = 1
	}

	server.transport = NewTransport(server, 60)

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

// Broadcast ...
func (server *Server) Broadcast(message []byte) {
	server.hub.broadcast <- message
}
