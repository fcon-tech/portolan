package selection

import (
	"encoding/json"
	"fmt"
	"os"
)

const SchemaVersion = "0.1.0"

type Selection struct {
	SchemaVersion string        `json:"schema_version"`
	Targets       []Target      `json:"targets"`
	Claims        []ClaimSource `json:"claims"`
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

func Load(path string) (Selection, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return Selection{}, fmt.Errorf("read selection: %w", err)
	}

	var sel Selection
	if err := json.Unmarshal(data, &sel); err != nil {
		return Selection{}, fmt.Errorf("parse selection: %w", err)
	}
	if sel.SchemaVersion != SchemaVersion {
		return Selection{}, fmt.Errorf("selection schema_version must be %q", SchemaVersion)
	}

	seen := map[string]struct{}{}
	for _, target := range sel.Targets {
		if target.ID == "" {
			return Selection{}, fmt.Errorf("target id is required")
		}
		if !validTargetKind(target.Kind) {
			return Selection{}, fmt.Errorf("target %q kind %q is not supported", target.ID, target.Kind)
		}
		if target.Path == "" {
			return Selection{}, fmt.Errorf("target %q path is required", target.ID)
		}
		if _, ok := seen[target.ID]; ok {
			return Selection{}, fmt.Errorf("duplicate target id %q", target.ID)
		}
		seen[target.ID] = struct{}{}
	}
	for _, claim := range sel.Claims {
		if claim.ID == "" {
			return Selection{}, fmt.Errorf("claim source id is required")
		}
		if claim.Path == "" {
			return Selection{}, fmt.Errorf("claim source %q path is required", claim.ID)
		}
		if _, ok := seen[claim.ID]; ok {
			return Selection{}, fmt.Errorf("duplicate graph id %q", claim.ID)
		}
		seen[claim.ID] = struct{}{}
	}

	return sel, nil
}

func validTargetKind(kind string) bool {
	switch kind {
	case "repository", "service", "package", "runtime", "team", "claim", "unknown":
		return true
	default:
		return false
	}
}
