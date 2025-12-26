package ai

import (
	"context"
	"fmt"
	"log"

	"github.com/google/generative-ai-go/genai"
	"github.com/pgvector/pgvector-go"
	"github.com/shivang/antigravity/backend/internal/config"
	"google.golang.org/api/option"
)

type AIClient struct {
	client *genai.Client
	model  *genai.EmbeddingModel
}

func NewAIClient(cfg *config.Config) *AIClient {
	if cfg.GeminiAPIKey == "" {
		log.Println("Warning: GEMINI_API_KEY is not set. AI features will fail.")
		return nil
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(cfg.GeminiAPIKey))
	if err != nil {
		log.Fatal(err)
	}

	// User text-embedding-004 or similar.
	// Note: Verify the model name for Gemini embeddings. 'text-embedding-004' is common.
	model := client.EmbeddingModel("text-embedding-004")

	return &AIClient{
		client: client,
		model:  model,
	}
}

func (ai *AIClient) GenerateEmbedding(ctx context.Context, text string) (pgvector.Vector, error) {
	if ai == nil || ai.client == nil {
		return pgvector.Vector{}, fmt.Errorf("AI client not initialized")
	}

	res, err := ai.model.EmbedContent(ctx, genai.Text(text))
	if err != nil {
		return pgvector.Vector{}, err
	}

	if res == nil || len(res.Embedding.Values) == 0 {
		return pgvector.Vector{}, fmt.Errorf("no embedding generated")
	}

	// Convert []float32 to pgvector.Vector
	// pgvector-go handles []float32 directly usually, but let's be explicit
	return pgvector.NewVector(res.Embedding.Values), nil
}

func (ai *AIClient) GenerateContent(ctx context.Context, prompt string) (string, error) {
	if ai == nil || ai.client == nil {
		return "", fmt.Errorf("AI client not initialized")
	}

	// For text generation, use the Flash model
	model := ai.client.GenerativeModel("gemini-flash-latest")
	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty response from model")
	}

	// Assuming text part
	if txt, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
		return string(txt), nil
	}

	return "", fmt.Errorf("unexpected response format")
}

func (ai *AIClient) Close() {
	if ai.client != nil {
		ai.client.Close()
	}
}
