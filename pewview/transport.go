package pewview

import (
	"github.com/AlexGustafsson/pewview/geoip"
	flowmessage "github.com/cloudflare/goflow/v3/pb"
	log "github.com/sirupsen/logrus"
)

// Transport is a custom transport used for handling incoming messages
type Transport struct {
	GeoIP  geoip.GeoIP
	Server *Server
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
		pair, err := geoip.LookupPair(transport.GeoIP, message.SrcAddr, message.DstAddr)
		if err != nil {
			log.Errorf("Error: unable to get lookup pair from database (%v)", err)
			continue
		}

		log.Debugf("Consumed interaction %v, %v (%v, %v) -> %v, %v (%v, %v)", stringOrDefault(pair.Source.CityName, "Unknown City Name"), stringOrDefault(pair.Source.CountryName, "Unknown Country Name"), pair.Source.Latitude, pair.Source.Longitude, stringOrDefault(pair.Destination.CityName, "Unknown City Name"), stringOrDefault(pair.Destination.CountryName, "Unknown Country Name"), pair.Destination.Latitude, pair.Destination.Longitude)
		err = transport.Server.BroadcastPair(pair)
		if err != nil {
			log.Debugf("Error: unable to broadcast incoming pair", err)
		}
	}
}
