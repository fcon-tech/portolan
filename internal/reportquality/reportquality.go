package reportquality

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const SchemaVersion = "0.1.0"

type Options struct {
	SummaryPath string
}

type Summary struct {
	SchemaVersion     string          `json:"schema_version"`
	ReportID          string          `json:"report_id"`
	RequiredSections  []Section       `json:"required_sections"`
	PositiveClaims    []PositiveClaim `json:"positive_claims"`
	WeakStates        []WeakState     `json:"weak_states"`
	OptionalProducers []ProducerGap   `json:"optional_producers,omitempty"`
}

type Section struct {
	Name    string `json:"name"`
	Present bool   `json:"present"`
}

type PositiveClaim struct {
	Claim       string `json:"claim"`
	EvidenceRef string `json:"evidence_ref"`
	Supported   bool   `json:"supported"`
}

type WeakState struct {
	State       string `json:"state"`
	Visible     bool   `json:"visible"`
	EvidenceRef string `json:"evidence_ref"`
}

type ProducerGap struct {
	Name    string `json:"name"`
	Visible bool   `json:"visible"`
}

type Result struct {
	SchemaVersion string   `json:"schema_version"`
	Verdict       string   `json:"verdict"`
	Failures      []string `json:"failures,omitempty"`
	Warnings      []string `json:"warnings,omitempty"`
}

func Run(opts Options) (Result, error) {
	summary, err := LoadSummary(opts.SummaryPath)
	if err != nil {
		return Result{}, err
	}
	return Validate(summary), nil
}

func LoadSummary(path string) (Summary, error) {
	clean, err := cleanSummaryPath(path)
	if err != nil {
		return Summary{}, err
	}
	if err := validateSummaryPath(clean); err != nil {
		return Summary{}, err
	}
	data, err := os.ReadFile(clean)
	if err != nil {
		return Summary{}, fmt.Errorf("read summary: %w", err)
	}
	return decodeSummary(data)
}

func cleanSummaryPath(path string) (string, error) {
	if strings.TrimSpace(path) == "" {
		return "", errors.New("--summary is required")
	}
	clean, err := filepath.Abs(path)
	if err != nil {
		return "", fmt.Errorf("resolve summary: %w", err)
	}
	return clean, nil
}

func validateSummaryPath(path string) error {
	info, err := os.Lstat(path)
	if err != nil {
		return fmt.Errorf("inspect summary: %w", err)
	}
	if info.Mode()&os.ModeSymlink != 0 {
		return fmt.Errorf("--summary must not be a symlink: %s", path)
	}
	if info.IsDir() {
		return fmt.Errorf("--summary must be a file: %s", path)
	}
	return nil
}

func decodeSummary(data []byte) (Summary, error) {
	var summary Summary
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&summary); err != nil {
		return Summary{}, fmt.Errorf("parse summary: %w", err)
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		return Summary{}, errors.New("parse summary: trailing JSON content")
	}
	if summary.SchemaVersion != SchemaVersion {
		return Summary{}, fmt.Errorf("summary schema_version must be %q", SchemaVersion)
	}
	return summary, nil
}

func Validate(summary Summary) Result {
	var failures []string
	if strings.TrimSpace(summary.ReportID) == "" {
		failures = append(failures, "report_id is required")
	}
	failures = append(failures, validateRequiredSections(summary.RequiredSections)...)
	failures = append(failures, validatePositiveClaims(summary.PositiveClaims)...)
	failures = append(failures, validateWeakStates(summary.WeakStates)...)
	warnings := validateOptionalProducers(summary.OptionalProducers)
	verdict := "pass"
	if len(failures) > 0 {
		verdict = "fail"
	}
	return Result{
		SchemaVersion: SchemaVersion,
		Verdict:       verdict,
		Failures:      failures,
		Warnings:      warnings,
	}
}

func validateRequiredSections(sections []Section) []string {
	var failures []string
	if len(sections) == 0 {
		return []string{"at least one required section is required"}
	}
	for _, section := range sections {
		failures = appendSectionFailure(failures, section)
	}
	return failures
}

func appendSectionFailure(failures []string, section Section) []string {
	if strings.TrimSpace(section.Name) == "" {
		return append(failures, "required section name is required")
	}
	if !section.Present {
		return append(failures, fmt.Sprintf("required section %q is missing", section.Name))
	}
	return failures
}

func validatePositiveClaims(claims []PositiveClaim) []string {
	var failures []string
	for _, claim := range claims {
		failures = appendClaimFailures(failures, claim)
	}
	return failures
}

func appendClaimFailures(failures []string, claim PositiveClaim) []string {
	if strings.TrimSpace(claim.Claim) == "" {
		failures = append(failures, "positive claim text is required")
	}
	if strings.TrimSpace(claim.EvidenceRef) == "" {
		failures = append(failures, fmt.Sprintf("positive claim %q has no evidence_ref", claim.Claim))
	}
	if !claim.Supported {
		failures = append(failures, fmt.Sprintf("positive claim %q is unsupported", claim.Claim))
	}
	return failures
}

func validateWeakStates(weakStates []WeakState) []string {
	var failures []string
	for _, weak := range weakStates {
		failures = appendWeakStateFailures(failures, weak)
	}
	return failures
}

func appendWeakStateFailures(failures []string, weak WeakState) []string {
	if !isWeakState(weak.State) {
		return append(failures, fmt.Sprintf("weak state %q is not supported", weak.State))
	}
	if !weak.Visible {
		failures = append(failures, fmt.Sprintf("weak state %q is hidden", weak.State))
	}
	if strings.TrimSpace(weak.EvidenceRef) == "" {
		failures = append(failures, fmt.Sprintf("weak state %q has no evidence_ref", weak.State))
	}
	return failures
}

func validateOptionalProducers(producers []ProducerGap) []string {
	var warnings []string
	for _, producer := range producers {
		warnings = appendProducerWarnings(warnings, producer)
	}
	return warnings
}

func appendProducerWarnings(warnings []string, producer ProducerGap) []string {
	if strings.TrimSpace(producer.Name) == "" {
		return append(warnings, "optional producer name is required")
	}
	if !producer.Visible {
		return append(warnings, fmt.Sprintf("optional producer %q absence is not visible", producer.Name))
	}
	return warnings
}

func isWeakState(state string) bool {
	switch state {
	case "unknown", "cannot_verify", "not_assessed":
		return true
	default:
		return false
	}
}
