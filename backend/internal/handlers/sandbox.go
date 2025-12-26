package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/shivang/antigravity/backend/internal/sandbox"
)

func RunCode(c *fiber.Ctx) error {
	var req sandbox.ExecutionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Code == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Code cannot be empty"})
	}

	res, err := sandbox.ExecuteCode(req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(res)
}
