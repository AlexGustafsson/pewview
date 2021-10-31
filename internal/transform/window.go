package transform

import (
	"fmt"
	"net"
	"time"

	"github.com/AlexGustafsson/pewview/internal/consumer"
	"github.com/AlexGustafsson/pewview/internal/location"
)

// Connection represents a connection between two address and port pairs over time
type Connection struct {
	SourceAddress      net.IP
	SourcePort         int
	DestinationAddress net.IP
	DestinationPort    int
	// Start is the start of the connection as an offset within the window
	Start time.Duration
	// End is the end of the connection as an offset within the window
	End time.Duration
	// Bytes is the total number of bytes sent from the source to the destination
	Bytes uint64
}

// LocalizedConnection is a Connection with both resolved locations for the source and destination
type LocalizedConnection struct {
	*Connection
	SourceLocation      *location.Location
	DestinationLocation *location.Location
}

// Window represents connections sent in a specific duration of time
type Window struct {
	// Start is the start time of the window
	Start time.Time
	// End is the end time of the window
	End time.Time

	connections map[string]map[string]*Connection
}

// CondensedWindow is a window with processed connections, condensed into unique connections
type CondensedWindow struct {
	Start       time.Time
	End         time.Time
	Connections []*LocalizedConnection
}

// NewWindow creates a new window over the specified duration, starting now
func NewWindow(duration time.Duration) *Window {
	now := time.Now()
	return &Window{
		Start:       now,
		End:         now.Add(duration),
		connections: make(map[string]map[string]*Connection),
	}
}

// Add adds a message to the window
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

// Condense summarized the connection table of the window and returns a condensed window
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

// Duration returns the duration of the window
func (window *CondensedWindow) Duration() time.Duration {
	return window.End.Sub(window.Start)
}

// Duration returns the duration of the window
func (connection *Connection) Duration() time.Duration {
	return connection.End - connection.Start
}
