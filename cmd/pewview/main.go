package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"runtime"
	"time"

	"github.com/AlexGustafsson/pewview/internal/consumer"
	"github.com/AlexGustafsson/pewview/internal/location"
	"github.com/AlexGustafsson/pewview/internal/server"
	"github.com/AlexGustafsson/pewview/internal/server/api"
	v1 "github.com/AlexGustafsson/pewview/internal/server/api/v1"
	"github.com/AlexGustafsson/pewview/internal/transform"
	flags "github.com/jessevdk/go-flags"
	"github.com/prometheus/client_golang/prometheus"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

func main() {
	// Configure base logging
	logConfig := zap.NewProductionConfig()
	log, err := logConfig.Build()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to initialize logging: %v", err)
		os.Exit(1)
	}
	defer log.Sync()

	// Parse the configuration
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

	// Create an aggregator for all of the configured consumers
	consumers, err := config.Consumers(log)
	if err != nil {
		log.Fatal("Failed to configure consumers", zap.Error(err))
	}
	aggregator := consumer.NewAggregator(consumers)

	// Configure location providers
	locationProviders, err := config.LocationProviders(log)
	if err != nil {
		log.Fatal("Failed to configure location providers", zap.Error(err))
	}

	// Handle lookup of addresses
	if len(config.Addresses) > 0 {
		var locations []*location.Location
		for _, address := range config.Addresses {
			ip := net.ParseIP(address)
			if ip == nil {
				log.Error("failed to parse address", zap.String("address", address))
			}

			location, err := locationProviders.Lookup(ip)
			if err != nil {
				log.Error("failed to lookup address", zap.String("address", address), zap.Error(err))
			}

			locations = append(locations, location)
		}

		json.NewEncoder(os.Stdout).Encode(locations)
		return
	}

	// The error group is used for all of the running services
	errGroup, ctx := errgroup.WithContext(context.Background())

	// Setup and start the store
	store := transform.NewStore(time.Now(), config.Metrics.Window, log)
	prometheus.DefaultRegisterer.MustRegister(store)
	errGroup.Go(func() error {
		store.Load(ctx)
		return nil
	})

	// Setup and start the pipeline
	pipeline := transform.NewPipeline(aggregator, locationProviders, config.Pipeline.QueueSize, config.Metrics.Window, log)
	prometheus.DefaultRegisterer.MustRegister(pipeline)
	errGroup.Go(func() error {
		return pipeline.Start(ctx, store.Input())
	})

	// Setup the API
	apiv1 := v1.NewAPI(store)
	apiv1.MetricsConfiguration = &v1.MetricsConfiguration{
		IncludeBytes:              config.Metrics.Expose.Bytes,
		IncludeSourceAddress:      config.Metrics.Expose.SourceAddress,
		IncludeSourcePort:         config.Metrics.Expose.SourcePort,
		IncludeDestinationAddress: config.Metrics.Expose.DestinationAddress,
		IncludeDestinationPort:    config.Metrics.Expose.DestinationPort,
	}
	prometheus.DefaultRegisterer.MustRegister(apiv1)

	// Setup and start the server
	server := &server.Server{
		WebAddress:     config.Web.Address,
		WebPort:        config.Web.Port,
		APIs:           []api.API{apiv1},
		ExposeMetrics:  config.Prometheus.Enable,
		EnableFrontend: !config.Web.Disable,
		Log:            log,
	}
	errGroup.Go(func() error {
		return server.Start(ctx, store)
	})

	// Wait for all services to exit, or one to fail
	if err := errGroup.Wait(); err != nil {
		log.Fatal("PewView failed to run", zap.Error(err))
	}
}
