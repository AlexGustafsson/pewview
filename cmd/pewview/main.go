package main

import (
	"fmt"
	"os"
	"runtime"

	"github.com/AlexGustafsson/pewview/internal/server"
	flags "github.com/jessevdk/go-flags"
	"go.uber.org/zap"
)

func main() {
	logConfig := zap.NewProductionConfig()
	log, err := logConfig.Build()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to initialize logging: %v", err)
		os.Exit(1)
	}
	defer log.Sync()

	var config Config
	_, err = flags.Parse(&config)
	if err == flags.ErrHelp {
		os.Exit(0)
	} else if err != nil {
		os.Exit(1)
	}

	if err := config.Validate(); err != nil {
		fmt.Fprintf(os.Stderr, "config validation failed: %v", err)
		os.Exit(1)
	}

	logConfig.Level.SetLevel(config.Log.Level)

	// Allow the runtime to span across multiple worker processes
	runtime.GOMAXPROCS(runtime.NumCPU())

	server := &server.Server{
		Workers: 1,

		EnableIPFIX:  config.ConsumerIsEnabled("ipfix"),
		IPFIXAddress: config.IPFix.Address,
		IPFIXPort:    config.IPFix.Port,

		EnableNetFlow:  config.ConsumerIsEnabled("netflow"),
		NetFlowAddress: config.Netflow.Address,
		NetFlowPort:    config.Netflow.Port,

		EnableSFlow:  config.ConsumerIsEnabled("sflow"),
		SFlowAddress: config.SFlow.Address,
		SFlowPort:    config.SFlow.Port,

		WebRoot:    "",
		WebAddress: config.Web.Address,
		WebPort:    config.Web.Port,

		Window: config.Metrics.Window,
	}
	server.Start()
}
