package services

import (
	"context"
	"errors"
	"time"

	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/config"
	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func getUserCollection() *mongo.Collection {
	return config.DB.Collection("userAuth")
}

func RegisterUser(email, password string) error {

	userCollection := getUserCollection()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existing models.User
	err := userCollection.FindOne(ctx, bson.M{"email": email}).Decode(&existing)
	if err == nil {
		return errors.New("user already exits")
	}

	user := models.User{
		Email:    email,
		Password: password,
	}

	_, err = userCollection.InsertOne(ctx, user)
	return err
}

func ValidateUser(email, password string) (*models.User, error) {

	userCollection := getUserCollection()

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
