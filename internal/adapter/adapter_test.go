package adapter

import (
	"strings"
	"testing"
)

func TestValidateGraphifyConfidenceMap(t *testing.T) {
	result, err := ValidateFile("../../testdata/oss-adapter-contract/graphify-minimal.json")
	if err != nil {
		t.Fatalf("ValidateFile returned error: %v", err)
	}

	got := result.Contract.Evidence.ConfidenceMap
	if got["EXTRACTED"] != "metadata-visible" {
		t.Fatalf("EXTRACTED maps to %q, want metadata-visible", got["EXTRACTED"])
	}
	if got["INFERRED"] != "claim-only" {
		t.Fatalf("INFERRED maps to %q, want claim-only", got["INFERRED"])
	}
	if got["AMBIGUOUS"] != "cannot_verify" {
		t.Fatalf("AMBIGUOUS maps to %q, want cannot_verify", got["AMBIGUOUS"])
	}
}

func TestValidateRejectsProducerConfidenceUpgradeToObservedEvidence(t *testing.T) {
	contract := validContractForTest()
	contract.Evidence.ConfidenceMap = map[string]string{
		"EXTRACTED": "source-visible",
		"INFERRED":  "metadata-visible",
	}

	err := Validate(contract)
	if err == nil {
		t.Fatal("Validate returned nil, want confidence mapping error")
	}
	for _, want := range []string{"confidence_map.EXTRACTED", "confidence_map.INFERRED"} {
		if !strings.Contains(err.Error(), want) {
			t.Fatalf("error = %q, want %q", err.Error(), want)
		}
	}
}

func TestValidateRejectsUnsupportedConfidenceMapState(t *testing.T) {
	contract := validContractForTest()
	contract.Evidence.ConfidenceMap = map[string]string{
		"EXTRACTED": "trusted-by-producer",
	}

	err := Validate(contract)
	if err == nil {
		t.Fatal("Validate returned nil, want unsupported confidence map state error")
	}
	if !strings.Contains(err.Error(), "confidence_map.EXTRACTED") {
		t.Fatalf("error = %q, want confidence_map.EXTRACTED", err.Error())
	}
}

func validContractForTest() Contract {
	return Contract{
		SchemaVersion: SchemaVersion,
		ID:            "test-adapter",
		Tool: Tool{
			Name: "Test Adapter",
		},
		Family:     "code-index",
		OutputKind: "code-index",
		License: License{
			ID:     "MIT",
			Status: "needs_review",
		},
		Execution: Execution{
			Mode:          "import-only",
			Network:       "none",
			MutatesTarget: false,
		},
		Privacy: Privacy{
			ContainsSourceSnippets: false,
			ContainsSecretValues:   false,
			RedactionRequired:      false,
		},
		Evidence: Evidence{
			DefaultState: "metadata-visible",
			Source:       "local fixture",
			Limitations:  []string{"test limitation"},
		},
		Limitations: []string{"test limitation"},
	}
}
