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
	maxMessageSize = 10 * 1024 * 1024
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
		// Key is in dbops:userId:chatId format
		if err := c.Hub.Publisher.SendMessage("db_ops", fmt.Sprintf("dbops:%s:%s", c.UserId, c.ChatId), data); err != nil {
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
				log.Printf("❌ WS read error %s_%s: %v", c.UserId, c.ChatId, err)
			}
			break
		}

		if msgType != websocket.TextMessage {
			log.Printf("⚠️ Ignoring non-text message for %s_%s", c.UserId, c.ChatId)
			continue
		}

		var incoming types.IncomingQuery
		if err := json.Unmarshal(msg, &incoming); err != nil {
			log.Printf("❌ Unmarshal failed for %s_%s: %v", c.UserId, c.ChatId, err)
			continue
		}

		key := incoming.UserId + "_" + incoming.ChatId // Key is in userId_chatId format

		if err := c.Hub.Publisher.SendMessage("user_query", key, msg); err != nil {
			log.Printf("❌ Kafka publish failed: %v", err)
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
			case []byte:
				// Forward raw payload from Kafka
				if err := c.Conn.WriteMessage(websocket.TextMessage, m); err != nil {
					log.Println("write error:", err)
					return
				}
			default:
				log.Printf("⚠️ Dropping unexpected type in writePump: %T", m)
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			c.Conn.WriteMessage(websocket.PingMessage, nil)
		}
	}
}

func (c *Client) SendToWritePump(msg interface{}) {
	select {
	case c.Send <- msg:
	default:
		log.Printf("Send buffer full for %s_%s — dropping message", c.UserId, c.ChatId)
	}
}
