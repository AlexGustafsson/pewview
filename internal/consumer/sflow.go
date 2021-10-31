package consumer

import (
	goflow "github.com/cloudflare/goflow/v3/utils"
	"go.uber.org/zap"
)

// SFlowConsumer is a consumer of SFlow messages
type SFlowConsumer struct {
	BaseGoFlowConsumer
}

// NewSFlowConsumer creates a new SFlow consumer
func NewSFlowConsumer(address string, port int, workers int, log *zap.Logger) *SFlowConsumer {
	consumer := &SFlowConsumer{
		BaseGoFlowConsumer: BaseGoFlowConsumer{
			address: address,
			port:    port,
			workers: workers,
			log:     log.With(zap.String("consumer", "sflow")),
		},
	}

	consumer.state = &goflow.StateSFlow{
		Transport: consumer,
		Logger:    nil,
	}

	return consumer
}
