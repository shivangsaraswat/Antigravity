package models

import (
	"time"

	"gorm.io/datatypes"
)

// Subject represents a course/subject in the degree program
type Subject struct {
	ID        string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Name      string `gorm:"not null" json:"name"`    // "Mathematics for Data Science 1"
	Code      string `gorm:"uniqueIndex" json:"code"` // "MDS1"
	Level     string `json:"level"`                   // "foundation", "diploma", "degree"
	CreatedAt time.Time
	UpdatedAt time.Time
}

// TermPaper represents an exam paper for a specific term
type TermPaper struct {
	ID              string  `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	SubjectID       string  `gorm:"type:uuid;index" json:"subject_id"`
	Subject         Subject `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"subject,omitempty"`
	Name            string  `json:"name"`             // "IIT M FOUNDATION AN EXAM QDF2 03 Aug 2025"
	Term            string  `json:"term"`             // "August 2025"
	ExamType        string  `json:"exam_type"`        // "Quiz 1", "Quiz 2", "End Term"
	DurationMinutes int     `json:"duration_minutes"` // 60
	TotalMarks      float64 `json:"total_marks"`      // 50
	TotalQuestions  int     `json:"total_questions"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	Questions       []Question `gorm:"foreignKey:PaperID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"questions,omitempty"`
}

// Question represents an exam question
type Question struct {
	ID              string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	PaperID         string         `gorm:"type:uuid;index" json:"paper_id"`
	QuestionNumber  int            `json:"question_number"`
	QuestionID      string         `json:"question_id"`   // Original ID from PDF
	QuestionType    string         `json:"question_type"` // "MCQ", "MSQ", "SA", "COMPREHENSION"
	QuestionText    string         `gorm:"type:text" json:"question_text"`
	QuestionImage   string         `json:"question_image,omitempty"`         // URL or base64
	Options         datatypes.JSON `gorm:"type:jsonb" json:"options"`        // [{id, text, is_correct}]
	CorrectAnswer   datatypes.JSON `gorm:"type:jsonb" json:"correct_answer"` // Hidden during exam
	Marks           float64        `json:"marks"`
	Section         string         `json:"section,omitempty"`
	IsComprehension bool           `json:"is_comprehension"`
	ParentID        *string        `gorm:"type:uuid" json:"parent_id,omitempty"` // For comprehension sub-questions
	CreatedAt       time.Time
}

// ExamAttempt represents a user's exam attempt
type ExamAttempt struct {
	ID                string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID            uint           `gorm:"index" json:"user_id"`
	User              User           `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	PaperIDs          datatypes.JSON `gorm:"type:jsonb" json:"paper_ids"` // Selected papers
	Status            string         `json:"status"`                      // "IN_PROGRESS", "SUBMITTED", "ABANDONED"
	StartedAt         time.Time      `json:"started_at"`
	SubmittedAt       *time.Time     `json:"submitted_at,omitempty"`
	TotalDurationMins int            `json:"total_duration_mins"`
	TimeRemainingSecs int            `json:"time_remaining_secs"`
	Responses         datatypes.JSON `gorm:"type:jsonb" json:"responses"`        // {question_id: {answer, status, time_spent}}
	Scores            datatypes.JSON `gorm:"type:jsonb" json:"scores,omitempty"` // {paper_id: {correct, total, percentage}}
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

// QuestionResponse represents a user's response to a question (for JSON storage)
type QuestionResponse struct {
	QuestionID string      `json:"question_id"`
	Answer     interface{} `json:"answer"`     // Option ID(s) or numeric value
	Status     string      `json:"status"`     // "NOT_VISITED", "ANSWERED", "NOT_ANSWERED", "MARKED", "ANSWERED_MARKED"
	TimeSpent  int         `json:"time_spent"` // Seconds spent on this question
}
