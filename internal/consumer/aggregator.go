package consumer

import (
	"context"

	"golang.org/x/sync/errgroup"
)

// Aggregator is a consumer which combines the output of other consumers
type Aggregator struct {
	consumers []Consumer
}

// NewAggregator creates a new consumer
func NewAggregator(consumers []Consumer) *Aggregator {
	return &Aggregator{
		consumers: consumers,
	}
}

// Listen implements Consumer
func (aggregator *Aggregator) Listen(messages chan *Message) error {
	errorGroup, _ := errgroup.WithContext(context.Background())

	for _, consumer := range aggregator.consumers {
		consumer := consumer
		errorGroup.Go(func() error {
			return consumer.Listen(messages)
		})
	}

	return errorGroup.Wait()
}
