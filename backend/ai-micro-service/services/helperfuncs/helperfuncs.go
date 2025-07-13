package helperfuncs

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"

	models "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/models/http"
	"github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/services/restapi"
	pb "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/vectorizer/proto"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func VectorizeSuccessfulPdf(uploadedFileIds []primitive.ObjectID) {

	// Step 1: Query DB for valid pdfs of the uploaded Ids.
	pendingPDFs, err := FetchVectorizationPendingPDFUploads(uploadedFileIds)
	if err != nil {
		log.Printf("error fetching pending PDFs: %v", err)
		return
	}

	// Create a channel to collect results
	type vectorResult struct {
		FileID primitive.ObjectID
		Error  error
	}
	results := make(chan vectorResult, len(pendingPDFs))

	// Step 2 - launch goroutines for gRPC calls

	for _, pdf := range pendingPDFs {
		go func(p models.Upload) {
			err := SendFileToPythonVectorizer(p)
			results <- vectorResult{
				FileID: p.ID,
				Error:  err,
			}
		}(pdf)
	}

	//Step 3. update DB based on gRPC results
	for range len(pendingPDFs) {
		res := <-results
		if res.Error == nil {
			log.Printf("Vectorized successfully: %s", res.FileID.Hex())
			if err := MarkVectorizationDone(res.FileID); err != nil {
				log.Printf("DB updation failed for: %s", res.FileID.Hex())
			}
		} else {
			log.Printf("Vectorization failed: %s. Error: %v", res.FileID.Hex(), res.Error)
		}
	}

}

func FetchVectorizationPendingPDFUploads(ids []primitive.ObjectID) ([]models.Upload, error) {

	uploadCollection := restapi.GetFileCollection()

	filter := bson.M{
		"_id":               bson.M{"$in": ids},
		"fileType":          "application/pdf",
		"isVectorDBcreated": false,
	}

	cursor, err := uploadCollection.Find(context.Background(), filter)
	if err != nil {
		return nil, err
	}

	defer cursor.Close(context.Background())

	var uploads []models.Upload
	if err := cursor.All(context.Background(), &uploads); err != nil {
		return nil, err
	}

	return uploads, nil

}

func SendFileToPythonVectorizer(upload models.Upload) error {
	conn, err := grpc.NewClient("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return err
	}
	defer conn.Close()

	client := pb.NewVectorizerServiceClient(conn)

	file, err := os.Open(upload.Path)
	if err != nil {
		return err
	}
	defer file.Close()

	stream, err := client.UploadAndVectorize(context.Background())
	if err != nil {
		return err
	}

	// send first chunk with metadata
	buf := make([]byte, 1024*512)
	n, err := file.Read(buf)
	if err != nil && err != io.EOF {
		return err
	}

	firstChunk := &pb.PDFChunk{
		UserId:       upload.UserId,
		ChatId:       upload.ChatId,
		FileId:       upload.ID.Hex(),
		Filename:     upload.FileName,
		Data:         buf[:n],
		IsFirstChunk: true,
		IsLastChunk:  false,
	}

	if err := stream.Send(firstChunk); err != nil {
		return err
	}

	// send remaining chunks
	for {
		n, err := file.Read(buf)
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		chunk := &pb.PDFChunk{
			Data:         buf[:n],
			IsFirstChunk: false,
			IsLastChunk:  false,
		}

		if err := stream.Send(chunk); err != nil {
			return err
		}
	}

	// send last chunk
	if err := stream.Send(&pb.PDFChunk{
		IsLastChunk: true,
	}); err != nil {
		return err
	}

	response, err := stream.CloseAndRecv()
	if err != nil {
		return err
	}

	if !response.Success {
		return fmt.Errorf("vectorization failed: %s", response.Message)
	}

	return nil
}

func MarkVectorizationDone(fileID primitive.ObjectID) error {
	uploadCollection := restapi.GetFileCollection()
	_, err := uploadCollection.UpdateByID(
		context.Background(),
		fileID,
		bson.M{"$set": bson.M{"isVectorDBcreated": true}},
	)
	return err
}
