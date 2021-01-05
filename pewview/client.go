package pewview

import (
  log "github.com/sirupsen/logrus"
  "github.com/gorilla/websocket"
  "time"
  "bytes"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

// Client ...
type Client struct {
  hub *Hub
  connection *websocket.Conn
  send chan []byte
}

// RegisterClient ...
func RegisterClient(connection *websocket.Conn, hub *Hub) *Client{
  client := &Client{
    hub: hub,
    connection: connection,
    send: make(chan []byte, 256),
  }

  hub.register <- client

  go client.write()
  go client.read()

  return client
}

func (client *Client) read() {
  defer func() {
    client.hub.unregister <- client
    client.connection.Close()
  }()

  client.connection.SetReadLimit(maxMessageSize)
  client.connection.SetReadDeadline(time.Now().Add(pongWait))
  client.connection.SetPongHandler(func (string) error {
    client.connection.SetReadDeadline(time.Now().Add(pongWait))
    return nil
  })

  for {
    _, message, err := client.connection.ReadMessage()
    if err != nil {
      if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
        log.WithFields(log.Fields{"Type": "Web"}).Errorf("Error: unexpected close: %v", err)
      } else {
        log.WithFields(log.Fields{"Type": "Web"}).Errorf("Error: unexpected error: %v", err)
      }
      break
    }

    message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))
    log.WithFields(log.Fields{"Type": "Web"}).Debugf("got message: %s", message)
  }
}

func (client *Client) write() {
  ticker := time.NewTicker(pingPeriod)
  defer func() {
    ticker.Stop()
    client.connection.Close()
  }()

  for {
    select {
    case message, ok := <-client.send:
      client.connection.SetWriteDeadline(time.Now().Add(writeWait))
      if !ok {
        // The hub closed the channel
        log.WithFields(log.Fields{"Type": "Web"}).Debugf("Server closed channel")
        client.connection.WriteMessage(websocket.CloseMessage, []byte{})
        return
      }

      response, err := client.connection.NextWriter(websocket.TextMessage)
      if err != nil {
        log.WithFields(log.Fields{"Type": "Web"}).Debugf("Error: unable to get response: %v", err)
        return
      }
      response.Write(message)

      // // Send all queued messages in the current message
      // queuedMessages := len(client.send)
      // for i := 0; i < queuedMessages; i++ {
      //   // response.Write(newline)
      //   response.Write(<-client.send)
      // }

      if err := response.Close(); err != nil {
        log.WithFields(log.Fields{"Type": "Web"}).Debugf("Error: unable to close response: %v", err)
        return
      }

    case <-ticker.C:
      client.connection.SetWriteDeadline(time.Now().Add(writeWait))
      if err := client.connection.WriteMessage(websocket.PingMessage, nil); err != nil {
        log.WithFields(log.Fields{"Type": "Web"}).Debugf("Error: unable to send ping: %v", err)
        return
      }
    }
  }
}
