package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/IBM/sarama"
	"github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/config"
	apimodels "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/models/api-models"
	databaseservices "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/database-services"
	grpcservices "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/grpc-services"
	"github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/types"
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
func StartVectorFileConsumer(brokers []string, topic, groupId string, publisher *PublisherHandler) {
	config := sarama.NewConfig()
	config.Version = sarama.V2_8_0_0
	config.Consumer.Group.Rebalance.Strategy = sarama.NewBalanceStrategyRange()
	config.Consumer.Offsets.Initial = sarama.OffsetOldest

	group, err := sarama.NewConsumerGroup(brokers, groupId, config)
	if err != nil {
		log.Fatalf("[VectorTaskConsumerGroup] group error: %v", err)
	}

	handler := &vectorTaskConsumerHandler{
		publisher: publisher,
	}
	ctx := context.Background()

	for {
		if err := group.Consume(ctx, []string{topic}, handler); err != nil {
			log.Printf("[VectorTaskConsumerGroup] consume error: %v", err)
		}
	}
}

type vectorTaskConsumerHandler struct {
	publisher *PublisherHandler
}

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
			taskCopy := task
			go func(task *VectorizationTask, msg *sarama.ConsumerMessage) {
				if err := handleVectorization(*task, h); err != nil {
					log.Printf("[VectorTaskConsumerGroup] vectorization failed: %v", err)
					// ❌ don't mark -> message will be retried on restart
					return
				}
				sess.MarkMessage(msg, "") // ✅ only mark after success/fail handled
			}(&taskCopy, msg)
		case "delete":
			taskCopy := task
			go func(task *VectorizationTask, msg *sarama.ConsumerMessage) {
				if err := handleVectorDocDeletion(*task, h); err != nil {
					log.Printf("[VectorTaskConsumerGroup] vectorization failed: %v", err)
					// ❌ don't mark -> message will be retried on restart
					return
				}
				sess.MarkMessage(msg, "") // ✅ only mark after success/fail handled
			}(&taskCopy, msg)
		default:
			log.Printf("[VectorTaskConsumerGroup] Unknown operation: %s", task.Operation)
			sess.MarkMessage(msg, "")
		}
	}
	return nil
}

// These should be implemented somewhere else in your service
func handleVectorization(task VectorizationTask, h *vectorTaskConsumerHandler) error {
	log.Printf("[VectorTaskConsumerGroup] Vectorizing file: %s for user=%s chat=%s", task.FileName, task.UserID, task.ChatID)

	// Step 1: Parse ObjectID
	objID, err := primitive.ObjectIDFromHex(task.FileID)
	if err != nil {
		log.Printf("[handleVectorization] Invalid fileId: %s", task.FileID)
		publishStatus(h, "vectorization_status", task, apimodels.Upload{}, "error", fmt.Sprintf("invalid ObjectID: %v", err))
		return err
	}

	// Step 2: Query DB for valid PDFs pending vectorization
	findValidIdFilter := bson.M{
		"_id":               objID,
		"fileType":          "application/pdf",
		"isVectorDBcreated": false,
	}

	pdfEntry, err := databaseservices.FindExactlyOne[apimodels.Upload](
		os.Getenv("FILE_COLLECTION"),
		findValidIdFilter,
	)
	if err != nil {
		log.Printf("[handleVectorization] DB query error: %v", err.Error())
		publishStatus(h, "vectorization_status", task, apimodels.Upload{}, "error", err.Error())
		return err
	}

	if pdfEntry.ID.IsZero() {
		log.Printf("[handleVectorization] No matching file found for vectorization")
		err := "no matching file found"
		publishStatus(h, "vectorization_status", task, apimodels.Upload{}, "error", err)
		return fmt.Errorf("%s", err)
	}

	// Step 3: Call gRPC vectorizer
	err = grpcservices.SendFileToPythonVectorizer(pdfEntry)

	status := "success"
	errorMsg := ""

	if err != nil {
		status = "failed"
		errorMsg = err.Error()

		// Update DB: failed vectorization
		update := bson.M{
			"$set": bson.M{
				"isVectorDBcreated": false,
				"status":            status,
				"error":             errorMsg,
			},
		}
		_ = databaseservices.UpdateOneByID(os.Getenv("FILE_COLLECTION"), pdfEntry.ID, update)
		log.Printf("[handleVectorization] Vectorization FAILED: %v", err)
	} else {
		// Update DB: success
		update := bson.M{
			"$set": bson.M{
				"isVectorDBcreated": true,
				"status":            status,
			},
		}
		if err := databaseservices.UpdateOneByID(os.Getenv("FILE_COLLECTION"), pdfEntry.ID, update); err != nil {
			log.Printf("[handleVectorization] Failed to update DB after success: %v", err)
		} else {
			log.Printf("[handleVectorization] File %s marked as vectorized", task.FileID)
		}
	}

	// Step 4: Publish final status to Kafka
	publishStatus(h, "vectorization_status", task, pdfEntry, status, errorMsg)

	return nil
}

func handleVectorDocDeletion(task VectorizationTask, h *vectorTaskConsumerHandler) error {
	log.Printf("[VectorTaskConsumerGroup] Deleting vector for fileId=%s user=%s chat=%s",
		task.FileID, task.UserID, task.ChatID)

	var (
		fileEntry apimodels.Upload
		status    = "deleted" // assume success, override on error
		errorMsg  string
	)

	// Step 1: Parse ObjectID
	objID, err := primitive.ObjectIDFromHex(task.FileID)
	if err != nil {
		publishStatus(h, "deletion_status", task, fileEntry, "error", fmt.Sprintf("invalid ObjectID: %v", err))
		return err
	}

	// Step 2: Fetch file entry
	filter := bson.M{"_id": objID}
	fileEntry, err = databaseservices.FindExactlyOne[apimodels.Upload](os.Getenv("FILE_COLLECTION"), filter)
	if err != nil {
		publishStatus(h, "deletion_status", task, fileEntry, "error", fmt.Sprintf("fetch error: %v", err))
		return err
	}

	// Step 3: Delete from vectorizer if needed
	if fileEntry.IsVectorDBCreated {
		if _, err := grpcservices.RequestDeleteDocsToPythonVectorizer([]apimodels.Upload{fileEntry}); err != nil {
			log.Printf("[handleVectorDocDeletion] Vector docs deletion failed for file=%s: %v", task.FileID, err)
			status = "error"
			errorMsg = fmt.Sprintf("vector deletion failed: %v", err)
		} else {
			log.Printf("[handleVectorDocDeletion] Vector docs deleted for file=%s", task.FileID)
		}
	}

	// Step 4: Remove file entry from DB
	collection := config.GetCollection(os.Getenv("FILE_COLLECTION"))
	if _, err := collection.DeleteOne(context.TODO(), filter); err != nil {
		log.Printf("[handleVectorDocDeletion] Failed to delete file entry: %v", err)
		status = "error"
		errorMsg = fmt.Sprintf("db delete failed: %v", err)
	} else {
		log.Printf("[handleVectorDocDeletion] File entry deleted for fileId=%s", task.FileID)
	}

	// Step 5: Publish status to Kafka
	publishStatus(h, "deletion_status", task, fileEntry, status, errorMsg)

	return nil
}

// helper
func publishStatus(
	h *vectorTaskConsumerHandler,
	status_type string,
	task VectorizationTask,
	fileEntry apimodels.Upload,
	status, errorMsg string,
) {
	fileStatus := types.OutgoingFileStatus{
		Type:     status_type,
		FileId:   task.FileID,
		FileName: fileEntry.FileName,
		Status:   status,
		Error:    errorMsg,
	}

	data, err := json.Marshal(fileStatus)
	if err != nil {
		log.Printf("[publishStatus] Failed to marshal OutgoingFileStatus: %v", err)
		return
	}

	key := task.UserID + "_" + task.ChatID
	if err := h.publisher.SendMessage("server_reply", key, data); err != nil {
		log.Printf("[publishStatus] Kafka publish failed for fileId=%s: %v", task.FileID, err)
	} else {
		log.Printf("[publishStatus] Kafka published succeded for file=%s", task.FileID)
	}
}
