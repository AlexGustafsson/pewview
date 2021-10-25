package v1

import (
	"net"
)

// Bucket is a data representation for a slice of data at single a point in time
type Bucket struct {
	// Origin is the UNIX time when the bucket was first created
	Origin uint64
	// Duration of the bucket in seconds
	Duration float64
	// Connections made in the window of the bucket
	Connections []*Connection
}

// Connection is one or more connections made between a set of addresses
// and ports under some time
type Connection struct {
	// Visible origin within the bucket the connection occured
	VisibleOrigin float64
	// Visible duration of the connection in seconds
	VisibleDuration float64
	// Source coordinate
	Source *Coordinate
	// Destination coordinate
	Destination *Coordinate
	// Metrics
	Metrics *Metrics
}

// Coordinate is a geographical coordinate
type Coordinate struct {
	// Latitude of the coordinate
	Latitude float64
	// Longitude of the coordinate
	Longitude float64
}

// Metrics is in-depth data that may be configured to hide sensitive data
type Metrics struct {
	// Bytes sent
	Bytes uint64 `json:",omitempty"`
	// Source Address of the connection
	SourceAddress net.IP `json:",omitempty"`
	// Source Port of the connection
	SourcePort uint32 `json:",omitempty"`
	// Destination Address of the connection
	DestinationAddress net.IP `json:",omitempty"`
	// Destination Port of the connection
	DestinationPort uint32 `json:",omitempty"`
}

// MetricsConfiguration configures what to include in connections' metrics
type MetricsConfiguration struct {
	IncludeBytes              bool
	IncludeSourceAddress      bool
	IncludeSourcePort         bool
	IncludeDestinationAddress bool
	IncludeDestinationPort    bool
}

// NewBucket creates a new bucket
func NewBucket(origin uint64, duration float64) *Bucket {
	return &Bucket{
		Origin:      origin,
		Duration:    duration,
		Connections: make([]*Connection, 0),
	}
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
