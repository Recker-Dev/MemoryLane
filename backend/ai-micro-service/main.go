package main

import (
	"log"

	"github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/config"
	"github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/kafka"
	"github.com/joho/godotenv"
)

func init() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	log.Println("✅ Env Loaded.")

	config.ConnectDB("nextjs_gpt_chat")
	config.ConnectRedis()

	config.InitGeminiClient()

}

func main() {

	brokers := []string{"localhost:9092"}
	publisherHandler := kafka.InitProducer(brokers)

	// Handle Vector Docs Creation and Deletion
	go kafka.StartVectorFileConsumer(brokers, "vectorize_file", "vector_group", publisherHandler)

	// Handle User Query Processing and server-reply publishing
	go kafka.StartUserQueryProcessing(brokers, "user_query", "ws_server_group", publisherHandler)

	// r := gin.Default()

	//File Routes
	// r.POST("/queryVectorDB/:userId/:chatId", controllers.VectorQuery)
	// r.POST("/uploadFile/:userId/:chatId", controllers.UploadFiles)
	// r.POST("/deleteFiles/:userId/:chatId", controllers.DeleteFiles)

	// r.Run(":8081")

	// Keep the main goroutine alive
	select {}

}
