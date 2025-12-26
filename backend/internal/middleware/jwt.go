package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/shivang/antigravity/backend/internal/config"
)

func Protected() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)

		// Use a fixed secret for now (in prod should be from env/config)
		secret := []byte("secret_key_antigravity_dev")
		if config.LoadConfig().JWTSecret != "" {
			secret = []byte(config.LoadConfig().JWTSecret)
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return secret, nil
		})

		if err != nil || !token.Valid {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid Token"})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid Token Claims"})
		}

		// Set user ID in context for next handlers
		// Provide default 0 if type assertion fails, but usually it's float64 in JSON
		if id, ok := claims["user_id"].(float64); ok {
			c.Locals("user_id", uint(id))
		}

		return c.Next()
	}
}
