package config

import (
	"context"
	"log"

	"google.golang.org/genai"
)

var GeminiClient *genai.Client

func InitGeminiClient() {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, nil)
	if err != nil {
		log.Fatalf("❌ Failed to initialize Gemini client: %v", err)
	}
	GeminiClient = client
	log.Println("✅ Gemini client initialized.")
}
