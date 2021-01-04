package utils

import (
	"fmt"
	flowmessage "github.com/cloudflare/goflow/v3/pb"
	goflow "github.com/cloudflare/goflow/v3/utils"
	log "github.com/sirupsen/logrus"
)

// PewViewTransport is a custom transport used for handling incoming messages
type PewViewTransport struct {
}

// Publish is invoked on every new message
func (s *PewViewTransport) Publish(messages []*flowmessage.FlowMessage) {
	log.WithFields(log.Fields{"Type": "NetFlow"}).Debug("Handling incoming messages")
	for _, message := range messages {
		formattedMessage := goflow.FlowMessageToString(message)
		log.WithFields(log.Fields{"Type": "NetFlow"}).Debugf("Got message: %v", formattedMessage)
		fmt.Printf("%v\n", formattedMessage)
	}
}
