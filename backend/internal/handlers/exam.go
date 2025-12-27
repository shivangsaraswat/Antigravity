package handlers

import (
	"encoding/json"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/shivang/antigravity/backend/internal/database"
	"github.com/shivang/antigravity/backend/internal/models"
	"gorm.io/datatypes"
)

// ExamHandler handles exam-related API endpoints
type ExamHandler struct{}

func NewExamHandler() *ExamHandler {
	return &ExamHandler{}
}

// GetSubjects returns all available subjects
func (h *ExamHandler) GetSubjects(c *fiber.Ctx) error {
	var subjects []models.Subject
	if err := database.DB.Find(&subjects).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch subjects",
		})
	}
	return c.JSON(subjects)
}

// GetPapers returns exam papers, optionally filtered by subject
func (h *ExamHandler) GetPapers(c *fiber.Ctx) error {
	subjectID := c.Query("subject_id")
	term := c.Query("term")
	examType := c.Query("exam_type")

	query := database.DB.Preload("Subject")

	if subjectID != "" {
		query = query.Where("subject_id = ?", subjectID)
	}
	if term != "" {
		query = query.Where("term = ?", term)
	}
	if examType != "" {
		query = query.Where("exam_type = ?", examType)
	}

	var papers []models.TermPaper
	if err := query.Find(&papers).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch papers",
		})
	}
	return c.JSON(papers)
}

// GetPaperWithQuestions returns a paper with its questions (answers hidden)
func (h *ExamHandler) GetPaperWithQuestions(c *fiber.Ctx) error {
	paperID := c.Params("id")

	var paper models.TermPaper
	if err := database.DB.Preload("Questions").First(&paper, "id = ?", paperID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Paper not found",
		})
	}

	// Hide correct answers for exam mode
	for i := range paper.Questions {
		paper.Questions[i].CorrectAnswer = nil
	}

	return c.JSON(paper)
}

// StartExamRequest represents the request to start an exam
type StartExamRequest struct {
	PaperIDs []string `json:"paper_ids"`
}

// StartExam creates a new exam attempt
func (h *ExamHandler) StartExam(c *fiber.Ctx) error {
	// Safe type assertion
	uID := c.Locals("user_id")
	if uID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not found"})
	}
	userID := uID.(uint)

	var req StartExamRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if len(req.PaperIDs) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "At least one paper must be selected",
		})
	}

	// Calculate total duration (60 minutes per paper)
	totalDuration := len(req.PaperIDs) * 60

	paperIDsJSON, _ := json.Marshal(req.PaperIDs)

	attempt := models.ExamAttempt{
		UserID:            userID,
		PaperIDs:          datatypes.JSON(paperIDsJSON),
		Status:            "IN_PROGRESS",
		StartedAt:         time.Now(),
		TotalDurationMins: totalDuration,
		TimeRemainingSecs: totalDuration * 60,
		Responses:         datatypes.JSON([]byte("{}")),
	}

	if err := database.DB.Create(&attempt).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to start exam",
		})
	}

	return c.JSON(attempt)
}

// SaveResponseRequest represents a single question response
type SaveResponseRequest struct {
	QuestionID string      `json:"question_id"`
	Answer     interface{} `json:"answer"`
	Status     string      `json:"status"`
	TimeSpent  int         `json:"time_spent"`
}

// SaveResponse saves a user's response to a question
func (h *ExamHandler) SaveResponse(c *fiber.Ctx) error {
	attemptID := c.Params("id")
	uID := c.Locals("user_id")
	if uID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not found"})
	}
	userID := uID.(uint)

	var req SaveResponseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var attempt models.ExamAttempt
	if err := database.DB.First(&attempt, "id = ? AND user_id = ?", attemptID, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Exam attempt not found",
		})
	}

	if attempt.Status != "IN_PROGRESS" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Exam is not in progress",
		})
	}

	// Parse existing responses
	var responses map[string]interface{}
	json.Unmarshal(attempt.Responses, &responses)
	if responses == nil {
		responses = make(map[string]interface{})
	}

	// Update response
	responses[req.QuestionID] = map[string]interface{}{
		"answer":     req.Answer,
		"status":     req.Status,
		"time_spent": req.TimeSpent,
	}

	responsesJSON, _ := json.Marshal(responses)
	attempt.Responses = datatypes.JSON(responsesJSON)

	if err := database.DB.Save(&attempt).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save response",
		})
	}

	return c.JSON(fiber.Map{"success": true})
}

// SubmitExam finalizes the exam and calculates score
func (h *ExamHandler) SubmitExam(c *fiber.Ctx) error {
	attemptID := c.Params("id")
	uID := c.Locals("user_id")
	if uID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not found"})
	}
	userID := uID.(uint)

	var attempt models.ExamAttempt
	if err := database.DB.First(&attempt, "id = ? AND user_id = ?", attemptID, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Exam attempt not found",
		})
	}

	if attempt.Status != "IN_PROGRESS" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Exam is already submitted",
		})
	}

	// Parse paper IDs
	var paperIDs []string
	json.Unmarshal(attempt.PaperIDs, &paperIDs)

	// Parse responses
	var responses map[string]map[string]interface{}
	json.Unmarshal(attempt.Responses, &responses)

	// Calculate scores for each paper
	scores := make(map[string]map[string]interface{})

	for _, paperID := range paperIDs {
		var questions []models.Question
		database.DB.Where("paper_id = ?", paperID).Find(&questions)

		var correct, total float64
		for _, q := range questions {
			total += q.Marks

			if resp, ok := responses[q.ID]; ok {
				// Compare answer with correct answer
				var correctAns interface{}
				json.Unmarshal(q.CorrectAnswer, &correctAns)

				userAnswer := resp["answer"]
				if isCorrect(userAnswer, correctAns) {
					correct += q.Marks
				}
			}
		}

		percentage := 0.0
		if total > 0 {
			percentage = (correct / total) * 100
		}

		scores[paperID] = map[string]interface{}{
			"correct":    correct,
			"total":      total,
			"percentage": percentage,
		}
	}

	scoresJSON, _ := json.Marshal(scores)
	now := time.Now()
	attempt.Status = "SUBMITTED"
	attempt.SubmittedAt = &now
	attempt.Scores = datatypes.JSON(scoresJSON)

	if err := database.DB.Save(&attempt).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to submit exam",
		})
	}

	return c.JSON(attempt)
}

// GetAttempt returns details of an exam attempt
func (h *ExamHandler) GetAttempt(c *fiber.Ctx) error {
	attemptID := c.Params("id")
	uID := c.Locals("user_id")
	if uID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not found"})
	}
	userID := uID.(uint)

	var attempt models.ExamAttempt
	if err := database.DB.First(&attempt, "id = ? AND user_id = ?", attemptID, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Exam attempt not found",
		})
	}

	return c.JSON(attempt)
}

// GetUserAttempts returns all exam attempts for a user
func (h *ExamHandler) GetUserAttempts(c *fiber.Ctx) error {
	uID := c.Locals("user_id")
	if uID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not found"})
	}
	userID := uID.(uint)

	var attempts []models.ExamAttempt
	if err := database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&attempts).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch attempts",
		})
	}

	return c.JSON(attempts)
}

// Helper function to compare answers
func isCorrect(userAnswer, correctAnswer interface{}) bool {
	// Handle different answer types
	switch correct := correctAnswer.(type) {
	case string:
		if userStr, ok := userAnswer.(string); ok {
			return userStr == correct
		}
	case []interface{}:
		// Multiple correct answers (MSQ)
		if userArr, ok := userAnswer.([]interface{}); ok {
			if len(userArr) != len(correct) {
				return false
			}
			for _, c := range correct {
				found := false
				for _, u := range userArr {
					if u == c {
						found = true
						break
					}
				}
				if !found {
					return false
				}
			}
			return true
		}
	case float64:
		if userNum, ok := userAnswer.(float64); ok {
			return userNum == correct
		}
		if userStr, ok := userAnswer.(string); ok {
			// Try parsing string to number
			var userNum float64
			if err := json.Unmarshal([]byte(userStr), &userNum); err == nil {
				return userNum == correct
			}
		}
	}
	return false
}
