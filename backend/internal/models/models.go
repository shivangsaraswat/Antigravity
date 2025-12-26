package models

import (
	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Email   string `gorm:"uniqueIndex;not null"`
	Name    string
	Picture string
	Role    string `gorm:"default:'student'"` // student, admin
}

// Resource represents any academic document, PYQ, or study material
type Resource struct {
	gorm.Model
	Category   string          `json:"category" gorm:"index"` // "pyq", "academic", "other"
	Subject    string          `json:"subject"`
	Year       int             `json:"year"`
	Title      string          `json:"title"`
	Content    string          `json:"content" gorm:"type:text"`
	Topic      string          `json:"topic"`
	Difficulty string          `json:"difficulty"`
	Metadata   string          `json:"metadata" gorm:"type:jsonb"` // Store extra info as JSON
	Embedding  pgvector.Vector `gorm:"type:vector(768)" json:"-"`  // Gemini 1.5 embedding size
}
