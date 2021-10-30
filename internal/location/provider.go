package location

import (
	"net"

	"go.uber.org/zap"
)

// Provider is an interface for looking up IP addresses
type Provider interface {
	// Lookup performs an IP lookup
	Lookup(ip net.IP) (*Location, error)
}

type ProviderSet struct {
	Providers []Provider
	log       *zap.Logger
}

func NewProviderSet(providers []Provider, log *zap.Logger) *ProviderSet {
	return &ProviderSet{providers, log}
}

func (set ProviderSet) Lookup(address net.IP) (*Location, error) {
	for _, provider := range set.Providers {
		location, err := provider.Lookup(address)
		if err != nil {
			set.log.Error("failed to lookup source", zap.Error(err))
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
