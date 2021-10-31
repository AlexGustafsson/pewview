package consumer

import "fmt"

// Consumer listens for incoming Messages
type Consumer interface {
	// Listen starts the consumer. Messages are published to the provided channel
	Listen(messages chan *Message) error
}

// Message represents a generic network flow message
type Message struct {
	// SourceAddress is the source address, be it an IP or a hostname
	SourceAddress string `json:"sourceAddress"`
	// SourcePort is the source port. 0 indicates an empty field
	SourcePort int `json:"sourcePort"`
	// DestinationAddress is the destination address, be it an IP or a hostname
	DestinationAddress string `json:"destinationAddress"`
	// DestinationPort is the destination port. 0 indicates an empty field
	DestinationPort int `json:"destinationPort"`
	// Bytes is the number of bytes sent
	Bytes uint64 `json:"bytes"`
}

// String returns a readable format of the message
func (message *Message) String() string {
	return fmt.Sprintf("%dB from %s:%d to %s:%d", message.Bytes, message.SourceAddress, message.SourcePort, message.DestinationAddress, message.DestinationPort)
}
