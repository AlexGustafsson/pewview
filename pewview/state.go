package pewview

import (
	"github.com/AlexGustafsson/pewview/geoip"
	flowmessage "github.com/cloudflare/goflow/v3/pb"
	log "github.com/sirupsen/logrus"
	"net"
	"time"
)

// State ...
type State struct {
	Server *Server
	Start  time.Time
	End    time.Time
}

// Window ...
type Window struct {
}

// Connection represents a connection between two addresses at some point in time
type Connection struct {
	Bytes              uint64
	SourceAddress      net.IP
	DestinationAddress net.IP
}

// NewState ...
func NewState(server *Server) *State {
	return &State{
		Server: server,
		Start:  time.Now(),
		End:    time.Time{},
	}
}

// Push ...
func (state *State) Push(message *flowmessage.FlowMessage) {
	pair, err := geoip.LookupPair(state.Server.GeoIP, message.SrcAddr, message.DstAddr)
	if err != nil {
		log.Errorf("Error: unable to get lookup pair from database (%v)", err)
		return
	}

	log.Debugf("Consumed interaction %v, %v (%v, %v) -> %v, %v (%v, %v)", stringOrDefault(pair.Source.CityName, "Unknown City Name"), stringOrDefault(pair.Source.CountryName, "Unknown Country Name"), pair.Source.Latitude, pair.Source.Longitude, stringOrDefault(pair.Destination.CityName, "Unknown City Name"), stringOrDefault(pair.Destination.CountryName, "Unknown Country Name"), pair.Destination.Latitude, pair.Destination.Longitude)

	if pair.HasCoordinates() {
		// err = state.Server.BroadcastPair(pair)
		// if err != nil {
		//   log.Debugf("Error: unable to broadcast incoming pair", err)
		// }
	}
}

// Summarize summarizes the state into a descriptive format
func (state *State) Summarize() (*Window, error) {
	state.End = time.Now()
	return &Window{}, nil
}

// Duration returns the duration the state has been active
func (state *State) Duration() time.Duration {
	if state.End.IsZero() {
		return time.Now().Sub(state.Start)
	}

	return state.End.Sub(state.Start)
}
