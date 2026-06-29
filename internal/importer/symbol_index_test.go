package importer

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/fcon-tech/portolan/internal/graph"
)

func writeTestFile(t *testing.T, dir, name, content string) string {
	t.Helper()
	if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
	return filepath.Join(dir, name)
}

func TestParseSymbolIndexValidExport(t *testing.T) {
	dir := t.TempDir()
	path := writeTestFile(t, dir, "symbols.json", `{
		"producer": "test",
		"documents": [
			{
				"path": "a.js",
				"language": "javascript",
				"symbols": [
					{"id": "sym foo()", "name": "foo", "kind": "function", "role": "reference", "range": "1:1-1:5"}
				]
			},
			{
				"path": "b.js",
				"language": "javascript",
				"symbols": [
					{"id": "sym foo()", "name": "foo", "kind": "function", "role": "definition", "range": "1:1-1:3"}
				]
			}
		]
	}`)

	g, err := ParseSymbolIndex(path)
	if err != nil {
		t.Fatalf("ParseSymbolIndex error: %v", err)
	}
	foundRef := false
	for _, edge := range g.Edges {
		if edge.Kind == "references" {
			foundRef = true
		}
	}
	if !foundRef {
		t.Fatalf("expected a references edge in graph %#v", g.Edges)
	}
}

func TestParseSymbolIndexMalformedJSON(t *testing.T) {
	dir := t.TempDir()
	path := writeTestFile(t, dir, "bad.json", `{not valid json`)

	g, err := ParseSymbolIndex(path)
	if err != nil {
		t.Fatalf("ParseSymbolIndex should not return an error on malformed JSON; got %v", err)
	}
	if !isCannotVerifySource(g) {
		t.Fatalf("expected a cannot_verify source node in graph with %d nodes", len(g.Nodes))
	}
}

func TestParseSymbolIndexEmptyDocuments(t *testing.T) {
	dir := t.TempDir()
	path := writeTestFile(t, dir, "empty.json", `{"producer":"test","documents":[]}`)

	g, err := ParseSymbolIndex(path)
	if err != nil {
		t.Fatalf("ParseSymbolIndex error: %v", err)
	}
	if !isCannotVerifySource(g) {
		t.Fatalf("expected a cannot_verify source node for empty documents")
	}
}

func TestParseSymbolIndexEmptyPath(t *testing.T) {
	_, err := ParseSymbolIndex("")
	if err == nil {
		t.Fatal("expected error for empty path")
	}
}

func isCannotVerifySource(g graph.Graph) bool {
	for _, node := range g.Nodes {
		if node.ID == "symbol-index:source" && node.Evidence.State == graph.CannotVerify {
			return true
		}
	}
	return false
}
