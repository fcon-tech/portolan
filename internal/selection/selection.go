package selection

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

const SchemaVersion = "0.1.0"

type Selection struct {
	SchemaVersion string        `json:"schema_version"`
	Targets       []Target      `json:"targets"`
	Metadata      []InputSource `json:"metadata"`
	Runtime       []InputSource `json:"runtime"`
	Claims        []ClaimSource `json:"claims"`
	BlackBoxes    []BlackBox    `json:"black_boxes"`
	ToolOutputs   []ToolOutput  `json:"tool_outputs"`

	CorpusManifest    string `json:"corpus_manifest"`
	RequireFullCorpus bool   `json:"require_full_corpus"`
}

type Target struct {
	ID   string `json:"id"`
	Kind string `json:"kind"`
	Path string `json:"path"`
}

type ClaimSource struct {
	ID   string `json:"id"`
	Path string `json:"path"`
}

type InputSource struct {
	ID   string `json:"id"`
	Path string `json:"path"`
}

type ToolOutput struct {
	ID          string   `json:"id"`
	Kind        string   `json:"kind"`
	Tool        string   `json:"tool"`
	Version     string   `json:"version"`
	Path        string   `json:"path"`
	Repository  string   `json:"repository"`
	Limitations []string `json:"limitations"`
}

type BlackBox struct {
	ID       string        `json:"id"`
	Kind     string        `json:"kind"`
	Label    string        `json:"label"`
	Metadata []InputSource `json:"metadata"`
	Runtime  []InputSource `json:"runtime"`
	Claims   []ClaimSource `json:"claims"`
	Expected []string      `json:"expected"`

	Repository string `json:"repository"`
	Path       string `json:"path"`
	SourceRoot string `json:"source_root"`
	Telemetry  string `json:"telemetry"`
}

func Load(path string) (Selection, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return Selection{}, fmt.Errorf("read selection: %w", err)
	}

	var sel Selection
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&sel); err != nil {
		return Selection{}, fmt.Errorf("parse selection: %w", err)
	}
	if err := sel.Validate(); err != nil {
		return Selection{}, err
	}

	return sel, nil
}

func (sel Selection) Validate() error {
	if sel.SchemaVersion != SchemaVersion {
		return fmt.Errorf("selection schema_version must be %q", SchemaVersion)
	}

	seen := map[string]struct{}{}
	for _, target := range sel.Targets {
		if target.ID == "" {
			return fmt.Errorf("target id is required")
		}
		if !validTargetKind(target.Kind) {
			return fmt.Errorf("target %q kind %q is not supported", target.ID, target.Kind)
		}
		if target.Path == "" {
			return fmt.Errorf("target %q path is required", target.ID)
		}
		if isURLLikePath(target.Path) {
			return fmt.Errorf("target %q path must be local", target.ID)
		}
		if _, ok := seen[target.ID]; ok {
			return fmt.Errorf("duplicate target id %q", target.ID)
		}
		seen[target.ID] = struct{}{}
	}
	for _, source := range sel.Metadata {
		if err := validateInputSource("metadata source", source, seen); err != nil {
			return err
		}
	}
	for _, source := range sel.Runtime {
		if err := validateInputSource("runtime source", source, seen); err != nil {
			return err
		}
	}
	for _, claim := range sel.Claims {
		if err := validateClaimSource(claim, seen); err != nil {
			return err
		}
	}
	for _, target := range sel.BlackBoxes {
		if target.ID == "" {
			return fmt.Errorf("black-box id is required")
		}
		if !validBlackBoxKind(target.Kind) {
			return fmt.Errorf("black-box %q kind %q is not supported", target.ID, target.Kind)
		}
		if target.Repository != "" || target.Path != "" || target.SourceRoot != "" {
			return fmt.Errorf("black-box %q must not declare repository or source paths", target.ID)
		}
		if target.Telemetry != "" {
			return fmt.Errorf("black-box %q live telemetry is not supported", target.ID)
		}
		if _, ok := seen[target.ID]; ok {
			return fmt.Errorf("duplicate selection id %q", target.ID)
		}
		seen[target.ID] = struct{}{}
		for _, source := range target.Metadata {
			if err := validateInputSource("black-box metadata source", source, seen); err != nil {
				return err
			}
		}
		for _, source := range target.Runtime {
			if err := validateInputSource("black-box runtime source", source, seen); err != nil {
				return err
			}
		}
		for _, claim := range target.Claims {
			if err := validateClaimSource(claim, seen); err != nil {
				return err
			}
		}
		for _, expected := range target.Expected {
			if !validExpectedField(expected) {
				return fmt.Errorf("black-box %q expected field %q is not supported", target.ID, expected)
			}
		}
	}
	for _, source := range sel.ToolOutputs {
		if source.ID == "" {
			return fmt.Errorf("tool output id is required")
		}
		if !validToolOutputKind(source.Kind) {
			return fmt.Errorf("tool output %q kind %q is not supported", source.ID, source.Kind)
		}
		if source.Tool == "" {
			return fmt.Errorf("tool output %q tool is required", source.ID)
		}
		if source.Path == "" {
			return fmt.Errorf("tool output %q path is required", source.ID)
		}
		if isURLLikePath(source.Path) {
			return fmt.Errorf("tool output %q path must be local", source.ID)
		}
		if _, ok := seen[source.ID]; ok {
			return fmt.Errorf("duplicate selection id %q", source.ID)
		}
		seen[source.ID] = struct{}{}
	}
	if sel.CorpusManifest != "" && isURLLikePath(sel.CorpusManifest) {
		return fmt.Errorf("corpus manifest path must be local")
	}

	return nil
}

func validateClaimSource(source ClaimSource, seen map[string]struct{}) error {
	if source.ID == "" {
		return fmt.Errorf("claim source id is required")
	}
	if source.Path == "" {
		return fmt.Errorf("claim source %q path is required", source.ID)
	}
	if isURLLikePath(source.Path) {
		return fmt.Errorf("claim source %q path must be local", source.ID)
	}
	if _, ok := seen[source.ID]; ok {
		return fmt.Errorf("duplicate graph id %q", source.ID)
	}
	seen[source.ID] = struct{}{}
	return nil
}

func validateInputSource(label string, source InputSource, seen map[string]struct{}) error {
	if source.ID == "" {
		return fmt.Errorf("%s id is required", label)
	}
	if source.Path == "" {
		return fmt.Errorf("%s %q path is required", label, source.ID)
	}
	if isURLLikePath(source.Path) {
		return fmt.Errorf("%s %q path must be local", label, source.ID)
	}
	if _, ok := seen[source.ID]; ok {
		return fmt.Errorf("duplicate selection id %q", source.ID)
	}
	seen[source.ID] = struct{}{}
	return nil
}

func isURLLikePath(path string) bool {
	lower := strings.ToLower(path)
	for _, prefix := range []string{"http://", "https://", "ssh://", "git://", "file://"} {
		if strings.HasPrefix(lower, prefix) {
			return true
		}
	}
	return false
}

func validTargetKind(kind string) bool {
	switch kind {
	case "repository", "service", "package", "runtime", "team", "claim", "unknown":
		return true
	default:
		return false
	}
}

func validBlackBoxKind(kind string) bool {
	switch kind {
	case "service", "runtime":
		return true
	default:
		return false
	}
}

func validExpectedField(field string) bool {
	switch field {
	case "owner", "dependencies", "runtime-endpoints":
		return true
	default:
		return false
	}
}

func validToolOutputKind(kind string) bool {
	switch kind {
	case "sbom", "dependency", "language-inventory", "code-size", "duplication", "configuration", "contract-surface":
		return true
	default:
		return false
	}
}
