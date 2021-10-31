package api

import "github.com/gorilla/mux"

// API represents an exposed HTTP API
type API interface {
	// SetupRoutes configures applicable routes for the API, using the provided router
	SetupRoutes(router *mux.Router) error
}
