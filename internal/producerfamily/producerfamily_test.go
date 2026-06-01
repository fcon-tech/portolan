package producerfamily

import (
	"strings"
	"testing"
)

func TestValidateJSONLFileAcceptsProducerRecords(t *testing.T) {
	records, err := ValidateJSONLFile("../../internal/testfixtures/language-agnostic-producers/producer-records.jsonl")
	if err != nil {
		t.Fatalf("ValidateJSONLFile returned error: %v", err)
	}
	if len(records) != 8 {
		t.Fatalf("records = %d, want 8", len(records))
	}
}

func TestValidateJSONLFileRejectsPlainCandidateToolStrings(t *testing.T) {
	_, err := ValidateJSONLFile("../../internal/testfixtures/language-agnostic-producers/invalid-plain-candidate-tools.jsonl")
	if err == nil {
		t.Fatal("ValidateJSONLFile returned nil, want candidate_tools error")
	}
	if !strings.Contains(err.Error(), "candidate_tools") {
		t.Fatalf("error = %q, want candidate_tools context", err)
	}
}

func TestValidateJSONLFileRejectsUndeclaredRuntimeTopologyFields(t *testing.T) {
	_, err := ValidateJSONLFile("../../internal/testfixtures/language-agnostic-producers/invalid-runtime-topology-field.jsonl")
	if err == nil {
		t.Fatal("ValidateJSONLFile returned nil, want unknown runtime field error")
	}
	if !strings.Contains(err.Error(), "runtime_topology") {
		t.Fatalf("error = %q, want runtime_topology context", err)
	}
}

func TestValidateJSONLFileRejectsAcceptedEvaluationWithoutLocalEvidence(t *testing.T) {
	_, err := ValidateJSONLFile("../../internal/testfixtures/language-agnostic-producers/invalid-accepted-without-evidence.jsonl")
	if err == nil {
		t.Fatal("ValidateJSONLFile returned nil, want evidence_source error")
	}
	if !strings.Contains(err.Error(), "evidence_source") {
		t.Fatalf("error = %q, want evidence_source context", err)
	}
}
