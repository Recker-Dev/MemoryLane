package ws

import (
	"log"
	"sync"
	"github.com/Recker-Dev/NextJs-GPT/backend/ws-micro-service/kafka"
	"github.com/Recker-Dev/NextJs-GPT/backend/ws-micro-service/types"
)

// Hub maintains active WebSocket clients and broadcasts messages.
type Hub struct {
	Connections map[string]map[string]*Client
	Register    chan *Client
	Unregister  chan *Client

	Publisher *kafka.PublisherHandler
	Mu        sync.Mutex
}

// NewHub creates a new Hub instance.
// publisher func(topic, key string, data []byte
func NewHub(publisher *kafka.PublisherHandler) *Hub {
	return &Hub{
		Connections: make(map[string]map[string]*Client),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),

		Publisher: publisher,
	}
}

// Run listens for register/unregister events.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Mu.Lock()
			if h.Connections[client.UserId] == nil {
				h.Connections[client.UserId] = make(map[string]*Client)
			}
			// Close old connection if exists
			if old, ok := h.Connections[client.UserId][client.ChatId]; ok {
				old.Conn.Close()
			}
			h.Connections[client.UserId][client.ChatId] = client
			log.Printf("Registered client %s_%s", client.UserId, client.ChatId)
			h.Mu.Unlock()

		case client := <-h.Unregister:
			h.Mu.Lock()
			if chats, ok := h.Connections[client.UserId]; ok {
				if _, ok2 := chats[client.ChatId]; ok2 {
					delete(chats, client.ChatId)
					close(client.Send)
					log.Printf("Unregistered client %s_%s", client.UserId, client.ChatId)
					if len(chats) == 0 {
						delete(h.Connections, client.UserId)
					}
				}
			}
			h.Mu.Unlock()
		}
	}
}


func (h *Hub) GetClient(userId, chatId string) types.TriggerWritePump {
	h.Mu.Lock()
	defer h.Mu.Unlock()
	if chats, ok := h.Connections[userId]; ok {
		return chats[chatId] // *Client, which implements SendToWritePump
	}
	return nil
}
