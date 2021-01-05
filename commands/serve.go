package commands

import (
	"fmt"
	"runtime"
	"net"
	"github.com/AlexGustafsson/pewview/utils"
	goflow "github.com/cloudflare/goflow/v3/utils"
	log "github.com/sirupsen/logrus"
	"github.com/urfave/cli/v2"
	"sync"
)

func serveCommand(context *cli.Context) error {
	address := context.String("address")

	enableIPFIX := context.Bool("ipfix")
	ipfixPort := context.Int("ipfix.port")

	enableNetFlow := context.Bool("netflow")
	netFlowPort := context.Int("netflow.port")

	enableSFlow := context.Bool("sflow")
	sFlowPort := context.Int("sflow.port")

	enableGeoLite := context.Bool("geoip.geolite")
	geoLitePath := context.String("geoip.geolite.path")

	if !enableIPFIX && !enableNetFlow && !enableSFlow {
		return fmt.Errorf("No consumer was enabled")
	}

	if !enableGeoLite {
		return fmt.Errorf("No GeoIP service enabled")
	}

	if enableGeoLite && geoLitePath == "" {
		return fmt.Errorf("Expected geoip.geolite.path to be set when GeoLite is enabled")
	}

	var geoIP utils.GeoIP

	if enableGeoLite {
		geolite := &utils.GeoLite{Reader: nil}
		err := geolite.Open(geoLitePath)
		if err != nil {
			log.Fatalf("Fatal error: could not open GeoLite2 database (%v)", err)
		}
		geoIP = geolite
		defer geolite.Close()
	}

	return serve(1, address, enableIPFIX, ipfixPort, enableNetFlow, netFlowPort, enableSFlow, sFlowPort, geoIP)
}

func serve(workers int, address string, enableIPFIX bool, ipfixPort int, enableNetFlow bool, netFlowPort int, enableSFlow bool, sFlowPort int, geoIP utils.GeoIP) error {
	ip := net.ParseIP("81.2.69.142")
	lookup, err := geoIP.Lookup(ip)
	if err != nil {
		log.Errorf("Error: unable to get address from database (%v)", err)
	}
	log.Infof("Got address: %v: %v", lookup.CountryName, lookup.CityName)

	var transport goflow.Transport
	transport = &utils.PewViewTransport{}

	// Allow the runtime to span across multiple worker processes
	runtime.GOMAXPROCS(runtime.NumCPU())

	log.Info("Starting PewView")

	// IPFIX / NetFlow v9
	ipfix := &goflow.StateNetFlow{
		Transport: transport,
		Logger:    log.StandardLogger(),
	}

	// NetFlow v5
	netflow := &goflow.StateNFLegacy{
		Transport: transport,
		Logger:    log.StandardLogger(),
	}

	sFlow := &goflow.StateSFlow{
		Transport: transport,
		Logger:    log.StandardLogger(),
	}

	wg := &sync.WaitGroup{}

	// Initialize IPFIX / NetFlow v9
	if enableIPFIX {
		wg.Add(1)
		go func() {
			log.WithFields(log.Fields{"Type": "IPFIX"}).Infof("Listening on UDP %v:%v", address, ipfixPort)

			err := ipfix.FlowRoutine(workers, address, ipfixPort, false)
			if err != nil {
				log.Fatalf("Fatal error: could not listen to UDP (%v)", err)
			}
			wg.Done()
		}()
	}

	// Initialize NetFlow v5
	if enableNetFlow {
		wg.Add(1)
		go func() {
			log.WithFields(log.Fields{"Type": "NetFlow"}).Infof("Listening on UDP %v:%v", address, netFlowPort)

			err := netflow.FlowRoutine(workers, address, netFlowPort, false)
			if err != nil {
				log.Fatalf("Fatal error: could not listen to UDP (%v)", err)
			}
			wg.Done()
		}()
	}

	// Initialize sFlow
	if enableSFlow {
		wg.Add(1)
		go func() {
			log.WithFields(log.Fields{"Type": "sFlow"}).Infof("Listening on UDP %v:%v", address, sFlowPort)

			err := sFlow.FlowRoutine(workers, address, sFlowPort, false)
			if err != nil {
				log.Fatalf("Fatal error: could not listen to UDP (%v)", err)
			}
			wg.Done()
		}()
	}

	// Wait for all consumers to be initialized
	wg.Wait()

	return nil
}
