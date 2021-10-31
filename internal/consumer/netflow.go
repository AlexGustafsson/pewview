package consumer

import (
	goflow "github.com/cloudflare/goflow/v3/utils"
	"go.uber.org/zap"
)

// NetFlowConsumer is a consumer of NetFlow v5 messages
type NetFlowConsumer struct {
	BaseGoFlowConsumer
}

// NewNetFlowConsumer creates a new NetFlow consumer
func NewNetFlowConsumer(address string, port int, workers int, log *zap.Logger) *NetFlowConsumer {
	consumer := &NetFlowConsumer{
		BaseGoFlowConsumer: BaseGoFlowConsumer{
			address: address,
			port:    port,
			workers: workers,
			log:     log.With(zap.String("consumer", "netflow")),
		},
	}

	consumer.state = &goflow.StateNFLegacy{
		Transport: consumer,
		Logger:    nil,
	}

	return consumer
}
