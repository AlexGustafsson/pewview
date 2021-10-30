package consumer

import (
	goflow "github.com/cloudflare/goflow/v3/utils"
	"go.uber.org/zap"
)

type SFlowConsumer struct {
	BaseGoFlowConsumer
}

func NewSFlowConsumer(address string, port int, workers int, log *zap.Logger) *SFlowConsumer {
	consumer := &SFlowConsumer{
		BaseGoFlowConsumer: BaseGoFlowConsumer{
			address:  address,
			port:     port,
			workers:  workers,
			messages: make(chan *Message),
			log:      log.With(zap.String("consumer", "sflow")),
		},
	}

	consumer.state = &goflow.StateSFlow{
		Transport: consumer,
		Logger:    nil,
	}

	return consumer
}
