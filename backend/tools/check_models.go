package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/google/generative-ai-go/genai"
	"github.com/joho/godotenv"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
)

func main() {
	// Load .env
	// Assuming running from backend root: go run tools/check_models.go
	if err := godotenv.Load(".env"); err != nil {
		log.Println("Warning: .env file not found or could not be loaded")
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("GEMINI_API_KEY is not set")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	iter := client.ListModels(ctx)
	fmt.Println("Available Gemini Models with generateContent:")
	for {
		m, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Fatal(err)
		}

		// Filter for Gemini and generateContent
		isGemini := false
		supportsGenerate := false

		if len(m.Name) > 6 && m.Name[0:13] == "models/gemini" {
			isGemini = true
		}

		for _, method := range m.SupportedGenerationMethods {
			if method == "generateContent" {
				supportsGenerate = true
			}
		}

		if isGemini && supportsGenerate {
			fmt.Printf("- %s\n", m.Name)
		}
	}
}
