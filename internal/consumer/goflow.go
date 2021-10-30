package consumer

import (
	"net"

	flowmessage "github.com/cloudflare/goflow/v3/pb"
	"go.uber.org/zap"
)

type GoFlowState interface {
	FlowRoutine(workers int, addr string, port int, reuseport bool) error
}

type BaseGoFlowConsumer struct {
	address  string
	port     int
	workers  int
	messages chan *Message
	state    GoFlowState
	log      *zap.Logger
}

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

func (consumer *BaseGoFlowConsumer) Messages() chan *Message {
	return consumer.messages
}

func (consumer *BaseGoFlowConsumer) Listen() error {
	consumer.log.Info("Listening", zap.String("address", consumer.address), zap.Int("port", consumer.port), zap.Int("workers", consumer.workers))
	return consumer.state.FlowRoutine(consumer.workers, consumer.address, consumer.port, false)
}
