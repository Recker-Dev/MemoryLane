package controllers

import (
	"fmt"
	"net/http"

	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/services"
	"github.com/gin-gonic/gin"
)

func Debug(c *gin.Context) {
	userId := c.Param("userId")

	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "userId is required"})
		return
	}

	chats, err := services.Debug(userId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": chats})

}

func CreateChat(c *gin.Context) {
	userId := c.Param("userId")
	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "userId is needed."})
		return
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	chatId, err := services.CreateChat(userId, input.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "chatId": chatId})

}

func DeleteChat(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")

	if userId == "" || chatId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "userId and chatId is needed."})
		return
	}

	if err := services.DeleteChat(userId, chatId); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Chat deleted!",
	})
}

func GetChatHeads(c *gin.Context) {
	userId := c.Param("userId")
	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "userId is needed"})
		return
	}

	heads, err := services.GetChatHeads(userId)
	if err != nil {
		if err.Error() == "user not found" {
			// More semantic than 400
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "user not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": heads})
}

func GetChatMessages(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")

	if userId == "" || chatId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "userId and chatId are required"})
		return
	}

	messages, err := services.GetChatMessages(userId, chatId)
	if err != nil {
		// Distinguish between not found vs internal errors
		if err.Error() == "user or chat not found" {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": messages})

}

func AddChatMemory(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")

	if userId == "" || chatId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "userId and chatId are required"})
		return
	}

	var input struct {
		Context string `json:"context" binding:"required"`
	}

	// Bind JSON body into struct
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Call service to add memory
	newMemid, err := services.AddMemory(userId, chatId, input.Context)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "memid": newMemid})
}

func GetChatMemories(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")

	if userId == "" || chatId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "userId and chatId are required"})
		return
	}

	memories, err := services.GetChatMemories(userId, chatId)
	if err != nil {
		// Distinguish between not found vs internal errors
		if err.Error() == "user or chat not found" {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": memories})
}

func DeleteChatMemory(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")
	memId := c.Param("memId")

	if userId == "" || chatId == "" || memId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "userId, chatId, and memId are required"})
		return
	}

	if err := services.DeleteMemory(userId, chatId, memId); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Memory deleted successfully"})
}

func SetPersistanceChatMemory(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")
	memId := c.Param("memId")

	if userId == "" || chatId == "" || memId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "userId, chatId, and memId are required"})
		return
	}

	var input struct {
		Persist *bool `json:"persist"`
	}

	// Bind JSON body into struct
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	if input.Persist == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "persist field is required and must be true or false",
		})
		return
	}

	if err := services.SetMemoryPersistence(userId, chatId, memId, *input.Persist); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true,
		"message": fmt.Sprintf("Memory persistence set to %v", *input.Persist),
		"memId":   memId})

}
