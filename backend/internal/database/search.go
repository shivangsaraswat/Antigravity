package database

import (
	"github.com/pgvector/pgvector-go"
	"github.com/shivang/antigravity/backend/internal/models"
	"gorm.io/gorm"
)

// SearchResources finds the most similar documents to the query embedding
// limit: number of results to return
func SearchResources(embedding pgvector.Vector, limit int) ([]models.Resource, error) {
	var resources []models.Resource

	// Cosine distance operator is <=>
	// Use gorm.Expr to pass parameters to Order
	err := DB.Order(gorm.Expr("embedding <=> ?", embedding)).
		Limit(limit).
		Find(&resources).Error

	return resources, err
}
