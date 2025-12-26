package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/pgvector/pgvector-go"
)

type BrainClient struct {
	BaseURL string
	Client  *http.Client
}

func NewBrainClient(baseURL string) *BrainClient {
	if baseURL == "" {
		baseURL = "http://localhost:8000"
	}
	return &BrainClient{
		BaseURL: baseURL,
		Client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

type BrainChatRequest struct {
	Message  string `json:"message"`
	Category string `json:"category"`
}

type BrainChatResponse struct {
	Answer  string `json:"answer"`
	Sources []struct {
		Content  string `json:"content"`
		Category string `json:"category"`
		Title    string `json:"title"`
	} `json:"sources"`
}

func (b *BrainClient) Ask(message string, category string) (*BrainChatResponse, error) {
	reqBody, err := json.Marshal(BrainChatRequest{
		Message:  message,
		Category: category,
	})
	if err != nil {
		return nil, err
	}

	resp, err := b.Client.Post(b.BaseURL+"/chat", "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("brain service unreachable: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("brain service returned error: %d", resp.StatusCode)
	}

	var brainResp BrainChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&brainResp); err != nil {
		return nil, err
	}

	return &brainResp, nil
}

type BrainEmbeddingRequest struct {
	Text string `json:"text"`
}

type BrainEmbeddingResponse struct {
	Embedding []float32 `json:"embedding"`
}

func (b *BrainClient) GetEmbedding(textStr string) (pgvector.Vector, error) {
	reqBody, err := json.Marshal(BrainEmbeddingRequest{
		Text: textStr,
	})
	if err != nil {
		return pgvector.Vector{}, err
	}

	resp, err := b.Client.Post(b.BaseURL+"/embeddings", "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		return pgvector.Vector{}, err
	}
	defer resp.Body.Close()

	var embedResp BrainEmbeddingResponse
	if err := json.NewDecoder(resp.Body).Decode(&embedResp); err != nil {
		return pgvector.Vector{}, err
	}

	return pgvector.NewVector(embedResp.Embedding), nil
}
