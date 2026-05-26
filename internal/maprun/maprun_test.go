package maprun

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestReadFindingsAcceptsLongJSONLLine(t *testing.T) {
	path := filepath.Join(t.TempDir(), "findings.jsonl")
	longSummary := strings.Repeat("large evidence cluster ", 5000)
	finding := Finding{
		ID:             "finding-large-line",
		Kind:           "technical-debt",
		Summary:        longSummary,
		Severity:       "info",
		EvidenceState:  "source-visible",
		EvidenceSource: "findings.jsonl",
		Confidence:     0.7,
		Status:         "open",
	}
	data, err := json.Marshal(finding)
	if err != nil {
		t.Fatal(err)
	}
	if len(data) <= 64*1024 {
		t.Fatalf("test fixture line = %d bytes, want > 64 KiB", len(data))
	}
	if err := os.WriteFile(path, append(data, '\n'), 0o644); err != nil {
		t.Fatal(err)
	}

	findings, err := readFindings(path)
	if err != nil {
		t.Fatal(err)
	}
	if len(findings) != 1 {
		t.Fatalf("findings = %d, want 1", len(findings))
	}
	if findings[0].Summary != longSummary {
		t.Fatalf("summary length = %d, want %d", len(findings[0].Summary), len(longSummary))
	}
}
