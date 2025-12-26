package models

import (
	"time"

	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Email    string `gorm:"uniqueIndex;not null" json:"email"`
	Password string `json:"-"` // Hashed password, don't return in JSON
	Name     string `json:"name"`
	Picture  string `json:"picture"`
	Role     string `gorm:"default:'student'" json:"role"` // student, admin
}

// ChatSession represents a conversation thread
type ChatSession struct {
	ID        string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID    uint   `gorm:"index" json:"user_id"`
	User      User   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	Title     string `json:"title"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Messages  []ChatMessage `gorm:"foreignKey:SessionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"messages"`
}

// ChatMessage represents a single message in a thread
type ChatMessage struct {
	ID        string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	SessionID string `gorm:"index;type:uuid" json:"session_id"`
	Role      string `json:"role"` // 'user' or 'ai'
	Content   string `gorm:"type:text" json:"content"`
	Sources   string `gorm:"type:jsonb" json:"sources"` // Store sources properly
	CreatedAt time.Time
}

// Resource represents any academic document, PYQ, or study material
type Resource struct {
	gorm.Model
	Category   string          `json:"category" gorm:"index"`
	Subject    string          `json:"subject"`
	Year       int             `json:"year"`
	Title      string          `json:"title"`
	Content    string          `json:"content" gorm:"type:text"`
	Topic      string          `json:"topic"`
	Difficulty string          `json:"difficulty"`
	Metadata   string          `json:"metadata" gorm:"type:jsonb"`
	Embedding  pgvector.Vector `gorm:"type:vector(768)" json:"-"`
}
