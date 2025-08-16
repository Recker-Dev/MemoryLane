package services

import (
	"context"
	"errors"
	"fmt"
	"os"
	"time"

	config "github.com/Recker-Dev/NextJs-GPT/backend/micro-service/config"
	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func Debug(userId string) ([]models.Chat, error) {
	chatCollection := config.GetCollection(
		os.Getenv("CHAT_COLLECTION"),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if userId exist
	exists := chatCollection.FindOne(ctx, bson.M{"userId": userId})
	if exists.Err() != nil {
		return nil, errors.New("user not found")
	}

	// Set Projection (only selected fileds)
	projection := bson.M{
		"userId":    1,
		"chatId":    1,
		"name":      1,
		"messages":  1,
		"memory":    1,
		"createdAt": 1,
	}

	opts := options.Find().SetProjection(projection)

	// Find all chats for this user
	cursor, err := chatCollection.Find(ctx, bson.M{"userId": userId}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var chats []models.Chat

	for cursor.Next(ctx) {
		var chat models.Chat
		if err := cursor.Decode(&chat); err != nil {
			return nil, err
		}
		chats = append(chats, chat)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return chats, nil

}

func CreateChat(userId, chatId, name string) error {
	chatCollection := config.GetCollection(
		os.Getenv("CHAT_COLLECTION"),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if userId, chatId chat exists
	if err := chatCollection.FindOne(ctx, bson.M{"userId": userId, "chatId": chatId}).Err(); err == nil {
		return errors.New("chat already exist")
	}

	chat := models.Chat{
		UserId:    userId,
		ChatId:    chatId,
		Name:      name,
		Messages:  []models.Message{},
		Memory:    []models.Memory{},
		CreatedAt: time.Now(),
	}

	_, err := chatCollection.InsertOne(ctx, chat)
	return err
}

func DeleteChat(userId, chatId string) error {
	chatCollection := config.GetCollection(
		os.Getenv("CHAT_COLLECTION"),
	)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existing models.Chat
	// Check if chat exists
	err := chatCollection.FindOne(ctx, bson.M{"userId": userId, "chatId": chatId}).Decode(&existing)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return fmt.Errorf("chat with userId=%s and chatId=%s not found", userId, chatId)
		}
		return fmt.Errorf("failed to check chat existence: %w", err)
	}

	// Delete the chat
	_, err = chatCollection.DeleteOne(ctx, bson.M{"userId": userId, "chatId": chatId})
	if err != nil {
		return fmt.Errorf("failed to delete chat: %w", err)
	}
	return nil

}

func GetChatHeads(userId string) ([]models.ChatHeads, error) {
	chatCollection := config.GetCollection(
		os.Getenv("CHAT_COLLECTION"),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if userId exist
	exists := chatCollection.FindOne(ctx, bson.M{"userId": userId})
	if exists.Err() != nil {
		return nil, errors.New("user not found")
	}

	// Projection
	projection := bson.M{
		"chatId":   1,
		"name":     1,
		"messages": 1,
	}

	opts := options.Find().SetProjection(projection)

	// Find all the Chats for this user with the valid projection
	cursor, err := chatCollection.Find(ctx, bson.M{"userId": userId}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var heads []models.ChatHeads

	// Iterate over the Chats and populate the for the relevant chatHeads array
	for cursor.Next(ctx) {
		var chat models.Chat
		if err := cursor.Decode(&chat); err != nil { // Perfectly safe to decode partial data into a struct.
			return nil, err
		}

		preview := "No messages yet"

		if len(chat.Messages) > 0 {
			preview = chat.Messages[0].Content
		}

		head := models.ChatHeads{
			ChatId:  chat.ChatId,
			Name:    chat.Name,
			Preview: preview,
		}

		heads = append(heads, head)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return heads, nil

}

func GetChatMessages(userId, chatId string) ([]models.Message, error) {
	chatCollection := config.GetCollection(
		os.Getenv("CHAT_COLLECTION"),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Projection: only pull the messages field
	projection := bson.M{
		"messages": 1,
		"_id":      0, // optional: avoids returning the document _id
	}

	opts := options.FindOne().SetProjection(projection)

	// Fetch the relevant chat for userId and chatId
	var chat models.Chat
	err := chatCollection.FindOne(ctx, bson.M{"userId": userId, "chatId": chatId}, opts).Decode(&chat)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, errors.New("user or chat not found")
		}
		return nil, err
	}

	if len(chat.Messages) == 0 {
		return []models.Message{}, nil
	}

	return chat.Messages, nil
}

func AddMemory(userId, chatId, memoryContext string) error {
	chatCollection := config.GetCollection(
		os.Getenv("CHAT_COLLECTION"),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	newMemory := bson.M{
		"memid":   primitive.NewObjectID().Hex(),
		"context": memoryContext,
	}

	filter := bson.M{
		"userId": userId,
		"chatId": chatId,
	}

	update := bson.M{
		"$addToSet": bson.M{
			"memory": newMemory,
		},
	}

	result, err := chatCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to add memory: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("chat not found for userId=%s chatId=%s", userId, chatId)
	}

	return nil
}

func GetChatMemories(userId, chatId string) ([]models.Memory, error) {
	chatCollection := config.GetCollection(
		os.Getenv("CHAT_COLLECTION"),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Projection: only pull the memories field
	projection := bson.M{
		"memory": 1,
		"_id":    0,
	}

	opts := options.FindOne().SetProjection(projection)

	// Fetch the relevant chat for userId and chatId
	var chat models.Chat
	err := chatCollection.FindOne(ctx, bson.M{"userId": userId, "chatId": chatId}, opts).Decode(&chat)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("user or chat not found")
		}
		return nil, err
	}

	if len(chat.Memory) == 0 {
		return []models.Memory{}, nil
	}

	return chat.Memory, nil

}

func DeleteMemory(userId, chatId, memId string) error {
	chatCollection := config.GetCollection(
		os.Getenv("CHAT_COLLECTION"),
	)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$pull": bson.M{
			"memory": bson.M{"memid": memId},
		},
	}

	result, err := chatCollection.UpdateOne(
		ctx,
		bson.M{"userId": userId, "chatId": chatId},
		update,
	)

	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return errors.New("chat not found for given userId and chatId")
	}
	if result.ModifiedCount == 0 {
		return errors.New("no memory with given memId found")
	}

	return nil
}
