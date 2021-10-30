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
	messages          chan *consumer.Message
	log               *zap.Logger
}

func NewPipeline(entry consumer.Consumer, locationProviders *location.ProviderSet, queueSize int, log *zap.Logger) *Pipeline {
	return &Pipeline{
		entry:             entry,
		locationProviders: locationProviders,
		messages:          make(chan *consumer.Message, queueSize),
		log:               log,
	}
}

func (pipeline *Pipeline) Start(ctx context.Context, out chan *CondensedWindow) error {
	go pipeline.entry.Listen(pipeline.messages)

	window := NewWindow(5 * time.Second)
	ticker := time.NewTicker(5 * time.Second)

	for {
		select {
		case message := <-pipeline.messages:
			window.Add(message)
		case <-ticker.C:
			oldWindow := window
			window = NewWindow(5 * time.Second)
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
