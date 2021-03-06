package geoip

import (
	"github.com/oschwald/maxminddb-golang"
	"net"
)

// GeoLite is a database from MaxMind
type GeoLite struct {
	Reader *maxminddb.Reader
}

// Open opens a database that will need to be closed
func (database *GeoLite) Open(path string) error {
	reader, err := maxminddb.Open(path)
	if err != nil {
		return err
	}

	database.Reader = reader

	return nil
}

func unwrap(values map[string]string, key string) string {
	value := ""
	if values[key] == "" {
		// Return the first key instead
		for key := range values {
			value = values[key]
			break
		}
	} else {
		value = values[key]
	}
	return value
}

// Lookup performs an IP lookup
func (database *GeoLite) Lookup(ip net.IP) (*LookupResult, error) {
	var record struct {
		City struct {
			Names map[string]string `maxminddb:"names"`
		} `maxminddb:"city"`
		Country struct {
			ISOCode string            `maxminddb:"iso_code"`
			Names   map[string]string `maxminddb:"names"`
		} `maxminddb:"country"`
		Location struct {
			AccuracyRadius uint16  `maxminddb:"accuracy_radius"`
			Latitude       float64 `maxminddb:"latitude"`
			Longitude      float64 `maxminddb:"longitude"`
		} `maxminddb:"location"`
	}

	err := database.Reader.Lookup(ip, &record)
	if err != nil {
		return nil, err
	}

	return &LookupResult{
		CountryName:    unwrap(record.Country.Names, "en"),
		CountryISOCode: record.Country.ISOCode,
		CityName:       unwrap(record.City.Names, "en"),
		Latitude:       record.Location.Latitude,
		Longitude:      record.Location.Longitude,
		AccuracyRadius: record.Location.AccuracyRadius,
	}, nil
}

// Close closes the database connection
func (database *GeoLite) Close() {
	if database.Reader != nil {
		database.Reader.Close()
	}
}
