package v1

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"net/http"
	"strconv"
	"time"
)

// API is the base API
type API struct {
	router       *mux.Router
	buckets      map[uint64]*Bucket
	latestBucket uint64
	Origin       uint64
	Window       float64
	// MetricsConfiguration configures what should be kept on ingest
	MetricsConfiguration *MetricsConfiguration
}

// NewAPI creates a new API context
func NewAPI(router *mux.Router, window float64) *API {
	api := &API{
		router:       router,
		buckets:      make(map[uint64]*Bucket),
		latestBucket: 0,
		Origin:       uint64(time.Now().Unix()),
		Window:       window,
		MetricsConfiguration: &MetricsConfiguration{
			IncludeBytes:              false,
			IncludeSourceAddress:      false,
			IncludeDestinationAddress: false,
		},
	}

	router.HandleFunc("/buckets/latest", api.handleLatest)
	router.HandleFunc("/buckets/{bucket}", api.handleBucket)

	return api
}

// AddBucket adds a bucket to the specified window. Overwrites any existing bucket
func (api *API) AddBucket(bucket *Bucket) {
	bucket.Strip(api.MetricsConfiguration)
	window := (bucket.Origin - api.Origin) / uint64(api.Window)
	api.buckets[window] = bucket
	if bucket.Origin > api.latestBucket {
		api.latestBucket = bucket.Origin
	}
}

// GetBucket returns a bucket based on some time window
func (api *API) GetBucket(time uint64) *Bucket {
	window := (time - api.Origin) / uint64(api.Window)
	bucket, _ := api.buckets[window]
	return bucket
}

func (api *API) handleLatest(response http.ResponseWriter, request *http.Request) {
	api.serveBucket(api.GetBucket(api.latestBucket), response, request)
}

func (api *API) handleBucket(response http.ResponseWriter, request *http.Request) {
	arguments := mux.Vars(request)
	time, err := strconv.ParseUint(arguments["bucket"], 10, 64)
	if err == nil {
		api.serveBucket(api.GetBucket(time), response, request)
	} else {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(response, "{\"error\": \"Bad window\"}")
	}
}

func (api *API) serveBucket(bucket *Bucket, response http.ResponseWriter, request *http.Request) {
	if bucket == nil {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusNotFound)
		fmt.Fprint(response, "{\"error\": \"Bucket not found\"}")
	} else {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusOK)
		json.NewEncoder(response).Encode(bucket)
	}
}
