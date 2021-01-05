package utils

import (
	flowmessage "github.com/cloudflare/goflow/v3/pb"
	log "github.com/sirupsen/logrus"
)

// PewViewTransport is a custom transport used for handling incoming messages
type PewViewTransport struct {
	GeoIP GeoIP
}

func stringOrDefault(value string, defaultValue string) string {
	if value == "" {
		return defaultValue
	}

	return value
}

// Publish is invoked on every new message
func (transport *PewViewTransport) Publish(messages []*flowmessage.FlowMessage) {
	log.WithFields(log.Fields{"Type": "NetFlow"}).Debug("Handling incoming messages")
	for _, message := range messages {
		pair, err := LookupPair(transport.GeoIP, message.SrcAddr, message.DstAddr)
		if err != nil {
			log.Errorf("Error: unable to get lookup pair from database (%v)", err)
			continue
		}

		log.Debugf("Consumed interaction %v, %v -> %v, %v", stringOrDefault(pair.Source.CityName, "Unknown City Name"), stringOrDefault(pair.Source.CountryName, "Unknown Country Name"), stringOrDefault(pair.Destination.CityName, "Unknown City Name"), stringOrDefault(pair.Destination.CountryName, "Unknown Country Name"))
	}
}
