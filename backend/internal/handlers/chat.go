package handlers

import (
	"bufio"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/shivang/antigravity/backend/internal/ai"
	"github.com/shivang/antigravity/backend/internal/database"
	"github.com/shivang/antigravity/backend/internal/models"
	"gorm.io/gorm"
)

type ChatHandler struct {
	AI *ai.BrainClient
}

func NewChatHandler(brainClient *ai.BrainClient) *ChatHandler {
	return &ChatHandler{AI: brainClient}
}

type ChatRequest struct {
	SessionID string        `json:"sessionId"`
	Message   string        `json:"message"`
	History   []interface{} `json:"history"`
}

func (h *ChatHandler) GetHistory(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)
	var sessions []models.ChatSession
	database.DB.Where("user_id = ?", userID).Order("updated_at desc").Find(&sessions)
	return c.JSON(sessions)
}

func (h *ChatHandler) GetSession(c *fiber.Ctx) error {
	sessionID := c.Params("id")
	userID := c.Locals("user_id").(uint)

	var session models.ChatSession
	if err := database.DB.Where("id = ? AND user_id = ?", sessionID, userID).Preload("Messages", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at asc")
	}).First(&session).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Session not found"})
	}

	return c.JSON(session)
}

func (h *ChatHandler) DeleteSession(c *fiber.Ctx) error {
	sessionID := c.Params("id")
	userID := c.Locals("user_id").(uint)
	database.DB.Where("id = ? AND user_id = ?", sessionID, userID).Delete(&models.ChatSession{})
	return c.SendStatus(200)
}

// Helper to get or create session
func getOrCreateSession(userID uint, sessionID string, firstMessage string) (*models.ChatSession, error) {
	if sessionID != "" {
		var session models.ChatSession
		if err := database.DB.Where("id = ? AND user_id = ?", sessionID, userID).First(&session).Error; err == nil {
			return &session, nil
		}
	}

	// Create new
	title := firstMessage
	if len(title) > 30 {
		title = title[:30] + "..."
	}

	newSession := models.ChatSession{
		UserID: userID,
		Title:  title,
	}
	if err := database.DB.Create(&newSession).Error; err != nil {
		return nil, err
	}
	return &newSession, nil
}

func (h *ChatHandler) ChatStream(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(401).SendString("Unauthorized")
	}

	var req ChatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).SendString("Invalid request body")
	}

	// 1. Get or Create Session
	session, err := getOrCreateSession(userID, req.SessionID, req.Message)
	if err != nil {
		return c.Status(500).SendString("Database error")
	}

	// 2. Save User Message
	userMsg := models.ChatMessage{
		SessionID: session.ID,
		Role:      "user",
		Content:   req.Message,
		Sources:   "[]",
	}
	database.DB.Create(&userMsg)

	// 3. Call Brain
	stream, err := h.AI.StreamAsk(req.Message, "all", req.History)
	if err != nil {
		return c.Status(500).SendString("Brain service error: " + err.Error())
	}
	defer stream.Close()

	c.Set("Content-Type", "text/plain")
	c.Set("Transfer-Encoding", "chunked")
	c.Set("X-Session-ID", session.ID) // Send Real Session ID to client

	// 4. Stream & buffer for saving
	accContent := ""

	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		buf := make([]byte, 1024)
		for {
			n, err := stream.Read(buf)
			if n > 0 {
				chunk := buf[:n]
				accContent += string(chunk)
				if _, wErr := w.Write(chunk); wErr != nil {
					return
				}
				w.Flush()
			}
			if err != nil {
				break
			}
		}

		// 5. Save AI Message after stream ends
		aiMsg := models.ChatMessage{
			SessionID: session.ID,
			Role:      "ai",
			Content:   accContent,
			Sources:   "[]",
		}
		database.DB.Create(&aiMsg)

		// Update session timestamp
		database.DB.Model(&session).Update("updated_at", time.Now())
	})

	return nil
}
