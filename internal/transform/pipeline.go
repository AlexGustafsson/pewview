package transform

import (
	"context"
	"time"

	"github.com/AlexGustafsson/pewview/internal/consumer"
	"github.com/AlexGustafsson/pewview/internal/location"
	"github.com/prometheus/client_golang/prometheus"
	"go.uber.org/zap"
)

// Pipeline transforms consumed consumer.Messages and publishes CondensedWindows of connections
type Pipeline struct {
	entry             consumer.Consumer
	locationProviders *location.ProviderSet
	window            time.Duration
	messages          chan *consumer.Message
	log               *zap.Logger

	processedMessagesCounter prometheus.Counter
	publishedMessagesCounter prometheus.Counter
	publishedWindowsCounter  prometheus.Counter
}

// NewPipeline creates a new pipeline using the supplied entry as the source of messages
func NewPipeline(entry consumer.Consumer, locationProviders *location.ProviderSet, queueSize int, window time.Duration, log *zap.Logger) *Pipeline {
	return &Pipeline{
		entry:             entry,
		locationProviders: locationProviders,
		window:            window,
		messages:          make(chan *consumer.Message, queueSize),
		log:               log,

		processedMessagesCounter: prometheus.NewCounter(prometheus.CounterOpts{
			Namespace: "pewview",
			Subsystem: "pipeline",
			Name:      "processed_messages_count",
		}),
		publishedMessagesCounter: prometheus.NewCounter(prometheus.CounterOpts{
			Namespace: "pewview",
			Subsystem: "pipeline",
			Name:      "published_messages_count",
		}),
		publishedWindowsCounter: prometheus.NewCounter(prometheus.CounterOpts{
			Namespace: "pewview",
			Subsystem: "pipeline",
			Name:      "published_windows_count",
		}),
	}
}

// Start starts processing messages in the pipeline. CondensedWindows are published to the output channel
func (pipeline *Pipeline) Start(ctx context.Context, out chan *CondensedWindow) error {
	go pipeline.entry.Listen(pipeline.messages)

	window := NewWindow(pipeline.window)
	ticker := time.NewTicker(pipeline.window)

	for {
		select {
		case message := <-pipeline.messages:
			window.Add(message)
			pipeline.processedMessagesCounter.Inc()
		case <-ticker.C:
			oldWindow := window
			window = NewWindow(pipeline.window)
			go pipeline.publish(oldWindow, out)
		case <-ctx.Done():
			return nil
		}
	}
}

func (pipeline *Pipeline) publish(window *Window, out chan *CondensedWindow) {
	condensed := window.Condense(pipeline.locationProviders)
	out <- condensed
	pipeline.publishedWindowsCounter.Inc()
	pipeline.publishedMessagesCounter.Add(float64(len(condensed.Connections)))
}

// Collect implements prometheus.Collector
func (pipeline *Pipeline) Collect(c chan<- prometheus.Metric) {
	c <- pipeline.processedMessagesCounter
	c <- pipeline.publishedWindowsCounter
}

// Describe implements prometheus.Collector
func (pipeline *Pipeline) Describe(c chan<- *prometheus.Desc) {
	c <- pipeline.processedMessagesCounter.Desc()
	c <- pipeline.publishedWindowsCounter.Desc()
}
