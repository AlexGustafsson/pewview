package consumer

import (
	"math/rand"
	"net"
	"time"
)

// RandomConsumer is a consumer that generates random data. Useful for testing and demos
type RandomConsumer struct{}

// NewRandomConsumer creates a new Random consumer
func NewRandomConsumer() *RandomConsumer {
	return &RandomConsumer{}
}

// Listen implements consumer
func (consumer *RandomConsumer) Listen(messages chan *Message) error {
	for {
		messages <- &Message{
			SourceAddress:      consumer.randomAddress(),
			SourcePort:         rand.Intn(0xffff) + 1,
			DestinationAddress: consumer.randomAddress(),
			DestinationPort:    rand.Intn(0xffff) + 1,
			Bytes:              rand.Uint64(),
		}

		// Sleep up to a second
		time.Sleep(time.Duration(rand.Intn(1000)) * time.Millisecond)
	}
}

func (consumer *RandomConsumer) randomAddress() string {
	if rand.Float32() < 0.5 {
		ip := make(net.IP, net.IPv4len)
		rand.Read(ip)
		return ip.String()
	}

	ip := make(net.IP, net.IPv6len)
	rand.Read(ip)
	return ip.String()
}
