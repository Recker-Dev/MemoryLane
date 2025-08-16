package kafka

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/IBM/sarama"
	"github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/config"
	apimodels "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/models/api-models"
	databaseservices "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/database-services"
	grpcservices "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/grpc-services"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type VectorizationTask struct {
	UserID    string `json:"userId"`
	ChatID    string `json:"chatId"`
	FileID    string `json:"fileId"`
	FileName  string `json:"fileName"`
	FilePath  string `json:"filePath"`  // Might be empty in delete
	Operation string `json:"operation"` // "vectorize" or "delete"
}

// StartVectorFileConsumer starts consuming the vectorize_file topic
func StartVectorFileConsumer(brokers []string, topic, groupId string) {
	config := sarama.NewConfig()
	config.Version = sarama.V2_8_0_0
	config.Consumer.Group.Rebalance.Strategy = sarama.NewBalanceStrategyRange()
	config.Consumer.Offsets.Initial = sarama.OffsetOldest

	group, err := sarama.NewConsumerGroup(brokers, groupId, config)
	if err != nil {
		log.Fatalf("[VectorTaskConsumerGroup] group error: %v", err)
	}

	handler := &vectorTaskConsumerHandler{}
	ctx := context.Background()

	for {
		if err := group.Consume(ctx, []string{topic}, handler); err != nil {
			log.Printf("[VectorTaskConsumerGroup] consume error: %v", err)
		}
	}
}

type vectorTaskConsumerHandler struct{}

func (vectorTaskConsumerHandler) Setup(_ sarama.ConsumerGroupSession) error   { return nil }
func (vectorTaskConsumerHandler) Cleanup(_ sarama.ConsumerGroupSession) error { return nil }

func (h *vectorTaskConsumerHandler) ConsumeClaim(sess sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for msg := range claim.Messages() {
		var task VectorizationTask
		if err := json.Unmarshal(msg.Value, &task); err != nil {
			log.Printf("[VectorTaskConsumerGroup] JSON unmarshal failed: %v", err)
			sess.MarkMessage(msg, "")
			continue
		}

		switch task.Operation {
		case "vectorize":
			go handleVectorization(task)
		case "delete":
			go handleVectorDocDeletion(task)
		default:
			log.Printf("[VectorTaskConsumerGroup] Unknown operation: %s", task.Operation)
		}

		sess.MarkMessage(msg, "")
	}
	return nil
}

// These should be implemented somewhere else in your service
func handleVectorization(task VectorizationTask) {
	log.Printf("[VectorTaskConsumerGroup] Vectorizing file: %s for user=%s chat=%s", task.FileName, task.UserID, task.ChatID)

	// Validate ObjectID
	fileObjID, err := primitive.ObjectIDFromHex(task.FileID)
	if err != nil {
		log.Printf("[handleVectorization (Consumer)] Invalid fileId: %s", task.FileID)
		return
	}

	// Create a valid filter condition to shorlist PDF and isVectorDBcreated: false from all uploaded Ids.
	findValidIdFilter := bson.M{
		"_id":               fileObjID,
		"fileType":          "application/pdf",
		"isVectorDBcreated": false,
	}

	// // Step 1: Query DB for valid pdfs out of the uploaded Ids.
	pdfEntry, err := databaseservices.FindExactlyOne[apimodels.Upload](
		os.Getenv("FILE_COLLECTION"),
		findValidIdFilter,
	)
	if err != nil {
		log.Printf("[handleVectorization (Consumer)] Error fetching PDF that are pending vectorization: %v", err.Error())
		return
	}

	// 🛡️ Ensure we have a valid document
	if pdfEntry.ID.IsZero() {
		log.Printf("[handleVectorization (Consumer)] No matching file found for vectorization")
		return
	}

	// Step 2: Call vectorizer gRPC service
	err = grpcservices.SendFileToPythonVectorizer(pdfEntry)
	if err != nil {
		log.Printf("[handleVectorization (Consumer)] gRPC Vectorizer error for file=%s: %v", task.FileName, err)
		return
	}

	// Step 3: Update DB to mark file as vectorized
	update := bson.M{"$set": bson.M{"isVectorDBcreated": true}}

	if err := databaseservices.UpdateOneByID(
		os.Getenv("FILE_COLLECTION"),
		pdfEntry.ID,
		update,
	); err != nil {
		log.Printf("[handleVectorization (Consumer)] Failed to update vector status in DB: %v", err)
	} else {
		log.Printf("[handleVectorization (Consumer)] DB updated: (%s) file marked as vectorized", task.FileID)
	}
}

func handleVectorDocDeletion(task VectorizationTask) {
	log.Printf("[VectorTaskConsumerGroup] Deleting vector for fileId=%s user=%s chat=%s", task.FileID, task.UserID, task.ChatID)

	// TODO: Call deletion logic (e.g., remove vector entry from DB)
	// example:
	// err := vectorizer.DeleteVector(task.FileID)

	// Step 1: Convert string to ObjectID
	fileObjID, err := primitive.ObjectIDFromHex(task.FileID)
	if err != nil {
		log.Printf("[handleVectorDocDeletion (Consumer)] Invalid fileId: %s", task.FileID)
		return
	}

	// Step 2: Check if the file exists and has vector data
	filter := bson.M{"_id": fileObjID, "isVectorDBcreated": true}
	pdfEntry, err := databaseservices.FindExactlyOne[apimodels.Upload](
		os.Getenv("FILE_COLLECTION"),
		filter,
	)
	if err != nil {
		log.Printf("[handleVectorDocDeletion (Consumer)] Could not find file in DB or error occurred: %v", err)
		return
	}
	if pdfEntry.ID.IsZero() {
		log.Printf("[handleVectorDocDeletion (Consumer)] No matching file with vector DB found")
		return
	}

	// Step 3: Call vector store deletion logic
	_, err = grpcservices.RequestDeleteDocsToPythonVectorizer([]apimodels.Upload{pdfEntry})
	if err != nil {
		log.Printf("[handleVectorDocDeletion (Consumer)] Vector docs deletion failed for file=%s: %v", task.FileID, err)
		return
	}

	log.Printf("[handleVectorDocDeletion (Consumer)] Vector docs successfully deleted for file=%s", task.FileID)

	// Step 4: Mark isVectorDBcreated as false in DB
	collection := config.GetCollection(os.Getenv("FILE_COLLECTION"))

	objID, err := primitive.ObjectIDFromHex(task.FileID)
	if err != nil {
		log.Printf("[handleVectorDocDeletion (Consumer)] Invalid fileId=%s: %v", task.FileID, err)
		return
	}

	deleteFilter := bson.M{"_id": objID}

	_, err = collection.DeleteOne(context.TODO(), deleteFilter)
	if err != nil {
		log.Printf("[handleVectorDocDeletion (Consumer)] Failed to delete file entry from DB: %v", err)
	} else {
		log.Printf("[handleVectorDocDeletion (Consumer)] File entry deleted from DB for fileId=%s", task.FileID)
	}
}
