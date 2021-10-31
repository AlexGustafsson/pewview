package location

import (
	"net"

	"go.uber.org/zap"
)

// Provider is an interface for looking up the location of IP addresses
type Provider interface {
	// Lookup performs an IP lookup
	Lookup(ip net.IP) (*Location, error)
}

// ProviderSet represents a set of Providers
type ProviderSet struct {
	// Providers is a list of Providers to use, in the order they are used
	Providers []Provider
	log       *zap.Logger
}

// NewProviderSet creates a new ProviderSet
func NewProviderSet(providers []Provider, log *zap.Logger) *ProviderSet {
	return &ProviderSet{providers, log}
}

// Lookup implements Provider
func (set ProviderSet) Lookup(address net.IP) (*Location, error) {
	for i, provider := range set.Providers {
		location, err := provider.Lookup(address)
		if err != nil {
			set.log.Error("failed to lookup source", zap.Error(err))
			continue
		}

		if !location.HasCoordinates() {
			set.log.Debug("provider returned zeroed coordinates", zap.Int("index", i))
			continue
		}

		return location, nil
	}

	return nil, ErrNotFound
}

// LookupPair looks up two pairs at once
func (set ProviderSet) LookupPair(sourceAddress net.IP, destinationAddress net.IP) (*LocationPair, error) {
	source, err := set.Lookup(sourceAddress)
	if err != nil {
		return nil, ErrNotFound
	}

	destination, err := set.Lookup(destinationAddress)
	if err != nil {
		return nil, ErrNotFound
	}

	return &LocationPair{source, destination}, nil
}
