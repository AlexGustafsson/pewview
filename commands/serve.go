package commands

import (
	"fmt"
	"runtime"
	"github.com/AlexGustafsson/pewview/pewview"
	log "github.com/sirupsen/logrus"
	"github.com/urfave/cli/v2"
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

	webRoot := context.String("web.root")
	webPort := context.Int("web.port")

	if !enableIPFIX && !enableNetFlow && !enableSFlow {
		return fmt.Errorf("No consumer was enabled")
	}

	if !enableGeoLite {
		return fmt.Errorf("No GeoIP service enabled")
	}

	if enableGeoLite && geoLitePath == "" {
		return fmt.Errorf("Expected geoip.geolite.path to be set when GeoLite is enabled")
	}

	var geoIP pewview.GeoIP

	if enableGeoLite {
		geolite := &pewview.GeoLite{Reader: nil}
		err := geolite.Open(geoLitePath)
		if err != nil {
			log.Fatalf("Fatal error: could not open GeoLite2 database (%v)", err)
		}
		geoIP = geolite
		defer geolite.Close()
	}

	// Allow the runtime to span across multiple worker processes
	runtime.GOMAXPROCS(runtime.NumCPU())

	server := &pewview.Server{
		Address: address,
		Workers: 1,

		EnableIPFIX: enableIPFIX,
		IPFIXPort: ipfixPort,

		EnableNetFlow: enableNetFlow,
		NetFlowPort: netFlowPort,

		EnableSFlow: enableSFlow,
		SFlowPort: sFlowPort,

		GeoIP: geoIP,

		WebRoot: webRoot,
		WebPort: webPort,
	}

	return server.Start()
}
