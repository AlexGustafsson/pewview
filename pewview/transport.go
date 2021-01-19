package pewview

import (
	flowmessage "github.com/cloudflare/goflow/v3/pb"
	goflow "github.com/cloudflare/goflow/v3/utils"
	log "github.com/sirupsen/logrus"
	"time"
)

// Transport is a custom transport used for handling incoming messages
type Transport struct {
	Server *Server
	// Window size in seconds
	WindowSize float64
	Callback   func(*State)
	state      *State
	goflow.Transport
}

// NewTransport creates a new transport
func NewTransport(server *Server, windowSize float64) *Transport {
	return &Transport{
		Server:     server,
		WindowSize: windowSize,
		state:      nil,
	}
}

func stringOrDefault(value string, defaultValue string) string {
	if value == "" {
		return defaultValue
	}

	return value
}

// Publish is invoked on every new message
func (transport *Transport) Publish(messages []*flowmessage.FlowMessage) {
	log.WithFields(log.Fields{"Type": "NetFlow"}).Debug("Handling incoming messages")
	for _, message := range messages {
		if transport.state == nil {
			transport.state = NewState(transport.Server)
		} else if transport.state.Duration().Seconds() >= transport.WindowSize {
			// NOTE: Doing it this way assumes that there is a steady stream of incoming
			// messages. If there are non for a while, the deadline will be missed.
			// Consider rewriting this functionality using a parallel pub-sub model instead
			transport.state.End = time.Now()
			transport.Callback(transport.state)

			transport.state = NewState(transport.Server)
		}

		transport.state.Push(message)
	}
}
