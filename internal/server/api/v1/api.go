package v1

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/AlexGustafsson/pewview/internal/transform"
	"github.com/gorilla/mux"
)

// API is the base API
type API struct {
	// MetricsConfiguration configures what should be kept on ingest
	MetricsConfiguration *MetricsConfiguration

	router *mux.Router
	store  *transform.Store
}

// NewAPI creates a new API context
func NewAPI(router *mux.Router, store *transform.Store) *API {
	api := &API{
		MetricsConfiguration: &MetricsConfiguration{
			IncludeBytes:              false,
			IncludeSourceAddress:      false,
			IncludeDestinationAddress: false,
		},

		router: router,
		store:  store,
	}

	router.HandleFunc("/buckets/latest", api.handleLatest)

	return api
}

func (api *API) handleLatest(response http.ResponseWriter, request *http.Request) {
	window := api.store.LatestWindow()
	api.serveWindow(window, response, request)
}

func (api *API) serveWindow(window *transform.CondensedWindow, response http.ResponseWriter, request *http.Request) {
	if window == nil {
		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusNotFound)
		fmt.Fprint(response, "{\"error\": \"bucket not found\"}")
	} else {
		bucket := BucketFromWindow(window)
		bucket.Strip(api.MetricsConfiguration)

		response.Header().Set("Content-Type", "application/json")
		response.WriteHeader(http.StatusOK)
		json.NewEncoder(response).Encode(bucket)
	}
}
