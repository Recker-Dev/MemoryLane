package controllers

import (
	"fmt"
	"mime/multipart"
	"net/http"

	helper "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/helperfuncs"
	services "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/restapi"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func UploadFiles(c *gin.Context) {
	userId := c.Param("userId")
	chatId := c.Param("chatId")

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No files uploaded"})
		return
	}

	if len(files) > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot upload more than 10 files"})
		return
	}

	var totalSize int64
	for _, f := range files {
		totalSize += f.Size
	}

	if totalSize > 500*1024*1024 { // 500 MB
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Total upload size exceeds 500MB limit (%.2f MB)", float64(totalSize)/(1024*1024)),
		})
		return
	}

	// Create a channel to collect results
	type UploadResult struct {
		FileID   primitive.ObjectID
		FileName string
		Error    error
	}

	results := make(chan UploadResult, len(files))

	// Launch Goroutines
	for _, fileHeader := range files {
		go func(fh *multipart.FileHeader) {
			fileId, err := services.HandleFileUpload(userId, chatId, fh)
			results <- UploadResult{FileID: fileId, FileName: fh.Filename, Error: err}
		}(fileHeader)
	}

	// For Vectorization
	var successfullyUploadedFileIds []primitive.ObjectID

	// For JSON
	type uploadedFileInfo struct {
		FileName string `json:"fileName"`
		FileID   string `json:"fileId"`
	}

	type failedFileInfo struct {
		FileName string `json:"fileName"`
		Error    string `json:"error"`
	}

	var uploadedFiles []uploadedFileInfo
	var failedFiles []failedFileInfo

	for i := 0; i < len(files); i++ {
		res := <-results
		if res.Error != nil {
			failedFiles = append(failedFiles, failedFileInfo{
				FileName: res.FileName,
				Error:    res.Error.Error(),
			})
			continue
		}
		successfullyUploadedFileIds = append(successfullyUploadedFileIds, res.FileID)
		uploadedFiles = append(uploadedFiles, uploadedFileInfo{
			FileName: res.FileName,
			FileID:   res.FileID.Hex(),
		})
	}

	var successStatus string
	var httpStatus int
	switch {
	case len(uploadedFiles) == len(files):
		successStatus = "all"
		httpStatus = http.StatusOK //200
	case len(uploadedFiles) == 0:
		successStatus = "none"
		httpStatus = http.StatusInternalServerError //500
	default:
		successStatus = "partial"
		httpStatus = http.StatusMultiStatus // 207
	}

	c.JSON(httpStatus, gin.H{
		"success":        successStatus,
		"uploaded":       uploadedFiles,
		"failed":         failedFiles,
		"uploaded_count": len(uploadedFiles),
		"failed_count":   len(failedFiles),
		"total_files":    len(files),
	})

	// Launch vectorization for successfully uploaded PDFs
	go helper.VectorizeSuccessfulPdf(successfullyUploadedFileIds) // We handle pdf seperation inside

}
