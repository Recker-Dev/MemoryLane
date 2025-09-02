package vectordbservices

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/config"
	apimodels "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/models/api-models"
	databaseservices "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/database-services"
	grpcservices "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/grpc-services"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/genai"
)

type VectorQueryRequest struct {
	UserId    string
	ChatId    string
	TopK      int
	QueryText string
	FileIds   []string
}

func VectorQueryService(req VectorQueryRequest) ([]grpcservices.QueryVectorResult, error) {
	if req.UserId == "" || req.ChatId == "" {
		return nil, errors.New("userId and chatId cannot be empty")
	}
	if req.TopK <= 0 || len(req.FileIds) == 0 || req.QueryText == "" {
		return nil, errors.New("top_k must be > 0, file_ids and query_text must be non-empty")
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
		return nil, fmt.Errorf("no valid PDF files with vector store found for")
	}

	// DO QUERY REFINEMENT HERE

	queries, err := RefineQuery(context.Background(), uploads, req.QueryText)
	if err != nil {
		log.Printf("[VectorQueryService] Error refining query: %v", err)
		return nil, err
	}

	// fmt.Printf("[VectorQueryService] userId=%s, chatId=%s, fileIds=%s\n", req.UserId, req.ChatId, strings.Join(req.FileIds, ","))

	// gRPC call
	response, err := grpcservices.SendQueryToPythonVectorizer(uploads, int32(req.TopK), queries)
	if err != nil {
		log.Printf("[VectorQueryService] Error processing grpc python service: %v", err)
		return nil, fmt.Errorf("grpc error from Python service: %v", err)
	}

	return response, nil
}

// RefineQuery expands a single user query into three refined queries using Gemini.
func RefineQuery(
	ctx context.Context,
	uploads []apimodels.Upload,
	query string,
) ([]string, error) {

	client := config.GeminiClient
	if client == nil {
		log.Println("❌ Gemini client is not initialized.")
		return nil, fmt.Errorf("internal error: AI module unavailable")
	}

	// Collect filenames to guide query refinement
	var fileNames []string
	for _, u := range uploads {
		fileNames = append(fileNames, u.FileName)
	}

	// 🔹 Query Expansion Prompt
	prompt := fmt.Sprintf(`
You are assisting in semantic search over PDF documents.
Generate exactly 3 refined/expanded queries that better retrieve relevant info.
Return them as a **single line**, comma-separated — no explanations, numbering, or newlines.

User query: "%s"
Selected file Names: %s
`, query, strings.Join(fileNames, ", "))

	// Gemini API call
	resp, err := client.Models.GenerateContent(
		ctx,
		"gemini-2.5-flash",
		genai.Text(prompt),
		nil, // no extra config
	)
	if err != nil {
		return nil, fmt.Errorf("gemini query refinement failed: %w", err)
	}

	text := resp.Text()
	parts := strings.Split(text, ",")
	var refined []string
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			refined = append(refined, trimmed)
		}
	}

	if len(refined) == 0 {
		return nil, fmt.Errorf("gemini returned no valid refinements, got: %q", text)
	}

	return refined, nil
}
