package commands

import (
	"fmt"
	"github.com/AlexGustafsson/pewview/geoip"
	"github.com/AlexGustafsson/pewview/pewview"
	"github.com/AlexGustafsson/pewview/pewview/api/v1"
	log "github.com/sirupsen/logrus"
	"github.com/urfave/cli/v2"
	"runtime"
)

func serveCommand(context *cli.Context) error {
	enableIPFIX := context.Bool("consumer.ipfix")
	ipfixAddress := context.String("consumer.ipfix.address")
	ipfixPort := context.Int("consumer.ipfix.port")

	enableNetFlow := context.Bool("consumer.netflow")
	netFlowAddress := context.String("consumer.netflow.address")
	netFlowPort := context.Int("consumer.netflow.port")

	enableSFlow := context.Bool("consumer.sflow")
	sFlowAddress := context.String("consumer.sflow.address")
	sFlowPort := context.Int("consumer.sflow.port")

	enableGeoLite := context.Bool("geoip.geolite")
	geoLitePath := context.String("geoip.geolite.path")

	enableIPGeolocation := context.Bool("geoip.ipgeolocation")
	ipGeolocationKey := context.String("geoip.ipgeolocation.key")

	enableIPAPI := context.Bool("geoip.ipapi")

	webRoot := context.String("web.root")
	webAddress := context.String("web.address")
	webPort := context.Int("web.port")

	metricsWindow := context.Float64("metrics.window")
	metricsConfiguration := &v1.MetricsConfiguration{
		IncludeBytes:              context.Bool("metrics.expose.bytes"),
		IncludeSourceAddress:      context.Bool("metrics.expose.source-address"),
		IncludeSourcePort:         context.Bool("metrics.expose.source-port"),
		IncludeDestinationAddress: context.Bool("metrics.expose.destination-address"),
		IncludeDestinationPort:    context.Bool("metrics.expose.destination-port"),
	}

	if !enableIPFIX && !enableNetFlow && !enableSFlow {
		return fmt.Errorf("No consumer was enabled")
	}

	var geoIP geoip.GeoIP

	if enableGeoLite {
		if geoLitePath == "" {
			return fmt.Errorf("Expected geoip.geolite.path to be set when GeoLite is enabled")
		}

		geolite := &geoip.GeoLite{Reader: nil}
		err := geolite.Open(geoLitePath)
		if err != nil {
			log.Fatalf("Fatal error: could not open GeoLite2 database (%v)", err)
		}
		geoIP = geolite
		defer geolite.Close()
	} else if enableIPGeolocation {
		if ipGeolocationKey == "" {
			return fmt.Errorf("Expected geoip.geolocation.key to be set when ipgeolocation.io is enabled")
		}

		ipGeolocation := &geoip.IPGeolocation{APIKey: ipGeolocationKey}
		geoIP = ipGeolocation
	} else if enableIPAPI {
		ipAPI := &geoip.IPAPI{}
		geoIP = ipAPI
	} else {
		return fmt.Errorf("No GeoIP service enabled")
	}

	// Allow the runtime to span across multiple worker processes
	runtime.GOMAXPROCS(runtime.NumCPU())

	server := &pewview.Server{
		Workers: 1,

		EnableIPFIX:  enableIPFIX,
		IPFIXAddress: ipfixAddress,
		IPFIXPort:    ipfixPort,

		EnableNetFlow:  enableNetFlow,
		NetFlowAddress: netFlowAddress,
		NetFlowPort:    netFlowPort,

		EnableSFlow:  enableSFlow,
		SFlowAddress: sFlowAddress,
		SFlowPort:    sFlowPort,

		GeoIP: geoIP,

		WebRoot:    webRoot,
		WebAddress: webAddress,
		WebPort:    webPort,

		MetricsConfiguration: metricsConfiguration,

		Window: metricsWindow,
	}

	return server.Start()
}
