package ws

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for development.
		return true
	},
}

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	// Extract UserId and ChatId from query parameters,
	userId := r.URL.Query().Get("userId")
	chatId := r.URL.Query().Get("chatId")

	if userId == "" || chatId == "" {
		http.Error(w, "UserId and ChatId are required", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	// 👇 Create client with initialized Send channel
	client := NewClient(hub, userId, chatId, conn)

	hub.Register <- client // Registers the client with the hub

	// Start separate goroutines for reading and writing WebSocket messages for this client.
	go client.writePump()
	go client.readPump()
}
