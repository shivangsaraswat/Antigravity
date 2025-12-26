package sandbox

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type ExecutionRequest struct {
	Language string `json:"language"`
	Code     string `json:"code"`
}

type ExecutionResponse struct {
	Output string `json:"output"`
	Error  string `json:"error"`
}

const PistonAPI = "https://emkc.org/api/v2/piston/execute"

func ExecuteCode(req ExecutionRequest) (*ExecutionResponse, error) {
	// Map our language names to Piston's
	// go -> go
	// python -> python
	// javascript -> javascript

	// Construct Piston Payload
	payload := map[string]interface{}{
		"language": req.Language,
		"version":  "*",
		"files": []map[string]string{
			{
				"content": req.Code,
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	client := http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(PistonAPI, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Run struct {
			Stdout string `json:"stdout"`
			Stderr string `json:"stderr"`
			Output string `json:"output"`
			Code   int    `json:"code"`
		} `json:"run"`
		Message string `json:"message"` // Error message from Piston (e.g. Runtime unsupported)
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode execution result")
	}

	if result.Message != "" {
		return &ExecutionResponse{Error: result.Message}, nil
	}

	// Combine stdout and stderr
	// Or just use 'output' if Piston provides concatenated
	return &ExecutionResponse{
		Output: result.Run.Output,
	}, nil
}
