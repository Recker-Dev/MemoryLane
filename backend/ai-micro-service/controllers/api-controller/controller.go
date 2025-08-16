package controllers

// // Request needs to wait till files are written down in a folder.
// func UploadFiles(c *gin.Context) {
// 	userId := c.Param("userId")
// 	chatId := c.Param("chatId")

// 	form, err := c.MultipartForm()
// 	if err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{
// 			"success": false,
// 			"message": "",
// 			"error":   err.Error(),
// 		})
// 		return
// 	}

// 	files := form.File["files"]
// 	if len(files) == 0 {
// 		c.JSON(http.StatusBadRequest, gin.H{
// 			"success": false,
// 			"message": "",
// 			"error":   "No files uploaded",
// 		})
// 		return
// 	}

// 	if len(files) > 10 {
// 		c.JSON(http.StatusBadRequest, gin.H{
// 			"success": false,
// 			"message": "",
// 			"error":   "Cannot upload more than 10 files",
// 		})
// 		return
// 	}

// 	var totalSize int64
// 	for _, f := range files {
// 		totalSize += f.Size
// 	}

// 	if totalSize > 500*1024*1024 { // 500 MB
// 		c.JSON(http.StatusBadRequest, gin.H{
// 			"success": false,
// 			"message": "",
// 			"error":   fmt.Sprintf("Total upload size exceeds 500MB limit (%.2f MB)", float64(totalSize)/(1024*1024)),
// 		})
// 		return
// 	}

// 	// Trigger Service for file uploading
// 	uploadSummary := fileservices.HandleFileUpload(userId, chatId, files)

// 	var successStatus string
// 	var httpStatus int
// 	switch {
// 	case len(uploadSummary.Successful) == len(files):
// 		successStatus = "all"
// 		httpStatus = http.StatusOK //200
// 	case len(uploadSummary.Successful) == 0:
// 		successStatus = "none"
// 		httpStatus = http.StatusInternalServerError //500
// 	default:
// 		successStatus = "partial"
// 		httpStatus = http.StatusMultiStatus // 207
// 	}

// 	// Launch vectorization for any PDF if any.
// 	go helperfuncs.CarryVectorizationIfAny(uploadSummary.SuccessfulFileIds) // We handle pdf seperation inside

// 	c.JSON(httpStatus, gin.H{
// 		"success":        successStatus,
// 		"uploaded":       uploadSummary.Successful,
// 		"failed":         uploadSummary.Failed,
// 		"uploaded_count": len(uploadSummary.Successful),
// 		"failed_count":   len(uploadSummary.Failed),
// 		"total_files":    len(files),
// 	})

// }

// Request does not need to wait
// func DeleteFiles(c *gin.Context) {
// 	userId := c.Param("userId")
// 	chatId := c.Param("chatId")

// 	type VectorDocsDeleteRequest struct {
// 		FileIds []string `json:"file_ids"`
// 	}
// 	var req VectorDocsDeleteRequest
// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		c.JSON(400, gin.H{
// 			"success": false,
// 			"error":   err.Error(),
// 			"message": "Invalid input parameters in JSON body. file_ids ([]string) required.",
// 		})
// 		return
// 	}

// 	if userId == "" || chatId == "" || len(req.FileIds) == 0 {
// 		c.JSON(400, gin.H{
// 			"success": false,
// 			"error":   "Invalid input parameters",
// 			"message": "userId, chatId cannot be empty. fileIds must be valid hex IDs.",
// 		})
// 		return
// 	}

// 	// Convert file_ids to ObjectIDs
// 	var objectIds []primitive.ObjectID
// 	var failedConversions []string
// 	for _, fId := range req.FileIds {
// 		objectId, err := primitive.ObjectIDFromHex(fId)
// 		if err != nil {
// 			failedConversions = append(failedConversions, fId)
// 			continue
// 		}
// 		objectIds = append(objectIds, objectId)
// 	}

// 	if len(objectIds) == 0 {
// 		c.JSON(400, gin.H{
// 			"success": false,
// 			"error":   "All provided fileIds are invalid ObjectID strings.",
// 		})
// 		return
// 	}

// 	// Find matching documents filter
// 	validEntriesFilter := bson.M{
// 		"_id": bson.M{"$in": objectIds},
// 	}

// 	toBeDeletedEntries, err := databaseservices.FindMany[apimodels.Upload](
// 		os.Getenv("FILE_COLLECTION"),
// 		validEntriesFilter,
// 	)
// 	if err != nil {
// 		errMsg := fmt.Sprintf("Failed DB lookup for file deletion: %v", err)
// 		c.JSON(400, gin.H{
// 			"success": false,
// 			"error":   errMsg,
// 		})
// 		return
// 	}

// 	if len(toBeDeletedEntries) == 0 {
// 		c.JSON(400, gin.H{
// 			"success": false,
// 			"error":   "No matching documents found for provided IDs.",
// 		})
// 		return
// 	}

// 	validIds := []string{}
// 	for _, entry := range toBeDeletedEntries {
// 		validIds = append(validIds, entry.ID.Hex())
// 	}

// 	log.Printf("[DeleteFiles] Found %d documents to delete. Triggering process in background...", len(toBeDeletedEntries))

// 	// Launch go routine
// 	go helperfuncs.CarryVectorDocsDeletion(toBeDeletedEntries)

// 	// Return immediately
// 	c.JSON(202, gin.H{
// 		"success":                true,
// 		"message":                "File deletion initiated in background.",
// 		"invalid_file_ids":       failedConversions,
// 		"valid_file_ids":         validIds,
// 		"deletion_requested_for": len(toBeDeletedEntries),
// 	})
// }
// Request does not need to wait
// func DeleteFiles(c *gin.Context) {
// 	userId := c.Param("userId")
// 	chatId := c.Param("chatId")

// 	type VectorDocsDeleteRequest struct {
// 		FileIds []string `json:"file_ids"`
// 	}
// 	var req VectorDocsDeleteRequest
// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		c.JSON(400, gin.H{
// 			"success": false,
// 			"error":   err.Error(),
// 			"message": "Invalid input parameters in JSON body. file_ids ([]string) required.",
// 		})
// 		return
// 	}

// 	if userId == "" || chatId == "" || len(req.FileIds) == 0 {
// 		c.JSON(400, gin.H{
// 			"success": false,
// 			"error":   "Invalid input parameters",
// 			"message": "userId, chatId cannot be empty. fileIds must be valid hex IDs.",
// 		})
// 		return
// 	}

// 	// Convert file_ids to ObjectIDs
// 	var objectIds []primitive.ObjectID
// 	var failedConversions []string
// 	for _, fId := range req.FileIds {
// 		objectId, err := primitive.ObjectIDFromHex(fId)
// 		if err != nil {
// 			failedConversions = append(failedConversions, fId)
// 			continue
// 		}
// 		objectIds = append(objectIds, objectId)
// 	}

// 	if len(objectIds) == 0 {
// 		c.JSON(400, gin.H{
// 			"success": false,
// 			"error":   "All provided fileIds are invalid ObjectID strings.",
// 		})
// 		return
// 	}

// 	// Find matching documents filter
// 	validEntriesFilter := bson.M{
// 		"_id": bson.M{"$in": objectIds},
// 	}

// 	toBeDeletedEntries, err := databaseservices.FindMany[apimodels.Upload](
// 		os.Getenv("FILE_COLLECTION"),
// 		validEntriesFilter,
// 	)
// 	if err != nil {
// 		errMsg := fmt.Sprintf("Failed DB lookup for file deletion: %v", err)
// 		c.JSON(400, gin.H{
// 			"success": false,
// 			"error":   errMsg,
// 		})
// 		return
// 	}

// 	if len(toBeDeletedEntries) == 0 {
// 		c.JSON(400, gin.H{
// 			"success": false,
// 			"error":   "No matching documents found for provided IDs.",
// 		})
// 		return
// 	}

// 	validIds := []string{}
// 	for _, entry := range toBeDeletedEntries {
// 		validIds = append(validIds, entry.ID.Hex())
// 	}

// 	log.Printf("[DeleteFiles] Found %d documents to delete. Triggering process in background...", len(toBeDeletedEntries))

// 	// Launch go routine
// 	go helperfuncs.CarryVectorDocsDeletion(toBeDeletedEntries)

// 	// Return immediately
// 	c.JSON(202, gin.H{
// 		"success":                true,
// 		"message":                "File deletion initiated in background.",
// 		"invalid_file_ids":       failedConversions,
// 		"valid_file_ids":         validIds,
// 		"deletion_requested_for": len(toBeDeletedEntries),
// 	})
// }

// Request needs to wait till queries are fetched.
// func VectorQuery(c *gin.Context) {
// 	userId := c.Param("userId")
// 	chatId := c.Param("chatId")

// 	type VectorQueryRequest struct {
// 		TopK       int      `json:"top_k"`
// 		QueryTexts []string `json:"query_texts"`
// 		FileIds    []string `json:"file_ids"`
// 	}
// 	var req VectorQueryRequest
// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		c.JSON(400, gin.H{
// 			"error":   err.Error(),
// 			"message": "Invalid input parametes in Json body. top_k(int) and query_texts([]string)",
// 		})
// 		return
// 	}

// 	if userId == "" || chatId == "" || req.TopK <= 0 || len(req.FileIds) == 0 || len(req.QueryTexts) == 0 {
// 		c.JSON(400, gin.H{
// 			"success": false,
// 			"error":   "Invalid input parameters",
// 			"message": "userId, chatId cannot be empty. top_k must be > 0, file_ids must be > 0 and query_texts cannot be empty.",
// 		})
// 		return
// 	}

// 	var objectIds []primitive.ObjectID

// 	for _, fileId := range req.FileIds {
// 		// Convert from String to Hex-Code
// 		objectId, err := primitive.ObjectIDFromHex(fileId)
// 		if err != nil {
// 			c.JSON(400, gin.H{
// 				"success": false,
// 				"error":   "Invalid fileId format. Must be a valid ObjectId hex string.",
// 				"message": "Provided fileId needs to be a valid string convertible to mongo ObjectID.",
// 			})
// 			continue
// 		}
// 		objectIds = append(objectIds, objectId)

// 	}

// 	// Verify Existance of valid file, file-type and vectorDB status in DB before proceeding.
// 	validEntriesFilter := bson.M{
// 		"_id": bson.M{
// 			"$in": objectIds,
// 		},
// 		"userId":            userId,
// 		"chatId":            chatId,
// 		"fileType":          "application/pdf",
// 		"isVectorDBcreated": true,
// 	}

// 	results, err := databaseservices.FindMany[apimodels.Upload](
// 		os.Getenv("FILE_COLLECTION"),
// 		validEntriesFilter,
// 	)
// 	if err != nil {
// 		c.JSON(500, gin.H{
// 			"success": false,
// 			"error":   "Database error while fetching documents for given Ids.",
// 			"userId":  userId,
// 			"chatId":  chatId,
// 			"message": err.Error(),
// 		})
// 		return
// 	}

// 	// Early exit, if no docs are found
// 	if len(results) == 0 {
// 		c.JSON(404, gin.H{
// 			"success": false,
// 			"error":   "No matching document found",
// 			"userId":  userId,
// 			"chatId":  chatId,
// 			"message": "No document found for the provided fields in database.",
// 		})
// 		return
// 	}

// 	log.Printf("[QueryVectorDB] Vector query requested by userId=%s, chatId=%s, across fileIds=%s", userId, chatId, strings.Join(req.FileIds, ","))

// 	response, err := grpcservices.SendQueryToPythonVectorizer(results, int32(req.TopK), req.QueryTexts)
// 	if err != nil {
// 		c.JSON(500, gin.H{
// 			"success": false,
// 			"error":   "Error while expecting response from Python micro-service",
// 			"message": err.Error()})
// 		return
// 	}

// 	// All good to procced
// 	c.JSON(200, response)
// }
