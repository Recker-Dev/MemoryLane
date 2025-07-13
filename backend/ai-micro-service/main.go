package main

// import (
// 	"context"
// 	"fmt"
// 	"io"
// 	"log"
// 	"os"

// 	pb "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/vectorizer/proto"

// 	"google.golang.org/grpc"
// 	"google.golang.org/grpc/credentials/insecure"
// )

// func main() {

// 	// Array of two file paths
// 	filePaths := []string{
// 		"/home/recker/Documents/Projects/NextJs-GPT/test/27a8300c-bda1-4a24-bf62-70b707563458.jpeg",
// 		"/home/recker/Documents/Projects/NextJs-GPT/test/Constitution 101 (Assignment 1).pdf",
// 	}

// 	// Channel to receive results from goroutines
// 	resCh := make(chan string)

// 	// Dial once, reuse connection
// 	conn, err := grpc.NewClient("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
// 	if err != nil {
// 		log.Fatalf("Failed to connect: %v", err)
// 	}
// 	defer conn.Close()

// 	client := pb.NewVectorizerServiceClient(conn)

// 	// Launch a goroutine for each file
// 	for _, path := range filePaths {
// 		go func(filePath string) {
// 			err := uploadFile(client, filePath, resCh)
// 			if err != nil {
// 				resCh <- fmt.Sprintf("[ERROR] Upload %s failed: %v", filePath, err)
// 			}
// 		}(path)
// 	}

// 	// Print responses as they arrive
// 	// We don't need to wait for both explicitly — the prints happen as goroutines finish
// 	for i := 0; i < len(filePaths); i++ {
// 		fmt.Println(<-resCh)
// 	}

// }

// func uploadFile(client pb.VectorizerServiceClient, filePath string, resCh chan<- string) error {
// 	// Open file
// 	f, err := os.Open(filePath)
// 	if err != nil {
// 		return fmt.Errorf("cannot open file: %v", err)
// 	}
// 	defer f.Close()

// 	// Create stream
// 	stream, err := client.UploadAndVectorize(context.Background())
// 	if err != nil {
// 		return fmt.Errorf("failed to create upload stream: %v", err)
// 	}

// 	const chunkSize = 1024 * 64 // 64KB
// 	buf := make([]byte, chunkSize)
// 	firstChunk := true
// 	for {
// 		n, err := f.Read(buf)
// 		if err == io.EOF {
// 			break
// 		}
// 		if err != nil {
// 			return fmt.Errorf("reading file: %v", err)
// 		}

// 		chunk := &pb.PDFChunk{
// 			Data: buf[:n],
// 		}

// 		// Send metadata only on the first chunk
// 		if firstChunk {
// 			chunk.UserId = "user123"
// 			chunk.ChatId = "chat456"
// 			chunk.FileId = "file789"
// 			chunk.Filename = filePath
// 			chunk.IsFirstChunk = true
// 		}

// 		// Check if this is the last chunk
// 		chunk.IsLastChunk = false

// 		if err := stream.Send(chunk); err != nil {
// 			return fmt.Errorf("failed to send chunk: %v", err)
// 		}

// 		firstChunk = false
// 	}

// 	// Send final message indicating end of stream
// 	lastChunk := &pb.PDFChunk{
// 		IsLastChunk: true,
// 	}
// 	if err := stream.Send(lastChunk); err != nil {
// 		return fmt.Errorf("failed to send last chunk: %v", err)
// 	}

// 	// Close and receive response
// 	resp, err := stream.CloseAndRecv()
// 	if err != nil {
// 		return fmt.Errorf("failed to receive server response: %v", err)
// 	}

// 	// Send result to channel
// 	resCh <- fmt.Sprintf("[SUCCESS] Uploaded %s: Server says %s", filePath, resp.Message)
// 	return nil
// }

import (
	"log"

	"github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/config"
	controllers "github.com/Recker-Dev/NextJs-GPT/backend/ai-micro-service/controllers/http"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}
}

func main() {

	err := config.ConnectDB("mongodb://localhost:27017", "nextjs_gpt_chat")
	if err != nil {
		log.Fatal("Mongo connection error:", err)
	}

	r := gin.Default()

	//File Routes
	r.POST("/uploadFile/:userId/:chatId", controllers.UploadFiles)

	r.Run(":8080")
}
