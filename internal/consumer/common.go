package consumer

type Consumer interface {
	Listen() error
	Messages() chan *Message
}

type Message struct {
	SourceAddress      string
	SourcePort         int
	DestinationAddress string
	DestinationPort    int
	Bytes              uint64
}
