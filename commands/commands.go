package commands

import (
	"github.com/urfave/cli/v2"
)

// Commands contains all commands of the application
var Commands = []*cli.Command{
	{
		Name:   "version",
		Usage:  "Show the application's version",
		Action: versionCommand,
	},
	{
		Name:   "serve",
		Usage:  "Start the server",
		Action: serveCommand,
		Flags: []cli.Flag{
			&cli.BoolFlag{
				Name:  "consumer.ipfix",
				Usage: "Enable IPFIX / NetFlow v9",
				Value: false,
			},
			&cli.StringFlag{
				Name:  "consumer.ipfix.address",
				Usage: "Address to listen on for IPFIX / NetFlow v9 traffic",
				Value: "",
			},
			&cli.IntFlag{
				Name:  "consumer.ipfix.port",
				Usage: "Port to consume IPFIX / NetFlow v9 on",
				Value: 2055,
			},
			&cli.BoolFlag{
				Name:  "consumer.netflow",
				Usage: "Enable NetFlow v5",
				Value: false,
			},
			&cli.StringFlag{
				Name:  "consumer.netflow.address",
				Usage: "Address to listen on for NetFlow v5 traffic",
				Value: "",
			},
			&cli.IntFlag{
				Name:  "consumer.netflow.port",
				Usage: "Port to consume NetFlow v5 on",
				Value: 2056,
			},
			&cli.BoolFlag{
				Name:  "consumer.sflow",
				Usage: "Enable sFlow",
				Value: false,
			},
			&cli.StringFlag{
				Name:  "consumer.sflow.address",
				Usage: "Address to listen on for sFlow traffic",
				Value: "",
			},
			&cli.IntFlag{
				Name:  "consumer.sflow.port",
				Usage: "Port to consume sFlow on",
				Value: 6343,
			},
			&cli.BoolFlag{
				Name:  "geoip.geolite",
				Usage: "Use GeoLite2 as a GeoIP database",
				Value: false,
			},
			&cli.StringFlag{
				Name:  "geoip.geolite.path",
				Usage: "Path to GeoLite2-City.mmdb",
			},
			&cli.BoolFlag{
				Name:  "geoip.ipgeolocation",
				Usage: "Use ipgeolocation.io as a GeoIP database",
				Value: false,
			},
			&cli.StringFlag{
				Name:  "geoip.ipgeolocation.key",
				Usage: "API key for ipgeolocation.io",
			},
			&cli.BoolFlag{
				Name:  "geoip.ipapi",
				Usage: "Use ip-api.com as a GeoIP database",
				Value: false,
			},
			&cli.StringFlag{
				Name:  "web.root",
				Usage: "The directory in which the UI lies",
				Value: "./build/frontend",
			},
			&cli.StringFlag{
				Name:  "web.address",
				Usage: "Address to listen on web traffic",
				Value: "",
			},
			&cli.IntFlag{
				Name:  "web.port",
				Usage: "The port to use for web traffic (UI / API)",
				Value: 8080,
			},
		},
	},
}
