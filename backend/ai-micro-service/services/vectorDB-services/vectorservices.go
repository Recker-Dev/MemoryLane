package vectordbservices

import (
	"errors"
	"fmt"
	"log"
	"os"

	apimodels "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/models/api-models"
	databaseservices "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/database-services"
	grpcservices "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/grpc-services"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type VectorQueryRequest struct {
	UserId     string
	ChatId     string
	TopK       int
	QueryTexts []string
	FileIds    []string
}

func VectorQueryService(req VectorQueryRequest) ([]grpcservices.QueryVectorResult, error) {
	if req.UserId == "" || req.ChatId == "" {
		return nil, errors.New("userId and chatId cannot be empty")
	}
	if req.TopK <= 0 || len(req.FileIds) == 0 || len(req.QueryTexts) == 0 {
		return nil, errors.New("top_k must be > 0, file_ids and query_texts must be non-empty")
	}

	// Convert FileIds to ObjectIDs
	var objectIds []primitive.ObjectID
	for _, fileId := range req.FileIds {
		objectId, err := primitive.ObjectIDFromHex(fileId)
		// fmt.Println("[DEBUG] objectId:", objectId.Hex())
		if err != nil {
			return nil, fmt.Errorf("invalid fileId format: %s", fileId)
		}
		objectIds = append(objectIds, objectId)
	}

	// Validate against DB
	filter := bson.M{
		"_id":               bson.M{"$in": objectIds},
		"userId":            req.UserId,
		"chatId":            req.ChatId,
		"fileType":          "application/pdf",
		"isVectorDBcreated": true,
	}

	uploads, err := databaseservices.FindMany[apimodels.Upload](
		os.Getenv("FILE_COLLECTION"),
		filter,
	)
	if err != nil {
		log.Printf("[VectorQueryService] Error processing query: %v", err)
		return nil, fmt.Errorf("db error fetching file entries: %v", err)
	}
	if len(uploads) == 0 {
		log.Printf("[VectorQueryService] Error processing query: %v", err)
		return nil, errors.New("no valid PDF files with vector store found for")
	}

	// fmt.Printf("[VectorQueryService] userId=%s, chatId=%s, fileIds=%s\n", req.UserId, req.ChatId, strings.Join(req.FileIds, ","))

	// gRPC call
	response, err := grpcservices.SendQueryToPythonVectorizer(uploads, int32(req.TopK), req.QueryTexts)
	if err != nil {
		log.Printf("[VectorQueryService] Error processing grpc python service: %v", err)
		return nil, fmt.Errorf("grpc error from Python service: %v", err)
	}

	return response, nil
}
