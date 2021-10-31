package api

import "github.com/gorilla/mux"

type API interface {
	SetupRoutes(router *mux.Router) error
}
