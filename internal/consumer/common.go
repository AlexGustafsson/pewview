package consumer

import "fmt"

type Consumer interface {
	Listen(messages chan *Message) error
}

type Message struct {
	SourceAddress      string `json:"sourceAddress"`
	SourcePort         int    `json:"sourcePort"`
	DestinationAddress string `json:"destinationAddress"`
	DestinationPort    int    `json:"destinationPort"`
	Bytes              uint64 `json:"bytes"`
}

func (message *Message) String() string {
	return fmt.Sprintf("%dB from %s:%d to %s:%d", message.Bytes, message.SourceAddress, message.SourcePort, message.DestinationAddress, message.DestinationPort)
}
