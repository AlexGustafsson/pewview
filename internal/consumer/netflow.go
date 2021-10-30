package consumer

import (
	goflow "github.com/cloudflare/goflow/v3/utils"
	"go.uber.org/zap"
)

type NetFlowConsumer struct {
	BaseGoFlowConsumer
}

func NewNetFlowConsumer(address string, port int, workers int, log *zap.Logger) *NetFlowConsumer {
	consumer := &NetFlowConsumer{
		BaseGoFlowConsumer: BaseGoFlowConsumer{
			address:  address,
			port:     port,
			workers:  workers,
			messages: make(chan *Message),
			log:      log.With(zap.String("consumer", "netflow")),
		},
	}

	consumer.state = &goflow.StateNFLegacy{
		Transport: consumer,
		Logger:    nil,
	}

	return consumer
}
