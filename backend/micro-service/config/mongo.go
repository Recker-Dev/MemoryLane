package config

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database

func ConnectDB(dbName string) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatal("Mongo connection error:", err)
	}

	DB = client.Database(dbName)
	log.Println("✅ Mongo DB connection made.")
}

func GetCollection(collectionName string) *mongo.Collection {
	return DB.Collection(collectionName)
}
