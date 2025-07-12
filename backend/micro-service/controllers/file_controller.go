package controllers

import (
	"mime/multipart"
	"net/http"

	"github.com/Recker-Dev/NextJs-GPT/backend/micro-service/services"
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

	// Create a channel to collect results
	type uploadResult struct {
		FileID   primitive.ObjectID
		FileName string
		Error    error
	}

	results := make(chan uploadResult, len(files))

	// Launch Goroutines
	for _, fileHeader := range files {
		go func(fh *multipart.FileHeader) {
			fileId, err := services.HandleFileUpload(userId, chatId, fh)
			results <- uploadResult{FileID: fileId, FileName: fh.Filename, Error: err}
		}(fileHeader)
	}

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
}
