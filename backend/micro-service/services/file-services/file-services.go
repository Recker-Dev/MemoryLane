package fileservices

import (
	"context"
	"errors"
	"io"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/config"
	models "github.com/Recker-Dev/NextJs-GPT/backend/micro-service/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// For File Upload Result
type FileUploadInfo struct {
	FileName string `json:"fileName"`
	FilePath string `json:"filePath"`
	FileType string `json:"fileType"`
	FileID   string `json:"fileId"`
	Error    string `json:"error"`
}

type UploadSummary struct {
	Successful        []FileUploadInfo
	SuccessfulFileIds []primitive.ObjectID
	Failed            []FileUploadInfo
}

type FileResponse struct {
	FileId    string    `json:"fileId"`
	FileName  string    `json:"fileName"`
	CreatedAt time.Time `json:"createdAt"`
	Persist   bool      `json:"persist"`
}

func HandleFileUpload(userId, chatId string, fileHeaderArr []*multipart.FileHeader) UploadSummary {

	uploadCollection := config.GetCollection(os.Getenv("FILE_COLLECTION"))

	// Create a channel to collect results
	type UploadResultForChannel struct {
		FileID   string
		FileName string
		FilePath string
		FileType string
		Error    error
	}

	fileUploadChannel := make(chan UploadResultForChannel, len(fileHeaderArr))

	for _, fileHeader := range fileHeaderArr {

		go func(fh *multipart.FileHeader) {

			log.Printf("[HandleFileUpload (File Service)] START - userId=%s chatId=%s filename=%s", userId, chatId, fh.Filename)

			// Open the file
			file, err := fh.Open()
			if err != nil {
				log.Printf("[HandleFileUpload (File Service)] ERROR opening file - userId=%s chatId=%s filename=%s err=%v", userId, chatId, fh.Filename, err)
				fileUploadChannel <- UploadResultForChannel{
					FileID:   "",
					FileName: fh.Filename,
					FilePath: "",
					Error:    err,
				}
				return
			}
			defer file.Close()

			// Bruteforce detect file type from extension
			ext := strings.ToLower(filepath.Ext(fh.Filename))
			var folder string
			var contentType string

			switch ext {
			case ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp":
				contentType = "images/"
				folder = "images"
			case ".pdf":
				contentType = "application/pdf"
				folder = "files"
			default:
				contentType = "others/"
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
				log.Printf("[HandleFileUpload (File Service)] ERROR creating path - userId=%s chatId=%s path=%s err=%v", userId, chatId, fullPath, err)
				fileUploadChannel <- UploadResultForChannel{
					FileID:   "",
					FileName: fh.Filename,
					FilePath: "",
					FileType: "",
					Error:    err,
				}
				return
			}

			// Create new Upload document to get ObjectID; needed for filepath
			doc := models.Upload{
				UserId:            userId,
				ChatId:            chatId,
				FileName:          fh.Filename,
				FileType:          contentType,
				CreatedAt:         time.Now(),
				IsVectorDBCreated: false,
				Status:            "processing",
				Error:             "",
				Persist:           false,
			}

			// Insert in DB and get the ObjectId; needed for filepath
			insertRes, err := uploadCollection.InsertOne(context.Background(), doc)
			if err != nil {
				log.Printf("[HandleFileUpload (File Service)] ERROR inserting doc - userId=%s chatId=%s filename=%s err=%v", userId, chatId, fh.Filename, err)
				fileUploadChannel <- UploadResultForChannel{
					FileID:   "",
					FileName: fh.Filename,
					FilePath: "",
					FileType: "",
					Error:    err,
				}
				return
			}

			// Get that mongo-id
			objectId := insertRes.InsertedID.(primitive.ObjectID)
			log.Printf("[HandleFileUpload (File Service)] Mongo Insert SUCCESS - userId=%s chatId=%s filename=%s objectId=%s", userId, chatId, fh.Filename, objectId.Hex()[:10])

			// Save file to disk using Mongo ID
			ext = filepath.Ext(fh.Filename)
			savePath := filepath.Join(fullPath, objectId.Hex()+ext)

			out, err := os.Create(savePath)
			if err != nil {
				log.Printf("[HandleFileUpload (File Service)] ERROR creating file on disk - userId=%s chatId=%s filename=%s path=%s err=%v", userId, chatId, fh.Filename, savePath, err)
				fileUploadChannel <- UploadResultForChannel{
					FileID:   objectId.Hex(),
					FileName: fh.Filename,
					FilePath: "",
					FileType: "",
					Error:    err,
				}
				return
			}
			defer out.Close()

			_, err = io.Copy(out, file)
			if err != nil {
				log.Printf("[HandleFileUpload (File Service)] ERROR writing file - userId=%s chatId=%s filename=%s path=%s err=%v", userId, chatId, fh.Filename, savePath, err)
				fileUploadChannel <- UploadResultForChannel{
					FileID:   objectId.Hex(),
					FileName: fh.Filename,
					FilePath: "",
					FileType: "",
					Error:    err,
				}
				return
			}

			// Update path in DB
			_, err = uploadCollection.UpdateByID(
				context.Background(),
				objectId,
				bson.M{
					"$set": bson.M{
						"path": savePath,
					},
				},
			)
			if err != nil {
				log.Printf("[HandleFileUpload (File Service)] ERROR updating path in DB - userId=%s chatId=%s filename=%s objectId=%s err=%v", userId, chatId, fh.Filename, objectId.Hex()[:10], err)
				fileUploadChannel <- UploadResultForChannel{
					FileID:   objectId.Hex(),
					FileName: fh.Filename,
					FilePath: "",
					FileType: "",
					Error:    err,
				}
				return
			}
			log.Printf("[HandleFileUpload (File Service)] COMPLETED - userId=%s chatId=%s filename=%s objectId=%s....", userId, chatId, fh.Filename, objectId.Hex()[:10])
			fileUploadChannel <- UploadResultForChannel{
				FileID:   objectId.Hex(),
				FileName: fh.Filename,
				FilePath: savePath,
				FileType: contentType,
				Error:    err,
			}
		}(fileHeader)
	}

	var successfulUploadedFiles []FileUploadInfo
	var failedUploadedFiles []FileUploadInfo

	// For Vectorization
	var successfullyUploadedFileIds []primitive.ObjectID

	// Consume the channel results
	for range fileHeaderArr {
		uploadResult := <-fileUploadChannel
		if uploadResult.Error != nil {
			// Collect failed upload files status
			failedUploadedFiles = append(failedUploadedFiles, FileUploadInfo{
				FileName: uploadResult.FileName,
				FileID:   "",
				FilePath: "",
				Error:    uploadResult.Error.Error(),
			})
			continue
		}
		// Collect success upload file status
		successfulUploadedFiles = append(successfulUploadedFiles, FileUploadInfo{
			FileName: uploadResult.FileName,
			FileID:   uploadResult.FileID,
			FilePath: uploadResult.FilePath,
			FileType: uploadResult.FileType,
			Error:    "",
		})
		// Collect success fileIds for vectorization
		objectId, err := primitive.ObjectIDFromHex(uploadResult.FileID)
		if err == nil {
			successfullyUploadedFileIds = append(successfullyUploadedFileIds, objectId)
		}
	}

	// Return the results
	return UploadSummary{
		Successful:        successfulUploadedFiles,
		SuccessfulFileIds: successfullyUploadedFileIds,
		Failed:            failedUploadedFiles,
	}

}

func HandleFilesDelete(uploads []models.Upload) {

	for _, upload := range uploads {

		filePath := upload.Path

		if filePath == "" {
			log.Printf("[HandleFilesDelete (File Service)] Skipped empty path for fileId=%s.... userId=%s chatId=%s",
				upload.ID.Hex()[:10], upload.UserId, upload.ChatId)
			continue
		}

		// Launches goroutine to take care of deletion of files
		go func(u models.Upload, f string) {
			// Check if filepath exist
			_, err := os.Stat(f)
			if err == nil {
				// Exist -> procced with delete
				if err := os.Remove(f); err != nil {
					log.Printf("[HandleFilesDelete (File Service)] ERROR deleting file - fileId=%s userId=%s chatId=%s path=%s err=%v",
						u.ID.Hex(), u.UserId, u.ChatId, f, err)
				} else {
					log.Printf("[HandleFilesDelete (File Service)] Deleted file - fileId=%s userId=%s chatId=%s",
						u.ID.Hex(), u.UserId, u.ChatId)
				}
			} else if errors.Is(err, os.ErrNotExist) {
				// File missing -> ignore or warn
				log.Printf("[HandleFilesDelete (File Service)] File already missing - fileId=%s userId=%s chatId=%s path=%s",
					u.ID.Hex(), u.UserId, u.ChatId, f)
			} else {
				// Some other file path system error
				log.Printf("[HandleFilesDelete (File Service)] ERROR checking file existence - fileId=%s userId=%s chatId=%s path=%s err=%v",
					u.ID.Hex(), u.UserId, u.ChatId, f, err)
			}
		}(upload, filePath)

	}

}

func HandleFilesGet(userId, chatId string) ([]FileResponse, error) {
	fileCollection := config.GetCollection(
		os.Getenv("FILE_COLLECTION"),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	projection := bson.M{
		"path": 0,
	}

	opts := options.Find().SetProjection(projection).SetSort(bson.D{{Key: "createdAt", Value: -1}}) //sets project and sorts latest upload first

	cursor, err := fileCollection.Find(ctx, bson.M{"userId": userId, "chatId": chatId}, opts)
	if err != nil {
		return nil, err
	}

	defer cursor.Close(ctx)

	var response []FileResponse

	for cursor.Next(ctx) {
		var file models.Upload
		err := cursor.Decode(&file)
		if err != nil {
			return nil, err
		}
		response = append(response, FileResponse{FileId: file.ID.Hex(),
			FileName:  file.FileName,
			CreatedAt: file.CreatedAt,
			Persist:   file.Persist})
	}

	if len(response) == 0 {
		return []FileResponse{}, nil
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return response, nil

}

func SetFilePersistence(userId, chatId, fileId string, setVal bool) error {
	fileCollection := config.GetCollection(
		os.Getenv("FILE_COLLECTION"),
	)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Convert string -> ObjectID
	objID, err := primitive.ObjectIDFromHex(fileId)
	if err != nil {
		return err // invalid fileId, exit early
	}

	// Build filter
	filter := bson.M{
		"_id":    objID,
		"userId": userId,
		"chatId": chatId,
	}

	update := bson.M{
		"$set": bson.M{"persist": setVal},
	}

	res, err := fileCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if res.MatchedCount == 0 {
		return mongo.ErrNoDocuments // nothing matched
	}

	return nil
}
