package database

import (
	"fmt"
	"log"

	"github.com/shivang/antigravity/backend/internal/config"
	"github.com/shivang/antigravity/backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDB(cfg *config.Config) {
	// If full connection string is provided (e.g. from Neon dashboard) use it
	var dsn string
	if cfg.DatabaseURL != "" {
		dsn = cfg.DatabaseURL
	} else if cfg.DBHost == "localhost" {
		dsn = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Kolkata",
			cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort)
	} else {
		// Fallback construction
		dsn = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=require",
			cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort)
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Error),
	})

	if err != nil {
		log.Fatal("Failed to connect to database. \n", err)
	}

	log.Println("connected to database successfully")

	// Enable pgvector extension
	db.Exec("CREATE EXTENSION IF NOT EXISTS vector")

	// Auto Migration
	log.Println("running migrations")
	db.AutoMigrate(&models.User{}, &models.Resource{})

	DB = db
}
