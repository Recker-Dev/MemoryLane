package services

import (
	"context"
	"errors"
	"os"
	"time"

	config "github.com/Recker-Dev/NextJs-GPT/backend/micro-service/config"
	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func RegisterUser(email, password string) (string, string, error) {
	userCollection := config.GetCollection(os.Getenv("AUTH_COLLECTION"))

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if user exists
	var existing models.User
	err := userCollection.FindOne(ctx, bson.M{"email": email}).Decode(&existing)
	if err == nil {
		// User exists, return their ID
		return existing.ID.Hex(), "User already exists!", nil
	}

	// If not found and not some other error
	if err != mongo.ErrNoDocuments {
		return "", "", err
	}

	// Create new user
	user := models.User{
		ID:       primitive.NewObjectID(), // Add ID manually
		Email:    email,
		Password: password,
	}

	_, err = userCollection.InsertOne(ctx, user)
	if err != nil {
		return "", "", err
	}

	return user.ID.Hex(), "User Registered!", nil
}

func ValidateUser(email, password string) (*models.User, error) {

	userCollection := config.GetCollection(
		os.Getenv("AUTH_COLLECTION"),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err := userCollection.FindOne(ctx, bson.M{"email": email}).Decode(&user)

	if err != nil {
		return nil, errors.New("user not in DB")
	}

	if user.Password != password {
		return nil, errors.New("incorrect password")
	}

	return &user, nil
}
