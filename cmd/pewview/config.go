package main

import (
	"time"

	"github.com/AlexGustafsson/pewview/internal/consumer"
	"github.com/AlexGustafsson/pewview/internal/location"
	"github.com/AlexGustafsson/pewview/internal/version"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// Config represents the application's configuration
type Config struct {
	Log LogConfig `group:"Logging" namespace:"log"`

	/// Commands

	Addresses []string `long:"lookup-address" description:"Print the location of the address and exit. May be used more than once"`

	/// Consumers

	EnabledConsumers []string `long:"consumer" description:"Enable a consumer. May be used more than once" choice:"ipfix" choice:"netflow" choice:"sflow" choice:"webhook"`

	IPFixConsumer struct {
		Address string `long:"address" description:"Listening address" default-mask:"<unset>"`
		Port    int    `long:"port" description:"Listening port" default:"2055"`
		Workers int    `long:"workers" description:"Worker count" default:"1"`
	} `group:"IPFix Consumer" namespace:"consumer.ipfix"`

	NetFlowConsumer struct {
		Address string `long:"address" description:"Listening address" default-mask:"<unset>"`
		Port    int    `long:"port" description:"Listening port" default:"2056"`
		Workers int    `long:"workers" description:"Worker count" default:"1"`
	} `group:"Netflow Consumer" namespace:"consumer.netflow"`

	SFlowConsumer struct {
		Address string `long:"address" description:"Listening address" default-mask:"<unset>"`
		Port    int    `long:"port" description:"Listening port" default:"6343"`
		Workers int    `long:"workers" description:"Worker count" default:"1"`
	} `group:"SFlow Consumer" namespace:"consumer.sflow"`

	WebHookConsumer struct {
		Address string `long:"address" description:"Listening address" default-mask:"<unset>"`
		Port    int    `long:"port" description:"Listening port" default:"8081"`
	} `group:"WebHook Consumer" namespace:"consumer.webhook"`

	/// Location providers

	EnabledLocationProviders []string `long:"geo" description:"Enable a location provider. May be used more than once" choice:"geolite" choice:"ipgeolocation" choice:"ipapi" choice:"file"`

	GeoLiteLocationProvider struct {
		Path string `long:"path" description:"Path to GeoLite2-City.mmdb"`
	} `group:"GeoLite Location Provider" namespace:"geo.geolite"`

	IPGeolocationLocationProvider struct {
		Key string `long:"key" description:"API key" env:"KEY"`
	} `group:"ipgeolocation.io Location Provider" namespace:"geo.ipgeolocation" env-namespace:"PEWVIEW_IPGEOLOCATION"`

	FileLocationProvider struct {
		Path string `long:"path" description:"Path to JSON file containing patterns and locations"`
	} `group:"File-based Location Provider" namespace:"geo.file"`

	/// Web

	Web struct {
		Disable        bool     `long:"disable" description:"Disable the built-in web interface"`
		Address        string   `long:"address" description:"Listening address" default-mask:"<unset>"`
		Port           int      `long:"port" description:"Listening port" default:"8080"`
		AllowedOrigins []string `long:"origin" description:"Origin to allow" default:"*"`
	} `group:"Web" namespace:"web"`

	/// Pipeline

	Pipeline struct {
		QueueSize int `long:"queue" description:"Length of the pipeline's message queue" default:"1024"`
	} `group:"Pipeline" namespace:"pipeline"`

	/// Metrics

	Metrics struct {
		Window time.Duration `long:"window" description:"Duration of a window" default:"1m"`
		Expose struct {
			Bytes              bool `long:"bytes" description:"Expose number of bytes sent in a connection"`
			SourceAddress      bool `long:"source-address" description:"Expose source address of a connection"`
			SourcePort         bool `long:"source-port" description:"Expose source port of a connection"`
			DestinationAddress bool `long:"destination-address" description:"Expose destination address of a connection"`
			DestinationPort    bool `long:"destination-port" description:"Expose destination port of a connection"`
		} `group:"Metrics to Expose" namespace:"expose"`
	} `group:"Metrics Tuning" namespace:"metrics"`

	/// Prometheus

	Prometheus struct {
		Enable bool `long:"enable" description:"Enable /metrics endpoint"`
	} `group:"Prometheus" namespace:"prometheus"`
}

// Version returns the version string of the application
func (Config) Version() string {
	return version.FullVersion()
}

// LogConfig represents configurable values for logging
type LogConfig struct {
	LevelName string        `long:"level" description:"Log level" choice:"debug" choice:"info" choice:"warn" choice:"error" default:"info"`
	Level     zapcore.Level `arg:"-"`
}

// Validate validates the config
func (c *Config) Validate() error {
	if err := c.Log.Validate(); err != nil {
		return err
	}

	return nil
}

// Validate validates the config
func (c *LogConfig) Validate() error {
	switch c.LevelName {
	case "debug":
		c.Level = zap.DebugLevel
	case "info":
		c.Level = zap.InfoLevel
	case "warn":
		c.Level = zap.WarnLevel
	case "error":
		c.Level = zap.ErrorLevel
	}

	return nil
}

// LocationProviderIsEnabled returns true if the named consumer is enabled
func (c *Config) ConsumerIsEnabled(name string) bool {
	for _, other := range c.EnabledConsumers {
		if name == other {
			return true
		}
	}
	return false
}

// LocationProviderIsEnabled returns true if the named location provider is enabled
func (c *Config) LocationProviderIsEnabled(name string) bool {
	for _, other := range c.EnabledLocationProviders {
		if name == other {
			return true
		}
	}
	return false
}

// Consumers returns the configured consumers
func (config *Config) Consumers(log *zap.Logger) ([]consumer.Consumer, error) {
	var consumers []consumer.Consumer

	if config.ConsumerIsEnabled("ipfix") {
		consumer := consumer.NewIPFixConsumer(config.IPFixConsumer.Address, config.IPFixConsumer.Port, config.IPFixConsumer.Workers, log)
		consumers = append(consumers, consumer)
	}

	if config.ConsumerIsEnabled("netflow") {
		consumer := consumer.NewNetFlowConsumer(config.NetFlowConsumer.Address, config.NetFlowConsumer.Port, config.NetFlowConsumer.Workers, log)
		consumers = append(consumers, consumer)
	}

	if config.ConsumerIsEnabled("sflow") {
		consumer := consumer.NewSFlowConsumer(config.SFlowConsumer.Address, config.SFlowConsumer.Port, config.SFlowConsumer.Workers, log)
		consumers = append(consumers, consumer)
	}

	if config.ConsumerIsEnabled("webhook") {
		consumer := consumer.NewWebHookConsumer(config.WebHookConsumer.Address, config.WebHookConsumer.Port, log)
		consumers = append(consumers, consumer)
	}

	return consumers, nil
}

// LocationProviders returns the configured location provider instances
func (config *Config) LocationProviders(log *zap.Logger) (*location.ProviderSet, error) {
	var providers []location.Provider

	if config.LocationProviderIsEnabled("geolite") {
		provider, err := location.NewGeoLiteProvider(config.GeoLiteLocationProvider.Path, log)
		if err != nil {
			return nil, err
		}
		providers = append(providers, provider)
	}

	if config.LocationProviderIsEnabled("ipgeolocation") {
		provider := location.NewIPGeolocationProvider(config.IPGeolocationLocationProvider.Key, log)
		providers = append(providers, provider)
	}

	if config.LocationProviderIsEnabled("ipapi") {
		provider := location.NewIPAPIProvider(log)
		providers = append(providers, provider)
	}

	if config.LocationProviderIsEnabled("file") {
		provider, err := location.NewFileProvider(config.FileLocationProvider.Path, log)
		if err != nil {
			return nil, err
		}
		providers = append(providers, provider)
	}

	return location.NewProviderSet(providers, log), nil
}
