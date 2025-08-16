package main

import (
	"log"
	"net/http"

	"github.com/Recker-Dev/NextJs-GPT/backend/ws-micro-service/kafka"
	"github.com/Recker-Dev/NextJs-GPT/backend/ws-micro-service/ws"
)

func main() {

	brokers := []string{"localhost:9092"}
	// inputTopic := "user_query"
	replyTopic := "server_reply"
	groupId := "ws_server_group"

	publisherHandler := kafka.InitProducer(brokers)

	hub := ws.NewHub(publisherHandler)

	go hub.Run()

	// go kafka.StartConsumeProcessRepublishRoutine(brokers, inputTopic, groupId, publisherHandler)
	go kafka.StartKafkaToUserRoutine(brokers, replyTopic, groupId, hub)
	log.Println("Kafka initialized")

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ws.ServeWs(hub, w, r)
	})

	log.Println("WebSocket Server started on :8082")
	log.Fatal(http.ListenAndServe(":8082", nil))
}
