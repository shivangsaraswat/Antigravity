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
	"github.com/shivang/antigravity/backend/internal/middleware"
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
	// Init Handlers
	ingestHandler := handlers.NewIngestHandler(brainClient)
	chatHandler := handlers.NewChatHandler(brainClient)
	authHandler := handlers.NewAuthHandler()

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Antigravity API",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:  "*",
		AllowHeaders:  "Origin, Content-Type, Accept, Authorization",
		ExposeHeaders: "X-Session-ID",
	}))

	// Auth Routes
	app.Post("/auth/register", authHandler.Register)
	app.Post("/auth/login", authHandler.Login)
	app.Get("/auth/google", auth.GoogleLogin)
	app.Get("/auth/google/callback", auth.GoogleCallback)

	// Protected Routes (Chat & History)
	api := app.Group("/", middleware.Protected())
	api.Post("/ingest", ingestHandler.IngestPYQ)
	api.Post("/chat/stream", chatHandler.ChatStream) // Main chat endpoint
	api.Get("/history", chatHandler.GetHistory)
	api.Get("/session/:id", chatHandler.GetSession)
	api.Delete("/session/:id", chatHandler.DeleteSession)

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
