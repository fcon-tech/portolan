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
