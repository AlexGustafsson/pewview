package server

import (
	"fmt"
	"net"
	"time"

	"github.com/AlexGustafsson/pewview/internal/location"
	flowmessage "github.com/cloudflare/goflow/v3/pb"
	log "github.com/sirupsen/logrus"
)

// State ...
type State struct {
	Server      *Server
	Start       time.Time
	End         time.Time
	Window      float64
	Connections map[string]*Connection
}

// Connection represents a connection between two addresses at some point in time
type Connection struct {
	Start               time.Time
	End                 time.Time
	Messages            []*flowmessage.FlowMessage
	SourceAddress       net.IP
	SourcePort          uint32
	SourceLocation      *location.LookupResult
	DestinationAddress  net.IP
	DestinationPort     uint32
	DestinationLocation *location.LookupResult
}

// NewState ...
func NewState(server *Server, window float64) *State {
	return &State{
		Server:      server,
		Start:       time.Now(),
		End:         time.Time{},
		Window:      window,
		Connections: make(map[string]*Connection),
	}
}

// NewConnection ...
func NewConnection() *Connection {
	return &Connection{
		Start:    time.Now(),
		End:      time.Time{},
		Messages: make([]*flowmessage.FlowMessage, 0),
	}
}

// Push ...
func (state *State) Push(message *flowmessage.FlowMessage) {
	// TODO: Micro optimization; get rid of the format and constant hashing of the ID?
	id := fmt.Sprintf("%v:%v,%v%v", message.SrcAddr, message.SrcPort, message.DstAddr, message.DstPort)
	connection, exists := state.Connections[id]
	if !exists {
		connection = NewConnection()
		connection.SourceAddress = message.SrcAddr
		connection.SourcePort = message.SrcPort
		connection.DestinationAddress = message.DstAddr
		connection.DestinationPort = message.DstPort
		state.Connections[id] = connection

		pair, err := location.LookupPair(state.Server.LocationProviders, message.SrcAddr, message.DstAddr)
		if err == nil {
			log.Debugf("Consumed interaction %v, %v (%v, %v) -> %v, %v (%v, %v)", stringOrDefault(pair.Source.CityName, "Unknown City Name"), stringOrDefault(pair.Source.CountryName, "Unknown Country Name"), pair.Source.Latitude, pair.Source.Longitude, stringOrDefault(pair.Destination.CityName, "Unknown City Name"), stringOrDefault(pair.Destination.CountryName, "Unknown Country Name"), pair.Destination.Latitude, pair.Destination.Longitude)

			connection.SourceLocation = pair.Source
			connection.DestinationLocation = pair.Destination
		} else {
			log.Errorf("Error: unable to get lookup pair from database (%v)", err)
		}
	}

	connection.Push(message)
}

// Push ...
func (connection *Connection) Push(message *flowmessage.FlowMessage) {
	connection.Messages = append(connection.Messages, message)

	start := time.Unix(int64(message.TimeFlowStart), 0)
	if start.Before(connection.Start) {
		connection.Start = start
	}

	end := time.Unix(int64(message.TimeFlowEnd), 0)
	if end.After(connection.End) {
		connection.End = end
	}
}

// Duration returns the duration the state has been active
// that is, the time in between which the consumer was active
func (state *State) Duration() time.Duration {
	if state.End.IsZero() {
		return time.Now().Sub(state.Start)
	}

	return state.End.Sub(state.Start)
}

// Duration returns the duration the connection has been active
// that is, the time in between which the traffic occured
func (connection *Connection) Duration() time.Duration {
	if connection.End.IsZero() {
		return time.Now().Sub(connection.Start)
	}

	return connection.End.Sub(connection.Start)
}
