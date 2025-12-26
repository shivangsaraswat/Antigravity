package handlers

import (
	"io"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/shivang/antigravity/backend/internal/ai"
	"github.com/shivang/antigravity/backend/internal/database"
	"github.com/shivang/antigravity/backend/internal/models"
	"github.com/shivang/antigravity/backend/pkg/parser"
)

type IngestHandler struct {
	AI *ai.BrainClient
}

func NewIngestHandler(brainClient *ai.BrainClient) *IngestHandler {
	return &IngestHandler{AI: brainClient}
}

func (h *IngestHandler) IngestPYQ(c *fiber.Ctx) error {
	// 1. Get File
	file, err := c.FormFile("pdf")
	if err != nil {
		return c.Status(400).SendString("Missing PDF file")
	}

	// Metadata
	subject := c.FormValue("subject")
	yearStr := c.FormValue("year")
	year, _ := strconv.Atoi(yearStr)
	topic := c.FormValue("topic") // Optional, or extract via AI

	// 2. Open and Read
	f, err := file.Open()
	if err != nil {
		return c.Status(500).SendString("Failed to open file")
	}
	defer f.Close()

	content, err := io.ReadAll(f)
	if err != nil {
		return c.Status(500).SendString("Failed to read file")
	}

	// 3. Parse PDF
	text, err := parser.ParsePDF(content)
	if err != nil {
		return c.Status(500).SendString("Failed to parse PDF: " + err.Error())
	}

	if len(text) < 10 {
		return c.Status(400).SendString("PDF content too short or empty")
	}

	// FIXME: In a real app, chunk the text!
	// Gemini 1.5 Flash has 1M context, implies we can just dump a lot,
	// BUT for embeddings (text-embedding-004), the limit is smaller (2048 tokens usually).
	// We MUST chunk. For this demo, let's take the first 2000 chars as a "summary" for embedding,
	// or rely on the user to upload single questions.
	// Let's assume the user dumps a single question PDF or we take a chunk.

	embedText := text
	if len(embedText) > 2000 {
		embedText = text[:2000]
	}

	// 4. Generate Embedding via Brain
	embedding, err := h.AI.GetEmbedding(embedText)
	if err != nil {
		return c.Status(500).SendString("AI Embedding failed: " + err.Error())
	}

	// 5. Save to DB
	resource := models.Resource{
		Category:   "pyq",
		Subject:    subject,
		Year:       year,
		Title:      "Question Source - " + strconv.Itoa(year),
		Content:    text, // Store full text
		Topic:      topic,
		Difficulty: "Medium", // Placeholder
		Embedding:  embedding,
	}

	if err := database.DB.Create(&resource).Error; err != nil {
		return c.Status(500).SendString("Database save failed: " + err.Error())
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"id":      resource.ID,
		"message": "PYQ ingested successfully",
	})
}
