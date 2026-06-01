package selection

import "testing"

func TestValidateAcceptsSymbolIndexToolOutput(t *testing.T) {
	sel := Selection{
		SchemaVersion: SchemaVersion,
		ToolOutputs: []ToolOutput{{
			ID:   "symbols",
			Kind: "symbol-index",
			Tool: "fixture-symbol-index",
			Path: "symbols.json",
		}},
	}

	if err := sel.Validate(); err != nil {
		t.Fatalf("Validate() error = %v, want nil", err)
	}
}

func TestValidateRejectsUnsupportedToolOutputKind(t *testing.T) {
	sel := Selection{
		SchemaVersion: SchemaVersion,
		ToolOutputs: []ToolOutput{{
			ID:   "unsupported",
			Kind: "made-up-index",
			Tool: "fixture",
			Path: "tool-output.json",
		}},
	}

	err := sel.Validate()
	if err == nil {
		t.Fatalf("Validate() error = nil, want unsupported tool output kind")
	}
	if got := err.Error(); got != `tool output "unsupported" kind "made-up-index" is not supported` {
		t.Fatalf("Validate() error = %q", got)
	}
}
