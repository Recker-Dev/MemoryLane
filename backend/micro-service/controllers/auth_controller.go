package controllers

import (
	"net/http"

	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/services"
	"github.com/gin-gonic/gin"
)

type AuthInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func RegisterUser(c *gin.Context) {
	var input AuthInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userId, message, err := services.RegisterUser(input.Email, input.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": message,
		"email":   input.Email,
		"userId":  userId,
	})
}

func ValidateUser(c *gin.Context) {
	var input AuthInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := services.ValidateUser(input.Email, input.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"succss": true,
		"userId": user.ID.Hex(),
		"email":  user.Email,
	})
}
