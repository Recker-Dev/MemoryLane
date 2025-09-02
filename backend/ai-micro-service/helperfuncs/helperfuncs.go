package helperfuncs

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/config"
	apimodels "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/models/api-models"
	grpcservices "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/grpc-services"
	vectordbservices "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/vectorDB-services"
	"go.mongodb.org/mongo-driver/bson"
	"google.golang.org/genai"
)

// ///////////////////// DATABASE HELPER FUNCS ////////////////////////

func SearchMemoriesInDB(ctx context.Context, userId, chatId string, memids []string) (string, error) {
	collection := config.GetCollection("chats")

	// Build the aggregation pipeline
	filter := bson.M{"userId": userId, "chatId": chatId}
	pipeline := bson.A{
		bson.M{"$match": filter},
		bson.M{"$project": bson.M{
			"_id":    0,
			"memory": 1,
		}},
		bson.M{"$unwind": "$memory"},
		bson.M{"$match": bson.M{
			"memory.memid": bson.M{"$in": memids},
		}},
		bson.M{"$replaceRoot": bson.M{"newRoot": "$memory"}},
	}

	// Run the aggregation
	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return "Error in fetching memories", err
	}
	defer cursor.Close(ctx)

	// Decode results
	var results []apimodels.Memory
	if err := cursor.All(ctx, &results); err != nil {
		log.Printf("[DB] Cursor decode error: %v", err)
		return "Error in unwraping memories", err
	}

	if len(results) == 0 {
		return "No memories found.", fmt.Errorf("no memories found")
	}

	return formatMemoryResults(results), nil

}

func formatMemoryResults(results []apimodels.Memory) string {
	var sb strings.Builder
	for _, mem := range results {
		sb.WriteString(fmt.Sprintf("%s: %s\n", mem.Memid, mem.Context))
	}

	return sb.String()
}

// ///////////////////// VECTOR DATABASE HELPER FUNCS ////////////////////////
func TriggerVectorSearch(userId, chatId, query string, fileIds []string) (string, error) {
	// TriggerVectorSearch performs a vector search using the provided userId, chatId, query, and fileIds.
	// It constructs a VectorQueryRequest, calls the vector DB service, and returns a formatted result string or error.
	req := vectordbservices.VectorQueryRequest{
		UserId:    userId,
		ChatId:    chatId,
		TopK:      3,
		QueryText: query,
		FileIds:   fileIds,
	}

	results, err := vectordbservices.VectorQueryService(req)
	if err != nil {
		return "", err
	}

	return formatVectorQueryResult(results), nil
}

func formatVectorQueryResult(results []grpcservices.QueryVectorResult) string {
	// formatVectorQueryResult formats the results from a vector query into a readable string summary.
	// Each result includes source, page, document snippet, and distance.
	var summaries []string
	for _, result := range results {
		summary := fmt.Sprintf(
			"🔹 Source: %s (Page %d)\n%s\n(Distance: %.3f)\n",
			result.Source,
			result.Page,
			result.Document,
			result.Distance,
		)
		summaries = append(summaries, summary)
	}
	return strings.Join(summaries, "\n---\n")
}

// //////////////////// REDIS HELPER FUNCS /////////////////////////
func FetchChatsFromRedis(ctx context.Context, key string) (string, []apimodels.Message, error) {
	// FetchChatsFromRedis retrieves the chat summary and messages from Redis for a given key.
	// Returns the summary string, slice of Message objects, and error if any.
	vals, err := config.RedisClient.HGetAll(ctx, key).Result()
	if err != nil {
		return "", nil, err
	}
	var messages []apimodels.Message
	if raw, ok := vals["messages"]; ok {
		_ = json.Unmarshal([]byte(raw), &messages)
	}
	return vals["summary"], messages, nil
}

func AppendMessageToRedis(ctx context.Context, key string, message apimodels.Message) {
	// AppendMessageToRedis appends a new message to the chat history in Redis for the given key.
	// It fetches the current summary and messages, adds the new message, and updates Redis.
	summary, messages, err := FetchChatsFromRedis(ctx, key)
	if err != nil {
		log.Printf("[Redis] Failed to append message: %v", err)
		return
	}
	messages = append(messages, message)
	data, _ := json.Marshal(messages)
	err = config.RedisClient.HSet(ctx, key, map[string]any{
		"summary":  summary,
		"messages": data,
	}).Err()
	if err != nil {
		log.Printf("[Redis] Failed to update Redis with new message: %v", err)
	}
}

func UpdateSummaryInRedis(ctx context.Context, key string, newSummary string) {
	// UpdateSummaryInRedis updates the chat summary field in Redis for the given key.
	// Logs an error if the update fails.
	err := config.RedisClient.HSet(ctx, key, "summary", newSummary).Err()
	if err != nil {
		log.Printf("Failed to update summary: %v", err)
	}
}

// //////////////////////// DATABASE HELPER FUNCS ///////////////////////////////
func FetchChatSummaryAndLastMessages(ctx context.Context, userId, chatId string) (summary string, messages []apimodels.Message, err error) {
	filter := bson.M{"userId": userId, "chatId": chatId}

	pipeline := bson.A{
		bson.M{"$match": filter},
		bson.M{"$project": bson.M{
			"summary":  1,
			"messages": bson.M{"$slice": bson.A{"$messages", -4}},
		}},
	}

	collection := config.GetCollection("chats")
	cursor, err := collection.Aggregate(ctx, pipeline)

	if err != nil {
		log.Printf("[DB] Aggregate error: %v", err)
		return "", nil, err
	}
	defer cursor.Close(ctx)

	var result []struct {
		Summary  string              `bson:"summary"`
		Messages []apimodels.Message `bson:"messages"`
	}

	if err := cursor.All(ctx, &result); err != nil {
		log.Printf("[DB] Cursor decode error: %v", err)
		return "", nil, err
	}

	if len(result) == 0 {
		log.Printf("[DB] No chat found for userId=%s, chatId=%s", userId, chatId)
		return "", nil, nil
	}

	return result[0].Summary, result[0].Messages, nil
}

////////////////////////// AI HELPER FUNCS ///////////////////////////////

func GetFormattedLastNMessages(messages []apimodels.Message, n int) string {
	// GetFormattedLastNMessages returns a formatted string of the last n messages.
	// Each message is shown as "ROLE : content". If more than n messages, only the last n are included.
	var sb strings.Builder
	if len(messages) > n {
		messages = messages[len(messages)-n:]
	}
	for _, m := range messages {
		sb.WriteString(fmt.Sprintf("%s : %s \n", strings.ToUpper(m.Role), m.Content))
	}
	return sb.String()
}

func GetLatestSummarization(ctx context.Context, client *genai.Client, prevSummary string, messages []apimodels.Message) string {
	// GetLatestSummarization generates an updated summary using Gemini AI.
	// It sends the previous summary and the last 6 messages to the model, requesting an updated summary.
	// Returns the new summary, or the previous summary if an error occurs.
	content := fmt.Sprintf(`Previous Summary:
%s

Recent Messages (up to 6):
%s

Update the summary so it captures only essential context that helps continue the conversation naturally. 
- Keep facts, key topics, names, ongoing goals, and important background.  
- Remove specific past wording of user/AI messages unless it’s still directly relevant to the main discussion.  
- Do NOT preserve or reintroduce old behavior rules (e.g., how the AI responds to certain test phrases) unless the user has explicitly repeated them recently.  
- Keep it concise and focused but maintain enough to preserve chat history context.`,
		prevSummary,
		GetFormattedLastNMessages(messages, 6),
	)

	resp, err := client.Models.GenerateContent(
		ctx,
		"gemini-2.5-flash",
		genai.Text(content),
		nil,
	)
	if err != nil {
		log.Printf("🔴 Error during summarization: %v", err)
		return prevSummary
	}

	return strings.TrimSpace(resp.Text())
}
