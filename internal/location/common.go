package location

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

// HasCoordinates returns true if the coordinates are non-zero
func (result *LookupResult) HasCoordinates() bool {
	return result.Latitude != 0 && result.Longitude != 0
}

// HasCoordinates returns true if the coordinates are non-zero
func (pair *LookupResultPair) HasCoordinates() bool {
	return pair.Source.HasCoordinates() && pair.Destination.HasCoordinates()
}
