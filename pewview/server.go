package pewview

import (
	goflow "github.com/cloudflare/goflow/v3/utils"
  log "github.com/sirupsen/logrus"
  "golang.org/x/sync/errgroup"
  "context"
  "fmt"
)

// Server is the core PewView server
type Server struct {
  Address string
  Workers int

  // NetFlow v9 / IPFIX
  EnableIPFIX bool
  IPFIXPort int
  ipfix *goflow.StateNetFlow

  // NetFlow v5 / IPFIX
  EnableNetFlow bool
  NetFlowPort int
  netFlow *goflow.StateNFLegacy

  // SFlow
  EnableSFlow bool
  SFlowPort int
  sFlow *goflow.StateSFlow

  transport goflow.Transport

  GeoIP GeoIP
}

func (server *Server) startIPFIX(errorGroup *errgroup.Group) {
  server.ipfix = &goflow.StateNetFlow{
    Transport: server.transport,
    Logger:    log.StandardLogger(),
  }

  errorGroup.Go(func() error {
    log.WithFields(log.Fields{"Type": "IPFIX"}).Infof("Listening on UDP %v:%v", server.Address, server.IPFIXPort)

    err := server.ipfix.FlowRoutine(server.Workers, server.Address, server.IPFIXPort, false)
    return err
  })
}

func (server *Server) startNetFlow(errorGroup *errgroup.Group) {
  server.netFlow = &goflow.StateNFLegacy{
		Transport: server.transport,
		Logger:    log.StandardLogger(),
	}

  errorGroup.Go(func() error {
    log.WithFields(log.Fields{"Type": "NetFlow"}).Infof("Listening on UDP %v:%v", server.Address, server.NetFlowPort)
    err := server.netFlow.FlowRoutine(server.Workers, server.Address, server.NetFlowPort, false)
    return err
  })
}

func (server *Server) startSFlow(errorGroup *errgroup.Group) {
  server.sFlow = &goflow.StateSFlow{
		Transport: server.transport,
		Logger:    log.StandardLogger(),
	}

  errorGroup.Go(func() error {
    log.WithFields(log.Fields{"Type": "sFlow"}).Infof("Listening on UDP %v:%v", server.Address, server.SFlowPort)
    err := server.sFlow.FlowRoutine(server.Workers, server.Address, server.SFlowPort, false)
    return err
  })
}

// Start the server using the configured values
func (server *Server) Start() error {
  if server.Workers <= 0 {
    server.Workers = 1
  }

  server.transport = &Transport{GeoIP: server.GeoIP}

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

  // Wait for all consumers to be started, returns the first error (if any)
  err := errorGroup.Wait()
  if err != nil {
    log.Errorf("Error: Unable to start consumers: %v", err)
    return fmt.Errorf("unable to start consumers")
  }

  return nil
}
