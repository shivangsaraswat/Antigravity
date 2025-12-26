package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/shivang/antigravity/backend/internal/ai"
	"github.com/shivang/antigravity/backend/internal/auth"
	"github.com/shivang/antigravity/backend/internal/config"
	"github.com/shivang/antigravity/backend/internal/database"
	"github.com/shivang/antigravity/backend/internal/handlers"
)

func main() {
	// Load environment variables
	cfg := config.LoadConfig()

	// Connect to Database
	database.ConnectDB(cfg)

	// Init Auth
	auth.InitAuth(cfg)

	// Init Brain (Python AI Service)
	brainClient := ai.NewBrainClient(cfg.BrainURL)

	// Init Handlers
	ingestHandler := handlers.NewIngestHandler(brainClient)
	chatHandler := handlers.NewChatHandler(brainClient)

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Antigravity API",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New())

	// Auth Routes
	app.Get("/auth/google", auth.GoogleLogin)
	app.Get("/auth/google/callback", auth.GoogleCallback)

	// Ingest Routes (Protected? For now public for demo)
	app.Post("/ingest", ingestHandler.IngestPYQ)
	app.Post("/chat", chatHandler.Chat)

	// Sandbox Routes
	app.Post("/sandbox/run", handlers.RunCode)

	// Routes
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Welcome to Antigravity API 🚀")
	})

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"uptime": "TODO",
		})
	})

	// Start server
	log.Fatal(app.Listen(":8080"))
}
