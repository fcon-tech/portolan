package producerfamily

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type ProducerRunRecord struct {
	RecordType     string           `json:"record_type"`
	ID             string           `json:"id"`
	ProducerFamily string           `json:"producer_family"`
	ProducerTool   string           `json:"producer_tool"`
	Command        string           `json:"command"`
	TargetRoot     string           `json:"target_root"`
	OutputPath     string           `json:"output_path,omitempty"`
	OutputFormat   string           `json:"output_format,omitempty"`
	Scope          ProducerRunScope `json:"scope"`
	Freshness      string           `json:"freshness,omitempty"`
	Status         string           `json:"status"`
	EvidenceState  string           `json:"evidence_state"`
	Limitations    []string         `json:"limitations,omitempty"`
	PrivacyReview  string           `json:"privacy_review"`
}

type ProducerRunScope struct {
	Repository   string   `json:"repository,omitempty"`
	Directory    string   `json:"directory,omitempty"`
	CoveredUnits []string `json:"covered_units,omitempty"`
}

var allowedProducerRunStatuses = map[string]bool{
	"verified":      true,
	"failed":        true,
	"blocked":       true,
	"cannot_verify": true,
	"not_assessed":  true,
}

var allowedProducerRunPrivacy = map[string]bool{
	"local_safe":    true,
	"redacted":      true,
	"blocked":       true,
	"cannot_verify": true,
	"not_assessed":  true,
}

var runtimeProducerFamilies = map[string]bool{
	"runtime-observation": true,
	"runtime-topology":    true,
}

func ValidateProducerRunJSONLFile(path string) ([]ProducerRunRecord, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("read producer run records: %w", err)
	}
	defer file.Close()

	var records []ProducerRunRecord
	scanner := bufio.NewScanner(file)
	lineNo := 0
	for scanner.Scan() {
		lineNo++
		line := bytes.TrimSpace(scanner.Bytes())
		if len(line) == 0 {
			continue
		}
		record, err := ValidateProducerRunJSON(line)
		if err != nil {
			return nil, fmt.Errorf("invalid producer run record line %d: %w", lineNo, err)
		}
		records = append(records, record)
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("read producer run records: %w", err)
	}
	return records, nil
}

func ValidateProducerRunJSON(data []byte) (ProducerRunRecord, error) {
	var record ProducerRunRecord
	if err := decodeProducerRunStrict(data, &record); err != nil {
		return ProducerRunRecord{}, err
	}
	if err := ValidateProducerRun(record); err != nil {
		return ProducerRunRecord{}, err
	}
	return record, nil
}

func ValidateProducerRun(record ProducerRunRecord) error {
	var problems []string
	if record.RecordType != "producer-run" {
		problems = append(problems, "record_type must be producer-run")
	}
	if record.ID == "" {
		problems = append(problems, "id is required")
	}
	if record.ProducerFamily == "" {
		problems = append(problems, "producer_family is required")
	}
	if record.ProducerTool == "" {
		problems = append(problems, "producer_tool is required")
	}
	if record.Command == "" {
		problems = append(problems, "command is required")
	}
	if commandLooksUnsafe(record.Command) {
		problems = append(problems, "command must not hide network, credential, daemon, or target mutation behavior")
	}
	if record.TargetRoot == "" {
		problems = append(problems, "target_root is required")
	} else if !filepath.IsAbs(record.TargetRoot) {
		problems = append(problems, "target_root must be absolute")
	}
	if !allowedProducerRunStatuses[record.Status] {
		problems = append(problems, "status is unsupported")
	}
	if !allowedEvidenceStates[record.EvidenceState] {
		problems = append(problems, "evidence_state is unsupported")
	}
	if record.EvidenceState == "runtime-visible" && !runtimeProducerFamilies[record.ProducerFamily] {
		problems = append(problems, "runtime-visible evidence_state requires a runtime producer family")
	}
	if !allowedProducerRunPrivacy[record.PrivacyReview] {
		problems = append(problems, "privacy_review is unsupported")
	}
	if record.Status == "verified" {
		validateVerifiedProducerRun(record, &problems)
	}
	if record.Status == "not_assessed" && record.EvidenceState != "not_assessed" {
		problems = append(problems, "not_assessed status must use not_assessed evidence_state")
	}
	if record.Status != "verified" && len(record.Limitations) == 0 {
		problems = append(problems, "limitations must explain non-verified producer runs")
	}
	if record.Freshness != "" {
		if _, err := time.Parse(time.RFC3339, record.Freshness); err != nil {
			problems = append(problems, "freshness must be RFC3339")
		}
	}
	return validationError("invalid producer run record", problems)
}

func validateVerifiedProducerRun(record ProducerRunRecord, problems *[]string) {
	if record.OutputPath == "" {
		*problems = append(*problems, "output_path is required for verified producer runs")
		return
	}
	outputPath := record.OutputPath
	if !filepath.IsAbs(outputPath) {
		outputPath = filepath.Join(record.TargetRoot, outputPath)
	}
	cleanRoot := filepath.Clean(record.TargetRoot)
	cleanOutput := filepath.Clean(outputPath)
	if !isWithinPath(cleanOutput, cleanRoot) {
		*problems = append(*problems, "output_path must stay within target_root for verified producer runs")
		return
	}
	info, err := os.Lstat(cleanOutput)
	if err != nil {
		*problems = append(*problems, "output_path must exist for verified producer runs")
		return
	}
	if info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular() {
		*problems = append(*problems, "output_path must be a regular non-symlink file")
	}
	if record.Scope.Repository == "" && record.Scope.Directory == "" && len(record.Scope.CoveredUnits) == 0 {
		*problems = append(*problems, "scope must not be empty for verified producer runs")
	}
	if record.EvidenceState == "not_assessed" || record.EvidenceState == "unknown" || record.EvidenceState == "cannot_verify" {
		*problems = append(*problems, "verified producer runs require observed evidence_state")
	}
}

func commandLooksUnsafe(command string) bool {
	lower := strings.ToLower(command)
	for _, token := range []string{
		"http://",
		"https://",
		" --token",
		" token=",
		"password=",
		"credential",
		"kubectl apply",
		"kubectl delete",
		"docker compose up",
		"docker-compose up",
		"docker run",
	} {
		if strings.Contains(lower, token) {
			return true
		}
	}
	return false
}

func isWithinPath(path, root string) bool {
	rel, err := filepath.Rel(root, path)
	if err != nil {
		return false
	}
	return rel == "." || (!strings.HasPrefix(rel, ".."+string(filepath.Separator)) && rel != "..")
}

func decodeProducerRunStrict(data []byte, value any) error {
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(value); err != nil {
		return err
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		return errors.New("trailing JSON content")
	}
	return nil
}
