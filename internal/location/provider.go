package location

import (
	"net"
)

// Provider is an interface for looking up IP addresses
type Provider interface {
	// Lookup performs an IP lookup
	Lookup(ip net.IP) (*LookupResult, error)
}
