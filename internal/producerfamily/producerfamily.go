package producerfamily

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
)

type Record struct {
	Kind           string
	Recommendation *RecommendationRecord
	Evaluation     *EvaluationRecord
	Coverage       *CoverageRecord
}

type RecommendationRecord struct {
	ID             string          `json:"id"`
	Kind           string          `json:"kind"`
	Family         string          `json:"family"`
	Status         string          `json:"status"`
	EvidenceState  string          `json:"evidence_state"`
	Repositories   []string        `json:"repositories"`
	BlockedClaims  []string        `json:"blocked_claims"`
	RequiredOutput string          `json:"required_output"`
	CandidateTools []CandidateTool `json:"candidate_tools"`
	SourceArtifact string          `json:"source_artifact"`
	SourceID       string          `json:"source_id,omitempty"`
	Summary        string          `json:"summary,omitempty"`
	Reason         string          `json:"reason"`
}

type CandidateTool struct {
	ID                string `json:"id"`
	VerificationState string `json:"verification_state"`
	SupportState      string `json:"support_state"`
	Reason            string `json:"reason"`
}

type EvaluationRecord struct {
	ID                      string `json:"id"`
	Kind                    string `json:"kind"`
	CandidateID             string `json:"candidate_id"`
	Family                  string `json:"family"`
	Status                  string `json:"status,omitempty"`
	EvidenceState           string `json:"evidence_state,omitempty"`
	SourceArtifact          string `json:"source_artifact,omitempty"`
	SourceID                string `json:"source_id,omitempty"`
	Scope                   string `json:"scope,omitempty"`
	ScopeDetail             string `json:"scope_detail,omitempty"`
	Decision                string `json:"decision"`
	Fit                     string `json:"fit"`
	OutputContractStability string `json:"output_contract_stability"`
	LocalExecution          string `json:"local_execution"`
	License                 string `json:"license"`
	Maintenance             string `json:"maintenance"`
	Privacy                 string `json:"privacy"`
	IntegrationCost         string `json:"integration_cost"`
	EvidenceSource          string `json:"evidence_source"`
	Summary                 string `json:"summary,omitempty"`
	Reason                  string `json:"reason,omitempty"`
	Notes                   string `json:"notes"`
}

type CoverageRecord struct {
	ID               string   `json:"id"`
	Kind             string   `json:"kind"`
	RepositoryID     string   `json:"repository_id"`
	Family           string   `json:"family"`
	Status           string   `json:"status"`
	EvidenceState    string   `json:"evidence_state"`
	SourceArtifact   string   `json:"source_artifact"`
	SourceID         string   `json:"source_id,omitempty"`
	Scope            string   `json:"scope"`
	ScopeDetail      string   `json:"scope_detail"`
	LanguagesInScope []string `json:"languages_in_scope"`
	Summary          string   `json:"summary,omitempty"`
	Reason           string   `json:"reason"`
}

var allowedEvidenceStates = map[string]bool{
	"source-visible":   true,
	"metadata-visible": true,
	"runtime-visible":  true,
	"claim-only":       true,
	"unknown":          true,
	"cannot_verify":    true,
	"not_assessed":     true,
}

var allowedRecommendationStatuses = map[string]bool{
	"not_assessed":  true,
	"unknown":       true,
	"cannot_verify": true,
	"blocked":       true,
	"partial":       true,
}

var allowedVerificationStates = map[string]bool{
	"not_assessed":          true,
	"cannot_verify":         true,
	"verified_local_output": true,
	"blocked":               true,
}

var allowedSupportStates = map[string]bool{
	"candidate_only": true,
	"accepted":       true,
	"narrowed":       true,
	"rejected":       true,
	"blocked":        true,
}

var allowedDecisions = map[string]bool{
	"accepted":     true,
	"narrowed":     true,
	"rejected":     true,
	"blocked":      true,
	"not_assessed": true,
}

var allowedEvaluationStatuses = map[string]bool{
	"accepted":      true,
	"narrowed":      true,
	"rejected":      true,
	"blocked":       true,
	"not_assessed":  true,
	"cannot_verify": true,
}

var allowedOutputContractStability = map[string]bool{
	"stable":        true,
	"partial":       true,
	"unstable":      true,
	"unknown":       true,
	"cannot_verify": true,
	"not_assessed":  true,
}

var allowedLocalExecution = map[string]bool{
	"verified":     true,
	"assumed":      true,
	"blocked":      true,
	"not_assessed": true,
}

var allowedLicenseStates = map[string]bool{
	"accepted":        true,
	"review_required": true,
	"blocked":         true,
	"not_assessed":    true,
}

var allowedMaintenanceStates = map[string]bool{
	"active":       true,
	"stale":        true,
	"unknown":      true,
	"not_assessed": true,
}

var allowedPrivacyStates = map[string]bool{
	"local_safe":   true,
	"narrowed":     true,
	"blocked":      true,
	"not_assessed": true,
}

var allowedIntegrationCosts = map[string]bool{
	"low":          true,
	"medium":       true,
	"high":         true,
	"unknown":      true,
	"not_assessed": true,
}

var allowedCoverageStatuses = map[string]bool{
	"observed":      true,
	"partial":       true,
	"blocked":       true,
	"unknown":       true,
	"cannot_verify": true,
	"not_assessed":  true,
}

var allowedScopes = map[string]bool{
	"repository":   true,
	"subdirectory": true,
	"landscape":    true,
	"unknown":      true,
}

func ValidateJSONLFile(path string) ([]Record, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("read producer family records: %w", err)
	}
	defer file.Close()

	var records []Record
	scanner := bufio.NewScanner(file)
	lineNo := 0
	for scanner.Scan() {
		lineNo++
		line := bytes.TrimSpace(scanner.Bytes())
		if len(line) == 0 {
			continue
		}
		record, err := ValidateJSON(line)
		if err != nil {
			return nil, fmt.Errorf("invalid producer family record line %d: %w", lineNo, err)
		}
		records = append(records, record)
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("read producer family records: %w", err)
	}
	return records, nil
}

func ValidateJSON(data []byte) (Record, error) {
	var probe struct {
		Kind string `json:"kind"`
	}
	if err := json.Unmarshal(data, &probe); err != nil {
		return Record{}, fmt.Errorf("parse record kind: %w", err)
	}
	switch probe.Kind {
	case "producer-recommendation":
		var record RecommendationRecord
		if err := decodeStrict(data, &record); err != nil {
			return Record{}, err
		}
		if err := ValidateRecommendation(record); err != nil {
			return Record{}, err
		}
		return Record{Kind: probe.Kind, Recommendation: &record}, nil
	case "producer-evaluation":
		var record EvaluationRecord
		if err := decodeStrict(data, &record); err != nil {
			return Record{}, err
		}
		if err := ValidateEvaluation(record); err != nil {
			return Record{}, err
		}
		return Record{Kind: probe.Kind, Evaluation: &record}, nil
	case "producer-coverage":
		var record CoverageRecord
		if err := decodeStrict(data, &record); err != nil {
			return Record{}, err
		}
		if err := ValidateCoverage(record); err != nil {
			return Record{}, err
		}
		return Record{Kind: probe.Kind, Coverage: &record}, nil
	default:
		return Record{}, fmt.Errorf("kind is unsupported")
	}
}

func decodeStrict(data []byte, value any) error {
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(value); err != nil {
		return err
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		return fmt.Errorf("trailing JSON content")
	}
	return nil
}

func ValidateRecommendation(record RecommendationRecord) error {
	var problems []string
	if record.ID == "" {
		problems = append(problems, "id is required")
	}
	if record.Kind != "producer-recommendation" {
		problems = append(problems, "kind must be producer-recommendation")
	}
	if record.Family == "" {
		problems = append(problems, "family is required")
	}
	if !allowedRecommendationStatuses[record.Status] {
		problems = append(problems, "status is unsupported")
	}
	if !allowedEvidenceStates[record.EvidenceState] {
		problems = append(problems, "evidence_state is unsupported")
	}
	if len(record.Repositories) == 0 {
		problems = append(problems, "repositories must not be empty")
	}
	if len(record.BlockedClaims) == 0 {
		problems = append(problems, "blocked_claims must not be empty")
	}
	if record.RequiredOutput == "" {
		problems = append(problems, "required_output is required")
	}
	if record.SourceArtifact == "" {
		problems = append(problems, "source_artifact is required")
	}
	if record.Reason == "" {
		problems = append(problems, "reason is required")
	}
	validateCandidateTools(record.CandidateTools, &problems)
	return validationError("invalid producer recommendation", problems)
}

func validateCandidateTools(candidates []CandidateTool, problems *[]string) {
	if len(candidates) == 0 {
		*problems = append(*problems, "candidate_tools must not be empty")
		return
	}
	for i, candidate := range candidates {
		prefix := fmt.Sprintf("candidate_tools[%d]", i)
		if candidate.ID == "" {
			*problems = append(*problems, prefix+".id is required")
		}
		if !allowedVerificationStates[candidate.VerificationState] {
			*problems = append(*problems, prefix+".verification_state is unsupported")
		}
		if !allowedSupportStates[candidate.SupportState] {
			*problems = append(*problems, prefix+".support_state is unsupported")
		}
		if candidate.SupportState != "candidate_only" {
			*problems = append(*problems, prefix+".support_state must remain candidate_only in recommendation records")
		}
		if candidate.Reason == "" {
			*problems = append(*problems, prefix+".reason is required")
		}
	}
}

func ValidateEvaluation(record EvaluationRecord) error {
	var problems []string
	if record.ID == "" {
		problems = append(problems, "id is required")
	}
	if record.Kind != "producer-evaluation" {
		problems = append(problems, "kind must be producer-evaluation")
	}
	if record.CandidateID == "" {
		problems = append(problems, "candidate_id is required")
	}
	if record.Family == "" {
		problems = append(problems, "family is required")
	}
	if !allowedDecisions[record.Decision] {
		problems = append(problems, "decision is unsupported")
	}
	if record.Status != "" && !allowedEvaluationStatuses[record.Status] {
		problems = append(problems, "status is unsupported")
	}
	if record.EvidenceState != "" && !allowedEvidenceStates[record.EvidenceState] {
		problems = append(problems, "evidence_state is unsupported")
	}
	if record.Scope != "" && !allowedScopes[record.Scope] {
		problems = append(problems, "scope is unsupported")
	}
	if record.Scope != "" && record.ScopeDetail == "" {
		problems = append(problems, "scope_detail is required when scope is set")
	}
	if record.Fit == "" {
		problems = append(problems, "fit is required")
	}
	if !allowedOutputContractStability[record.OutputContractStability] {
		problems = append(problems, "output_contract_stability is unsupported")
	}
	if !allowedLocalExecution[record.LocalExecution] {
		problems = append(problems, "local_execution is unsupported")
	}
	if !allowedLicenseStates[record.License] {
		problems = append(problems, "license is unsupported")
	}
	if !allowedMaintenanceStates[record.Maintenance] {
		problems = append(problems, "maintenance is unsupported")
	}
	if !allowedPrivacyStates[record.Privacy] {
		problems = append(problems, "privacy is unsupported")
	}
	if !allowedIntegrationCosts[record.IntegrationCost] {
		problems = append(problems, "integration_cost is unsupported")
	}
	if record.EvidenceSource == "" {
		problems = append(problems, "evidence_source is required")
	}
	if (record.Decision == "accepted" || record.Decision == "narrowed") && record.EvidenceSource == "not_assessed" {
		problems = append(problems, "evidence_source must cite local evidence for accepted or narrowed decisions")
	}
	if (record.Decision == "accepted" || record.Decision == "narrowed") && record.LocalExecution == "not_assessed" {
		problems = append(problems, "local_execution must be assessed for accepted or narrowed decisions")
	}
	if record.Notes == "" {
		problems = append(problems, "notes is required")
	}
	return validationError("invalid producer evaluation", problems)
}

func ValidateCoverage(record CoverageRecord) error {
	var problems []string
	if record.ID == "" {
		problems = append(problems, "id is required")
	}
	if record.Kind != "producer-coverage" {
		problems = append(problems, "kind must be producer-coverage")
	}
	if record.RepositoryID == "" {
		problems = append(problems, "repository_id is required")
	}
	if record.Family == "" {
		problems = append(problems, "family is required")
	}
	if !allowedCoverageStatuses[record.Status] {
		problems = append(problems, "status is unsupported")
	}
	if !allowedEvidenceStates[record.EvidenceState] {
		problems = append(problems, "evidence_state is unsupported")
	}
	if record.SourceArtifact == "" {
		problems = append(problems, "source_artifact is required")
	}
	if !allowedScopes[record.Scope] {
		problems = append(problems, "scope is unsupported")
	}
	if record.ScopeDetail == "" {
		problems = append(problems, "scope_detail is required")
	}
	if record.Reason == "" {
		problems = append(problems, "reason is required")
	}
	return validationError("invalid producer coverage", problems)
}

func validationError(prefix string, problems []string) error {
	if len(problems) == 0 {
		return nil
	}
	return errors.New(prefix + ": " + strings.Join(problems, "; "))
}
