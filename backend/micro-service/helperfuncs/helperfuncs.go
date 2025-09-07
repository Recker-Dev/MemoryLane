package helperfuncs

import (
	"encoding/json"
	"log"

	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/kafka"
	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/models"
	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/services"
)

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

func CreateVectorizationTasks(userId, chatId string, succFiles []services.FileUploadInfo) {
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
