package server

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/AlexGustafsson/pewview/frontend"
	"github.com/AlexGustafsson/pewview/internal/server/api"
	"github.com/AlexGustafsson/pewview/internal/transform"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"
)

// Server exposes APIs, metrics and the frontend
type Server struct {
	WebAddress     string
	WebPort        int
	AllowedOrigins []string

	ExposeMetrics  bool
	EnableFrontend bool

	APIs []api.API

	Log *zap.Logger
}

// Start the server
func (server *Server) Start(ctx context.Context, store *transform.Store) error {
	server.Log.Info("Starting PewView")

	router := mux.NewRouter()

	router.Use(handlers.CORS(handlers.AllowedOrigins(server.AllowedOrigins)))

	for _, api := range server.APIs {
		api.SetupRoutes(router)
	}

	// Static files
	// TODO: Include as compiled FS
	// router.PathPrefix("/").Handler(http.FileServer(http.Dir(server.WebRoot)))

	// Metrics
	if server.ExposeMetrics {
		router.Handle("/metrics", promhttp.Handler())
	}

	if server.EnableFrontend {
		router.PathPrefix("/").Handler(frontend.NewFrontend())
	}

	httpServer := &http.Server{
		Handler:      handlers.CompressHandler(handlers.CombinedLoggingHandler(os.Stdout, router)),
		Addr:         fmt.Sprintf("%v:%v", server.WebAddress, server.WebPort),
		WriteTimeout: 5 * time.Second,
		ReadTimeout:  5 * time.Second,
	}

	server.Log.Info("Listening", zap.String("address", server.WebAddress), zap.Int("port", server.WebPort))
	return httpServer.ListenAndServe()
}
