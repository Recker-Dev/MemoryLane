package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/Recker-Dev/NextJs-GPT/backend/ws-micro-service/types"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 8192
)

// Client represents a WebSocket connection.
type Client struct {
	Hub          *Hub
	UserId       string
	ChatId       string
	CurrentMsgId string
	Conn         *websocket.Conn
	Send         chan any
}

// NewClient constructs a new Client.
func NewClient(hub *Hub, userId, chatId string, conn *websocket.Conn) *Client {
	return &Client{Hub: hub, UserId: userId, ChatId: chatId, Conn: conn, Send: make(chan any, 256)}
}

// readPump reads incoming WebSocket messages and delegates to Hub.Publish.
func (c *Client) readPump() {
	defer func() {
		type dbRequest struct {
			UserId string `json:"userId"`
			ChatId string `json:"chatId"`
			Action string `json:"action"` // "flush" or "del"
		}
		data, _ := json.Marshal(dbRequest{UserId: c.UserId, ChatId: c.ChatId, Action: "del"})
		if err := c.Hub.Publisher.SendMessage("db_ops", fmt.Sprintf("dbops:%s:%s",c.UserId,c.ChatId), data); err != nil {
			log.Printf("[WS] Kafka publish failed for signal: %v", err)
		}
		log.Printf("✅ Raised Redis key delete for UserId: %s and ChatId: %s", c.UserId, c.ChatId)
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()
	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error { c.Conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		msgType, msg, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Read error %s_%s: %v", c.UserId, c.ChatId, err)
			}
			break
		}
		switch msgType {
		case websocket.TextMessage:
			var cntrl types.IncomingControl
			if err := json.Unmarshal(msg, &cntrl); err != nil {
				log.Printf("Unmarshal error %s_%s: %v", c.UserId, c.ChatId, err)
				continue
			}

			// Construct the Kafka key once from full message ID
			key := cntrl.UserId + "_" + cntrl.ChatId + "_" + cntrl.MessageId

			switch cntrl.Type {
			case "user_start":
				if err := c.Hub.Publisher.SendMessage("user_query", key, msg); err != nil {
					log.Printf("Kafka send error (user_start): %v", err)
				}
				c.CurrentMsgId = cntrl.MessageId
			case "user_end":
				if err := c.Hub.Publisher.SendMessage("user_query", key, msg); err != nil {
					log.Printf("Kafka send error (user_end): %v", err)
				}
				c.CurrentMsgId = ""
			default:
				log.Printf("⚠️ Unknown message type")

			}
		case websocket.BinaryMessage:
			key := c.UserId + "_" + c.ChatId + "_" + c.CurrentMsgId

			if c.CurrentMsgId == "" {
				log.Printf("⚠️ Binary chunk received before user_start for %s_%s", c.UserId, c.ChatId)
				c.Conn.WriteMessage(websocket.CloseMessage, []byte("Protocol violation: binary sent before user_start"))
				return
			}

			if err := c.Hub.Publisher.SendMessage("user_query", key, msg); err != nil {
				log.Printf("Kafka send error (chunk): %v", err)
			}
		}
	}
}

// writePump writes outgoing messages from Kafka to WebSocket.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() { ticker.Stop(); c.Conn.Close() }()

	for {
		select {
		case msg, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, nil)
				return
			}
			switch m := msg.(type) {
			case types.OutgoingMessage:
				b, err := json.Marshal(m)
				if err != nil {
					log.Println("marshal", err)
					continue
				}
				c.Conn.WriteMessage(websocket.TextMessage, b)
			case types.OutgoingBinary:
				c.Conn.WriteMessage(websocket.BinaryMessage, m.Data)
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			c.Conn.WriteMessage(websocket.PingMessage, nil)
		}
	}
}

func (c *Client) SendToWritePump(payload []byte) {
	select {
	case c.Send <- types.OutgoingBinary{Data: payload}:
	default:
		log.Printf("Send buffer full for %s_%s — dropping chunk", c.UserId, c.ChatId)
	}
}
