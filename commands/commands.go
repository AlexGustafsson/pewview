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
			&cli.StringFlag{
				Name:  "address",
				Usage: "Address to listen on",
				Value: "",
			},
			&cli.BoolFlag{
				Name:  "ipfix",
				Usage: "Enable IPFIX / NetFlow v9",
				Value: false,
			},
			&cli.IntFlag{
				Name:  "ipfix.port",
				Usage: "Port to consume IPFIX / NetFlow v9 on",
				Value: 2055,
			},
			&cli.BoolFlag{
				Name:  "netflow",
				Usage: "Enable NetFlow v5",
				Value: false,
			},
			&cli.IntFlag{
				Name:  "netflow.port",
				Usage: "Port to consume NetFlow v5 on",
				Value: 2056,
			},
			&cli.BoolFlag{
				Name:  "sflow",
				Usage: "Enable sFlow",
				Value: false,
			},
			&cli.IntFlag{
				Name:  "sflow.port",
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
			&cli.StringFlag{
				Name:  "web.root",
				Usage: "The directory in which the UI lies",
				Value: "./build/frontend",
			},
			&cli.IntFlag{
				Name:  "web.port",
				Usage: "The port to use for web traffic (UI / API)",
				Value: 8080,
			},
		},
	},
}
