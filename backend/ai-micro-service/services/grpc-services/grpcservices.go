package grpcservices

import (
	"context"
	"fmt"
	"io"
	"os"
	"time"

	apimodels "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/models/api-models"
	pb "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/vectorizer/proto"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func SendFileToPythonVectorizer(upload apimodels.Upload) error {

	// Establish conn with grpc server
	conn, err := grpc.NewClient("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return err
	}
	defer conn.Close()

	// Get a client stub for all the RPC methods; for all services.
	client := pb.NewVectorizerServiceClient(conn)

	// Open the stored file
	file, err := os.Open(upload.Path)
	if err != nil {
		return err
	}
	defer file.Close()

	// Grab the stream object client for UploadAndVectorize gRPC streaming method; to stream PDF bytes.
	stream, err := client.UploadAndVectorize(context.Background())
	if err != nil {
		return err
	}

	// send first chunk with metadata
	buf := make([]byte, 1024*512) // Buffer has Byte size of 512 KB
	n, err := file.Read(buf)      // Read the 1st <=512KB bytes onto the buffer
	if err != nil && err != io.EOF {
		return err
	}

	firstChunk := &pb.PDFChunk{
		UserId:       upload.UserId,
		ChatId:       upload.ChatId,
		FileId:       upload.ID.Hex(),
		Filename:     upload.FileName,
		Data:         buf[:n], // Sends the 1st n valid bytes
		IsFirstChunk: true,
		IsLastChunk:  false,
	}

	if err := stream.Send(firstChunk); err != nil {
		return err
	}

	// send remaining chunks
	for {
		n, err := file.Read(buf)
		if err == io.EOF { // If EOF reached, means we can have n is 0 | <=512. Either case we trigger last chunk send.
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
		return fmt.Errorf("%s", response.Message)
	}

	if response.ChunkCount == 0 {
		return fmt.Errorf("file had no parseable documents to vectorize; Skipped Vectorization")
	}

	return nil
}

type QueryVectorResult struct {
	ID       string
	Document string
	Source   string
	Page     int32
	Distance float32
}

func SendQueryToPythonVectorizer(uploads []apimodels.Upload, topK int32, query_texts []string) ([]QueryVectorResult, error) {
	// Establish conn with grpc server
	conn, err := grpc.NewClient("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}
	defer conn.Close()

	// Get a client stub for all the RPC methods; for all services.
	client := pb.NewVectorizerServiceClient(conn)

	var userId string
	var chatId string
	var fileIds []string
	for _, upload := range uploads {
		userId = upload.UserId
		chatId = upload.ChatId
		fileIds = append(fileIds, upload.ID.Hex())
	}

	request := &pb.QueryRequest{
		UserId:     userId,
		ChatId:     chatId,
		FileId:     fileIds,
		TopK:       topK,
		QueryTexts: query_texts,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Call gRPC
	response, err := client.QueryVectors(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("error calling Python Vectorizer: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("vector query failed on Python side: %s", response.Message)
	}

	// Transform proto results into Go structs
	var results []QueryVectorResult
	for _, r := range response.Results {
		results = append(results, QueryVectorResult{
			ID:       r.Id,
			Document: r.Document,
			Source:   r.Source,
			Page:     r.Page,
			Distance: float32(r.Distance),
		})
	}

	return results, nil
}

// Make a channel to gather the file-wise delete-reponses
type DeleteVectorDocsResults struct {
	FileID  primitive.ObjectID
	Success bool
	Message string
	Error   string
}

func RequestDeleteDocsToPythonVectorizer(uploads []apimodels.Upload) ([]DeleteVectorDocsResults, error) {
	// Establish conn with grpc server
	conn, err := grpc.NewClient("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}
	defer conn.Close()

	// Get a client stub for all the RPC methods; for all services.
	client := pb.NewVectorizerServiceClient(conn)

	resultsChan := make(chan DeleteVectorDocsResults, len(uploads))

	for _, upload := range uploads {

		go func(u apimodels.Upload) {
			// Per-request timeout
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()

			req := &pb.DeleteRequest{
				FileId: u.ID.Hex(),
				UserId: u.UserId,
				ChatId: u.ChatId,
			}

			response, err := client.DeleteVectors(ctx, req)

			var res DeleteVectorDocsResults
			res.FileID = u.ID

			if err != nil {
				res.Success = false
				res.Message = ""
				res.Error = err.Error()
			} else {
				res.Success = response.GetSuccess()
				res.Message = response.GetMessage()
				res.Error = ""
			}

			resultsChan <- res
		}(upload)

	}

	// Gather the results
	var finalResults []DeleteVectorDocsResults
	for range uploads {
		result := <-resultsChan
		finalResults = append(finalResults, result)
	}

	return finalResults, nil
}
