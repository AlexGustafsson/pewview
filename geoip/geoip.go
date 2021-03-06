package geoip

import (
	"net"
)

// LookupResult is a location as resolved by a GeoIP interface
type LookupResult struct {
	CountryName    string
	CountryISOCode string
	CityName       string
	Latitude       float64
	Longitude      float64
	AccuracyRadius uint16
}

// LookupResultPair is a source-destination pair of lookup results
type LookupResultPair struct {
	Source      *LookupResult
	Destination *LookupResult
}

// GeoIP is an interface for looking up IP addresses
type GeoIP interface {
	// Lookup performs an IP lookup
	Lookup(ip net.IP) (*LookupResult, error)
}

// LookupPair looks up two pairs at once
func LookupPair(database GeoIP, source net.IP, destination net.IP) (*LookupResultPair, error) {
	sourceResult, err := database.Lookup(source)
	if err != nil {
		return nil, err
	}

	destinationResult, err := database.Lookup(destination)
	if err != nil {
		return nil, err
	}

	return &LookupResultPair{
		Source:      sourceResult,
		Destination: destinationResult,
	}, nil
}

// HasCoordinates returns true if the coordinates are non-zero
func (result *LookupResult) HasCoordinates() bool {
	return result.Latitude != 0 && result.Longitude != 0
}

// HasCoordinates returns true if the coordinates are non-zero
func (pair *LookupResultPair) HasCoordinates() bool {
	return pair.Source.HasCoordinates() && pair.Destination.HasCoordinates()
}
