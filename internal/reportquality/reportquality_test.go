package reportquality

import (
	"path/filepath"
	"strings"
	"testing"
)

func TestValidatePassesThinHonestReport(t *testing.T) {
	result, err := Run(Options{SummaryPath: filepath.Join("..", "..", "testdata", "report-quality", "thin-honest.json")})
	if err != nil {
		t.Fatal(err)
	}
	if result.Verdict != "pass" {
		t.Fatalf("verdict = %q, failures = %v", result.Verdict, result.Failures)
	}
}

func TestValidateFailsUnsupportedPositiveClaim(t *testing.T) {
	result, err := Run(Options{SummaryPath: filepath.Join("..", "..", "testdata", "report-quality", "unsupported-positive-claim.json")})
	if err != nil {
		t.Fatal(err)
	}
	if result.Verdict != "fail" {
		t.Fatalf("verdict = %q, want fail", result.Verdict)
	}
	if !contains(result.Failures, "unsupported") {
		t.Fatalf("failures = %v, want unsupported claim failure", result.Failures)
	}
}

func TestValidateFailsHiddenWeakState(t *testing.T) {
	result, err := Run(Options{SummaryPath: filepath.Join("..", "..", "testdata", "report-quality", "hidden-weak-state.json")})
	if err != nil {
		t.Fatal(err)
	}
	if result.Verdict != "fail" {
		t.Fatalf("verdict = %q, want fail", result.Verdict)
	}
	if !contains(result.Failures, "hidden") {
		t.Fatalf("failures = %v, want hidden weak state failure", result.Failures)
	}
}

func contains(values []string, want string) bool {
	for _, value := range values {
		if strings.Contains(value, want) {
			return true
		}
	}
	return false
}
