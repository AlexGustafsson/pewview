package location

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"time"

	log "github.com/sirupsen/logrus"
	"go.uber.org/zap"
)

// IPAPIProvider is a database from ip-api.com
type IPAPIProvider struct {
	log *zap.Logger
}

// IPAPIResponse is the response of a request to the API
type IPAPIResponse struct {
	Query        string  `json:"query"`
	Status       string  `json:"status"`
	Country      string  `json:"country"`
	CountryCode  string  `json:"countryCode"`
	Region       string  `json:"region"`
	RegionName   string  `json:"regionName"`
	City         string  `json:"city"`
	Zip          string  `json:"zip"`
	Latitude     float64 `json:"lat"`
	Longitude    float64 `json:"lon"`
	Timezone     string  `json:"timezone"`
	ISP          string  `json:"isp"`
	Organization string  `json:"org"`
	ASN          string  `json:"as"`
}

func NewIPAPIProvider(log *zap.Logger) *IPAPIProvider {
	return &IPAPIProvider{
		log: log.With(zap.String("provider", "ipapi")),
	}
}

// Lookup performs an IP lookup
func (provider *IPAPIProvider) Lookup(ip net.IP) (*Location, error) {
	client := http.Client{
		Timeout: time.Second * 2,
	}

	// NOTE: http is not a type here, it's unavailable over HTTPS without purchase
	url := fmt.Sprintf("http://ip-api.com/json/%v", ip.String())
	response, err := client.Get(url)
	if err != nil {
		return nil, err
	}

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}
	log.Debugf("Got message: %s", body)

	record := IPAPIResponse{}
	err = json.Unmarshal(body, &record)
	if err != nil {
		return nil, err
	}

	return &Location{
		CountryName:    record.Country,
		CountryISOCode: record.CountryCode,
		CityName:       record.City,
		Latitude:       record.Latitude,
		Longitude:      record.Longitude,
		AccuracyRadius: 0,
	}, nil
}
