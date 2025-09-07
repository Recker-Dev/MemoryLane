package controllers

import (
	"fmt"
	"net/http"
	"os"

	helperfuncs "github.com/Recker-Dev/NextJs-GPT/backend/micro-service/helperfuncs"
	models "github.com/Recker-Dev/NextJs-GPT/backend/micro-service/models"
	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/services"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Request needs to wait till files are written down in a folder.
func UploadChatFiles(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "",
			"error":   err.Error(),
		})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "",
			"error":   "No files uploaded",
		})
		return
	}

	if len(files) > 10 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "",
			"error":   "Cannot upload more than 10 files",
		})
		return
	}

	var totalSize int64
	for _, f := range files {
		totalSize += f.Size
	}

	if totalSize > 500*1024*1024 { // 500 MB
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "",
			"error":   fmt.Sprintf("Total upload size exceeds 500MB limit (%.2f MB)", float64(totalSize)/(1024*1024)),
		})
		return
	}

	// Trigger Service for file uploading
	uploadSummary := services.HandleFileUpload(userId, chatId, files)

	var successStatus string
	var httpStatus int
	switch {
	case len(uploadSummary.Successful) == len(files):
		successStatus = "all"
		httpStatus = http.StatusOK //200
	case len(uploadSummary.Successful) == 0:
		successStatus = "none"
		httpStatus = http.StatusInternalServerError //500
	default:
		successStatus = "partial"
		httpStatus = http.StatusMultiStatus // 207
	}

	//  Replaced with raising a kafka task
	go helperfuncs.CreateVectorizationTasks(userId, chatId, uploadSummary.Successful)

	c.JSON(httpStatus, gin.H{
		"success":        successStatus,
		"uploaded":       uploadSummary.Successful,
		"failed":         uploadSummary.Failed,
		"uploaded_count": len(uploadSummary.Successful),
		"failed_count":   len(uploadSummary.Failed),
		"total_files":    len(files),
	})

}

// Request does not need to wait
func DeleteChatFiles(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")

	var req struct {
		FileIds []string `json:"file_ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "Invalid input parameters in JSON body. file_ids ([]string) required.",
		})
		return
	}

	if userId == "" || chatId == "" || len(req.FileIds) == 0 {
		c.JSON(400, gin.H{
			"success": false,
			"error":   "Invalid input parameters",
			"message": "userId, chatId cannot be empty. fileIds must be valid hex IDs.",
		})
		return
	}

	// Convert file_ids to ObjectIDs
	var objectIds []primitive.ObjectID
	var failedConversions []string
	for _, fId := range req.FileIds {
		objectId, err := primitive.ObjectIDFromHex(fId)
		if err != nil {
			failedConversions = append(failedConversions, fId)
			continue
		}
		objectIds = append(objectIds, objectId)
	}

	if len(objectIds) == 0 {
		c.JSON(400, gin.H{
			"success": false,
			"error":   "All provided fileIds are invalid ObjectID strings.",
		})
		return
	}

	// Find matching documents filter
	validEntriesFilter := bson.M{
		"_id": bson.M{"$in": objectIds},
	}

	toBeDeletedEntries, err := services.FindMany[models.Upload](
		os.Getenv("FILE_COLLECTION"),
		validEntriesFilter,
	)
	if err != nil {
		errMsg := fmt.Sprintf("Failed DB lookup for file deletion: %v", err)
		c.JSON(400, gin.H{
			"success": false,
			"error":   errMsg,
		})
		return
	}

	if len(toBeDeletedEntries) == 0 {
		c.JSON(400, gin.H{
			"success": false,
			"error":   "No matching documents found for provided IDs.",
		})
		return
	}

	// Filter out files that are still processing
	var deletableEntries []models.Upload
	var blockedIds []string
	for _, entry := range toBeDeletedEntries {
		if entry.Status == "processing" {
			blockedIds = append(blockedIds, entry.ID.Hex())
		} else {
			deletableEntries = append(deletableEntries, entry)
		}
	}

	if len(deletableEntries) == 0 {
		c.JSON(400, gin.H{
			"success":          false,
			"error":            "None of the selected files can be deleted because they are currently processing.",
			"blocked_file_ids": blockedIds,
		})
		return
	}

	validIds := []string{}
	for _, entry := range deletableEntries {
		validIds = append(validIds, entry.ID.Hex())
	}

	// log.Printf("[DeleteFiles] Found %d documents to delete. Triggering process in background...", len(toBeDeletedEntries))

	// Launch deletion for allowed files
	go services.HandleFilesDelete(deletableEntries)
	go helperfuncs.CarryVectorDocsDeletionTask(userId, chatId, deletableEntries)

	c.JSON(202, gin.H{
		"success":                true,
		"message":                "File deletion initiated in background for allowed files.",
		"invalid_file_ids":       failedConversions,
		"blocked_file_ids":       blockedIds,
		"valid_file_ids":         validIds,
		"deletion_requested_for": len(deletableEntries),
	})
}

func GetFiles(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")

	if userId == "" || chatId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "userId and chatId are required"})
		return
	}

	filesUploadData, err := services.HandleFilesGet(userId, chatId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": filesUploadData})

}

func SetPersistanceChatFile(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")
	fileId := c.Param("fileId")

	if userId == "" || chatId == "" || fileId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "userId, chatId, and fileId are required"})
		return
	}

	var input struct {
		Persist *bool `json:"persist"`
	}

	// Bind JSON body into struct
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}
	if input.Persist == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "persist field is required and must be true or false",
		})
		return
	}

	if err := services.SetFilePersistence(userId, chatId, fileId, *input.Persist); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true,
		"message": fmt.Sprintf("File persistence set to %v", *input.Persist),
		"fileId":  fileId})

}
