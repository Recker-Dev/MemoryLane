package controllers

import (
	"net/http"

	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/services"
	"github.com/gin-gonic/gin"
)

func Debug(c *gin.Context) {
	userId := c.Param("userId")

	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
		return
	}

	chats, err := services.Debug(userId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, chats)

}

func CreateChat(c *gin.Context) {
	userId := c.Param("userId")
	type CreateChatInput struct {
		ChatId string `json:"chatId"`
		Name   string `json:"name"`
	}
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

func DeleteChat(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")

	if userId == "" || chatId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId and chatId is needed."})
		return
	}

	if err := services.DeleteChat(userId, chatId); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Chat deleted successfully",
		"userId":  userId,
		"chatId":  chatId,
	})
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
		// Distinguish between not found vs internal errors
		if err.Error() == "user or chat not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, messages)

}

func AddChatMemory(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")

	if userId == "" || chatId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId and chatId are required"})
		return
	}

	var input struct {
		Context string `json:"context" binding:"required"`
	}

	// Bind JSON body into struct
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Call service to add memory
	if err := services.AddMemory(userId, chatId, input.Context); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Memory added successfully"})
}

func GetChatMemories(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")

	if userId == "" || chatId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId and chatId are required"})
		return
	}

	memories, err := services.GetChatMemories(userId, chatId)
	if err != nil {
		// Distinguish between not found vs internal errors
		if err.Error() == "user or chat not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, memories)
}

func DeleteChatMemory(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")
	memId := c.Param("memId")

	if userId == "" || chatId == "" || memId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId, chatId, and memId are required"})
		return
	}

	if err := services.DeleteMemory(userId, chatId, memId); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Memory deleted successfully"})
}
