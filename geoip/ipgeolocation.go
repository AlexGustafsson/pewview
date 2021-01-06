package geoip

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"strconv"
	"time"
)

// IPGeolocation is a database from ipgeolocation.io
type IPGeolocation struct {
	APIKey string
}

// IPGeolocationResponse is the response of a request to the API
type IPGeolocationResponse struct {
	IP                    string `json:"ip"`
	Hostname              string `json:"hostname"`
	ContinentCode         string `json:"continent_code"`
	ContinentName         string `json:"continent_name"`
	CountryCode2          string `json:"country_code2"`
	CountryCode3          string `json:"country_code3"`
	CountryName           string `json:"country_name"`
	CountryCapital        string `json:"country_capital"`
	StateOrProvince       string `json:"state_province"`
	District              string `json:"district"`
	City                  string `json:"city"`
	ZipCode               string `json:"zipcode"`
	Latitude              string `json:"latitude"`
	Longitude             string `json:"longitude"`
	IsInEU                bool   `json:"is_eu"`
	CallingCode           string `json:"calling_code"`
	CountryTopLevelDomain string `json:"country_tld"`
	Languages             string `json:"languages"`
	CountryFlagURL        string `json:"country_flag"`
	GeoID                 string `json:"geoname_id"`
	ISP                   string `json:"isp"`
	ConnectionType        string `json:"connection_type"`
	Organization          string `json:"organization"`
	ASN                   string `json:"asn"`
	Currency              struct {
		Code   string `json:"code"`
		Name   string `json:"name"`
		Symbol string `json:"symbol"`
	} `json:"currency"`
	TimeZone struct {
		Name                 string  `json:"name"`
		Offset               int     `json:"offset"`
		CurrentTime          string  `json:"current_time"`
		CurrentUNIXTime      float64 `json:"current_time_unix"`
		IsDaylightSavingTime bool    `json:"is_dst"`
		DaylightSavings      int     `json:"dst_savings"`
	}
}

// Lookup performs an IP lookup
func (database *IPGeolocation) Lookup(ip net.IP) (*LookupResult, error) {
	client := http.Client{
		Timeout: time.Second * 2,
	}

	url := fmt.Sprintf("https://api.ipgeolocation.io/ipgeo?apiKey=%v&ip=%v", database.APIKey, ip.String())
	response, err := client.Get(url)
	if err != nil {
		return nil, err
	}

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	record := IPGeolocationResponse{}
	err = json.Unmarshal(body, &record)
	if err != nil {
		return nil, err
	}

	var latitude float64
	latitude = 0
	if record.Latitude != "" {
		latitude, err = strconv.ParseFloat(record.Latitude, 64)
		if err != nil {
			return nil, err
		}
	}

	var longitude float64
	longitude = 0
	if record.Longitude != "" {
		longitude, err = strconv.ParseFloat(record.Longitude, 64)
		if err != nil {
			return nil, err
		}
	}

	return &LookupResult{
		CountryName:    record.CountryName,
		CountryISOCode: record.CountryCode2,
		CityName:       record.City,
		Latitude:       latitude,
		Longitude:      longitude,
		AccuracyRadius: 0,
	}, nil
}
