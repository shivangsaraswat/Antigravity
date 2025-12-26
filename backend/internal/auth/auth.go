package auth

import (
	"context"
	"encoding/json"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/shivang/antigravity/backend/internal/config"
	"github.com/shivang/antigravity/backend/internal/database"
	"github.com/shivang/antigravity/backend/internal/models"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var googleOauthConfig *oauth2.Config

func InitAuth(cfg *config.Config) {
	googleOauthConfig = &oauth2.Config{
		RedirectURL:  "http://localhost:8080/auth/google/callback",
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
	}
}

// GoogleLogin redirects user to Google Consent Screen
func GoogleLogin(c *fiber.Ctx) error {
	url := googleOauthConfig.AuthCodeURL("random-state")
	return c.Redirect(url)
}

// GoogleCallback handles the callback and exchanges code for token
func GoogleCallback(c *fiber.Ctx) error {
	code := c.Query("code")
	token, err := googleOauthConfig.Exchange(context.Background(), code)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).SendString("Code exchange failed")
	}

	client := googleOauthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).SendString("Failed to get user info")
	}
	defer resp.Body.Close()

	var userInfo struct {
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to decode user info")
	}

	// Create or Find User
	var user models.User
	result := database.DB.Where("email = ?", userInfo.Email).First(&user)
	if result.Error != nil {
		// User Create
		user = models.User{
			Email:   userInfo.Email,
			Name:    userInfo.Name,
			Picture: userInfo.Picture,
			Role:    "student",
		}
		database.DB.Create(&user)
	}

	// Generate JWT
	jwtToken, err := generateJWT(user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to generate token")
	}

	// For now, return token as JSON. Ideally set HttpOnly cookie and redirect to frontend.
	// return c.JSON(fiber.Map{"token": jwtToken, "user": user})

	// Redirect to frontend with token (simple approach for now)
	return c.Redirect("http://localhost:3000/dashboard?token=" + jwtToken)
}

func generateJWT(user models.User) (string, error) {
	// TODO: Need access to JWT Secret here, might need to pass config or store in global
	// Quick fix: re-load config or dependency injection.
	// Let's assume we can get it from env for this scope or refactor.
	cfg := config.LoadConfig()

	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecret))
}
