package consumer

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"go.uber.org/zap"
)

// WebHookConsumer is a consumer of HTTP messages. It listens for POSTs containing
// a JSON-encoded Message
type WebHookConsumer struct {
	address  string
	port     int
	log      *zap.Logger
	messages chan *Message
}

// NewWebHookConsumer creates a new WebHook consumer
func NewWebHookConsumer(address string, port int, log *zap.Logger) *WebHookConsumer {
	return &WebHookConsumer{
		address: address,
		port:    port,
		log:     log,
	}
}

// Listen implements consumer
func (consumer *WebHookConsumer) Listen(messages chan *Message) error {
	consumer.log.Info("Listening", zap.String("address", consumer.address), zap.Int("port", consumer.port))
	consumer.messages = messages
	server := &http.Server{
		Handler:      consumer,
		Addr:         fmt.Sprintf("%v:%v", consumer.address, consumer.port),
		WriteTimeout: 5 * time.Second,
		ReadTimeout:  5 * time.Second,
	}

	return server.ListenAndServe()
}

// ServeHTTP handles incoming HTTP requests
func (consumer *WebHookConsumer) ServeHTTP(response http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		consumer.log.Debug("Received request using a bad method")
		response.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var message Message
	if err := json.NewDecoder(request.Body).Decode(&message); err != nil {
		consumer.log.Debug("Received request with a bad body", zap.Error(err))
		response.WriteHeader(http.StatusBadRequest)
		return
	}

	select {
	case consumer.messages <- &message:
		consumer.log.Debug("Successfully consumed request")
		response.WriteHeader(http.StatusOK)
	case <-request.Context().Done():
		consumer.log.Error("Failed to consume request before reaching context deadline")
		response.WriteHeader(http.StatusRequestTimeout)
	}
}
