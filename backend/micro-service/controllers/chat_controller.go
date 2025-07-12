package controllers

import (
	"net/http"

	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/services"
	"github.com/gin-gonic/gin"
)

func GetUserHistory(c *gin.Context) {
	userId := c.Param("userId")

	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
		return
	}

	chats, err := services.FindChatsByUserId(userId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, chats)

}

type CreateChatInput struct {
	ChatId string `json:"chatId"`
	Name   string `json:"name"`
}

func CreateChat(c *gin.Context) {
	userId := c.Param("userId")
	var input CreateChatInput

	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is needed."})
		return
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := services.CreateChat(userId, input.ChatId, input.Name); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true})

}

func GetChatHeads(c *gin.Context) {
	userId := c.Param("userId")
	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is needed"})
		return
	}

	heads, err := services.GetChatHeads(userId)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, heads)

}

func GetChatMessages(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")

	if userId == "" || chatId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId and chatId are required"})
		return
	}

	messages, err := services.GetChatMessages(userId, chatId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}

	c.JSON(http.StatusOK, messages)

}
