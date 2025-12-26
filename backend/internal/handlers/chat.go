package handlers

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/shivang/antigravity/backend/internal/ai"
	"github.com/shivang/antigravity/backend/internal/database"
)

type ChatHandler struct {
	AI *ai.AIClient
}

func NewChatHandler(aiClient *ai.AIClient) *ChatHandler {
	return &ChatHandler{AI: aiClient}
}

type ChatRequest struct {
	Message string `json:"message"`
}

func (h *ChatHandler) Chat(c *fiber.Ctx) error {
	var req ChatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).SendString("Invalid request body")
	}

	if req.Message == "" {
		return c.Status(400).SendString("Message cannot be empty")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// 1. Generate Embedding for User Query
	// We use the same model as ingestion
	queryEmbedding, err := h.AI.GenerateEmbedding(ctx, req.Message)
	if err != nil {
		return c.Status(500).SendString("Failed to process query: " + err.Error())
	}

	// 2. Search Database for Context (RAG)
	// Retrieve top 5 most relevant PYQs
	relevantPYQs, err := database.SearchPYQs(queryEmbedding, 5)
	if err != nil {
		// Log error but maybe proceed without context?
		// For now, fail hard to debug.
		return c.Status(500).SendString("Failed to retrieve context: " + err.Error())
	}

	// 3. Construct Prompt
	var contextBuilder strings.Builder
	contextBuilder.WriteString("You are Antigravity, an intelligent academic mentor. \n")
	contextBuilder.WriteString("Answer the student's question concisely using Markdown formatting (headings, bullet points, bold text). \n")
	contextBuilder.WriteString("- Prioritize clarity and structure.\n")
	contextBuilder.WriteString("- If showing code, use syntax highlighting.\n")
	contextBuilder.WriteString("- Use the provided context (PYQs) if relevant. Cite them as '[Year, Subject]'.\n\n")

	contextBuilder.WriteString("--- CONTEXT START ---\n")
	for i, pyq := range relevantPYQs {
		contextBuilder.WriteString(fmt.Sprintf("Source %d (Year: %d, Subject: %s): %s\n\n", i+1, pyq.Year, pyq.Subject, pyq.Question))
	}
	contextBuilder.WriteString("--- CONTEXT END ---\n\n")

	contextBuilder.WriteString("Student Question: " + req.Message)

	// 4. Generate Response from LLM
	response, err := h.AI.GenerateContent(ctx, contextBuilder.String())
	if err != nil {
		return c.Status(500).SendString("AI generation failed: " + err.Error())
	}

	return c.JSON(fiber.Map{
		"response": response,
		"sources":  relevantPYQs, // Return sources for UI citations
	})
}
