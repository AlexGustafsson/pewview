package v1

import (
	"net"
	"time"

	"github.com/AlexGustafsson/pewview/internal/transform"
)

// Bucket is a data representation for a slice of data at single a point in time
type Bucket struct {
	// Origin is the UNIX time when the bucket was first created, the UTC timestamp formatted according to RFC3339 / ISO8601
	Origin string `json:"origin"`
	// Duration of the bucket in seconds
	Duration float64 `json:"duration"`
	// Connections made in the window of the bucket
	Connections []*Connection `json:"connections"`
}

// BucketFromWindow creates a bucket from a condensed window
func BucketFromWindow(window *transform.CondensedWindow) *Bucket {
	connections := make([]*Connection, len(window.Connections))

	for i, connection := range window.Connections {
		connections[i] = &Connection{
			Origin:      connection.Start.Seconds(),
			Duration:    connection.Duration().Seconds(),
			Source:      NewCoordinate(connection.SourceLocation.Latitude, connection.SourceLocation.Longitude),
			Destination: NewCoordinate(connection.DestinationLocation.Latitude, connection.DestinationLocation.Longitude),
			Metrics: &Metrics{
				Bytes:              connection.Bytes,
				SourceAddress:      connection.SourceAddress,
				SourcePort:         connection.SourcePort,
				DestinationAddress: connection.DestinationAddress,
				DestinationPort:    connection.DestinationPort,
			},
		}
	}

	bucket := &Bucket{
		Origin:      window.Start.UTC().Format(time.RFC3339),
		Duration:    window.Duration().Seconds(),
		Connections: connections,
	}

	return bucket
}

// Connection is one or more connections made between a set of addresses
// and ports under some time
type Connection struct {
	// Origin within the bucket the connection occured
	Origin float64 `json:"origin"`
	// Duration of the connection in seconds
	Duration float64 `json:"duration"`
	// Source coordinate
	Source *Coordinate `json:"source"`
	// Destination coordinate
	Destination *Coordinate `json:"destination"`
	// Metrics
	Metrics *Metrics `json:"metrics"`
}

// Coordinate is a geographical coordinate
type Coordinate struct {
	// Latitude of the coordinate
	Latitude float64 `json:"latitude"`
	// Longitude of the coordinate
	Longitude float64 `json:"longitude"`
}

// Metrics is in-depth data that may be configured to hide sensitive data
type Metrics struct {
	// Bytes sent
	Bytes uint64 `json:"bytes,omitempty"`
	// Source Address of the connection
	SourceAddress net.IP `json:"sourceAddress,omitempty"`
	// Source Port of the connection
	SourcePort int `json:"sourcePort,omitempty"`
	// Destination Address of the connection
	DestinationAddress net.IP `json:"destinationAddress,omitempty"`
	// Destination Port of the connection
	DestinationPort int `json:"destinationPort,omitempty"`
}

// MetricsConfiguration configures what to include in connections' metrics
type MetricsConfiguration struct {
	IncludeBytes              bool
	IncludeSourceAddress      bool
	IncludeSourcePort         bool
	IncludeDestinationAddress bool
	IncludeDestinationPort    bool
}

// AddConnection adds a connection to the bucket
func (bucket *Bucket) AddConnection(connection *Connection) {
	bucket.Connections = append(bucket.Connections, connection)
}

// Strip removes all non-visisble metrics
func (bucket *Bucket) Strip(config *MetricsConfiguration) {
	for _, connection := range bucket.Connections {
		if connection.Metrics == nil {
			continue
		}

		if !config.IncludeBytes {
			connection.Metrics.Bytes = 0
		}

		if !config.IncludeSourceAddress {
			connection.Metrics.SourceAddress = nil
		}

		if !config.IncludeDestinationAddress {
			connection.Metrics.DestinationAddress = nil
		}

		if !config.IncludeSourcePort {
			connection.Metrics.SourcePort = 0
		}

		if !config.IncludeDestinationPort {
			connection.Metrics.DestinationPort = 0
		}
	}
}

// NewCoordinate creates a new coordinate
func NewCoordinate(latitude float64, longitude float64) *Coordinate {
	return &Coordinate{
		Latitude:  latitude,
		Longitude: longitude,
	}
}
