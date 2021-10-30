package consumer

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"go.uber.org/zap"
)

type WebhookConsumer struct {
	address  string
	port     int
	log      *zap.Logger
	messages chan *Message
}

func NewWebhookConsumer(address string, port int, log *zap.Logger) *WebhookConsumer {
	return &WebhookConsumer{
		address:  address,
		port:     port,
		log:      log,
		messages: make(chan *Message),
	}
}

func (consumer *WebhookConsumer) Messages() chan *Message {
	return consumer.messages
}

func (consumer *WebhookConsumer) Listen() error {
	consumer.log.Info("Listening", zap.String("address", consumer.address), zap.Int("port", consumer.port))
	server := &http.Server{
		Handler:      consumer,
		Addr:         fmt.Sprintf("%v:%v", consumer.address, consumer.port),
		WriteTimeout: 5 * time.Second,
		ReadTimeout:  5 * time.Second,
	}

	return server.ListenAndServe()
}

func (consumer *WebhookConsumer) ServeHTTP(response http.ResponseWriter, request *http.Request) {
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
