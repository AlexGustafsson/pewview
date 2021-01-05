package pewview

import (
  log "github.com/sirupsen/logrus"
)

// Hub ...
type Hub struct {
  clients map[*Client]bool
  broadcast chan []byte
  register chan *Client
  unregister chan *Client
}

// NewHub ...
func NewHub() *Hub{
  return &Hub {
    clients: make(map[*Client]bool),
    broadcast: make(chan []byte),
    register: make(chan *Client),
    unregister: make(chan *Client),
  }
}

// Run ...
func (hub *Hub) Run() {
  for {
    select {
    case client := <-hub.register:
      hub.clients[client] = true
      log.WithFields(log.Fields{"Type": "Web"}).Debugf("registered client")
    case client := <-hub.unregister:
      if _, ok := hub.clients[client]; ok {
        delete(hub.clients, client)
        close(client.send)
        log.WithFields(log.Fields{"Type": "Web"}).Debugf("unregistered client")
      }
    case message := <-hub.broadcast:
      for client := range hub.clients {
        select {
        case client.send <- message:
        default:
          close(client.send)
          delete(hub.clients, client)
        }
      }
    }
  }
}
