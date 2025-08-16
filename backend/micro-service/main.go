package main

import (
	"log"

	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/config"
	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/controllers"
	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/kafka"
	"github.com/gin-gonic/gin"
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
}

func main() {
	var brokers = []string{"localhost:9092"}

	go kafka.StartDbopsConsumer(brokers, "db_ops", "dp_ops_group")

	r := gin.Default()

	// Auth Services
	r.POST("/registerUser", controllers.RegisterUser)
	r.POST("/validateUser", controllers.ValidateUser)

	// Debug Route
	r.GET("/history/:userId", controllers.Debug)

	// Chat Routes
	r.POST("/createChat/:userId", controllers.CreateChat)
	r.DELETE("/deleteChat/:userId/:chatId", controllers.DeleteChat)
	r.GET("/chatHeads/:userId", controllers.GetChatHeads)
	r.GET("/chats/:userId/:chatId", controllers.GetChatMessages)

	r.POST("/addMemory/:userId/:chatId", controllers.AddChatMemory)
	r.GET("/memories/:userId/:chatId", controllers.GetChatMemories)
	r.DELETE("/deleteMemory/:userId/:chatId/:memId", controllers.DeleteChatMemory)

	// File upload and deletion Routes
	r.POST("/uploadFiles/:userId/:chatId", controllers.UploadFiles)
	r.DELETE("/deleteFiles/:userId/:chatId", controllers.DeleteFiles)

	r.Run(":8080")

}
