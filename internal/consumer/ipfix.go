package consumer

import (
	goflow "github.com/cloudflare/goflow/v3/utils"
	"go.uber.org/zap"
)

// IPFixConsumer is a consumer of IPFix / Netflow v9 messages
type IPFixConsumer struct {
	BaseGoFlowConsumer
}

// NewIPFixConsumer creates a new IPFix consumer
func NewIPFixConsumer(address string, port int, workers int, log *zap.Logger) *IPFixConsumer {
	consumer := &IPFixConsumer{
		BaseGoFlowConsumer: BaseGoFlowConsumer{
			address: address,
			port:    port,
			workers: workers,
			log:     log.With(zap.String("consumer", "ipfix")),
		},
	}

	consumer.state = &goflow.StateNetFlow{
		Transport: consumer,
		Logger:    nil,
	}

	return consumer
}
