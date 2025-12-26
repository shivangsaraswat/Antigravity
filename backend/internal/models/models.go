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

type pyq struct {
	gorm.Model
	Subject    string          `json:"subject"`
	Year       int             `json:"year"`
	Question   string          `json:"question"`
	Topic      string          `json:"topic"`
	Difficulty string          `json:"difficulty"`
	Embedding  pgvector.Vector `gorm:"type:vector(768)" json:"-"` // Gemini 1.5 embedding size
}

// Public alias to avoid export issues but keep strict typing if needed,
// actually let's just make the struct public.
type PYQ struct {
	gorm.Model
	Subject    string          `json:"subject"`
	Year       int             `json:"year"`
	Question   string          `json:"question" gorm:"type:text"`
	Topic      string          `json:"topic"`
	Difficulty string          `json:"difficulty"`
	Embedding  pgvector.Vector `gorm:"type:vector(768)" json:"-"` // Gemini 1.5 embedding size is 768 dimensions
}
