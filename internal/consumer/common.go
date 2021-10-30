package consumer

type Consumer interface {
	Listen() error
	Messages() chan *Message
}

type Message struct {
	SourceAddress      string `json:"sourceAddress"`
	SourcePort         int    `json:"sourcePort"`
	DestinationAddress string `json:"destinationAddress"`
	DestinationPort    int    `json:"destinationPort"`
	Bytes              uint64 `json:"bytes"`
}
