package utils

import (
  "net"
  "github.com/oschwald/maxminddb-golang"
)

// City is a location as resolved by a GeoIP interface
type City struct {
  Name string
  Latitude float32
  Longitude float32
}

// GeoIP is an interface for looking up IP addresses
type GeoIP interface {
  // Lookup performs an IP lookup
	Lookup(ip net.IP) (*City, error)
}

// GeoLite is a database from MaxMind
type GeoLite struct {
  Database *maxminddb.Reader
}

// Open opens a database that will need to be closed
func (database GeoLite) Open(path string) error {
  file, err := maxminddb.Open(path)
  if err != nil {
    return err
  }

  database.Database = file

  return nil
}

// Lookup performs an IP lookup
func (database GeoLite) Lookup(ip net.IP) (*City, error) {
  var record struct {
    Country struct {
      ISOCode string `maxminddb:"iso_code"`
    } `maxminddb:"country"`
  }

  err := database.Database.Lookup(ip, &record)
  if err != nil {
    return nil, err
  }

  return &City {
    Name: record.Country.ISOCode,
  }, nil
}

// Close closes the database connection
func (database GeoLite) Close() {
  if database.Database != nil {
    database.Database.Close()
  }
}
