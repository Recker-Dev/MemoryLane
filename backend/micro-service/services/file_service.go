package services

import (
	"context"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/config"
	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func getFileCollection() *mongo.Collection {
	return config.DB.Collection("files")
}

func HandleFileUpload(userId, chatId string, fileHeader *multipart.FileHeader) (primitive.ObjectID, error) {

	uploadCollection := getFileCollection()

	// Open the file
	file, err := fileHeader.Open()
	if err != nil {
		return primitive.NilObjectID, err
	}
	defer file.Close()

	// Determine type
	contentType := fileHeader.Header.Get("Content-Type")

	var folder string
	if strings.HasPrefix(contentType, "image/") {
		folder = "images"
	} else {
		folder = "files"
	}

	// Build path
	basePath := os.Getenv("UPLOAD_PATH")
	fullPath := filepath.Join(
		basePath,
		userId,
		chatId,
		folder,
	)

	// Create folders
	err = os.MkdirAll(fullPath, os.ModePerm)
	if err != nil {
		return primitive.NilObjectID, err
	}

	// Create new Upload document to get ObjectID
	doc := models.Upload{
		UserId:            userId,
		ChatId:            chatId,
		FileName:          fileHeader.Filename,
		FileType:          contentType,
		CreatedAt:         time.Now(),
		IsVectorDBCreated: false,
	}

	// Insert in DB and get the ObjectId
	insertRes, err := uploadCollection.InsertOne(context.Background(), doc)
	if err != nil {
		return primitive.NilObjectID, err
	}

	objectId := insertRes.InsertedID.(primitive.ObjectID)

	// Save file to disk using Mongo ID
	ext := filepath.Ext(fileHeader.Filename)
	savePath := filepath.Join(fullPath, objectId.Hex()+ext)

	out, err := os.Create(savePath)
	if err != nil {
		return primitive.NilObjectID, err
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	if err != nil {
		return primitive.NilObjectID, err
	}

	// Update path in DB
	_, err = uploadCollection.UpdateByID(
		context.Background(),
		objectId,
		bson.M{"$set": bson.M{"path": savePath}},
	)
	if err != nil {
		return primitive.NilObjectID, err
	}

	return objectId, nil

}
