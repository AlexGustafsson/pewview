package consumer

import (
	"context"

	"golang.org/x/sync/errgroup"
)

type Aggregator struct {
	consumers []Consumer
}

func NewAggregator(consumers []Consumer) *Aggregator {
	return &Aggregator{
		consumers: consumers,
	}
}

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
