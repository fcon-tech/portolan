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

func TestReadFindingsAcceptsLongJSONLLine(t *testing.T) {
	path := filepath.Join(t.TempDir(), "findings.jsonl")
	longSummary := strings.Repeat("large evidence cluster ", 5000)
	finding := Finding{
		ID:             "finding-large-line",
		Kind:           "technical-debt",
		Summary:        longSummary,
		Severity:       "info",
		EvidenceState:  "source-visible",
		EvidenceSource: "findings.jsonl",
		Confidence:     0.7,
		Status:         "open",
	}
	data, err := json.Marshal(finding)
	if err != nil {
		t.Fatal(err)
	}
	if len(data) <= 64*1024 {
		t.Fatalf("test fixture line = %d bytes, want > 64 KiB", len(data))
	}
	if err := os.WriteFile(path, append(data, '\n'), 0o644); err != nil {
		t.Fatal(err)
	}

	findings, err := readFindings(path)
	if err != nil {
		t.Fatal(err)
	}
	if len(findings) != 1 {
		t.Fatalf("findings = %d, want 1", len(findings))
	}
	if findings[0].Summary != longSummary {
		t.Fatalf("summary length = %d, want %d", len(findings[0].Summary), len(longSummary))
	}
}

func TestNormalizeDependencyToolOutputCreatesRelationshipEvidence(t *testing.T) {
	path := filepath.Join(t.TempDir(), "composer-cyclonedx.json")
	if err := os.WriteFile(path, []byte(`{
		"bomFormat":"CycloneDX",
		"components":[
			{"bom-ref":"php-api","type":"application","name":"acme/api","version":"1.0.0"},
			{"bom-ref":"symfony-console","type":"library","name":"symfony/console","version":"7.0.0"}
		],
		"dependencies":[{"ref":"php-api","dependsOn":["symfony-console"]}]
	}`), 0o644); err != nil {
		t.Fatal(err)
	}

	nodes, edges, findings := normalizeToolOutput(selection.ToolOutput{
		ID:         "composer-deps",
		Kind:       "dependency",
		Tool:       "cyclonedx-composer",
		Path:       path,
		Repository: "php-api",
	})

	if node := maprunNode(nodes, "composer-deps:component:php-api"); node == nil {
		t.Fatalf("nodes = %#v, want source component node", nodes)
	}
	edge := maprunEdge(edges, "composer-deps:component:php-api", "composer-deps:component:symfony-console", "depends-on")
	if edge == nil {
		t.Fatalf("edges = %#v, want dependency edge", edges)
	}
	if edge.Evidence.State != graph.MetadataVisible || edge.Evidence.Source != path {
		t.Fatalf("edge evidence = %#v, want metadata-visible source ref", edge.Evidence)
	}
	if len(findings) != 1 {
		t.Fatalf("findings = %d, want 1", len(findings))
	}
	finding := findings[0]
	if finding.Kind != "relationships" || finding.Status != "observed" || finding.EvidenceState != string(graph.MetadataVisible) {
		t.Fatalf("finding = %#v, want observed relationship finding", finding)
	}
	for _, want := range []string{"dependency evidence", "repository php-api", "2 components", "1 dependency records"} {
		if !strings.Contains(finding.Summary, want) {
			t.Fatalf("summary = %q, want %q", finding.Summary, want)
		}
	}
	if strings.Contains(strings.ToLower(finding.Summary), "runtime") {
		t.Fatalf("summary = %q, must not imply runtime topology", finding.Summary)
	}
}

func TestNormalizeDependencyToolOutputMarksMissingRefsCannotVerify(t *testing.T) {
	path := filepath.Join(t.TempDir(), "cyclonedx-missing-ref.json")
	if err := os.WriteFile(path, []byte(`{
		"bomFormat":"CycloneDX",
		"components":[{"bom-ref":"php-api","type":"application","name":"acme/api"}],
		"dependencies":[{"ref":"php-api","dependsOn":["missing-library"]}]
	}`), 0o644); err != nil {
		t.Fatal(err)
	}

	nodes, edges, findings := normalizeToolOutput(selection.ToolOutput{
		ID:   "deps",
		Kind: "dependency",
		Tool: "cyclonedx",
		Path: path,
	})

	missing := maprunNode(nodes, "deps:component:missing-library")
	if missing == nil || missing.Evidence.State != graph.CannotVerify {
		t.Fatalf("missing component node = %#v, want cannot_verify", missing)
	}
	edge := maprunEdge(edges, "deps:component:php-api", "deps:component:missing-library", "depends-on")
	if edge == nil || edge.Evidence.State != graph.CannotVerify || !strings.Contains(edge.Evidence.Reason, "dependency ref was not present") {
		t.Fatalf("dependency edge = %#v, want cannot_verify missing-ref edge", edge)
	}
	if len(findings) != 1 || findings[0].Status != "observed" {
		t.Fatalf("findings = %#v, want producer finding retained as observed with degraded edge", findings)
	}
}

func TestNormalizeDependencyToolOutputCannotVerifyMalformedOrOversized(t *testing.T) {
	t.Run("malformed", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "bad-cyclonedx.json")
		if err := os.WriteFile(path, []byte(`{"bomFormat":"CycloneDX"`), 0o644); err != nil {
			t.Fatal(err)
		}

		nodes, edges, findings := normalizeToolOutput(selection.ToolOutput{
			ID:   "bad-deps",
			Kind: "dependency",
			Tool: "cyclonedx",
			Path: path,
		})

		if len(edges) != 0 {
			t.Fatalf("edges = %#v, want no assessed relationships", edges)
		}
		if nodes[0].Evidence.State != graph.CannotVerify {
			t.Fatalf("source evidence = %#v, want cannot_verify", nodes[0].Evidence)
		}
		if findings[0].Status != "cannot_verify" || findings[0].Confidence != 0 {
			t.Fatalf("finding = %#v, want cannot_verify with zero confidence", findings[0])
		}
		if !strings.Contains(strings.ToLower(findings[0].Summary), "malformed") {
			t.Fatalf("summary = %q, want malformed", findings[0].Summary)
		}
	})

	t.Run("oversized", func(t *testing.T) {
		oldLimit := maxSelectedToolOutputBytes
		maxSelectedToolOutputBytes = 32
		t.Cleanup(func() { maxSelectedToolOutputBytes = oldLimit })
		path := filepath.Join(t.TempDir(), "large-cyclonedx.json")
		if err := os.WriteFile(path, []byte(strings.Repeat(" ", 33)), 0o644); err != nil {
			t.Fatal(err)
		}

		nodes, edges, findings := normalizeToolOutput(selection.ToolOutput{
			ID:   "large-deps",
			Kind: "dependency",
			Tool: "cyclonedx",
			Path: path,
		})

		if len(edges) != 0 {
			t.Fatalf("edges = %#v, want no assessed relationships", edges)
		}
		if nodes[0].Evidence.State != graph.CannotVerify {
			t.Fatalf("source evidence = %#v, want cannot_verify", nodes[0].Evidence)
		}
		if findings[0].Status != "cannot_verify" || !strings.Contains(findings[0].Summary, "exceeds") {
			t.Fatalf("finding = %#v, want oversized cannot_verify", findings[0])
		}
	})
}

func TestNormalizeSymbolIndexToolOutputCreatesBoundedRelationshipEvidence(t *testing.T) {
	path := filepath.Join(t.TempDir(), "symbols.json")
	if err := os.WriteFile(path, []byte(`{
		"producer":"fixture-symbol-index",
		"documents":[
			{
				"path":"src/Controller.php",
				"language":"php",
				"symbols":[{"id":"php:App\\Controller","name":"App\\Controller","kind":"class","range":"1:1-8:1"}]
			},
			{
				"path":"src/main/scala/App.scala",
				"language":"scala",
				"symbols":[{"id":"jvm:com.acme.App","name":"com.acme.App","kind":"object","range":"1:1-12:1"}]
			}
		]
	}`), 0o644); err != nil {
		t.Fatal(err)
	}

	nodes, edges, findings := normalizeToolOutput(selection.ToolOutput{
		ID:         "mixed-symbols",
		Kind:       "symbol-index",
		Tool:       "fixture-symbol-index",
		Path:       path,
		Repository: "mixed-estate",
	})

	for _, id := range []string{
		"mixed-symbols:document:src-controller-php",
		"mixed-symbols:document:src-main-scala-app-scala",
		"mixed-symbols:symbol:php-app-controller",
		"mixed-symbols:symbol:jvm-com-acme-app",
	} {
		if node := maprunNode(nodes, id); node == nil || node.Evidence.State != graph.MetadataVisible {
			t.Fatalf("node %s = %#v, want metadata-visible", id, node)
		}
	}
	for _, edge := range edges {
		if edge.Kind != "owns" {
			t.Fatalf("edge = %#v, want only owns relationships from symbol-index output", edge)
		}
		if edge.Evidence.State != graph.MetadataVisible {
			t.Fatalf("edge evidence = %#v, want metadata-visible symbol evidence", edge.Evidence)
		}
	}
	docEdge := maprunEdge(edges, "mixed-symbols", "mixed-symbols:document:src-controller-php", "owns")
	if docEdge == nil || docEdge.Evidence.Reason != "symbol-index document ownership; not a complete call graph" {
		t.Fatalf("document ownership edge = %#v, want explicit non-call-graph reason", docEdge)
	}
	symbolEdge := maprunEdge(edges, "mixed-symbols:document:src-controller-php", "mixed-symbols:symbol:php-app-controller", "owns")
	if symbolEdge == nil || symbolEdge.Evidence.Reason != "symbol occurrence listed by local export; not a complete call graph" {
		t.Fatalf("symbol ownership edge = %#v, want explicit non-call-graph reason", symbolEdge)
	}
	if len(findings) != 1 || findings[0].Kind != "relationships" || findings[0].Status != "observed" {
		t.Fatalf("findings = %#v, want observed relationship finding", findings)
	}
	for _, want := range []string{"symbol-index evidence", "repository mixed-estate", "2 documents", "2 symbols", "not a complete call graph"} {
		if !strings.Contains(findings[0].Summary, want) {
			t.Fatalf("summary = %q, want %q", findings[0].Summary, want)
		}
	}
}

func TestNormalizeSymbolIndexToolOutputCannotVerifyEmptyOrTooManySymbols(t *testing.T) {
	t.Run("malformed", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "symbols.json")
		if err := os.WriteFile(path, []byte(`{"documents":[`), 0o644); err != nil {
			t.Fatal(err)
		}

		nodes, edges, findings := normalizeToolOutput(selection.ToolOutput{
			ID:   "bad-symbols",
			Kind: "symbol-index",
			Tool: "fixture",
			Path: path,
		})

		if len(edges) != 0 {
			t.Fatalf("edges = %#v, want no assessed relationships", edges)
		}
		if nodes[0].Evidence.State != graph.CannotVerify {
			t.Fatalf("source evidence = %#v, want cannot_verify", nodes[0].Evidence)
		}
		if findings[0].Status != "cannot_verify" || !strings.Contains(strings.ToLower(findings[0].Summary), "malformed") {
			t.Fatalf("finding = %#v, want malformed symbol-index cannot_verify", findings[0])
		}
	})

	t.Run("empty documents", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "symbols.json")
		if err := os.WriteFile(path, []byte(`{"producer":"fixture","documents":[]}`), 0o644); err != nil {
			t.Fatal(err)
		}

		nodes, edges, findings := normalizeToolOutput(selection.ToolOutput{
			ID:   "empty-symbols",
			Kind: "symbol-index",
			Tool: "fixture",
			Path: path,
		})

		if len(edges) != 0 {
			t.Fatalf("edges = %#v, want no assessed relationships", edges)
		}
		if nodes[0].Evidence.State != graph.CannotVerify {
			t.Fatalf("source evidence = %#v, want cannot_verify", nodes[0].Evidence)
		}
		if findings[0].Status != "cannot_verify" || !strings.Contains(findings[0].Summary, "no documents") {
			t.Fatalf("finding = %#v, want no-documents cannot_verify", findings[0])
		}
	})

	t.Run("too many symbols", func(t *testing.T) {
		oldLimit := maxSelectedSymbols
		maxSelectedSymbols = 1
		t.Cleanup(func() { maxSelectedSymbols = oldLimit })
		path := filepath.Join(t.TempDir(), "symbols.json")
		if err := os.WriteFile(path, []byte(`{
			"documents":[
				{"path":"a.php","symbols":[{"id":"php:A"},{"id":"php:B"}]}
			]
		}`), 0o644); err != nil {
			t.Fatal(err)
		}

		nodes, edges, findings := normalizeToolOutput(selection.ToolOutput{
			ID:   "large-symbols",
			Kind: "symbol-index",
			Tool: "fixture",
			Path: path,
		})

		if len(edges) != 0 {
			t.Fatalf("edges = %#v, want no assessed relationships", edges)
		}
		if nodes[0].Evidence.State != graph.CannotVerify {
			t.Fatalf("source evidence = %#v, want cannot_verify", nodes[0].Evidence)
		}
		if findings[0].Status != "cannot_verify" || !strings.Contains(findings[0].Summary, "exceeds") {
			t.Fatalf("finding = %#v, want oversized symbol cannot_verify", findings[0])
		}
	})

	t.Run("too many documents", func(t *testing.T) {
		oldLimit := maxSelectedSymbolDocuments
		maxSelectedSymbolDocuments = 1
		t.Cleanup(func() { maxSelectedSymbolDocuments = oldLimit })
		path := filepath.Join(t.TempDir(), "symbols.json")
		if err := os.WriteFile(path, []byte(`{
			"documents":[
				{"path":"a.php","symbols":[{"id":"php:A"}]},
				{"path":"b.php","symbols":[{"id":"php:B"}]}
			]
		}`), 0o644); err != nil {
			t.Fatal(err)
		}

		nodes, edges, findings := normalizeToolOutput(selection.ToolOutput{
			ID:   "large-documents",
			Kind: "symbol-index",
			Tool: "fixture",
			Path: path,
		})

		if len(edges) != 0 {
			t.Fatalf("edges = %#v, want no assessed relationships", edges)
		}
		if nodes[0].Evidence.State != graph.CannotVerify {
			t.Fatalf("source evidence = %#v, want cannot_verify", nodes[0].Evidence)
		}
		if findings[0].Status != "cannot_verify" || !strings.Contains(findings[0].Summary, "document count") || !strings.Contains(findings[0].Summary, "exceeds") {
			t.Fatalf("finding = %#v, want oversized document cannot_verify", findings[0])
		}
	})
}

func TestGraphAndFindingsForSelectionImportsTopLevelRuntimeObservation(t *testing.T) {
	path := filepath.Join(t.TempDir(), "runtime-observations.json")
	if err := os.WriteFile(path, []byte(`{
		"schema_version":"0.1.0",
		"source":"runtime/export.json",
		"observations":[
			{
				"id":"obs-api-worker",
				"observed_at":"2026-06-02T00:00:00Z",
				"from":"api",
				"to":"worker",
				"kind":"http-call",
				"coverage":"partial",
				"source":"runtime/redacted-export.json"
			}
		]
	}`), 0o644); err != nil {
		t.Fatal(err)
	}

	g, findings, warnings := graphAndFindingsForSelection(selection.Selection{
		SchemaVersion: selection.SchemaVersion,
		Runtime: []selection.InputSource{{
			ID:   "runtime-export",
			Path: path,
		}},
	})

	if len(warnings) != 0 {
		t.Fatalf("warnings = %#v, want none", warnings)
	}
	if node := maprunNode(g.Nodes, "runtime-export"); node == nil || node.Evidence.State != graph.RuntimeVisible {
		t.Fatalf("runtime input node = %#v, want runtime-visible", node)
	}
	if node := maprunNode(g.Nodes, "api"); node == nil || node.Evidence.State != graph.RuntimeVisible {
		t.Fatalf("from node = %#v, want runtime-visible api node", node)
	}
	if node := maprunNode(g.Nodes, "worker"); node == nil || node.Evidence.State != graph.RuntimeVisible {
		t.Fatalf("to node = %#v, want runtime-visible worker node", node)
	}
	edge := maprunEdge(g.Edges, "api", "worker", "observes")
	if edge == nil || edge.Evidence.State != graph.RuntimeVisible || edge.Evidence.Source != "runtime/redacted-export.json" {
		t.Fatalf("runtime edge = %#v, want runtime-visible observation edge with source", edge)
	}
	if !strings.Contains(edge.Evidence.Reason, "coverage partial") || !strings.Contains(edge.Evidence.Reason, "kind http-call") {
		t.Fatalf("runtime edge reason = %q, want observation kind and coverage", edge.Evidence.Reason)
	}
	unknown := maprunEdge(g.Edges, "runtime-export", "runtime-export:unknown:runtime-topology", "unknown")
	if unknown == nil || unknown.Evidence.State != graph.Unknown {
		t.Fatalf("unknown coverage edge = %#v, want unknown partial-coverage edge", unknown)
	}
	finding := maprunFinding(findings, "finding-runtime-runtime-export")
	if finding == nil || finding.Status != "observed" || finding.EvidenceState != string(graph.RuntimeVisible) {
		t.Fatalf("runtime finding = %#v, want observed runtime-visible finding", finding)
	}
}

func TestGraphAndFindingsForSelectionRuntimeCoverageCompleteDoesNotEmitUnknownTopology(t *testing.T) {
	path := filepath.Join(t.TempDir(), "runtime-observations.json")
	if err := os.WriteFile(path, []byte(`{
		"schema_version":"0.1.0",
		"observations":[
			{"id":"obs-api-worker","from":"api","to":"worker","coverage":"complete","source":"runtime/redacted-export.json"}
		]
	}`), 0o644); err != nil {
		t.Fatal(err)
	}

	g, _, _ := graphAndFindingsForSelection(selection.Selection{
		SchemaVersion: selection.SchemaVersion,
		Runtime: []selection.InputSource{{
			ID:   "runtime-export",
			Path: path,
		}},
	})

	if edge := maprunEdge(g.Edges, "api", "worker", "observes"); edge == nil || edge.Evidence.State != graph.RuntimeVisible {
		t.Fatalf("runtime edge = %#v, want runtime-visible observation edge", edge)
	}
	if unknown := maprunEdge(g.Edges, "runtime-export", "runtime-export:unknown:runtime-topology", "unknown"); unknown != nil {
		t.Fatalf("unknown coverage edge = %#v, want none for complete coverage", unknown)
	}
}

func TestGraphAndFindingsForSelectionRejectsInvalidTopLevelRuntimeObservation(t *testing.T) {
	t.Run("missing file", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "missing-runtime-observations.json")

		g, findings, _ := graphAndFindingsForSelection(selection.Selection{
			SchemaVersion: selection.SchemaVersion,
			Runtime: []selection.InputSource{{
				ID:   "missing-runtime",
				Path: path,
			}},
		})

		if node := maprunNode(g.Nodes, "missing-runtime"); node == nil || node.Evidence.State != graph.CannotVerify || node.Evidence.Reason != "path does not exist" {
			t.Fatalf("runtime input node = %#v, want cannot_verify missing path", node)
		}
		finding := maprunFinding(findings, "finding-runtime-missing-runtime")
		if finding == nil || finding.Status != "cannot_verify" {
			t.Fatalf("runtime finding = %#v, want cannot_verify", finding)
		}
	})

	t.Run("malformed", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "runtime-observations.json")
		if err := os.WriteFile(path, []byte(`{"schema_version":"0.1.0","observations":[`), 0o644); err != nil {
			t.Fatal(err)
		}

		g, findings, _ := graphAndFindingsForSelection(selection.Selection{
			SchemaVersion: selection.SchemaVersion,
			Runtime: []selection.InputSource{{
				ID:   "bad-runtime",
				Path: path,
			}},
		})

		if node := maprunNode(g.Nodes, "bad-runtime"); node == nil || node.Evidence.State != graph.CannotVerify {
			t.Fatalf("runtime input node = %#v, want cannot_verify", node)
		}
		if len(g.Edges) != 0 {
			t.Fatalf("edges = %#v, want no assessed runtime edges", g.Edges)
		}
		finding := maprunFinding(findings, "finding-runtime-bad-runtime")
		if finding == nil || finding.Status != "cannot_verify" || !strings.Contains(finding.Summary, "malformed") {
			t.Fatalf("runtime finding = %#v, want malformed cannot_verify finding", finding)
		}
	})

	t.Run("unsupported schema version", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "runtime-observations.json")
		if err := os.WriteFile(path, []byte(`{"schema_version":"0.2.0","observations":[]}`), 0o644); err != nil {
			t.Fatal(err)
		}

		g, findings, _ := graphAndFindingsForSelection(selection.Selection{
			SchemaVersion: selection.SchemaVersion,
			Runtime: []selection.InputSource{{
				ID:   "versioned-runtime",
				Path: path,
			}},
		})

		if node := maprunNode(g.Nodes, "versioned-runtime"); node == nil || node.Evidence.State != graph.CannotVerify || !strings.Contains(node.Evidence.Reason, "schema_version") {
			t.Fatalf("runtime input node = %#v, want cannot_verify schema version", node)
		}
		finding := maprunFinding(findings, "finding-runtime-versioned-runtime")
		if finding == nil || finding.Status != "cannot_verify" {
			t.Fatalf("runtime finding = %#v, want cannot_verify", finding)
		}
	})

	t.Run("unsafe source", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "runtime-observations.json")
		if err := os.WriteFile(path, []byte(`{
			"schema_version":"0.1.0",
			"observations":[
				{"id":"obs-secret","from":"api","to":"db","coverage":"complete","source":"https://telemetry.example/export?token=secret"}
			]
		}`), 0o644); err != nil {
			t.Fatal(err)
		}

		g, findings, _ := graphAndFindingsForSelection(selection.Selection{
			SchemaVersion: selection.SchemaVersion,
			Runtime: []selection.InputSource{{
				ID:   "unsafe-runtime",
				Path: path,
			}},
		})

		if node := maprunNode(g.Nodes, "unsafe-runtime:unsafe-observation:obs-secret"); node == nil || node.Evidence.State != graph.CannotVerify {
			t.Fatalf("unsafe observation node = %#v, want cannot_verify", node)
		}
		if edge := maprunEdge(g.Edges, "api", "db", "observes"); edge != nil {
			t.Fatalf("runtime edge = %#v, want unsafe observation not promoted", edge)
		}
		finding := maprunFinding(findings, "finding-runtime-unsafe-runtime")
		if finding == nil || finding.Status != "cannot_verify" {
			t.Fatalf("runtime finding = %#v, want cannot_verify", finding)
		}
	})

	t.Run("unsafe source schemes", func(t *testing.T) {
		for _, source := range []string{"data:text/plain,secret", "javascript:alert(1)"} {
			t.Run(source, func(t *testing.T) {
				path := filepath.Join(t.TempDir(), "runtime-observations.json")
				doc := `{"schema_version":"0.1.0","observations":[{"id":"obs-unsafe","from":"api","to":"worker","coverage":"complete","source":"` + source + `"}]}`
				if err := os.WriteFile(path, []byte(doc), 0o644); err != nil {
					t.Fatal(err)
				}

				g, _, _ := graphAndFindingsForSelection(selection.Selection{
					SchemaVersion: selection.SchemaVersion,
					Runtime: []selection.InputSource{{
						ID:   "unsafe-runtime",
						Path: path,
					}},
				})

				if edge := maprunEdge(g.Edges, "api", "worker", "observes"); edge != nil {
					t.Fatalf("runtime edge = %#v, want unsafe source not promoted", edge)
				}
			})
		}
	})
}

func TestRelationshipProducerGapFindingsPreserveAbsentSymbolNotAssessed(t *testing.T) {
	findings := relationshipProducerGapFindings(nil)

	dependency := maprunFinding(findings, "finding-relationships-dependency-evidence-not-assessed")
	if dependency == nil || dependency.Status != "not_assessed" || dependency.EvidenceState != "not_assessed" {
		t.Fatalf("dependency finding = %#v, want not_assessed", dependency)
	}
	symbol := maprunFinding(findings, "finding-relationships-symbol-evidence-not-assessed")
	if symbol == nil || symbol.Status != "not_assessed" || symbol.EvidenceState != "not_assessed" {
		t.Fatalf("symbol finding = %#v, want not_assessed", symbol)
	}
	if !strings.Contains(symbol.Summary, "symbol-index") {
		t.Fatalf("symbol finding = %#v, want symbol-index guidance", symbol)
	}

	findings = relationshipProducerGapFindings([]selection.ToolOutput{{
		ID:   "symbols",
		Kind: "symbol-index",
		Tool: "fixture",
		Path: "symbols.json",
	}})
	if symbol := maprunFinding(findings, "finding-relationships-symbol-evidence-not-assessed"); symbol != nil {
		t.Fatalf("findings = %#v, did not expect absent symbol finding when symbol-index output is selected", findings)
	}
}

func maprunNode(nodes []graph.Node, id string) *graph.Node {
	for i := range nodes {
		if nodes[i].ID == id {
			return &nodes[i]
		}
	}
	return nil
}

func maprunEdge(edges []graph.Edge, from, to, kind string) *graph.Edge {
	for i := range edges {
		if edges[i].From == from && edges[i].To == to && edges[i].Kind == kind {
			return &edges[i]
		}
	}
	return nil
}

func maprunFinding(findings []Finding, id string) *Finding {
	for i := range findings {
		if findings[i].ID == id {
			return &findings[i]
		}
	}
	return nil
}
