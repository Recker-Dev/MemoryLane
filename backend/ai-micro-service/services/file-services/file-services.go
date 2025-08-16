package fileservices

// // For File Upload Result
// type FileUploadInfo struct {
// 	FileName string `json:"fileName"`
// 	FileID   string `json:"fileId"`
// 	FileType string `json:"fileType"`
// 	Error    string `json:"error"`
// }

// type UploadSummary struct {
// 	Successful        []FileUploadInfo
// 	SuccessfulFileIds []primitive.ObjectID
// 	Failed            []FileUploadInfo
// }

// func HandleFileUpload(userId, chatId string, fileHeaderArr []*multipart.FileHeader) UploadSummary {

// 	uploadCollection := config.GetCollection(os.Getenv("FILE_COLLECTION"))

// 	// Create a channel to collect results
// 	type UploadResultForChannel struct {
// 		FileID   string
// 		FileName string
// 		FileType string
// 		Error    error
// 	}

// 	fileUploadChannel := make(chan UploadResultForChannel, len(fileHeaderArr))

// 	for _, fileHeader := range fileHeaderArr {

// 		go func(fh *multipart.FileHeader) {

// 			log.Printf("[HandleFileUpload] START - userId=%s chatId=%s filename=%s", userId, chatId, fh.Filename)

// 			// Open the file
// 			file, err := fh.Open()
// 			if err != nil {
// 				log.Printf("[HandleFileUpload] ERROR opening file - userId=%s chatId=%s filename=%s err=%v", userId, chatId, fh.Filename, err)
// 				fileUploadChannel <- UploadResultForChannel{
// 					FileID:   "",
// 					FileName: fh.Filename,
// 					FileType: "",
// 					Error:    err,
// 				}
// 				return
// 			}
// 			defer file.Close()

// 			// Determine type
// 			contentType := fh.Header.Get("Content-Type")

// 			var folder string
// 			if strings.HasPrefix(contentType, "image/") {
// 				folder = "images"
// 			} else {
// 				folder = "files"
// 			}

// 			// Build path
// 			basePath := os.Getenv("UPLOAD_PATH")
// 			fullPath := filepath.Join(
// 				basePath,
// 				userId,
// 				chatId,
// 				folder,
// 			)

// 			// Create folders
// 			err = os.MkdirAll(fullPath, os.ModePerm)
// 			if err != nil {
// 				log.Printf("[HandleFileUpload] ERROR creating path - userId=%s chatId=%s path=%s err=%v", userId, chatId, fullPath, err)
// 				fileUploadChannel <- UploadResultForChannel{
// 					FileID:   "",
// 					FileName: fh.Filename,
// 					FileType: "",
// 					Error:    err,
// 				}
// 				return
// 			}

// 			// Create new Upload document to get ObjectID; needed for filepath
// 			doc := apimodels.Upload{
// 				UserId:            userId,
// 				ChatId:            chatId,
// 				FileName:          fh.Filename,
// 				FileType:          contentType,
// 				CreatedAt:         time.Now(),
// 				IsVectorDBCreated: false,
// 			}

// 			// Insert in DB and get the ObjectId; needed for filepath
// 			insertRes, err := uploadCollection.InsertOne(context.Background(), doc)
// 			if err != nil {
// 				log.Printf("[HandleFileUpload] ERROR inserting doc - userId=%s chatId=%s filename=%s err=%v", userId, chatId, fh.Filename, err)
// 				fileUploadChannel <- UploadResultForChannel{
// 					FileID:   "",
// 					FileName: fh.Filename,
// 					FileType: "",
// 					Error:    err,
// 				}
// 				return
// 			}

// 			// Get that mongo-id
// 			objectId := insertRes.InsertedID.(primitive.ObjectID)
// 			log.Printf("[HandleFileUpload] Mongo Insert SUCCESS - userId=%s chatId=%s filename=%s objectId=%s", userId, chatId, fh.Filename, objectId.Hex()[:10])

// 			// Save file to disk using Mongo ID
// 			ext := filepath.Ext(fh.Filename)
// 			savePath := filepath.Join(fullPath, objectId.Hex()+ext)

// 			out, err := os.Create(savePath)
// 			if err != nil {
// 				log.Printf("[HandleFileUpload] ERROR creating file on disk - userId=%s chatId=%s filename=%s path=%s err=%v", userId, chatId, fh.Filename, savePath, err)
// 				fileUploadChannel <- UploadResultForChannel{
// 					FileID:   objectId.Hex(),
// 					FileName: fh.Filename,
// 					FileType: "",
// 					Error:    err,
// 				}
// 				return
// 			}
// 			defer out.Close()

// 			_, err = io.Copy(out, file)
// 			if err != nil {
// 				log.Printf("[HandleFileUpload] ERROR writing file - userId=%s chatId=%s filename=%s path=%s err=%v", userId, chatId, fh.Filename, savePath, err)
// 				fileUploadChannel <- UploadResultForChannel{
// 					FileID:   objectId.Hex(),
// 					FileName: fh.Filename,
// 					FileType: "",
// 					Error:    err,
// 				}
// 				return
// 			}

// 			// Update path in DB
// 			_, err = uploadCollection.UpdateByID(
// 				context.Background(),
// 				objectId,
// 				bson.M{
// 					"$set": bson.M{
// 						"path": savePath,
// 					},
// 				},
// 			)
// 			if err != nil {
// 				log.Printf("[HandleFileUpload] ERROR updating path in DB - userId=%s chatId=%s filename=%s objectId=%s err=%v", userId, chatId, fh.Filename, objectId.Hex()[:10], err)
// 				fileUploadChannel <- UploadResultForChannel{
// 					FileID:   objectId.Hex(),
// 					FileName: fh.Filename,
// 					FileType: "",
// 					Error:    err,
// 				}
// 				return
// 			}
// 			log.Printf("[HandleFileUpload] COMPLETED - userId=%s chatId=%s filename=%s objectId=%s....", userId, chatId, fh.Filename, objectId.Hex()[:10])
// 			fileUploadChannel <- UploadResultForChannel{
// 				FileID:   objectId.Hex(),
// 				FileName: fh.Filename,
// 				FileType: fh.Header.Get("Content-Type"),
// 				Error:    err,
// 			}
// 		}(fileHeader)
// 	}

// 	var successfulUploadedFiles []FileUploadInfo
// 	var failedUploadedFiles []FileUploadInfo

// 	// For Vectorization
// 	var successfullyUploadedFileIds []primitive.ObjectID

// 	// Consume the channel results
// 	for range fileHeaderArr {
// 		uploadResult := <-fileUploadChannel
// 		if uploadResult.Error != nil {
// 			// Collect failed upload files status
// 			failedUploadedFiles = append(failedUploadedFiles, FileUploadInfo{
// 				FileName: uploadResult.FileName,
// 				FileID:   "",
// 				FileType: "",
// 				Error:    uploadResult.Error.Error(),
// 			})
// 			continue
// 		}
// 		// Collect success upload file status
// 		successfulUploadedFiles = append(successfulUploadedFiles, FileUploadInfo{
// 			FileName: uploadResult.FileName,
// 			FileID:   uploadResult.FileID,
// 			FileType: uploadResult.FileType,
// 			Error:    "",
// 		})
// 		// Collect success fileIds for vectorization
// 		objectId, err := primitive.ObjectIDFromHex(uploadResult.FileID)
// 		if err == nil {
// 			successfullyUploadedFileIds = append(successfullyUploadedFileIds, objectId)
// 		}
// 	}

// 	// Return the results
// 	return UploadSummary{
// 		Successful:        successfulUploadedFiles,
// 		SuccessfulFileIds: successfullyUploadedFileIds,
// 		Failed:            failedUploadedFiles,
// 	}

// }

// func HandleFilesDelete(uploads []apimodels.Upload) {

// 	for _, upload := range uploads {

// 		filePath := upload.Path

// 		if filePath == "" {
// 			log.Printf("[HandleFilesDelete] Skipped empty path for fileId=%s.... userId=%s chatId=%s",
// 				upload.ID.Hex()[:10], upload.UserId, upload.ChatId)
// 			continue
// 		}

// 		// Launches goroutine to take care of deletion of files
// 		go func(u apimodels.Upload, f string) {
// 			// Check if filepath exist
// 			_, err := os.Stat(f)
// 			if err == nil {
// 				// Exist -> procced with delete
// 				if err := os.Remove(f); err != nil {
// 					log.Printf("[HandleFilesDelete] ERROR deleting file - fileId=%s userId=%s chatId=%s path=%s err=%v",
// 						u.ID.Hex(), u.UserId, u.ChatId, f, err)
// 				} else {
// 					log.Printf("[HandleFilesDelete] Deleted file - fileId=%s userId=%s chatId=%s",
// 						u.ID.Hex(), u.UserId, u.ChatId)
// 				}
// 			} else if errors.Is(err, os.ErrNotExist) {
// 				// File missing -> ignore or warn
// 				log.Printf("[HandleFilesDelete] File already missing - fileId=%s userId=%s chatId=%s path=%s",
// 					u.ID.Hex(), u.UserId, u.ChatId, f)
// 			} else {
// 				// Some other file path system error
// 				log.Printf("[HandleFilesDelete] ERROR checking file existence - fileId=%s userId=%s chatId=%s path=%s err=%v",
// 					u.ID.Hex(), u.UserId, u.ChatId, f, err)
// 			}
// 		}(upload, filePath)

// 	}

// }
