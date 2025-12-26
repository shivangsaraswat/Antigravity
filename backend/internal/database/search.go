package database

import (
	"github.com/pgvector/pgvector-go"
	"github.com/shivang/antigravity/backend/internal/models"
	"gorm.io/gorm"
)

// SearchPYQs finds the most similar PYQs to the query embedding
// limit: number of results to return
func SearchPYQs(embedding pgvector.Vector, limit int) ([]models.PYQ, error) {
	var pyqs []models.PYQ

	// Cosine distance operator is <=>
	// Use gorm.Expr to pass parameters to Order
	err := DB.Order(gorm.Expr("embedding <=> ?", embedding)).
		Limit(limit).
		Find(&pyqs).Error

	return pyqs, err
}
