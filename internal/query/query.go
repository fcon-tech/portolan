package query

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/fall-out-bug/portolan/internal/coverage"
)

const (
	SchemaVersion  = "0.1.0"
	DefaultLimit   = 20
	MaxLimit       = 200
	FamilyFindings = "findings"
	FamilyGaps     = "gaps"
)

type Options struct {
	BundlePath string
	Family     string
	Kind       string
	Limit      int
}

type Result struct {
	SchemaVersion    string   `json:"schema_version"`
	Query            Query    `json:"query"`
	Records          []Record `json:"records"`
	Truncated        bool     `json:"truncated"`
	TruncatedRecords int      `json:"truncated_records"`
	Warnings         []string `json:"warnings"`
}

type Query struct {
	Family     string `json:"family"`
	Kind       string `json:"kind,omitempty"`
	Limit      int    `json:"limit"`
	BundlePath string `json:"bundle_path"`
}

type Record struct {
	ID             string  `json:"id"`
	Reference      string  `json:"reference"`
	BundlePath     string  `json:"bundle_path"`
	Artifact       string  `json:"artifact"`
	RecordID       string  `json:"record_id"`
	Kind           string  `json:"kind"`
	EvidenceState  string  `json:"evidence_state"`
	Status         string  `json:"status"`
	Reason         string  `json:"reason"`
	EvidenceSource string  `json:"evidence_source,omitempty"`
	Summary        string  `json:"summary,omitempty"`
	Severity       string  `json:"severity,omitempty"`
	Confidence     float64 `json:"confidence,omitempty"`
}

type findingRecord struct {
	ID             string  `json:"id"`
	Kind           string  `json:"kind"`
	Summary        string  `json:"summary"`
	Severity       string  `json:"severity"`
	EvidenceState  string  `json:"evidence_state"`
	EvidenceSource string  `json:"evidence_source"`
	Confidence     float64 `json:"confidence"`
	Status         string  `json:"status"`
}

func Run(opts Options) (Result, error) {
	bundle, err := normalizeBundle(opts.BundlePath)
	if err != nil {
		return Result{}, err
	}
	limit := opts.Limit
	if limit == 0 {
		limit = DefaultLimit
	}
	if limit < 1 || limit > MaxLimit {
		return Result{}, fmt.Errorf("--limit must be between 1 and %d", MaxLimit)
	}

	var records []Record
	switch opts.Family {
	case FamilyFindings:
		if strings.TrimSpace(opts.Kind) == "" {
			return Result{}, errors.New("--kind is required for findings queries")
		}
		findings, err := readFindings(bundleFile(bundle, "findings.jsonl"))
		if err != nil {
			return Result{}, err
		}
		for _, finding := range findings {
			if finding.Kind != opts.Kind {
				continue
			}
			records = append(records, recordFromFinding(bundle, finding))
		}
	case FamilyGaps:
		if strings.TrimSpace(opts.Kind) != "" {
			return Result{}, errors.New("--kind is only supported for findings queries")
		}
		ledger, err := readCoverage(bundleFile(bundle, "coverage.json"))
		if err != nil {
			return Result{}, err
		}
		for _, record := range ledger.Records {
			if isWeak(record.EvidenceState, record.Status) {
				records = append(records, recordFromCoverage(bundle, record))
			}
		}
		findings, err := readFindings(bundleFile(bundle, "findings.jsonl"))
		if err != nil {
			return Result{}, err
		}
		for _, finding := range findings {
			if isWeak(finding.EvidenceState, finding.Status) {
				records = append(records, recordFromFinding(bundle, finding))
			}
		}
	default:
		return Result{}, fmt.Errorf("unsupported query family %q", opts.Family)
	}

	sortRecords(records)
	total := len(records)
	if total > limit {
		records = records[:limit]
	}
	warnings := []string{}
	if total == 0 {
		warnings = append(warnings, "no records matched the query")
	}
	return Result{
		SchemaVersion: SchemaVersion,
		Query: Query{
			Family:     opts.Family,
			Kind:       opts.Kind,
			Limit:      limit,
			BundlePath: bundle,
		},
		Records:          records,
		Truncated:        total > limit,
		TruncatedRecords: max(0, total-limit),
		Warnings:         warnings,
	}, nil
}

func normalizeBundle(path string) (string, error) {
	if strings.TrimSpace(path) == "" {
		return "", errors.New("--bundle is required")
	}
	abs, err := filepath.Abs(path)
	if err != nil {
		return "", fmt.Errorf("resolve bundle: %w", err)
	}
	abs = filepath.Clean(abs)
	info, err := os.Lstat(abs)
	if err != nil {
		return "", fmt.Errorf("inspect bundle: %w", err)
	}
	if info.Mode()&os.ModeSymlink != 0 {
		return "", fmt.Errorf("--bundle must not be a symlink: %s", abs)
	}
	if !info.IsDir() {
		return "", fmt.Errorf("--bundle must be a directory: %s", abs)
	}
	return abs, nil
}

func bundleFile(bundle, name string) string {
	return filepath.Join(bundle, name)
}

func readCoverage(path string) (coverage.Ledger, error) {
	if err := rejectSymlink(path, "coverage"); err != nil {
		return coverage.Ledger{}, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return coverage.Ledger{}, fmt.Errorf("read coverage: %w", err)
	}
	var ledger coverage.Ledger
	decoder := json.NewDecoder(bytes.NewReader(data))
	if err := decoder.Decode(&ledger); err != nil {
		return coverage.Ledger{}, fmt.Errorf("parse coverage: %w", err)
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		return coverage.Ledger{}, errors.New("parse coverage: trailing JSON content")
	}
	if ledger.SchemaVersion != "" && ledger.SchemaVersion != coverage.SchemaVersion {
		return coverage.Ledger{}, fmt.Errorf("coverage schema_version must be %q", coverage.SchemaVersion)
	}
	return ledger, nil
}

func readFindings(path string) ([]findingRecord, error) {
	if err := rejectSymlink(path, "findings"); err != nil {
		return nil, err
	}
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("read findings: %w", err)
	}
	defer file.Close()

	var findings []findingRecord
	reader := bufio.NewReader(file)
	lineNumber := 0
	for {
		line, err := reader.ReadString('\n')
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			lineNumber++
			var finding findingRecord
			if err := json.Unmarshal([]byte(trimmed), &finding); err != nil {
				return nil, fmt.Errorf("parse findings line %d: %w", lineNumber, err)
			}
			if strings.TrimSpace(finding.ID) == "" {
				return nil, fmt.Errorf("parse findings line %d: id is required", lineNumber)
			}
			if strings.TrimSpace(finding.Kind) == "" {
				return nil, fmt.Errorf("parse findings line %d: kind is required", lineNumber)
			}
			findings = append(findings, finding)
		}
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return nil, fmt.Errorf("read findings: %w", err)
		}
	}
	return findings, nil
}

func rejectSymlink(path string, label string) error {
	info, err := os.Lstat(path)
	if err != nil {
		return fmt.Errorf("inspect %s: %w", label, err)
	}
	if info.Mode()&os.ModeSymlink != 0 {
		return fmt.Errorf("%s artifact must not be a symlink: %s", label, path)
	}
	if info.IsDir() {
		return fmt.Errorf("%s artifact must be a file: %s", label, path)
	}
	return nil
}

func recordFromCoverage(bundle string, record coverage.Record) Record {
	reason := record.Reason
	if strings.TrimSpace(reason) == "" {
		reason = weakReason(record.EvidenceState, record.Status)
	}
	return Record{
		ID:             record.ID,
		Reference:      reference("coverage", record.ID),
		BundlePath:     bundle,
		Artifact:       "coverage.json",
		RecordID:       record.ID,
		Kind:           record.Kind,
		EvidenceState:  record.EvidenceState,
		Status:         record.Status,
		Reason:         reason,
		EvidenceSource: record.Source,
	}
}

func recordFromFinding(bundle string, finding findingRecord) Record {
	reason := finding.Summary
	if strings.TrimSpace(reason) == "" {
		reason = weakReason(finding.EvidenceState, finding.Status)
	}
	return Record{
		ID:             finding.ID,
		Reference:      reference("findings", finding.ID),
		BundlePath:     bundle,
		Artifact:       "findings.jsonl",
		RecordID:       finding.ID,
		Kind:           finding.Kind,
		EvidenceState:  finding.EvidenceState,
		Status:         finding.Status,
		Reason:         reason,
		EvidenceSource: finding.EvidenceSource,
		Summary:        finding.Summary,
		Severity:       finding.Severity,
		Confidence:     finding.Confidence,
	}
}

func reference(artifact, id string) string {
	return "portolan://bundle/" + artifact + "/" + url.PathEscape(id)
}

func isWeak(state, status string) bool {
	switch state {
	case "unknown", "cannot_verify", "not_assessed":
		return true
	}
	switch status {
	case "unknown", "cannot_verify", "not_assessed", "missing", "blocked":
		return true
	default:
		return false
	}
}

func weakReason(state, status string) string {
	switch {
	case state != "" && status != "":
		return fmt.Sprintf("weak query record has evidence_state=%s and status=%s", state, status)
	case state != "":
		return fmt.Sprintf("weak query record has evidence_state=%s", state)
	case status != "":
		return fmt.Sprintf("weak query record has status=%s", status)
	default:
		return "weak query record lacks explicit state details"
	}
}

func sortRecords(records []Record) {
	sort.Slice(records, func(i, j int) bool {
		if records[i].Artifact != records[j].Artifact {
			return records[i].Artifact < records[j].Artifact
		}
		if records[i].Kind != records[j].Kind {
			return records[i].Kind < records[j].Kind
		}
		return records[i].ID < records[j].ID
	})
}
