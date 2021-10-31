package location

import (
	"errors"
)

var (
	// ErrNotFound is returned if the location could not be found
	ErrNotFound = errors.New("no location found")
)

// Location is a location as resolved by a GeoIP interface
type Location struct {
	CountryName    string
	CountryISOCode string
	CityName       string
	Latitude       float64
	Longitude      float64
	AccuracyRadius uint16
}

// LocationPair is a source-destination pair of lookup results
type LocationPair struct {
	Source      *Location
	Destination *Location
}

// HasCoordinates returns true if the coordinates are non-zero
func (result *Location) HasCoordinates() bool {
	return result.Latitude != 0 && result.Longitude != 0
}

// HasCoordinates returns true if the coordinates are non-zero
func (pair *LocationPair) HasCoordinates() bool {
	return pair.Source.HasCoordinates() && pair.Destination.HasCoordinates()
}
