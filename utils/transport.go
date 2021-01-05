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
		sourceAddress := message.SrcAddr
		sourceLookup, err := transport.GeoIP.Lookup(sourceAddress)
		if err != nil {
			log.Errorf("Error: unable to get source address from database (%v)", err)
			continue
		}

		destinationAddress := message.DstAddr
		destinationLookup, err := transport.GeoIP.Lookup(destinationAddress)
		if err != nil {
			log.Errorf("Error: unable to get destination address from database (%v)", err)
			continue
		}

		log.Debugf("Consumed interaction %v, %v -> %v, %v", stringOrDefault(sourceLookup.CityName, "Unknown City Name"), stringOrDefault(sourceLookup.CountryName, "Unknown Country Name"), stringOrDefault(destinationLookup.CityName, "Unknown City Name"), stringOrDefault(destinationLookup.CountryName, "Unknown Country Name"))
	}
}
