package main

import (
	"log"

	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/config"
	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/controllers"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}
}

func main() {

	err := config.ConnectDB("mongodb://localhost:27017", "nextjs_gpt_chat")
	if err != nil {
		log.Fatal("Mongo connection error:", err)
	}

	r := gin.Default()

	//Auth Services
	r.POST("/registerUser", controllers.RegisterUser)
	r.POST("/validateUser", controllers.ValidateUser)

	// Debug Route
	r.GET("/history/:userId", controllers.GetUserHistory)

	//Chat Routes
	r.POST("/createChat/:userId", controllers.CreateChat)
	r.GET("/chatHeads/:userId", controllers.GetChatHeads)
	r.GET("/chats/:userId/:chatId", controllers.GetChatMessages)

	//File Routes
	r.POST("/uploadFile/:userId/:chatId", controllers.UploadFiles)

	r.Run(":8080")
}
