package main

import (
	"context"
	"fmt"
	"os"
	"runtime"

	"github.com/AlexGustafsson/pewview/internal/consumer"
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

	var consumers []consumer.Consumer

	if config.ConsumerIsEnabled("ipfix") {
		consumer := consumer.NewIPFixConsumer(config.IPFix.Address, config.IPFix.Port, config.IPFix.Workers, log)
		consumers = append(consumers, consumer)
	}

	if config.ConsumerIsEnabled("netflow") {
		consumer := consumer.NewNetFlowConsumer(config.NetFlow.Address, config.NetFlow.Port, config.NetFlow.Workers, log)
		consumers = append(consumers, consumer)
	}

	if config.ConsumerIsEnabled("sflow") {
		consumer := consumer.NewSFlowConsumer(config.SFlow.Address, config.SFlow.Port, config.SFlow.Workers, log)
		consumers = append(consumers, consumer)
	}

	server := &server.Server{
		Consumers: consumers,

		WebRoot:    "",
		WebAddress: config.Web.Address,
		WebPort:    config.Web.Port,

		Window: config.Metrics.Window,
	}

	server.Start(context.Background())
}
