package server

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	v1 "github.com/AlexGustafsson/pewview/internal/server/api/v1"
	"github.com/AlexGustafsson/pewview/internal/transform"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// Server is the core PewView server
type Server struct {
	WebAddress string
	WebPort    int

	MetricsConfiguration *v1.MetricsConfiguration

	Window float64

	Log *zap.Logger
}

// Start the server using the configured values
func (server *Server) Start(ctx context.Context, store *transform.Store) error {
	server.Log.Info("Starting PewView")

	router := mux.NewRouter()

	// APIv1
	api := v1.NewAPI(router.PathPrefix("/api/v1").Subrouter(), store)
	api.MetricsConfiguration = server.MetricsConfiguration

	// Static files
	// TODO: Include as compiled FS
	// router.PathPrefix("/").Handler(http.FileServer(http.Dir(server.WebRoot)))

	httpServer := &http.Server{
		Handler:      handlers.CompressHandler(handlers.CombinedLoggingHandler(os.Stdout, router)),
		Addr:         fmt.Sprintf("%v:%v", server.WebAddress, server.WebPort),
		WriteTimeout: 5 * time.Second,
		ReadTimeout:  5 * time.Second,
	}

	server.Log.Info("Listening", zap.String("address", server.WebAddress), zap.Int("port", server.WebPort))
	return httpServer.ListenAndServe()
}
