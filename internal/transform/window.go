package transform

import (
	"fmt"
	"net"
	"time"

	"github.com/AlexGustafsson/pewview/internal/consumer"
	"github.com/AlexGustafsson/pewview/internal/location"
)

type Connection struct {
	SourceAddress      net.IP
	SourcePort         int
	DestinationAddress net.IP
	DestinationPort    int
	Start              time.Duration
	End                time.Duration
	Bytes              uint64
}

type LocalizedConnection struct {
	*Connection
	SourceLocation      *location.Location
	DestinationLocation *location.Location
}

type Window struct {
	Start time.Time
	End   time.Time

	connections map[string]map[string]*Connection
}

type CondensedWindow struct {
	Start       time.Time
	End         time.Time
	Connections []*LocalizedConnection
}

func NewWindow(duration time.Duration) *Window {
	now := time.Now()
	return &Window{
		Start:       now,
		End:         now.Add(duration),
		connections: make(map[string]map[string]*Connection),
	}
}

func (window *Window) Add(message *consumer.Message) error {
	sourceID := fmt.Sprintf("%s:%d", message.SourceAddress, message.SourcePort)
	destinationID := fmt.Sprintf("%s:%d", message.DestinationAddress, message.DestinationPort)

	destinations, ok := window.connections[sourceID]
	if !ok {
		destinations = make(map[string]*Connection)
		window.connections[sourceID] = destinations
	}

	connection, ok := destinations[destinationID]
	if !ok {
		// TODO: handle DNS etc. as some consumers may return hostnames instead of IPs
		sourceIP := net.ParseIP(message.SourceAddress)
		if sourceIP == nil {
			return fmt.Errorf("failed to parse source address")
		}

		destinationIP := net.ParseIP(message.DestinationAddress)
		if destinationIP == nil {
			return fmt.Errorf("failed to parse destination address")
		}

		connection = &Connection{
			SourceAddress:      sourceIP,
			SourcePort:         message.SourcePort,
			DestinationAddress: destinationIP,
			DestinationPort:    message.DestinationPort,
			Start:              time.Since(window.Start),
			Bytes:              0,
		}
		destinations[destinationID] = connection
	}

	connection.End = time.Since(window.Start)
	connection.Bytes += message.Bytes

	return nil
}

func (window *Window) Condense(locationProviders *location.ProviderSet) *CondensedWindow {
	var connections []*LocalizedConnection
	for _, destinations := range window.connections {
		for _, connection := range destinations {
			locations, err := locationProviders.LookupPair(connection.SourceAddress, connection.DestinationAddress)
			if err != nil {
				continue
			}

			connections = append(connections, &LocalizedConnection{
				Connection:          connection,
				SourceLocation:      locations.Source,
				DestinationLocation: locations.Destination,
			})
		}
	}

	return &CondensedWindow{
		Start:       window.Start,
		End:         window.End,
		Connections: connections,
	}
}

func (window *CondensedWindow) Duration() time.Duration {
	return window.End.Sub(window.Start)
}

func (connection *Connection) Duration() time.Duration {
	return connection.End - connection.Start
}
