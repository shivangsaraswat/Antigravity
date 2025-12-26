package parser

import (
	"bytes"
	"fmt"

	"github.com/ledongthuc/pdf"
)

// ParsePDF extracts plain text from a PDF file
func ParsePDF(content []byte) (string, error) {
	reader := bytes.NewReader(content)
	r, err := pdf.NewReader(reader, int64(len(content)))
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	// Loop through all pages
	for pageIndex := 1; pageIndex <= r.NumPage(); pageIndex++ {
		p := r.Page(pageIndex)
		if p.V.IsNull() {
			continue
		}

		text, err := p.GetPlainText(nil)
		if err != nil {
			// Log error but continue to next page?
			// For now, let's just create a simple error
			return "", fmt.Errorf("failed to get text from page %d: %w", pageIndex, err)
		}
		buf.WriteString(text)
		buf.WriteString("\n")
	}

	return buf.String(), nil
}
