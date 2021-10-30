package consumer

import (
	goflow "github.com/cloudflare/goflow/v3/utils"
	"go.uber.org/zap"
)

type IPFixConsumer struct {
	BaseGoFlowConsumer
}

func NewIPFixConsumer(address string, port int, workers int, log *zap.Logger) *IPFixConsumer {
	consumer := &IPFixConsumer{
		BaseGoFlowConsumer: BaseGoFlowConsumer{
			address:  address,
			port:     port,
			workers:  workers,
			messages: make(chan *Message),
			log:      log.With(zap.String("consumer", "ipfix")),
		},
	}

	consumer.state = &goflow.StateNetFlow{
		Transport: consumer,
		Logger:    nil,
	}

	return consumer
}
