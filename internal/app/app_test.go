package app

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/fall-out-bug/portolan/internal/graph"
	"github.com/fall-out-bug/portolan/internal/scan"
)

func TestRunVersionWritesVersion(t *testing.T) {
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"--version"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0", code)
	}
	if got := strings.TrimSpace(stdout.String()); got != "portolan dev" {
		t.Fatalf("stdout = %q, want %q", got, "portolan dev")
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
}

func TestRunScanHelpDescribesReadOnlyEvidenceGraph(t *testing.T) {
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"scan", "--help"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0", code)
	}
	out := stdout.String()
	for _, want := range []string{"--selection", "--out", "--force", "read-only", "no network", "source-visible", "unknown"} {
		if !strings.Contains(out, want) {
			t.Fatalf("stdout %q does not contain %q", out, want)
		}
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
}

func TestRunScanHelpWithOtherFlagsReturnsHelp(t *testing.T) {
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"scan", "--selection", "selection.json", "--help"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
	if !strings.Contains(stdout.String(), "--selection") {
		t.Fatalf("stdout = %q, want scan help", stdout.String())
	}
}

func TestRunSelectionHelpDescribesReadOnlyValidation(t *testing.T) {
	tests := [][]string{
		{"selection", "--help"},
		{"selection", "validate", "--help"},
	}
	for _, args := range tests {
		t.Run(strings.Join(args, " "), func(t *testing.T) {
			var stdout bytes.Buffer
			var stderr bytes.Buffer

			code := Run(args, &stdout, &stderr)

			if code != 0 {
				t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
			}
			out := stdout.String()
			for _, want := range []string{"--selection", "local", "no network", "target contents"} {
				if !strings.Contains(out, want) {
					t.Fatalf("stdout %q does not contain %q", out, want)
				}
			}
			if stderr.Len() != 0 {
				t.Fatalf("stderr = %q, want empty", stderr.String())
			}
		})
	}
}

func TestRunSelectionValidateAcceptsInventoryInputs(t *testing.T) {
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"selection", "validate", "--selection", "testdata/selection-inventory/valid-selection.json"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	if !strings.Contains(stdout.String(), "selection valid") {
		t.Fatalf("stdout = %q, want success message", stdout.String())
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
}

func TestRunSelectionValidateRejectsInvalidInventoryInputs(t *testing.T) {
	tests := []struct {
		name string
		path string
		want string
	}{
		{
			name: "duplicate ids",
			path: "testdata/selection-inventory/duplicate-ids.json",
			want: "duplicate selection id",
		},
		{
			name: "missing path",
			path: "testdata/selection-inventory/missing-path.json",
			want: "path is required",
		},
		{
			name: "network url",
			path: "testdata/selection-inventory/network-url.json",
			want: "must be local",
		},
		{
			name: "file url",
			path: writeSelection(t, t.TempDir(), "file-url", `{"schema_version":"0.1.0","targets":[{"id":"file-url","kind":"repository","path":"file:///tmp/repo"}]}`),
			want: "must be local",
		},
		{
			name: "unsupported kind",
			path: writeSelection(t, t.TempDir(), "unsupported-kind", `{"schema_version":"0.1.0","targets":[{"id":"bad","kind":"metadata","path":"catalog.json"}]}`),
			want: "not supported",
		},
		{
			name: "unknown field",
			path: writeSelection(t, t.TempDir(), "unknown-field", `{"schema_version":"0.1.0","targets":[],"remote_url":"https://example.com"}`),
			want: "unknown field",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var stdout bytes.Buffer
			var stderr bytes.Buffer

			code := Run([]string{"selection", "validate", "--selection", tt.path}, &stdout, &stderr)

			if code == 0 {
				t.Fatalf("Run returned 0, want error")
			}
			if stdout.Len() != 0 {
				t.Fatalf("stdout = %q, want empty", stdout.String())
			}
			if !strings.Contains(stderr.String(), tt.want) {
				t.Fatalf("stderr = %q, want %q", stderr.String(), tt.want)
			}
		})
	}
}

func TestRunSelectionValidateAllowsWindowsStyleLocalPath(t *testing.T) {
	path := writeSelection(t, t.TempDir(), "windows-path", `{"schema_version":"0.1.0","targets":[{"id":"windows-repo","kind":"repository","path":"C:\\repo\\service"}]}`)
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"selection", "validate", "--selection", path}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
}

func TestRunSelectionValidateRequiresSelectionFlag(t *testing.T) {
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"selection", "validate"}, &stdout, &stderr)

	if code == 0 {
		t.Fatalf("Run returned 0, want error")
	}
	if !strings.Contains(stderr.String(), "--selection is required") {
		t.Fatalf("stderr = %q, want missing selection error", stderr.String())
	}
}

func TestRunPacketHelpDescribesGraphOnlyMarkdown(t *testing.T) {
	tests := [][]string{
		{"packet", "--help"},
		{"packet", "render", "--help"},
	}
	for _, args := range tests {
		t.Run(strings.Join(args, " "), func(t *testing.T) {
			var stdout bytes.Buffer
			var stderr bytes.Buffer

			code := Run(args, &stdout, &stderr)

			if code != 0 {
				t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
			}
			out := stdout.String()
			for _, want := range []string{"--graph", "--out", "Markdown", "graph", "no network"} {
				if !strings.Contains(out, want) {
					t.Fatalf("stdout %q does not contain %q", out, want)
				}
			}
			if stderr.Len() != 0 {
				t.Fatalf("stderr = %q, want empty", stderr.String())
			}
		})
	}
}

func TestRunPacketRenderWritesMarkdownPacket(t *testing.T) {
	out := filepath.Join(t.TempDir(), "packet.md")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"packet", "render", "--graph", "testdata/human-readable-packet/graph.json", "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	if !strings.Contains(stdout.String(), "wrote ") {
		t.Fatalf("stdout = %q, want write summary", stdout.String())
	}
	data, err := os.ReadFile(out)
	if err != nil {
		t.Fatal(err)
	}
	text := string(data)
	for _, want := range []string{
		"# Portolan Evidence Packet",
		"- Nodes: 4",
		"- Edges: 1",
		"`source-visible`: 1",
		"`claim-only`: 2",
		"`unknown`: 1",
		"`cannot_verify`: 1",
		"id `repo-main`",
		"claimed, not observed",
		"## Unknown Areas",
		"## Cannot Verify Areas",
	} {
		if !strings.Contains(text, want) {
			t.Fatalf("packet missing %q:\n%s", want, text)
		}
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
}

func TestRunPacketRenderDoesNotDescribeClaimOnlyAsObserved(t *testing.T) {
	out := filepath.Join(t.TempDir(), "packet.md")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"packet", "render", "--graph", "testdata/human-readable-packet/claim-only-graph.json", "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	data, err := os.ReadFile(out)
	if err != nil {
		t.Fatal(err)
	}
	text := string(data)
	if !strings.Contains(text, "claimed, not observed") {
		t.Fatalf("packet should preserve claim-only authority:\n%s", text)
	}
	if strings.Contains(text, "visible source evidence") {
		t.Fatalf("packet overclaimed observed truth:\n%s", text)
	}
}

func TestRunPacketRenderDoesNotDescribeUnknownOrCannotVerifyEdgesAsObserved(t *testing.T) {
	root := t.TempDir()
	graphPath := filepath.Join(root, "graph.json")
	out := filepath.Join(root, "packet.md")
	mustWrite(t, graphPath, `{
		"schema_version":"0.1.0",
		"generated_by":"portolan",
		"nodes":[
			{"id":"api","kind":"unknown","label":"api","evidence":{"state":"unknown","source":"selection","reason":"not visible"}},
			{"id":"db","kind":"unknown","label":"db","evidence":{"state":"cannot_verify","source":"selection","reason":"unreadable"}}
		],
		"edges":[
			{"from":"api","to":"db","kind":"depends-on","evidence":{"state":"unknown","source":"selection","reason":"not visible"}},
			{"from":"db","to":"api","kind":"depends-on","evidence":{"state":"cannot_verify","source":"selection","reason":"unreadable"}}
		]
	}`)
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"packet", "render", "--graph", graphPath, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	data, err := os.ReadFile(out)
	if err != nil {
		t.Fatal(err)
	}
	text := string(data)
	if !strings.Contains(text, "is unknown from") || !strings.Contains(text, "is cannot verify from") {
		t.Fatalf("packet should preserve weak edge evidence:\n%s", text)
	}
	if strings.Contains(text, "is observed from") {
		t.Fatalf("packet overclaimed weak edge evidence:\n%s", text)
	}
}

func TestRunPacketRenderEscapesGraphTextForMarkdown(t *testing.T) {
	root := t.TempDir()
	graphPath := filepath.Join(root, "graph.json")
	out := filepath.Join(root, "packet.md")
	mustWrite(t, graphPath, `{
		"schema_version":"0.1.0",
		"generated_by":"portolan",
		"nodes":[
			{"id":"bad`+"`"+`id","kind":"unknown","label":"<script>alert(1)</script>","evidence":{"state":"cannot_verify","source":"source`+"`"+`path","reason":"<b>bad</b>\n# heading"}}
		],
		"edges":[]
	}`)
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"packet", "render", "--graph", graphPath, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	data, err := os.ReadFile(out)
	if err != nil {
		t.Fatal(err)
	}
	text := string(data)
	for _, want := range []string{"&lt;script&gt;alert(1)&lt;/script&gt;", "id `bad&#39;id`", "`source&#39;path`", "&lt;b&gt;bad&lt;/b&gt; # heading"} {
		if !strings.Contains(text, want) {
			t.Fatalf("packet missing escaped text %q:\n%s", want, text)
		}
	}
	if strings.Contains(text, "<script>") || strings.Contains(text, "\n# heading") {
		t.Fatalf("packet contains unescaped markdown/html:\n%s", text)
	}
}

func TestRunPacketRenderRejectsMalformedGraphWithoutPartialOutput(t *testing.T) {
	out := filepath.Join(t.TempDir(), "packet.md")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"packet", "render", "--graph", "testdata/human-readable-packet/malformed-graph.json", "--out", out}, &stdout, &stderr)

	if code == 0 {
		t.Fatalf("Run returned 0, want error")
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	if !strings.Contains(stderr.String(), "packet: parse graph") {
		t.Fatalf("stderr = %q, want parse graph error", stderr.String())
	}
	if _, err := os.Stat(out); !os.IsNotExist(err) {
		t.Fatalf("output exists after malformed graph; err = %v", err)
	}
}

func TestRunPacketRenderOutputSafety(t *testing.T) {
	root := t.TempDir()
	existing := filepath.Join(root, "packet.md")
	mustWrite(t, existing, "old")

	t.Run("existing output requires force", func(t *testing.T) {
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"packet", "render", "--graph", "testdata/human-readable-packet/graph.json", "--out", existing}, &stdout, &stderr)
		if code == 0 || !strings.Contains(stderr.String(), "--force") {
			t.Fatalf("code = %d stderr = %q, want force error", code, stderr.String())
		}
	})

	t.Run("force overwrites existing output", func(t *testing.T) {
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"packet", "render", "--graph", "testdata/human-readable-packet/graph.json", "--out", existing, "--force"}, &stdout, &stderr)
		if code != 0 {
			t.Fatalf("code = %d stderr = %q, want success", code, stderr.String())
		}
	})
}

func TestRunImportHelpDescribesLocalCycloneDXImport(t *testing.T) {
	tests := [][]string{
		{"import", "--help"},
		{"import", "cyclonedx", "--help"},
	}
	for _, args := range tests {
		t.Run(strings.Join(args, " "), func(t *testing.T) {
			var stdout bytes.Buffer
			var stderr bytes.Buffer

			code := Run(args, &stdout, &stderr)

			if code != 0 {
				t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
			}
			out := stdout.String()
			for _, want := range []string{"cyclonedx", "--in", "--out", "local", "no network", "metadata-visible"} {
				if !strings.Contains(out, want) {
					t.Fatalf("stdout %q does not contain %q", out, want)
				}
			}
			if stderr.Len() != 0 {
				t.Fatalf("stderr = %q, want empty", stderr.String())
			}
		})
	}
}

func TestRunImportCycloneDXWritesEvidenceGraph(t *testing.T) {
	out := filepath.Join(t.TempDir(), "graph.json")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"import", "cyclonedx", "--in", "testdata/importer-normalization/cyclonedx.json", "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	if !strings.Contains(stdout.String(), "wrote ") {
		t.Fatalf("stdout = %q, want write summary", stdout.String())
	}
	result := readGraph(t, out)
	assertSchemaShape(t, result)
	states := evidenceStates(t, result)
	if !states["metadata-visible"] {
		t.Fatalf("states = %#v, want metadata-visible", states)
	}
	nodes := result["nodes"].([]any)
	edges := result["edges"].([]any)
	if len(nodes) != 3 {
		t.Fatalf("nodes = %#v, want source plus two packages", nodes)
	}
	if len(edges) != 1 {
		t.Fatalf("edges = %#v, want one dependency edge", edges)
	}
	foundPackage := false
	for _, item := range nodes {
		node := item.(map[string]any)
		if node["id"] != "cyclonedx:pkg:maven/org.example/lib-a@1.2.3" {
			continue
		}
		foundPackage = true
		if node["kind"] != "package" || !strings.Contains(node["label"].(string), "lib-a") {
			t.Fatalf("node = %#v, want lib-a package", node)
		}
		evidence := node["evidence"].(map[string]any)
		if evidence["source"] != "testdata/importer-normalization/cyclonedx.json" {
			t.Fatalf("evidence = %#v, want input source", evidence)
		}
	}
	if !foundPackage {
		t.Fatalf("nodes = %#v, want lib-a package node", nodes)
	}
}

func TestRunImportCycloneDXReportsMalformedInputAsCannotVerifyGraph(t *testing.T) {
	out := filepath.Join(t.TempDir(), "graph.json")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"import", "cyclonedx", "--in", "testdata/importer-normalization/malformed-cyclonedx.json", "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	result := readGraph(t, out)
	assertSchemaShape(t, result)
	nodes := result["nodes"].([]any)
	if len(nodes) != 1 {
		t.Fatalf("nodes = %#v, want one cannot_verify source node", nodes)
	}
	evidence := nodes[0].(map[string]any)["evidence"].(map[string]any)
	if evidence["state"] != "cannot_verify" || !strings.Contains(evidence["reason"].(string), "malformed CycloneDX JSON") {
		t.Fatalf("evidence = %#v, want malformed cannot_verify", evidence)
	}
}

func TestRunImportCycloneDXKeepsUnknownDependencyRefsCannotVerify(t *testing.T) {
	out := filepath.Join(t.TempDir(), "graph.json")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"import", "cyclonedx", "--in", "testdata/importer-normalization/cyclonedx-unknown-ref.json", "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	result := readGraph(t, out)
	assertSchemaShape(t, result)
	states := evidenceStates(t, result)
	if !states["cannot_verify"] {
		t.Fatalf("states = %#v, want cannot_verify", states)
	}
	foundMissing := false
	foundMissingSourceEdge := false
	for _, item := range result["nodes"].([]any) {
		node := item.(map[string]any)
		if node["id"] != "cyclonedx:pkg:npm/missing@0.0.1" {
			continue
		}
		foundMissing = true
		evidence := node["evidence"].(map[string]any)
		if evidence["state"] != "cannot_verify" {
			t.Fatalf("missing node evidence = %#v, want cannot_verify", evidence)
		}
	}
	if !foundMissing {
		t.Fatalf("nodes = %#v, want missing dependency placeholder", result["nodes"])
	}
	for _, item := range result["edges"].([]any) {
		edge := item.(map[string]any)
		if edge["from"] != "cyclonedx:pkg:npm/missing-source@0.0.1" {
			continue
		}
		foundMissingSourceEdge = true
		evidence := edge["evidence"].(map[string]any)
		if evidence["state"] != "cannot_verify" {
			t.Fatalf("missing source edge evidence = %#v, want cannot_verify", evidence)
		}
	}
	if !foundMissingSourceEdge {
		t.Fatalf("edges = %#v, want missing source dependency edge", result["edges"])
	}
}

func TestRunImportCycloneDXReportsMissingInputAsCannotVerifyGraph(t *testing.T) {
	out := filepath.Join(t.TempDir(), "graph.json")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"import", "cyclonedx", "--in", "testdata/importer-normalization/missing.json", "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	result := readGraph(t, out)
	assertSchemaShape(t, result)
	nodes := result["nodes"].([]any)
	if len(nodes) != 1 {
		t.Fatalf("nodes = %#v, want one cannot_verify source node", nodes)
	}
	evidence := nodes[0].(map[string]any)["evidence"].(map[string]any)
	if evidence["state"] != "cannot_verify" || !strings.Contains(evidence["reason"].(string), "read CycloneDX JSON") {
		t.Fatalf("evidence = %#v, want missing input cannot_verify", evidence)
	}
}

func TestRunImportCycloneDXRejectsInvalidFlags(t *testing.T) {
	root := t.TempDir()
	tests := []struct {
		name string
		args []string
		want string
	}{
		{
			name: "missing input",
			args: []string{"import", "cyclonedx", "--out", filepath.Join(root, "graph.json")},
			want: "--in is required",
		},
		{
			name: "missing output",
			args: []string{"import", "cyclonedx", "--in", "testdata/importer-normalization/cyclonedx.json"},
			want: "--out is required",
		},
		{
			name: "unknown import command",
			args: []string{"import", "spdx"},
			want: "portolan import --help",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var stdout bytes.Buffer
			var stderr bytes.Buffer

			code := Run(tt.args, &stdout, &stderr)

			if code == 0 {
				t.Fatalf("Run returned 0, want error")
			}
			if !strings.Contains(stderr.String(), tt.want) {
				t.Fatalf("stderr = %q, want %q", stderr.String(), tt.want)
			}
		})
	}
}

func TestRunImportCycloneDXOutputSafety(t *testing.T) {
	root := t.TempDir()
	existing := filepath.Join(root, "graph.json")
	mustWrite(t, existing, "preserve me")

	t.Run("existing output requires force", func(t *testing.T) {
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"import", "cyclonedx", "--in", "testdata/importer-normalization/cyclonedx.json", "--out", existing}, &stdout, &stderr)
		if code == 0 || !strings.Contains(stderr.String(), "--force") {
			t.Fatalf("code = %d stderr = %q, want force error", code, stderr.String())
		}
		data, err := os.ReadFile(existing)
		if err != nil {
			t.Fatal(err)
		}
		if string(data) != "preserve me" {
			t.Fatalf("existing file changed: %q", data)
		}
	})

	t.Run("force overwrites existing output", func(t *testing.T) {
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"import", "cyclonedx", "--in", "testdata/importer-normalization/cyclonedx.json", "--out", existing, "--force"}, &stdout, &stderr)
		if code != 0 {
			t.Fatalf("code = %d stderr = %q, want success", code, stderr.String())
		}
		readGraph(t, existing)
	})

	t.Run("refuses output symlink", func(t *testing.T) {
		target := filepath.Join(root, "target.json")
		link := filepath.Join(root, "link.json")
		mustWrite(t, target, "{}")
		if err := os.Symlink(target, link); err != nil {
			t.Skipf("symlink unavailable: %v", err)
		}
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"import", "cyclonedx", "--in", "testdata/importer-normalization/cyclonedx.json", "--out", link, "--force"}, &stdout, &stderr)
		if code == 0 || !strings.Contains(stderr.String(), "symlink") {
			t.Fatalf("code = %d stderr = %q, want symlink error", code, stderr.String())
		}
	})
}

func TestRunScanFixtureStillWorksAfterSelectionInventoryExpansion(t *testing.T) {
	out := filepath.Join(t.TempDir(), "graph.json")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"scan", "--selection", "testdata/local-evidence-graph/selection.json", "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	readGraph(t, out)
}

func TestRunScanWritesBlackBoxProfileEvidence(t *testing.T) {
	out := filepath.Join(t.TempDir(), "graph.json")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"scan", "--selection", "testdata/black-box-profile/selection.json", "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	result := readGraph(t, out)
	states := evidenceStates(t, result)
	for _, want := range []string{"metadata-visible", "runtime-visible", "claim-only"} {
		if !states[want] {
			t.Fatalf("states = %#v, want %q", states, want)
		}
	}
	for _, item := range result["nodes"].([]any) {
		node := item.(map[string]any)
		evidence := node["evidence"].(map[string]any)
		if evidence["state"] == "source-visible" {
			t.Fatalf("black-box node used source-visible: %#v", node)
		}
		if node["id"] == "payments-api" && evidence["state"] != "metadata-visible" {
			t.Fatalf("payments-api evidence = %#v, want metadata-visible", evidence)
		}
	}
	foundClaimEdge := false
	for _, item := range result["edges"].([]any) {
		edge := item.(map[string]any)
		evidence := edge["evidence"].(map[string]any)
		if evidence["state"] == "source-visible" {
			t.Fatalf("black-box edge used source-visible: %#v", edge)
		}
		if edge["from"] == "payments-api" && edge["to"] == "ledger-api" && edge["kind"] == "depends-on" && evidence["state"] == "claim-only" {
			foundClaimEdge = true
		}
	}
	if !foundClaimEdge {
		t.Fatalf("edges = %#v, want payments-api claim-only dependency edge", result["edges"])
	}
	assertSchemaShape(t, result)
}

func TestRunScanBlackBoxMissingExpectedDependencyIsUnknown(t *testing.T) {
	out := filepath.Join(t.TempDir(), "graph.json")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"scan", "--selection", "testdata/black-box-profile/missing-dependency-selection.json", "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	result := readGraph(t, out)
	for _, item := range result["edges"].([]any) {
		edge := item.(map[string]any)
		evidence := edge["evidence"].(map[string]any)
		if edge["kind"] == "unknown" && evidence["state"] == "unknown" && strings.Contains(evidence["reason"].(string), "dependencies") {
			return
		}
	}
	t.Fatalf("edges = %#v, want unknown dependency edge with reason", result["edges"])
}

func TestRunScanBlackBoxMalformedRuntimeIsCannotVerify(t *testing.T) {
	out := filepath.Join(t.TempDir(), "graph.json")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"scan", "--selection", "testdata/black-box-profile/malformed-runtime-selection.json", "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	result := readGraph(t, out)
	states := evidenceStates(t, result)
	if !states["metadata-visible"] || !states["cannot_verify"] {
		t.Fatalf("states = %#v, want metadata-visible and cannot_verify", states)
	}
	for _, item := range result["nodes"].([]any) {
		node := item.(map[string]any)
		evidence := node["evidence"].(map[string]any)
		if evidence["state"] == "cannot_verify" && strings.Contains(evidence["reason"].(string), "malformed runtime JSON") {
			return
		}
	}
	t.Fatalf("nodes = %#v, want malformed runtime cannot_verify node", result["nodes"])
}

func TestRunScanBlackBoxMalformedInputsAreCannotVerify(t *testing.T) {
	root := t.TempDir()
	metadata := filepath.Join(root, "metadata.json")
	claims := filepath.Join(root, "claims.json")
	mustWrite(t, metadata, `{`)
	mustWrite(t, claims, `{`)
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{
		"schema_version":"0.1.0",
		"black_boxes":[{
			"id":"payments-api",
			"kind":"service",
			"metadata":[{"id":"bad-metadata","path":`+quote(metadata)+`}],
			"claims":[{"id":"bad-claims","path":`+quote(claims)+`}]
		}]
	}`)
	out := filepath.Join(root, "graph.json")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"scan", "--selection", selection, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	result := readGraph(t, out)
	reasons := map[string]bool{}
	for _, item := range result["nodes"].([]any) {
		node := item.(map[string]any)
		evidence := node["evidence"].(map[string]any)
		if evidence["state"] == "cannot_verify" {
			reasons[evidence["reason"].(string)] = true
		}
	}
	for _, want := range []string{"malformed metadata JSON", "malformed claim JSON"} {
		if !reasons[want] {
			t.Fatalf("cannot_verify reasons = %#v, want %q", reasons, want)
		}
	}
}

func TestRunPacketBlackBoxWordingDoesNotImplySourceAnalysis(t *testing.T) {
	root := t.TempDir()
	graphPath := filepath.Join(root, "graph.json")
	packetPath := filepath.Join(root, "packet.md")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"scan", "--selection", "testdata/black-box-profile/selection.json", "--out", graphPath, "--force"}, &stdout, &stderr)
	if code != 0 {
		t.Fatalf("scan returned %d, want 0; stderr = %q", code, stderr.String())
	}
	code = Run([]string{"packet", "render", "--graph", graphPath, "--out", packetPath, "--force"}, &stdout, &stderr)
	if code != 0 {
		t.Fatalf("packet returned %d, want 0; stderr = %q", code, stderr.String())
	}
	data, err := os.ReadFile(packetPath)
	if err != nil {
		t.Fatal(err)
	}
	text := string(data)
	for _, want := range []string{"Metadata-Visible Facts", "Runtime-Visible Facts", "metadata-visible evidence", "runtime-visible evidence"} {
		if !strings.Contains(text, want) {
			t.Fatalf("packet missing %q:\n%s", want, text)
		}
	}
	if !strings.Contains(text, "`payments-api` `depends-on` `ledger-api` is claimed, not observed") {
		t.Fatalf("packet missing claim-only edge wording:\n%s", text)
	}
	if !strings.Contains(text, "`payments-api` `observes`") || !strings.Contains(text, "is runtime-visible evidence") {
		t.Fatalf("packet missing runtime edge wording:\n%s", text)
	}
	if strings.Contains(text, "source analysis") || strings.Contains(text, "source code was inspected") {
		t.Fatalf("packet implied source analysis for black-box facts:\n%s", text)
	}
}

func TestRunSelectionValidateRejectsInvalidBlackBoxes(t *testing.T) {
	root := t.TempDir()
	tests := []struct {
		name string
		body string
		want string
	}{
		{
			name: "unsupported kind",
			body: `{"schema_version":"0.1.0","black_boxes":[{"id":"svc","kind":"repository"}]}`,
			want: "kind",
		},
		{
			name: "source path",
			body: `{"schema_version":"0.1.0","black_boxes":[{"id":"svc","kind":"service","path":"/tmp/repo"}]}`,
			want: "must not declare repository or source paths",
		},
		{
			name: "live telemetry",
			body: `{"schema_version":"0.1.0","black_boxes":[{"id":"svc","kind":"service","telemetry":"https://telemetry.example"}]}`,
			want: "live telemetry is not supported",
		},
		{
			name: "invalid expected field",
			body: `{"schema_version":"0.1.0","black_boxes":[{"id":"svc","kind":"service","expected":["source"]}]}`,
			want: "expected field",
		},
		{
			name: "duplicate id",
			body: `{"schema_version":"0.1.0","black_boxes":[{"id":"svc","kind":"service"},{"id":"svc","kind":"runtime"}]}`,
			want: "duplicate selection id",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := writeSelection(t, root, "black-box-"+tt.name, tt.body)
			var stdout bytes.Buffer
			var stderr bytes.Buffer

			code := Run([]string{"selection", "validate", "--selection", path}, &stdout, &stderr)

			if code == 0 || !strings.Contains(stderr.String(), tt.want) {
				t.Fatalf("code = %d stderr = %q, want %q", code, stderr.String(), tt.want)
			}
		})
	}
}

func TestRunScanWritesEvidenceGraph(t *testing.T) {
	root := t.TempDir()
	repo := filepath.Join(root, "repo")
	mustMkdir(t, repo)
	mustWrite(t, filepath.Join(repo, "README.md"), "# Demo\n")
	claims := filepath.Join(root, "claims.json")
	mustWrite(t, claims, `{"claims":[{"id":"claim-api-db","subject":"api","predicate":"depends-on","object":"database","source":"architecture-interview"}]}`)
	missingClaims := filepath.Join(root, "missing-claims.json")
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{
		"schema_version":"0.1.0",
		"targets":[{"id":"demo-repo","kind":"repository","path":`+quote(repo)+`}],
		"claims":[{"id":"claims-main","path":`+quote(claims)+`},{"id":"claims-missing","path":`+quote(missingClaims)+`}]
	}`)
	out := filepath.Join(root, "graph.json")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	code := Run([]string{"scan", "--selection", selection, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	if !strings.Contains(stdout.String(), "wrote ") {
		t.Fatalf("stdout = %q, want write summary", stdout.String())
	}
	graph := readGraph(t, out)
	info, err := os.Stat(out)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(stdout.String(), fmt.Sprintf("(%d bytes)", info.Size())) {
		t.Fatalf("stdout = %q, want actual file size %d", stdout.String(), info.Size())
	}
	if graph["schema_version"] != "0.1.0" {
		t.Fatalf("schema_version = %v, want 0.1.0", graph["schema_version"])
	}
	states := evidenceStates(t, graph)
	for _, want := range []string{"source-visible", "claim-only", "unknown"} {
		if !states[want] {
			t.Fatalf("states = %#v, want %q", states, want)
		}
	}
	if len(graph["edges"].([]any)) != 1 {
		t.Fatalf("edges = %#v, want one claim edge", graph["edges"])
	}
	assertSchemaShape(t, graph)

	out2 := filepath.Join(root, "graph-rerun.json")
	code = Run([]string{"scan", "--selection", selection, "--out", out2}, &stdout, &stderr)
	if code != 0 {
		t.Fatalf("second Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	first, err := os.ReadFile(out)
	if err != nil {
		t.Fatal(err)
	}
	second, err := os.ReadFile(out2)
	if err != nil {
		t.Fatal(err)
	}
	if string(first) != string(second) {
		t.Fatalf("rerun graph differed\nfirst:\n%s\nsecond:\n%s", first, second)
	}
}

func TestRunScanDoesNotDuplicateClaimDerivedNodeIDs(t *testing.T) {
	root := t.TempDir()
	repo := filepath.Join(root, "repo")
	mustMkdir(t, repo)
	mustWrite(t, filepath.Join(repo, "README.md"), "# Demo\n")
	claims := filepath.Join(root, "claims.json")
	mustWrite(t, claims, `{"claims":[{"id":"claim-repo-db","subject":"repo","predicate":"depends-on","object":"database","source":"architecture-interview"}]}`)
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{"schema_version":"0.1.0","targets":[{"id":"repo","kind":"repository","path":`+quote(repo)+`}],"claims":[{"id":"claims-main","path":`+quote(claims)+`}]}`)
	out := filepath.Join(root, "graph.json")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	code := Run([]string{"scan", "--selection", selection, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	graph := readGraph(t, out)
	seen := map[string]int{}
	for _, item := range graph["nodes"].([]any) {
		node := item.(map[string]any)
		seen[node["id"].(string)]++
	}
	for id, count := range seen {
		if count != 1 {
			t.Fatalf("node id %q appeared %d times", id, count)
		}
	}
	for _, item := range graph["nodes"].([]any) {
		node := item.(map[string]any)
		if node["id"] != "repo" {
			continue
		}
		evidence := node["evidence"].(map[string]any)
		if evidence["state"] != "source-visible" {
			t.Fatalf("repo evidence = %#v, want source-visible", evidence)
		}
	}
}

func TestRunScanKeepsFirstClaimNodeEvidenceAndUnknownPredicate(t *testing.T) {
	root := t.TempDir()
	repo := filepath.Join(root, "repo")
	mustMkdir(t, repo)
	mustWrite(t, filepath.Join(repo, "README.md"), "# Demo\n")
	claims := filepath.Join(root, "claims.json")
	mustWrite(t, claims, `{"claims":[{"id":"claim-one","subject":"api","predicate":"runs","object":"database","source":"first-source"},{"id":"claim-two","subject":"api","predicate":"depends-on","object":"cache","source":"second-source"}]}`)
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{"schema_version":"0.1.0","targets":[{"id":"repo","kind":"repository","path":`+quote(repo)+`}],"claims":[{"id":"claims-main","path":`+quote(claims)+`}]}`)
	out := filepath.Join(root, "graph.json")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	code := Run([]string{"scan", "--selection", selection, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	result := readGraph(t, out)
	for _, item := range result["nodes"].([]any) {
		node := item.(map[string]any)
		if node["id"] != "api" {
			continue
		}
		evidence := node["evidence"].(map[string]any)
		if evidence["source"] != "first-source" {
			t.Fatalf("api evidence = %#v, want first-source", evidence)
		}
	}
	foundUnknown := false
	for _, item := range result["edges"].([]any) {
		edge := item.(map[string]any)
		if edge["kind"] == "unknown" {
			foundUnknown = true
		}
	}
	if !foundUnknown {
		t.Fatalf("expected an unknown edge kind in %#v", result["edges"])
	}
}

func TestRunScanReportsMalformedClaimAsCannotVerify(t *testing.T) {
	root := t.TempDir()
	repo := filepath.Join(root, "repo")
	mustMkdir(t, repo)
	claims := filepath.Join(root, "claims.json")
	mustWrite(t, claims, `{`)
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{"schema_version":"0.1.0","targets":[{"id":"repo","kind":"repository","path":`+quote(repo)+`}],"claims":[{"id":"claims-bad","path":`+quote(claims)+`}]}`)
	out := filepath.Join(root, "graph.json")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	code := Run([]string{"scan", "--selection", selection, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	states := evidenceStates(t, readGraph(t, out))
	if !states["cannot_verify"] {
		t.Fatalf("states = %#v, want cannot_verify", states)
	}
}

func TestRunScanReportsClaimSymlinkAsCannotVerify(t *testing.T) {
	root := t.TempDir()
	repo := filepath.Join(root, "repo")
	mustMkdir(t, repo)
	claims := filepath.Join(root, "claims.json")
	link := filepath.Join(root, "claims-link.json")
	mustWrite(t, claims, `{"claims":[]}`)
	if err := os.Symlink(claims, link); err != nil {
		t.Skipf("symlink unavailable: %v", err)
	}
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{"schema_version":"0.1.0","targets":[{"id":"repo","kind":"repository","path":`+quote(repo)+`}],"claims":[{"id":"claims-link","path":`+quote(link)+`}]}`)
	out := filepath.Join(root, "graph.json")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	code := Run([]string{"scan", "--selection", selection, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	states := evidenceStates(t, readGraph(t, out))
	if !states["cannot_verify"] {
		t.Fatalf("states = %#v, want cannot_verify", states)
	}
}

func TestRunScanRejectsInvalidInputs(t *testing.T) {
	root := t.TempDir()
	repo := filepath.Join(root, "repo")
	mustMkdir(t, repo)
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{"schema_version":"0.1.0","targets":[{"id":"repo","kind":"repository","path":`+quote(repo)+`},{"id":"repo","kind":"repository","path":`+quote(repo)+`}],"claims":[]}`)

	tests := []struct {
		name string
		args []string
		want string
	}{
		{
			name: "missing selection",
			args: []string{"scan", "--selection", filepath.Join(root, "missing.json"), "--out", filepath.Join(root, "graph.json")},
			want: "read selection",
		},
		{
			name: "duplicate target ids",
			args: []string{"scan", "--selection", selection, "--out", filepath.Join(root, "graph.json")},
			want: "duplicate target id",
		},
		{
			name: "missing required flag",
			args: []string{"scan", "--selection", selection},
			want: "--out is required",
		},
		{
			name: "missing selection flag",
			args: []string{"scan", "--out", filepath.Join(root, "graph.json")},
			want: "--selection is required",
		},
		{
			name: "unsupported target kind",
			args: []string{"scan", "--selection", writeSelection(t, root, "unsupported-kind", `{"schema_version":"0.1.0","targets":[{"id":"repo","kind":"component","path":`+quote(repo)+`}],"claims":[]}`), "--out", filepath.Join(root, "graph.json")},
			want: "not supported",
		},
		{
			name: "missing claim source id",
			args: []string{"scan", "--selection", writeSelection(t, root, "missing-claim-id", `{"schema_version":"0.1.0","targets":[{"id":"repo","kind":"repository","path":`+quote(repo)+`}],"claims":[{"path":"claims.json"}]}`), "--out", filepath.Join(root, "graph.json")},
			want: "claim source id",
		},
		{
			name: "claim id collides with target id",
			args: []string{"scan", "--selection", writeSelection(t, root, "duplicate-claim-target", `{"schema_version":"0.1.0","targets":[{"id":"dup","kind":"repository","path":`+quote(repo)+`}],"claims":[{"id":"dup","path":"claims.json"}]}`), "--out", filepath.Join(root, "graph.json")},
			want: "duplicate graph id",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var stdout bytes.Buffer
			var stderr bytes.Buffer
			code := Run(tt.args, &stdout, &stderr)
			if code == 0 {
				t.Fatalf("Run returned 0, want error")
			}
			if !strings.Contains(stderr.String(), tt.want) {
				t.Fatalf("stderr = %q, want %q", stderr.String(), tt.want)
			}
		})
	}
}

func TestRunScanOutputSafety(t *testing.T) {
	root := t.TempDir()
	repo := filepath.Join(root, "repo")
	mustMkdir(t, repo)
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{"schema_version":"0.1.0","targets":[{"id":"repo","kind":"repository","path":`+quote(repo)+`}],"claims":[]}`)
	existing := filepath.Join(root, "graph.json")
	mustWrite(t, existing, "{}")

	t.Run("existing output requires force", func(t *testing.T) {
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"scan", "--selection", selection, "--out", existing}, &stdout, &stderr)
		if code == 0 || !strings.Contains(stderr.String(), "--force") {
			t.Fatalf("code = %d stderr = %q, want force error", code, stderr.String())
		}
	})

	t.Run("force overwrites existing output", func(t *testing.T) {
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"scan", "--selection", selection, "--out", existing, "--force"}, &stdout, &stderr)
		if code != 0 {
			t.Fatalf("code = %d stderr = %q, want success", code, stderr.String())
		}
	})

	t.Run("refuses output inside selected repository", func(t *testing.T) {
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"scan", "--selection", selection, "--out", filepath.Join(repo, "graph.json")}, &stdout, &stderr)
		if code == 0 || !strings.Contains(stderr.String(), "inside selected repository") {
			t.Fatalf("code = %d stderr = %q, want repository output error", code, stderr.String())
		}
	})

	t.Run("refuses output directory", func(t *testing.T) {
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"scan", "--selection", selection, "--out", root, "--force"}, &stdout, &stderr)
		if code == 0 || !strings.Contains(stderr.String(), "directory") {
			t.Fatalf("code = %d stderr = %q, want directory error", code, stderr.String())
		}
	})

	t.Run("refuses missing output parent", func(t *testing.T) {
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"scan", "--selection", selection, "--out", filepath.Join(root, "missing", "graph.json")}, &stdout, &stderr)
		if code == 0 || !strings.Contains(stderr.String(), "parent") {
			t.Fatalf("code = %d stderr = %q, want parent error", code, stderr.String())
		}
	})

	t.Run("refuses output symlink", func(t *testing.T) {
		target := filepath.Join(root, "target.json")
		link := filepath.Join(root, "link.json")
		mustWrite(t, target, "{}")
		if err := os.Symlink(target, link); err != nil {
			t.Skipf("symlink unavailable: %v", err)
		}
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"scan", "--selection", selection, "--out", link, "--force"}, &stdout, &stderr)
		if code == 0 || !strings.Contains(stderr.String(), "symlink") {
			t.Fatalf("code = %d stderr = %q, want symlink error", code, stderr.String())
		}
	})

	t.Run("force replaces symlink instead of truncating target", func(t *testing.T) {
		target := filepath.Join(root, "target-to-preserve.json")
		link := filepath.Join(root, "swap-link.json")
		mustWrite(t, target, "preserve me")
		mustWrite(t, link, "{}")
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"scan", "--selection", selection, "--out", link, "--force"}, &stdout, &stderr)
		if code != 0 {
			t.Fatalf("initial force write failed: code = %d stderr = %q", code, stderr.String())
		}
		if err := os.Remove(link); err != nil {
			t.Fatal(err)
		}
		if err := os.Symlink(target, link); err != nil {
			t.Skipf("symlink unavailable: %v", err)
		}

		graph := readGraph(t, filepath.Join(root, "graph.json"))
		if err := scanWriteForTest(link, graph); err != nil {
			t.Fatalf("direct write failed: %v", err)
		}
		data, err := os.ReadFile(target)
		if err != nil {
			t.Fatal(err)
		}
		if string(data) != "preserve me" {
			t.Fatalf("symlink target was modified: %q", data)
		}
		info, err := os.Lstat(link)
		if err != nil {
			t.Fatal(err)
		}
		if info.Mode()&os.ModeSymlink != 0 {
			t.Fatalf("output path is still a symlink")
		}
	})
}

func TestRunScanDoesNotMarkEmptyDirectorySourceVisible(t *testing.T) {
	root := t.TempDir()
	repo := filepath.Join(root, "empty-repo")
	mustMkdir(t, repo)
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{"schema_version":"0.1.0","targets":[{"id":"repo","kind":"repository","path":`+quote(repo)+`}],"claims":[]}`)
	out := filepath.Join(root, "graph.json")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	code := Run([]string{"scan", "--selection", selection, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	states := evidenceStates(t, readGraph(t, out))
	if states["source-visible"] {
		t.Fatalf("states = %#v, did not expect source-visible", states)
	}
	if !states["cannot_verify"] {
		t.Fatalf("states = %#v, want cannot_verify", states)
	}
}

func TestRunScanDoesNotMarkSymlinkOnlyRepositorySourceVisible(t *testing.T) {
	root := t.TempDir()
	repo := filepath.Join(root, "repo")
	outside := filepath.Join(root, "outside")
	mustMkdir(t, repo)
	mustMkdir(t, outside)
	if err := os.Symlink(outside, filepath.Join(repo, "outside-link")); err != nil {
		t.Skipf("symlink unavailable: %v", err)
	}
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{"schema_version":"0.1.0","targets":[{"id":"repo","kind":"repository","path":`+quote(repo)+`}],"claims":[]}`)
	out := filepath.Join(root, "graph.json")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	code := Run([]string{"scan", "--selection", selection, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	states := evidenceStates(t, readGraph(t, out))
	if states["source-visible"] {
		t.Fatalf("states = %#v, did not expect source-visible", states)
	}
	if !states["cannot_verify"] {
		t.Fatalf("states = %#v, want cannot_verify", states)
	}
}

func TestRunScanDoesNotFollowSelectedRootSymlink(t *testing.T) {
	root := t.TempDir()
	realRepo := filepath.Join(root, "real-repo")
	linkRepo := filepath.Join(root, "repo-link")
	mustMkdir(t, realRepo)
	mustWrite(t, filepath.Join(realRepo, "README.md"), "# Real\n")
	if err := os.Symlink(realRepo, linkRepo); err != nil {
		t.Skipf("symlink unavailable: %v", err)
	}
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{"schema_version":"0.1.0","targets":[{"id":"repo","kind":"repository","path":`+quote(linkRepo)+`}],"claims":[]}`)
	out := filepath.Join(root, "graph.json")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	code := Run([]string{"scan", "--selection", selection, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	states := evidenceStates(t, readGraph(t, out))
	if states["source-visible"] {
		t.Fatalf("states = %#v, did not expect source-visible", states)
	}
	if !states["cannot_verify"] {
		t.Fatalf("states = %#v, want cannot_verify", states)
	}
}

func TestRunScanRecordsLexicalPathTraversalAndOutsideSymlinkAsCannotVerify(t *testing.T) {
	root := t.TempDir()
	repo := filepath.Join(root, "repo")
	outside := filepath.Join(root, "outside")
	mustMkdir(t, repo)
	mustMkdir(t, outside)
	link := filepath.Join(repo, "outside-link")
	if err := os.Symlink(outside, link); err != nil {
		t.Skipf("symlink unavailable: %v", err)
	}
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{"schema_version":"0.1.0","targets":[{"id":"repo","kind":"repository","path":`+quote(filepath.Join(repo, "..", "repo"))+`}],"claims":[]}`)
	out := filepath.Join(root, "graph.json")

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	code := Run([]string{"scan", "--selection", selection, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	states := evidenceStates(t, readGraph(t, out))
	if !states["cannot_verify"] {
		t.Fatalf("states = %#v, want cannot_verify", states)
	}
}

func mustMkdir(t *testing.T, path string) {
	t.Helper()
	if err := os.MkdirAll(path, 0o755); err != nil {
		t.Fatal(err)
	}
}

func mustWrite(t *testing.T, path, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

func writeSelection(t *testing.T, root, name, content string) string {
	t.Helper()
	path := filepath.Join(root, "selection-"+name+".json")
	mustWrite(t, path, content)
	return path
}

func quote(value string) string {
	data, err := json.Marshal(value)
	if err != nil {
		panic(err)
	}
	return string(data)
}

func readGraph(t *testing.T, path string) map[string]any {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var graph map[string]any
	if err := json.Unmarshal(data, &graph); err != nil {
		t.Fatal(err)
	}
	return graph
}

func evidenceStates(t *testing.T, graph map[string]any) map[string]bool {
	t.Helper()
	states := map[string]bool{}
	for _, item := range graph["nodes"].([]any) {
		node := item.(map[string]any)
		evidence := node["evidence"].(map[string]any)
		states[evidence["state"].(string)] = true
	}
	for _, item := range graph["edges"].([]any) {
		edge := item.(map[string]any)
		evidence := edge["evidence"].(map[string]any)
		states[evidence["state"].(string)] = true
	}
	return states
}

func assertSchemaShape(t *testing.T, graph map[string]any) {
	t.Helper()
	if graph["generated_by"] == "" {
		t.Fatalf("generated_by is required")
	}
	validNodeKinds := map[string]bool{"repository": true, "service": true, "package": true, "runtime": true, "team": true, "claim": true, "unknown": true}
	validEdgeKinds := map[string]bool{"owns": true, "depends-on": true, "exposes": true, "imports": true, "observes": true, "claims": true, "unknown": true}
	validStates := map[string]bool{"source-visible": true, "metadata-visible": true, "runtime-visible": true, "claim-only": true, "unknown": true, "cannot_verify": true}
	for _, item := range graph["nodes"].([]any) {
		node := item.(map[string]any)
		for _, field := range []string{"id", "kind", "label"} {
			if node[field] == "" {
				t.Fatalf("node missing %s: %#v", field, node)
			}
		}
		if !validNodeKinds[node["kind"].(string)] {
			t.Fatalf("invalid node kind: %#v", node)
		}
		assertEvidenceShape(t, node["evidence"].(map[string]any), validStates)
	}
	for _, item := range graph["edges"].([]any) {
		edge := item.(map[string]any)
		for _, field := range []string{"from", "to", "kind"} {
			if edge[field] == "" {
				t.Fatalf("edge missing %s: %#v", field, edge)
			}
		}
		if !validEdgeKinds[edge["kind"].(string)] {
			t.Fatalf("invalid edge kind: %#v", edge)
		}
		assertEvidenceShape(t, edge["evidence"].(map[string]any), validStates)
	}
}

func assertEvidenceShape(t *testing.T, evidence map[string]any, validStates map[string]bool) {
	t.Helper()
	state, ok := evidence["state"].(string)
	if !ok || !validStates[state] {
		t.Fatalf("invalid evidence state: %#v", evidence)
	}
	source, ok := evidence["source"].(string)
	if !ok || source == "" {
		t.Fatalf("invalid evidence source: %#v", evidence)
	}
}

func scanWriteForTest(path string, raw map[string]any) error {
	var g graph.Graph
	data, err := json.Marshal(raw)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(data, &g); err != nil {
		return err
	}
	return scan.Write(path, g, true)
}

func TestRunUnknownCommandReturnsUsageError(t *testing.T) {
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"rewrite"}, &stdout, &stderr)

	if code != 2 {
		t.Fatalf("Run returned %d, want 2", code)
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	if got := stderr.String(); !strings.Contains(got, "unknown command") {
		t.Fatalf("stderr = %q, want unknown command message", got)
	}
}
