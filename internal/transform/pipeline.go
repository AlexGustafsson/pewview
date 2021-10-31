package transform

import (
	"context"
	"time"

	"github.com/AlexGustafsson/pewview/internal/consumer"
	"github.com/AlexGustafsson/pewview/internal/location"
	"go.uber.org/zap"
)

type Pipeline struct {
	entry             consumer.Consumer
	locationProviders *location.ProviderSet
	window            time.Duration
	messages          chan *consumer.Message
	log               *zap.Logger
}

func NewPipeline(entry consumer.Consumer, locationProviders *location.ProviderSet, queueSize int, window time.Duration, log *zap.Logger) *Pipeline {
	return &Pipeline{
		entry:             entry,
		locationProviders: locationProviders,
		window:            window,
		messages:          make(chan *consumer.Message, queueSize),
		log:               log,
	}
}

func (pipeline *Pipeline) Start(ctx context.Context, out chan *CondensedWindow) error {
	go pipeline.entry.Listen(pipeline.messages)

	window := NewWindow(pipeline.window)
	ticker := time.NewTicker(pipeline.window)

	for {
		select {
		case message := <-pipeline.messages:
			window.Add(message)
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
}
