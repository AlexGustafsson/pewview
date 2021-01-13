package pewview

import (
	flowmessage "github.com/cloudflare/goflow/v3/pb"
	log "github.com/sirupsen/logrus"
	"encoding/json"
)

// Transport is a custom transport used for handling incoming messages
type Transport struct {
	Server *Server
	WindowSize float64
	state *State
}

// NewTransport creates a new transport
func NewTransport(server *Server, windowSize float64) *Transport {
	return &Transport {
		Server: server,
		WindowSize: windowSize,
		state: nil,
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
			window, err := transport.state.Summarize()
			if err != nil {
				log.Errorf("Unable to summarize window: %v", err)
			}

			encodedWindow, err := json.Marshal(window)
			if err != nil {
				log.Errorf("Unable to encode window as JSON: %v", err)
			}

			transport.Server.Broadcast(encodedWindow)

			transport.state = NewState(transport.Server)
		}

		transport.state.Push(message)
	}
}
