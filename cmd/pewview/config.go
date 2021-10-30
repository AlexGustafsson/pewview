package main

import (
	"github.com/AlexGustafsson/pewview/internal/version"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// arg:"-v,--verbose" help:"verbosity level"`

type Config struct {
	Log LogConfig `group:"Logging" namespace:"log"`

	/// Consumers

	EnabledConsumers []string `long:"consumer" description:"Consumers to enable" choice:"ipfix" choice:"netflow" choice:"sflow"`

	IPFix struct {
		Address string `long:"address" description:"Listening address" default-mask:"<unset>"`
		Port    int    `long:"port" description:"Listening port" default:"2055"`
		Workers int    `long:"workers" description:"Worker count" default:"1"`
	} `group:"IPFix Consumer" namespace:"ipfix"`

	NetFlow struct {
		Address string `long:"address" description:"Listening address" default-mask:"<unset>"`
		Port    int    `long:"port" description:"Listening port" default:"2056"`
		Workers int    `long:"workers" description:"Worker count" default:"1"`
	} `group:"Netflow Consumer" namespace:"netflow"`

	SFlow struct {
		Address string `long:"address" description:"Listening address" default-mask:"<unset>"`
		Port    int    `long:"port" description:"Listening port" default:"6343"`
		Workers int    `long:"workers" description:"Worker count" default:"1"`
	} `group:"SFlow Consumer" namespace:"sflow"`

	/// Location providers

	EnabledLocationProviders []string `long:"location-provider" description:"Location providers to enable" choice:"geolite" choice:"ipgeolocation" choice:"ipapi"`

	GeoLite struct {
		Path string `long:"path" description:"Path to GeoLite2-City.mmdb"`
	} `group:"GeoLite Consumer" namespace:"geolite"`

	IPGeolocation struct {
		Key string `long:"key" description:"API key"`
	} `group:"ipgeolocation.io Consumer" namespace:"ipgeolocation"`

	/// Web

	Web struct {
		Enable  bool   `long:"enable" description:"Enable the built-in web interface"`
		Address string `long:"address" description:"Listening address" default-mask:"<unset>"`
		Port    int    `long:"port" description:"Listening port" default:"8080"`
	} `group:"Web" namespace:"web"`

	/// Metrics

	Metrics struct {
		Window float64 `long:"window" description:"Number of seconds to summarize in a block" default:"60"`
		Expose struct {
			Bytes              bool `long:"bytes" description:"Expose number of bytes sent in a connection"`
			SourceAddress      bool `long:"source-address" description:"Expose source address of a connection"`
			SourcePort         bool `long:"source-port" description:"Expose source port of a connection"`
			DestinationAddress bool `long:"destination-address" description:"Expose destination address of a connection"`
			DestinationPort    bool `long:"destination-port" description:"Expose destination port of a connection"`
		} `group:"Metrics to Expose" namespace:"expose"`
	} `group:"Metrics Tuning" namespace:"metrics"`
}

func (Config) Version() string {
	return version.FullVersion()
}

type LogConfig struct {
	LevelName string        `long:"level" description:"Log level" choice:"debug" choice:"info" choice:"warn" choice:"error" default:"info"`
	Level     zapcore.Level `arg:"-"`
}

func (c *Config) Validate() error {
	if err := c.Log.Validate(); err != nil {
		return err
	}

	return nil
}

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

func (c *Config) ConsumerIsEnabled(name string) bool {
	for _, other := range c.EnabledConsumers {
		if name == other {
			return true
		}
	}
	return false
}
