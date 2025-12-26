package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DBHost             string
	DBUser             string
	DBPassword         string
	DBName             string
	DBPort             string
	DatabaseURL        string
	GeminiAPIKey       string
	GoogleClientID     string
	GoogleClientSecret string
	JWTSecret          string
}

func LoadConfig() *Config {
	godotenv.Load() // Ignore error if .env doesn't exist (prod env vars)

	return &Config{
		Port:               getEnv("PORT", "8080"),
		DBHost:             getEnv("DB_HOST", "localhost"),
		DBUser:             getEnv("DB_USER", "postgres"),
		DBPassword:         getEnv("DB_PASSWORD", "postgres"),
		DBName:             getEnv("DB_NAME", "antigravity"),
		DBPort:             getEnv("DB_PORT", "5432"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		GeminiAPIKey:       getEnv("GEMINI_API_KEY", ""),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		JWTSecret:          getEnv("JWT_SECRET", "super_secret_key_change_me"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
