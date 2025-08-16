package helperfuncs

import (
	"encoding/json"
	"log"

	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/kafka"
	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/models"
	fileservices "github.com/Recker-Dev/NextJs-GPT/backend/micro-service/services/file-services"
)

// import (
// 	"log"
// 	"os"

// 	models "github.com/Recker-Dev/NextJs-GPT/backend/micro-service/models"
// 	databaseservices "github.com/Recker-Dev/NextJs-GPT/backend/micro-service/services/database-services"
// 	fileservices "github.com/Recker-Dev/NextJs-GPT/backend/micro-service/services/file-services"
// 	"go.mongodb.org/mongo-driver/bson"
// 	"go.mongodb.org/mongo-driver/bson/primitive"
// )

// func CarryVectorizationIfAny(uploadedFileIds []primitive.ObjectID) {

// 	// Create a valid filter condition to shorlist PDF and isVectorDBcreated: false from all uploaded Ids.
// 	findValidIdsFilter := bson.M{
// 		"_id":               bson.M{"$in": uploadedFileIds},
// 		"fileType":          "application/pdf",
// 		"isVectorDBcreated": false,
// 	}

// 	// // Step 1: Query DB for valid pdfs out of the uploaded Ids.
// 	pendingPDFs, err := databaseservices.FindMany[models.Upload](
// 		os.Getenv("FILE_COLLECTION"),
// 		findValidIdsFilter,
// 	)
// 	if err != nil {
// 		log.Printf("[CarryVectorizationIfAny] Error fetching PDFs that are pending vectorization: %v", err.Error())
// 		return
// 	}

// 	// Early Exit if no valid PDF found
// 	if len(pendingPDFs) == 0 {
// 		log.Printf("[CarryVectorizationIfAny] No pending PDFs found for vectorization.....Exiting Function")
// 		return
// 	}

// 	// Create a channel to collect results
// 	type vectorResult struct {
// 		FileID primitive.ObjectID
// 		Error  error
// 	}
// 	results := make(chan vectorResult, len(pendingPDFs))

// 	// Step 2 - launch goroutines for gRPC calls
// 	for _, pdf := range pendingPDFs {
// 		go func(p models.Upload) {
// 			log.Printf("[CarryVectorizationIfAny] Triggering Vectorization Effort for File with ID: %s ....", p.ID.Hex())
// 			err := grpcservices.SendFileToPythonVectorizer(p)
// 			results <- vectorResult{
// 				FileID: p.ID,
// 				Error:  err,
// 			}
// 		}(pdf)
// 	}

// 	//Step 3. update DB based on gRPC results
// 	var successfullyVectorizedIDs []primitive.ObjectID
// 	for range pendingPDFs {
// 		res := <-results
// 		if res.Error == nil {
// 			successfullyVectorizedIDs = append(successfullyVectorizedIDs, res.FileID)
// 			log.Printf("[CarryVectorizationIfAny] Vectorized successfully: %s", res.FileID.Hex())
// 		} else {
// 			log.Printf("[CarryVectorizationIfAny] Vectorization failed: %s. Error: %v", res.FileID.Hex(), res.Error)
// 		}
// 	}

// 	// Early exit incase no IDs were vectorized succesfully.
// 	if len(successfullyVectorizedIDs) == 0 {
// 		log.Printf("[CarryVectorizationIfAny] No PDFs were successfully vectorized. Skipping DB update......Exiting Fuction")
// 		return
// 	}

// 	log.Printf("[CarryVectorizationIfAny] Proceeding with vector status updation of %d Ids.....", len(successfullyVectorizedIDs))

// 	// Creating a valid filter condition for the succesfuly IDs.
// 	updateFilter := bson.M{
// 		"$set": bson.M{
// 			"isVectorDBcreated": true,
// 		},
// 	}

// 	matched, modified, err := databaseservices.UpdateManyByIds(
// 		os.Getenv("FILE_COLLECTION"),
// 		successfullyVectorizedIDs,
// 		updateFilter,
// 	)
// 	if err != nil {
// 		log.Printf("[CarryVectorizationIfAny] Failed to update documents: %v", err.Error())

// 	} else {
// 		log.Printf(
// 			"[CarryVectorizationIfAny] Received %d pdf ids by Mongo for Vectorization status updation, matched %d, updated %d.",
// 			len(successfullyVectorizedIDs),
// 			matched,
// 			modified,
// 		)
// 	}

// }

// func CarryVectorDocsDeletion(uploads []models.Upload) {

// 	// Launch File Deletion from disk.
// 	fileservices.HandleFilesDelete(uploads)

// 	// Launch gRPC request for deletion.
// 	results, err := grpcservices.RequestDeleteDocsToPythonVectorizer(uploads)
// 	if err != nil {
// 		log.Printf("[ProcessDeleteFiles->gRPC] Error during gRPC process, %v", err)
// 		return
// 	}

// 	var successfullyDeletedIDsByVectorDB []primitive.ObjectID

// 	// Process results of file deletion from VectorDB and delete successful entries from MongoDB
// 	for _, result := range results {
// 		log.Printf("[CarryVectorDocsDeletion] FileID %s deletion result from Vector Database: Success=%v, Msg=%s, Err=%s",
// 			result.FileID.Hex(), result.Success, result.Message, result.Error)
// 		if result.Success {
// 			successfullyDeletedIDsByVectorDB = append(successfullyDeletedIDsByVectorDB, result.FileID)
// 		}
// 	}

// 	if len(successfullyDeletedIDsByVectorDB) > 0 {
// 		deleteResult, err := databaseservices.DeleteManyByIds(
// 			os.Getenv("FILE_COLLECTION"),
// 			successfullyDeletedIDsByVectorDB,
// 		)
// 		if err != nil {
// 			log.Printf("[CarryVectorDocsDeletion] ERROR deleting from Mongo: %v", err)
// 		} else {
// 			log.Printf("[CarryVectorDocsDeletion] Deleted %d documents from MongoDB.", deleteResult)
// 		}
// 	}
// }

var brokers = []string{"localhost:9092"}

var publisherHandler = kafka.InitProducer(brokers)

type SingleFileVectorizationTask struct {
	Operation string `json:"operation"`
	UserID    string `json:"userId"`
	ChatID    string `json:"chatId"`
	FileName  string `json:"fileName"`
	FileID    string `json:"fileId"`
	FileType  string `json:"fileType"`
	FilePath  string `json:"filePath"`
}

func CreateVectorizationTasks(userId, chatId string, succFiles []fileservices.FileUploadInfo) {
	for _, file := range succFiles {

		// log.Print("Printing type: ", file.FileType)

		if file.FileType != "application/pdf" {
			log.Printf("[CreateVectorizationTasks (Kafka Publisher)] Skipping file=%s as it is not pdf.", file.FileName)
			continue
		}

		task := SingleFileVectorizationTask{
			Operation: "vectorize",
			UserID:    userId,
			ChatID:    chatId,
			FileName:  file.FileName,
			FileID:    file.FileID,
			FilePath:  file.FilePath,
		}

		// Marshal to JSON
		tastBytes, err := json.Marshal(task)
		if err != nil {
			log.Printf("[CreateVectorizationTasks (Kafka Publisher)] ERROR marshalling task for file=%s: %v", file.FileName, err)
			continue
		}

		//Pubish
		err = publisherHandler.SendMessage("vectorize_file", chatId, tastBytes)
		if err != nil {
			log.Printf("[CreateVectorizationTasks (Kafka Publisher)] ERROR sending Kafka msg for file=%s: %v", file.FileName, err)
		} else {
			log.Printf("[CreateVectorizationTasks (Kafka Publisher)] Kafka msg sent for file=%s fileId=%s", file.FileName, file.FileID)
		}
	}
}

func CarryVectorDocsDeletionTask(userId, chatId string, delFiles []models.Upload) {
	for _, file := range delFiles {
		task := SingleFileVectorizationTask{
			Operation: "delete",
			UserID:    userId,
			ChatID:    chatId,
			FileID:    file.ID.Hex(),
			FileName:  file.FileName,
			FilePath:  "",
		}

		// Marshal to JSON
		tastBytes, err := json.Marshal(task)
		if err != nil {
			log.Printf("[CarryVectorDocsDeletionTask (Kafka Publisher)] ERROR marshalling task for file=%s: %v", file.FileName, err)
			continue
		}

		//Pubish
		err = publisherHandler.SendMessage("vectorize_file", chatId, tastBytes)
		if err != nil {
			log.Printf("[CarryVectorDocsDeletionTask (Kafka Publisher)] ERROR sending Kafka msg for file=%s: %v", file.FileName, err)
		} else {
			log.Printf("[CarryVectorDocsDeletionTask (Kafka Publisher)] Kafka msg sent for file=%s fileId=%s", file.FileName, file.ID.Hex())
		}

	}
}
