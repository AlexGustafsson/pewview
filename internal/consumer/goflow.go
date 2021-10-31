package consumer

import (
	"net"

	flowmessage "github.com/cloudflare/goflow/v3/pb"
	"go.uber.org/zap"
)

type goFlowState interface {
	FlowRoutine(workers int, addr string, port int, reuseport bool) error
}

// BaseGoFlowConsumer provides a common interface for goflow's consumers
type BaseGoFlowConsumer struct {
	address  string
	port     int
	workers  int
	messages chan *Message
	state    goFlowState
	log      *zap.Logger
}

// Publish implements goflow Publish
func (consumer *BaseGoFlowConsumer) Publish(messages []*flowmessage.FlowMessage) {
	for _, message := range messages {
		consumer.messages <- &Message{
			SourceAddress:      net.IP(message.SrcAddr).String(),
			SourcePort:         int(message.SrcPort),
			DestinationAddress: net.IP(message.DstAddr).String(),
			DestinationPort:    int(message.DstPort),
			Bytes:              message.Bytes,
		}
	}
}

// Listen implements Consumer
func (consumer *BaseGoFlowConsumer) Listen(messages chan *Message) error {
	consumer.log.Info("Listening", zap.String("address", consumer.address), zap.Int("port", consumer.port), zap.Int("workers", consumer.workers))
	consumer.messages = messages
	return consumer.state.FlowRoutine(consumer.workers, consumer.address, consumer.port, false)
}
