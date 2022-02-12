package location

import (
	"math/rand"
	"net"
)

// RandomProvider provides random locations. Useful for testing and demos
type RandomProvider struct{}

// NewRandomProvider creates a new file provider
func NewRandomProvider() *RandomProvider {
	return &RandomProvider{}
}

// Lookup implements LocationProvider
func (provider *RandomProvider) Lookup(ip net.IP) (*Location, error) {
	latitude := rand.Float64()*180 - 90
	longitude := rand.Float64()*80 - 180

	return &Location{
		Latitude:  latitude,
		Longitude: longitude,
	}, nil
}
