package maprun

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/fcon-tech/portolan/internal/graph"
	"github.com/fcon-tech/portolan/internal/selection"
)

func writeSymbolIndexExport(t *testing.T, path string, v interface{}) {
	t.Helper()
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		t.Fatal(err)
	}
}

func setupSymbolRefLandscape(t *testing.T) (string, []selection.Target) {
	t.Helper()
	root := t.TempDir()
	repos := []selection.Target{
		{ID: "repo-a", Kind: "repository", Path: filepath.Join(root, "repos", "repo-a")},
		{ID: "repo-b", Kind: "repository", Path: filepath.Join(root, "repos", "repo-b")},
	}
	for _, repo := range repos {
		if err := os.MkdirAll(filepath.Join(repo.Path, ".git"), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(repo.Path, "main.go"), []byte("package main\n"), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return root, repos
}

func exportPath(root string) string {
	return filepath.Join(root, symbolIndexDir, "export.json")
}

func TestImportSymbolReferencesCrossRepo(t *testing.T) {
	root, repos := setupSymbolRefLandscape(t)
	writeSymbolIndexExport(t, exportPath(root), map[string]interface{}{
		"producer": "test-scip",
		"documents": []map[string]interface{}{
			{
				"path":     "repo-a/src/app.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym someFunc()", "name": "someFunc", "kind": "function", "role": "reference", "range": "1:1-1:10"},
				},
			},
			{
				"path":     "repo-b/src/lib.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym someFunc()", "name": "someFunc", "kind": "function", "role": "definition", "range": "1:1-1:3"},
				},
			},
		},
	})

	result := importSymbolReferences(root, repos)

	if len(result.Edges) != 1 {
		t.Fatalf("edges = %d, want 1; got %#v", len(result.Edges), result.Edges)
	}
	edge := result.Edges[0]
	if edge.From != "repo-a" || edge.To != "repo-b" || edge.Kind != "references" {
		t.Fatalf("edge = {From:%s To:%s Kind:%s}, want {From:repo-a To:repo-b Kind:references}", edge.From, edge.To, edge.Kind)
	}
	if edge.Evidence.State != graph.MetadataVisible {
		t.Fatalf("evidence state = %s, want metadata-visible", edge.Evidence.State)
	}
}

func TestImportSymbolReferencesOut_ofPerimeter(t *testing.T) {
	root, repos := setupSymbolRefLandscape(t)
	writeSymbolIndexExport(t, exportPath(root), map[string]interface{}{
		"producer": "test-scip",
		"documents": []map[string]interface{}{
			{
				"path":     "repo-a/src/app.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym externalFunc()", "name": "externalFunc", "kind": "function", "role": "reference", "range": "1:1-1:10"},
				},
			},
			{
				"path":     "external-lib/src/index.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym externalFunc()", "name": "externalFunc", "kind": "function", "role": "definition", "range": "1:1-1:3"},
				},
			},
		},
	})

	result := importSymbolReferences(root, repos)

	if len(result.Edges) != 1 {
		t.Fatalf("edges = %d, want 1; got %#v", len(result.Edges), result.Edges)
	}
	edge := result.Edges[0]
	if edge.From != "repo-a" || edge.Kind != "references" {
		t.Fatalf("edge = {From:%s To:%s Kind:%s}, want From:repo-a Kind:references", edge.From, edge.To, edge.Kind)
	}
	if !strings.HasPrefix(edge.To, "external:symbol-ref:") {
		t.Fatalf("edge.To = %s, want external:symbol-ref:*", edge.To)
	}
	found := false
	for _, node := range result.Nodes {
		if node.ID == edge.To && node.Kind == "external" {
			found = true
			if node.Evidence.State != graph.MetadataVisible {
				t.Fatalf("external node evidence = %s, want metadata-visible", node.Evidence.State)
			}
		}
	}
	if !found {
		t.Fatalf("external node %s not found in nodes %#v", edge.To, result.Nodes)
	}
}

func TestImportSymbolReferencesUnresolvedRecorded(t *testing.T) {
	root, repos := setupSymbolRefLandscape(t)
	writeSymbolIndexExport(t, exportPath(root), map[string]interface{}{
		"producer": "test-scip",
		"documents": []map[string]interface{}{
			{
				"path":     "repo-a/src/app.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym missing()", "name": "missing", "kind": "function", "role": "reference", "range": "1:1-1:10"},
				},
			},
		},
	})

	result := importSymbolReferences(root, repos)

	if len(result.Edges) != 0 {
		t.Fatalf("edges = %d, want 0 (unresolved should not produce an edge)", len(result.Edges))
	}
	if len(result.Records) != 1 {
		t.Fatalf("records = %d, want 1", len(result.Records))
	}
	rec := result.Records[0]
	if rec.Status != "unknown" || rec.EvidenceState != string(graph.Unknown) {
		t.Fatalf("record = {Status:%s EvidenceState:%s}, want unknown/unknown", rec.Status, rec.EvidenceState)
	}
}

func TestImportSymbolReferencesIntraRepoSkipped(t *testing.T) {
	root, repos := setupSymbolRefLandscape(t)
	writeSymbolIndexExport(t, exportPath(root), map[string]interface{}{
		"producer": "test-scip",
		"documents": []map[string]interface{}{
			{
				"path":     "repo-a/src/app.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym helper()", "name": "helper", "kind": "function", "role": "reference", "range": "1:1-1:10"},
				},
			},
			{
				"path":     "repo-a/src/utils.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym helper()", "name": "helper", "kind": "function", "role": "definition", "range": "1:1-1:3"},
				},
			},
		},
	})

	result := importSymbolReferences(root, repos)

	if len(result.Edges) != 0 {
		t.Fatalf("edges = %d, want 0 (intra-repo references should not be lifted)", len(result.Edges))
	}
}

func TestImportSymbolReferencesNoExports(t *testing.T) {
	root, repos := setupSymbolRefLandscape(t)

	result := importSymbolReferences(root, repos)

	if len(result.Edges) != 0 || len(result.Nodes) != 0 || len(result.Findings) != 0 || len(result.Records) != 0 {
		t.Fatalf("expected empty result with no exports, got edges=%d nodes=%d findings=%d records=%d",
			len(result.Edges), len(result.Nodes), len(result.Findings), len(result.Records))
	}
}

func TestImportSymbolReferencesDedup(t *testing.T) {
	root, repos := setupSymbolRefLandscape(t)
	writeSymbolIndexExport(t, exportPath(root), map[string]interface{}{
		"producer": "test-scip",
		"documents": []map[string]interface{}{
			{
				"path":     "repo-a/src/app.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym func1()", "name": "func1", "kind": "function", "role": "reference", "range": "1:1-1:10"},
					{"id": "sym func2()", "name": "func2", "kind": "function", "role": "reference", "range": "2:1-2:10"},
				},
			},
			{
				"path":     "repo-b/src/lib.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym func1()", "name": "func1", "kind": "function", "role": "definition", "range": "1:1-1:3"},
					{"id": "sym func2()", "name": "func2", "kind": "function", "role": "definition", "range": "2:1-2:3"},
				},
			},
		},
	})

	result := importSymbolReferences(root, repos)

	if len(result.Edges) != 1 {
		t.Fatalf("edges = %d, want 1 (deduped repo->repo references)", len(result.Edges))
	}
}

func TestRunMapSymbolReferencesReachGraph(t *testing.T) {
	root, repos := setupSymbolRefLandscape(t)
	writeSymbolIndexExport(t, exportPath(root), map[string]interface{}{
		"producer": "test-scip",
		"documents": []map[string]interface{}{
			{
				"path":     "repo-a/src/app.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym someFunc()", "name": "someFunc", "kind": "function", "role": "reference", "range": "1:1-1:10"},
				},
			},
			{
				"path":     "repo-b/src/lib.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym someFunc()", "name": "someFunc", "kind": "function", "role": "definition", "range": "1:1-1:3"},
				},
			},
		},
	})

	out := filepath.Join(root, ".portolan", "run")
	result, err := Run(Options{RootPath: root, OutputPath: out, Force: true})
	if err != nil {
		t.Fatalf("Run: %v", err)
	}

	data, err := os.ReadFile(result.Artifacts.Graph)
	if err != nil {
		t.Fatalf("read graph.json: %v", err)
	}
	var g graph.Graph
	if err := json.Unmarshal(data, &g); err != nil {
		t.Fatalf("unmarshal graph.json: %v", err)
	}

	foundRef := false
	for _, edge := range g.Edges {
		if edge.Kind == "references" && edge.From == repos[0].ID && edge.To == repos[1].ID {
			foundRef = true
			if edge.Evidence.State != graph.MetadataVisible {
				t.Fatalf("references edge evidence = %s, want metadata-visible", edge.Evidence.State)
			}
		}
	}
	if !foundRef {
		t.Fatalf("graph.json has no references edge from %s to %s; edges = %#v", repos[0].ID, repos[1].ID, g.Edges)
	}

	data, err = os.ReadFile(result.Artifacts.Findings)
	if err != nil {
		t.Fatalf("read findings.jsonl: %v", err)
	}
	if !strings.Contains(string(data), "finding-symbol-references-resolved") {
		t.Fatalf("findings.jsonl does not contain symbol-references-resolved finding")
	}
}

func TestRunMapSymbolReferencesOutOfPerimeter(t *testing.T) {
	root, repos := setupSymbolRefLandscape(t)
	writeSymbolIndexExport(t, exportPath(root), map[string]interface{}{
		"producer": "test-scip",
		"documents": []map[string]interface{}{
			{
				"path":     "repo-a/src/app.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym extLib()", "name": "extLib", "kind": "function", "role": "reference", "range": "1:1-1:10"},
				},
			},
			{
				"path":     "external-pkg/src/index.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym extLib()", "name": "extLib", "kind": "function", "role": "definition", "range": "1:1-1:3"},
				},
			},
		},
	})

	out := filepath.Join(root, ".portolan", "run")
	result, err := Run(Options{RootPath: root, OutputPath: out, Force: true})
	if err != nil {
		t.Fatalf("Run: %v", err)
	}

	data, err := os.ReadFile(result.Artifacts.Graph)
	if err != nil {
		t.Fatalf("read graph.json: %v", err)
	}
	var g graph.Graph
	if err := json.Unmarshal(data, &g); err != nil {
		t.Fatalf("unmarshal graph.json: %v", err)
	}

	foundExternal := false
	for _, node := range g.Nodes {
		if node.Kind == "external" && strings.HasPrefix(node.ID, "external:symbol-ref:") {
			foundExternal = true
			if node.Evidence.State != graph.MetadataVisible {
				t.Fatalf("external node evidence = %s, want metadata-visible", node.Evidence.State)
			}
		}
	}
	if !foundExternal {
		t.Fatalf("graph.json has no external node for out-of-perimeter reference; nodes = %d", len(g.Nodes))
	}

	foundExtEdge := false
	for _, edge := range g.Edges {
		if edge.Kind == "references" && edge.From == repos[0].ID && strings.HasPrefix(edge.To, "external:symbol-ref:") {
			foundExtEdge = true
		}
	}
	if !foundExtEdge {
		t.Fatalf("graph.json has no references edge from %s to external node", repos[0].ID)
	}
}

func TestImportSymbolReferencesMalformedExport(t *testing.T) {
	root, repos := setupSymbolRefLandscape(t)
	writeSymbolIndexExport(t, exportPath(root), `{not valid json`)

	result := importSymbolReferences(root, repos)

	if len(result.Edges) != 0 {
		t.Fatalf("edges = %d, want 0 for malformed export", len(result.Edges))
	}
	foundCannotVerify := false
	for _, rec := range result.Records {
		if rec.Status == "cannot_verify" && rec.EvidenceState == string(graph.CannotVerify) {
			foundCannotVerify = true
		}
	}
	if !foundCannotVerify {
		t.Fatalf("expected a cannot_verify coverage record for malformed export; got %#v", result.Records)
	}
}

func TestImportSymbolReferencesUnmappedSourceDoc(t *testing.T) {
	root, repos := setupSymbolRefLandscape(t)
	writeSymbolIndexExport(t, exportPath(root), map[string]interface{}{
		"producer": "test-scip",
		"documents": []map[string]interface{}{
			{
				"path":     "unknown-repo/src/app.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym foo()", "name": "foo", "kind": "function", "role": "reference", "range": "1:1-1:10"},
				},
			},
			{
				"path":     "repo-b/src/lib.js",
				"language": "javascript",
				"symbols": []map[string]interface{}{
					{"id": "sym foo()", "name": "foo", "kind": "function", "role": "definition", "range": "1:1-1:3"},
				},
			},
		},
	})

	result := importSymbolReferences(root, repos)

	if len(result.Edges) != 0 {
		t.Fatalf("edges = %d, want 0 (source doc not in any repo)", len(result.Edges))
	}
	foundUnmapped := false
	for _, rec := range result.Records {
		if strings.Contains(rec.ID, "unmapped-src") && rec.Status == "cannot_verify" {
			foundUnmapped = true
		}
	}
	if !foundUnmapped {
		t.Fatalf("expected a cannot_verify record for unmapped source doc; got %#v", result.Records)
	}
}
