package location

import (
	"net"

	"github.com/oschwald/maxminddb-golang"
	"go.uber.org/zap"
)

// GeoLiteProvider is a provider using MaxMind's services
type GeoLiteProvider struct {
	database *maxminddb.Reader
	log      *zap.Logger
}

// NewGeoLiteProvider creates a new GeoLite provider
func NewGeoLiteProvider(path string, log *zap.Logger) (*GeoLiteProvider, error) {
	database, err := maxminddb.Open(path)
	if err != nil {
		return nil, err
	}

	return &GeoLiteProvider{
		database: database,
		log:      log.With(zap.String("provider", "geolite")),
	}, nil
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

// Lookup implements LocationProvider
func (provider *GeoLiteProvider) Lookup(ip net.IP) (*Location, error) {
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

	err := provider.database.Lookup(ip, &record)
	if err != nil {
		return nil, err
	}

	return &Location{
		CountryName:    unwrap(record.Country.Names, "en"),
		CountryISOCode: record.Country.ISOCode,
		CityName:       unwrap(record.City.Names, "en"),
		Latitude:       record.Location.Latitude,
		Longitude:      record.Location.Longitude,
		AccuracyRadius: record.Location.AccuracyRadius,
	}, nil
}

// Close closes the database connection
func (provider *GeoLiteProvider) Close() {
	if provider.database != nil {
		provider.database.Close()
	}
}
