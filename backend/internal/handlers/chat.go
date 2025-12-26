package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/shivang/antigravity/backend/internal/ai"
)

type ChatHandler struct {
	AI *ai.BrainClient
}

func NewChatHandler(brainClient *ai.BrainClient) *ChatHandler {
	return &ChatHandler{AI: brainClient}
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

	// Delegate everything to the Python Brain
	resp, err := h.AI.Ask(req.Message, "all")
	if err != nil {
		return c.Status(500).SendString("Brain service error: " + err.Error())
	}

	return c.JSON(fiber.Map{
		"response": resp.Answer,
		"sources":  resp.Sources,
	})
}
