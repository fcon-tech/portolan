package adapter

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
)

const SchemaVersion = "0.1.0"

type Contract struct {
	SchemaVersion string    `json:"schema_version"`
	ID            string    `json:"id"`
	Tool          Tool      `json:"tool"`
	Family        string    `json:"family"`
	OutputKind    string    `json:"output_kind"`
	License       License   `json:"license"`
	Execution     Execution `json:"execution"`
	Privacy       Privacy   `json:"privacy"`
	Evidence      Evidence  `json:"evidence"`
	Commands      []Command `json:"commands,omitempty"`
	Limitations   []string  `json:"limitations"`
	Notes         string    `json:"notes,omitempty"`
}

type Tool struct {
	Name    string `json:"name"`
	Version string `json:"version,omitempty"`
	URL     string `json:"url,omitempty"`
}

type License struct {
	ID     string `json:"id"`
	URL    string `json:"url,omitempty"`
	Status string `json:"status"`
}

type Execution struct {
	Mode          string   `json:"mode"`
	Network       string   `json:"network"`
	MutatesTarget bool     `json:"mutates_target"`
	Reads         []string `json:"reads,omitempty"`
	Writes        []string `json:"writes,omitempty"`
}

type Privacy struct {
	ContainsSourceSnippets bool `json:"contains_source_snippets"`
	ContainsSecretValues   bool `json:"contains_secret_values"`
	RedactionRequired      bool `json:"redaction_required"`
}

type Evidence struct {
	DefaultState  string            `json:"default_state"`
	Source        string            `json:"source"`
	Limitations   []string          `json:"limitations"`
	ConfidenceMap map[string]string `json:"confidence_map,omitempty"`
}

type Command struct {
	Label      string   `json:"label"`
	Executable string   `json:"executable"`
	Args       []string `json:"args"`
	OutputPath string   `json:"output_path"`
}

type Result struct {
	Path     string
	Contract Contract
}

var allowedFamilies = map[string]bool{
	"duplication":         true,
	"sbom":                true,
	"configuration":       true,
	"service-catalog":     true,
	"api-contract":        true,
	"architecture-model":  true,
	"code-index":          true,
	"dependency-metadata": true,
}

var allowedOutputKinds = map[string]bool{
	"duplication":        true,
	"sbom":               true,
	"configuration":      true,
	"contract-surface":   true,
	"service-catalog":    true,
	"architecture-model": true,
	"code-index":         true,
	"dependency":         true,
}

var allowedLicenseStatuses = map[string]bool{
	"approved":     true,
	"needs_review": true,
	"unknown":      true,
}

var allowedModes = map[string]bool{
	"import-only":   true,
	"local-command": true,
	"manual-export": true,
}

var allowedNetwork = map[string]bool{
	"none":     true,
	"optional": true,
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

func ValidateFile(path string) (Result, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return Result{}, fmt.Errorf("read adapter contract: %w", err)
	}
	var contract Contract
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&contract); err != nil {
		return Result{}, fmt.Errorf("parse adapter contract: %w", err)
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		return Result{}, fmt.Errorf("parse adapter contract: trailing JSON content")
	}
	if err := Validate(contract); err != nil {
		return Result{}, err
	}
	return Result{Path: path, Contract: contract}, nil
}

func Validate(contract Contract) error {
	var problems []string
	if contract.SchemaVersion != SchemaVersion {
		problems = append(problems, fmt.Sprintf("schema_version must be %q", SchemaVersion))
	}
	if contract.ID == "" {
		problems = append(problems, "id is required")
	}
	if contract.Tool.Name == "" {
		problems = append(problems, "tool.name is required")
	}
	if !allowedFamilies[contract.Family] {
		problems = append(problems, "family is unsupported")
	}
	if !allowedOutputKinds[contract.OutputKind] {
		problems = append(problems, "output_kind is unsupported")
	}
	if contract.License.ID == "" {
		problems = append(problems, "license.id is required")
	}
	if !allowedLicenseStatuses[contract.License.Status] {
		problems = append(problems, "license.status is unsupported")
	}
	if !allowedModes[contract.Execution.Mode] {
		problems = append(problems, "execution.mode is unsupported")
	}
	if !allowedNetwork[contract.Execution.Network] {
		problems = append(problems, "execution.network must be none or optional")
	}
	if contract.Execution.MutatesTarget {
		problems = append(problems, "execution.mutates_target must be false")
	}
	if contract.Privacy.ContainsSecretValues && !contract.Privacy.RedactionRequired {
		problems = append(problems, "privacy.redaction_required must be true when secret values may be present")
	}
	if !allowedEvidenceStates[contract.Evidence.DefaultState] {
		problems = append(problems, "evidence.default_state is unsupported")
	}
	if contract.Evidence.Source == "" {
		problems = append(problems, "evidence.source is required")
	}
	validateConfidenceMap(contract.Evidence.ConfidenceMap, &problems)
	if len(contract.Limitations) == 0 {
		problems = append(problems, "limitations must not be empty")
	}
	for i, command := range contract.Commands {
		if command.Label == "" || command.Executable == "" || command.OutputPath == "" {
			problems = append(problems, fmt.Sprintf("commands[%d] requires label, executable, and output_path", i))
		}
	}
	if len(problems) > 0 {
		return errors.New("invalid adapter contract: " + joinProblems(problems))
	}
	return nil
}

func validateConfidenceMap(confidenceMap map[string]string, problems *[]string) {
	for producerState, portolanState := range confidenceMap {
		normalizedProducerState := strings.ToUpper(strings.TrimSpace(producerState))
		if normalizedProducerState == "" {
			*problems = append(*problems, "evidence.confidence_map keys must not be empty")
			continue
		}
		if !allowedEvidenceStates[portolanState] {
			*problems = append(*problems, fmt.Sprintf("evidence.confidence_map.%s maps to unsupported evidence state", normalizedProducerState))
			continue
		}
		if portolanState == "source-visible" || portolanState == "runtime-visible" {
			*problems = append(*problems, fmt.Sprintf("evidence.confidence_map.%s must not map to source-visible or runtime-visible without Portolan source/runtime inspection", normalizedProducerState))
			continue
		}
		if (normalizedProducerState == "INFERRED" || normalizedProducerState == "AMBIGUOUS") && portolanState == "metadata-visible" {
			*problems = append(*problems, fmt.Sprintf("evidence.confidence_map.%s must remain weak evidence", normalizedProducerState))
		}
	}
}

func joinProblems(problems []string) string {
	var out string
	for i, problem := range problems {
		if i > 0 {
			out += "; "
		}
		out += problem
	}
	return out
}
