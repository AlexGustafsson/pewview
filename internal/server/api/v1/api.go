package v1

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/AlexGustafsson/pewview/internal/transform"
	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus"
)

// API is the base API
type API struct {
	// MetricsConfiguration configures what should be kept on ingest
	MetricsConfiguration *MetricsConfiguration

	store *transform.Store

	servedBucketsCount prometheus.Counter
}

// NewAPI creates a new API context
func NewAPI(store *transform.Store) *API {
	api := &API{
		MetricsConfiguration: &MetricsConfiguration{
			IncludeBytes:              false,
			IncludeSourceAddress:      false,
			IncludeDestinationAddress: false,
		},
		store: store,

		servedBucketsCount: prometheus.NewCounter(prometheus.CounterOpts{
			Namespace: "pewview",
			Subsystem: "api_v1",
			Name:      "served_buckets_count",
		}),
	}

	return api
}

func (api *API) SetupRoutes(router *mux.Router) error {
	subrouter := router.PathPrefix("/api/v1").Subrouter()
	subrouter.HandleFunc("/buckets/latest", api.handleLatest)
	subrouter.HandleFunc("/buckets/{timestamp}", api.handleTimestamp)
	return nil
}

func (api *API) handleLatest(response http.ResponseWriter, request *http.Request) {
	window := api.store.LatestWindow()
	api.serveWindow(window, response, request)
}

func (api *API) handleTimestamp(response http.ResponseWriter, request *http.Request) {
	vars := mux.Vars(request)
	timestamp, err := time.Parse(time.RFC3339, vars["timestamp"])
	if err != nil {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(response, "{\"code\":400,\"error\":\"badly formatted timestamp\"}")
		return
	}

	window := api.store.Window(timestamp)
	api.serveWindow(window, response, request)
}

func (api *API) serveWindow(window *transform.CondensedWindow, response http.ResponseWriter, request *http.Request) {
	if window == nil {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusNotFound)
		fmt.Fprint(response, "{\"code\":404,\"error\":\"bucket not found\"}")
	} else {
		bucket := BucketFromWindow(window)
		bucket.Strip(api.MetricsConfiguration)

		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusOK)
		err := json.NewEncoder(response).Encode(bucket)
		if err == nil {
			api.servedBucketsCount.Inc()
		}
	}
}

func (api *API) Collect(c chan<- prometheus.Metric) {
	c <- api.servedBucketsCount
}

func (api *API) Describe(c chan<- *prometheus.Desc) {
	c <- api.servedBucketsCount.Desc()
}
