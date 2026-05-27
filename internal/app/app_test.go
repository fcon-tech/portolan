package app

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/fall-out-bug/portolan/internal/graph"
	"github.com/fall-out-bug/portolan/internal/scan"
)

const mapCommandFixtureRoot = "../../testdata/map-command/repo"
const relationshipFixtureRoot = "../../testdata/relationship-detection/repo"
const duplicationFixtureRoot = "../../testdata/duplication-detection/repo"
const configurationFixtureRoot = "../../testdata/configuration-surfaces/repo"
const technicalDebtFixtureRoot = "../../testdata/technical-debt-findings/repo"
const landscapeMapSelection = "../../testdata/landscape-map/selection.json"

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

func TestBootstrapPortolanScriptBuildsLocalBinary(t *testing.T) {
	script, err := filepath.Abs("../../scripts/bootstrap-portolan")
	if err != nil {
		t.Fatalf("resolve bootstrap script: %v", err)
	}
	workDir := t.TempDir()
	out := filepath.Join(workDir, "bin", "portolan")

	help := exec.Command(script, "--help")
	help.Dir = "."
	helpOut, err := help.CombinedOutput()
	if err != nil {
		t.Fatalf("bootstrap help failed: %v\n%s", err, helpOut)
	}
	for _, want := range []string{".portolan/bin/portolan", "network: disabled", "PORTOLAN_BOOTSTRAP_ALLOW_NETWORK"} {
		if !strings.Contains(string(helpOut), want) {
			t.Fatalf("bootstrap help missing %q:\n%s", want, helpOut)
		}
	}

	build := exec.Command(script, "--out", filepath.Join("bin", "portolan"))
	build.Dir = workDir
	buildOut, err := build.CombinedOutput()
	if err != nil {
		t.Fatalf("bootstrap build failed: %v\n%s", err, buildOut)
	}
	if !strings.Contains(string(buildOut), "wrote "+out) {
		t.Fatalf("bootstrap output = %q, want written binary path", buildOut)
	}

	version := exec.Command(out, "--version")
	versionOut, err := version.CombinedOutput()
	if err != nil {
		t.Fatalf("bootstrapped binary failed: %v\n%s", err, versionOut)
	}
	if got := strings.TrimSpace(string(versionOut)); got != "portolan dev" {
		t.Fatalf("version output = %q, want portolan dev", got)
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

func TestRunSelectionGenerateBigtopWritesFullCorpusSelection(t *testing.T) {
	root := t.TempDir()
	repoDir := filepath.Join(root, "repos")
	mustMkdir(t, filepath.Join(repoDir, "apache-bigtop-repo"))
	mustMkdir(t, filepath.Join(repoDir, "apache-hadoop"))
	manifest := filepath.Join(root, "manifest.json")
	mustWrite(t, manifest, `{
		"schema_version":"0.1.0",
		"id":"apache-bigtop",
		"targets":[
			{"id":"apache-bigtop-repo","label":"Bigtop","kind":"repository","lifecycle":"active","role":"integrator","evidence_state":"source-visible"},
			{"id":"apache-hadoop","label":"Hadoop","kind":"repository","lifecycle":"active","role":"filesystem","evidence_state":"source-visible"},
			{"id":"bigtop-utils","label":"Utils","kind":"package","lifecycle":"internal-support","role":"support","evidence_state":"metadata-visible"}
		]
	}`)
	out := filepath.Join(root, "selection.json")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"selection", "generate-bigtop", "--manifest", manifest, "--repo-dir", repoDir, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	selection := readJSONFile(t, out)
	if selection["corpus_manifest"] != manifest || selection["require_full_corpus"] != true {
		t.Fatalf("selection = %#v, want full-corpus manifest fields", selection)
	}
	targets := selection["targets"].([]any)
	if len(targets) != 2 {
		t.Fatalf("targets = %#v, want only active repositories", targets)
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

func TestRunDiffHelpDescribesLocalGraphDiff(t *testing.T) {
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"diff", "--help"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	out := stdout.String()
	for _, want := range []string{"--base", "--head", "--out", "local", "no network", "evidence-state transitions"} {
		if !strings.Contains(out, want) {
			t.Fatalf("stdout %q does not contain %q", out, want)
		}
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
}

func TestRunDiffWritesMachineReadableEvidenceDiff(t *testing.T) {
	out := filepath.Join(t.TempDir(), "diff.json")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"diff", "--base", "testdata/evidence-diff/base.json", "--head", "testdata/evidence-diff/head.json", "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	if !strings.Contains(stdout.String(), "wrote ") {
		t.Fatalf("stdout = %q, want write summary", stdout.String())
	}
	result := readGraph(t, out)
	if result["generated_by"] != "portolan" {
		t.Fatalf("generated_by = %v, want portolan", result["generated_by"])
	}
	nodes := result["nodes"].(map[string]any)
	edges := result["edges"].(map[string]any)
	for section, want := range map[string]int{"added": 1, "removed": 1, "unchanged": 1, "changed": 1} {
		if got := len(nodes[section].([]any)); got != want {
			t.Fatalf("nodes.%s length = %d, want %d: %#v", section, got, want, nodes[section])
		}
	}
	for section, want := range map[string]int{"added": 1, "removed": 1, "unchanged": 1, "changed": 1} {
		if got := len(edges[section].([]any)); got != want {
			t.Fatalf("edges.%s length = %d, want %d: %#v", section, got, want, edges[section])
		}
	}
	nodeChange := nodes["changed"].([]any)[0].(map[string]any)
	if nodeChange["id"] != "api" || nodeChange["evidence_state_transition"] != "unknown -> metadata-visible" {
		t.Fatalf("node change = %#v, want api evidence-state transition", nodeChange)
	}
	edgeChange := edges["changed"].([]any)[0].(map[string]any)
	if edgeChange["evidence_state_transition"] != "unknown -> metadata-visible" {
		t.Fatalf("edge change = %#v, want evidence-state transition", edgeChange)
	}
}

func TestRunDiffDoesNotEmitReadinessVerdicts(t *testing.T) {
	out := filepath.Join(t.TempDir(), "diff.json")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"diff", "--base", "testdata/evidence-diff/base.json", "--head", "testdata/evidence-diff/head.json", "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	data, err := os.ReadFile(out)
	if err != nil {
		t.Fatal(err)
	}
	lower := strings.ToLower(string(data))
	for _, forbidden := range []string{`"readiness"`, `"pass"`, `"fail"`, `"improvement"`, `"degradation"`, `"verdict"`} {
		if strings.Contains(lower, forbidden) {
			t.Fatalf("diff output contains forbidden verdict term %q:\n%s", forbidden, data)
		}
	}
}

func TestRunDiffIdenticalInputsAreUnchanged(t *testing.T) {
	out := filepath.Join(t.TempDir(), "diff.json")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"diff", "--base", "testdata/evidence-diff/base.json", "--head", "testdata/evidence-diff/base.json", "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	result := readGraph(t, out)
	nodes := result["nodes"].(map[string]any)
	edges := result["edges"].(map[string]any)
	if got := len(nodes["unchanged"].([]any)); got != 3 {
		t.Fatalf("nodes.unchanged length = %d, want 3", got)
	}
	if got := len(edges["unchanged"].([]any)); got != 3 {
		t.Fatalf("edges.unchanged length = %d, want 3", got)
	}
	for _, section := range []string{"added", "removed", "changed"} {
		if got := len(nodes[section].([]any)); got != 0 {
			t.Fatalf("nodes.%s length = %d, want 0", section, got)
		}
		if got := len(edges[section].([]any)); got != 0 {
			t.Fatalf("edges.%s length = %d, want 0", section, got)
		}
	}
}

func TestRunDiffRejectsInvalidInputs(t *testing.T) {
	root := t.TempDir()
	tests := []struct {
		name string
		args []string
		want string
	}{
		{
			name: "bare command",
			args: []string{"diff"},
			want: "--base is required",
		},
		{
			name: "missing base",
			args: []string{"diff", "--head", "testdata/evidence-diff/head.json", "--out", filepath.Join(root, "diff.json")},
			want: "--base is required",
		},
		{
			name: "missing head",
			args: []string{"diff", "--base", "testdata/evidence-diff/base.json", "--out", filepath.Join(root, "diff.json")},
			want: "--head is required",
		},
		{
			name: "missing output",
			args: []string{"diff", "--base", "testdata/evidence-diff/base.json", "--head", "testdata/evidence-diff/head.json"},
			want: "--out is required",
		},
		{
			name: "malformed graph",
			args: []string{"diff", "--base", "testdata/human-readable-packet/malformed-graph.json", "--head", "testdata/evidence-diff/head.json", "--out", filepath.Join(root, "malformed.json")},
			want: "parse graph",
		},
		{
			name: "missing base file",
			args: []string{"diff", "--base", "testdata/evidence-diff/missing.json", "--head", "testdata/evidence-diff/head.json", "--out", filepath.Join(root, "missing-base.json")},
			want: "read base graph",
		},
		{
			name: "missing head file",
			args: []string{"diff", "--base", "testdata/evidence-diff/base.json", "--head", "testdata/evidence-diff/missing.json", "--out", filepath.Join(root, "missing-head.json")},
			want: "read head graph",
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

func TestRunDiffOutputSafety(t *testing.T) {
	root := t.TempDir()
	existing := filepath.Join(root, "diff.json")
	mustWrite(t, existing, "preserve me")

	t.Run("existing output requires force", func(t *testing.T) {
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"diff", "--base", "testdata/evidence-diff/base.json", "--head", "testdata/evidence-diff/head.json", "--out", existing}, &stdout, &stderr)
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
		code := Run([]string{"diff", "--base", "testdata/evidence-diff/base.json", "--head", "testdata/evidence-diff/head.json", "--out", existing, "--force"}, &stdout, &stderr)
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
		code := Run([]string{"diff", "--base", "testdata/evidence-diff/base.json", "--head", "testdata/evidence-diff/head.json", "--out", link, "--force"}, &stdout, &stderr)
		if code == 0 || !strings.Contains(stderr.String(), "symlink") {
			t.Fatalf("code = %d stderr = %q, want symlink error", code, stderr.String())
		}
	})
}

func TestRunMapWritesArtifactBundle(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", mapCommandFixtureRoot, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	if !strings.Contains(stdout.String(), "wrote map bundle") {
		t.Fatalf("stdout = %q, want bundle summary", stdout.String())
	}
	for _, name := range []string{"run.json", "coverage.json", "graph.json", "graph-index.json", "findings.jsonl", "summary.json", "map.md"} {
		if _, err := os.Stat(filepath.Join(out, name)); err != nil {
			t.Fatalf("missing %s: %v", name, err)
		}
	}
	graph := readGraph(t, filepath.Join(out, "graph.json"))
	assertSchemaShape(t, graph)
	states := evidenceStates(t, graph)
	if !states["source-visible"] {
		t.Fatalf("states = %#v, want source-visible", states)
	}
	mapText, err := os.ReadFile(filepath.Join(out, "map.md"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(mapText), "- Findings: ") {
		t.Fatalf("map.md = %q, want finding count", string(mapText))
	}
	if !strings.Contains(string(mapText), "## Skipped Surfaces") {
		t.Fatalf("map.md = %q, want skipped surfaces warning", string(mapText))
	}
	if !strings.Contains(string(mapText), "Inspect `summary.json` and `graph-index.json` before loading full `graph.json`") {
		t.Fatalf("map.md = %q, want summary-first next task", string(mapText))
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
}

func TestRunMapWritesAgentScaleSummary(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, ".git"))
	mustMkdir(t, filepath.Join(root, ".github", "workflows"))
	mustMkdir(t, filepath.Join(root, "cmd"))
	mustMkdir(t, filepath.Join(root, "tests"))
	mustWrite(t, filepath.Join(root, "go.mod"), "module example.com/summary\n")
	mustWrite(t, filepath.Join(root, "cmd", "main.go"), "package main\n")
	mustWrite(t, filepath.Join(root, ".github", "workflows", "ci.yml"), "name: ci\n")
	mustWrite(t, filepath.Join(root, "Dockerfile"), "FROM scratch\n")
	mustWrite(t, filepath.Join(root, "config.yaml"), "service: demo\n")
	mustWrite(t, filepath.Join(root, "README.md"), "# Demo\n")
	mustWrite(t, filepath.Join(root, "tests", "app_test.py"), "def test_app(): pass\n")

	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", root, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	summary := readJSONFile(t, filepath.Join(out, "summary.json"))
	if summary["schema_version"] != "0.1.0" || summary["generated_by"] != "portolan" {
		t.Fatalf("summary identity = %#v", summary)
	}
	graph := summary["graph"].(map[string]any)
	if graph["nodes"].(float64) == 0 || graph["edges"].(float64) == 0 {
		t.Fatalf("summary graph = %#v, want node and edge counts", graph)
	}
	evidenceStates := graph["evidence_states"].(map[string]any)
	if evidenceStates["source-visible"].(float64) == 0 {
		t.Fatalf("evidence states = %#v, want source-visible", evidenceStates)
	}
	findings := summary["findings"].(map[string]any)
	if findings["total"].(float64) == 0 || findings["not_assessed_total"].(float64) == 0 {
		t.Fatalf("finding summary = %#v, want total and not_assessed counts", findings)
	}
	coverage := summary["coverage"].(map[string]any)
	if coverage["records"].(float64) == 0 {
		t.Fatalf("coverage summary = %#v, want records", coverage)
	}
	weak := coverage["weak_records"].([]any)
	if len(weak) == 0 {
		t.Fatalf("coverage summary = %#v, want weak records", coverage)
	}
	surfaces := summary["file_surfaces"].(map[string]any)
	for _, want := range []string{"manifest", "source", "workflow", "container", "config", "doc", "test"} {
		if surfaces[want].(float64) == 0 {
			t.Fatalf("file surfaces = %#v, want %q", surfaces, want)
		}
	}
}

func TestRunMapWritesBoundedGraphIndex(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, ".git"))
	mustMkdir(t, filepath.Join(root, "cmd"))
	mustWrite(t, filepath.Join(root, "go.mod"), "module example.com/index\n")
	for i := 0; i < 25; i++ {
		mustWrite(t, filepath.Join(root, "cmd", fmt.Sprintf("file%02d.go", i)), "package main\n")
	}

	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", root, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	index := readJSONFile(t, filepath.Join(out, "graph-index.json"))
	if index["schema_version"] != "0.1.0" || index["generated_by"] != "portolan" {
		t.Fatalf("graph index identity = %#v", index)
	}
	budget := index["budget"].(map[string]any)
	if budget["node_samples_per_kind"] != float64(20) || budget["edge_samples_per_kind"] != float64(20) {
		t.Fatalf("budget = %#v, want 20-sample limits", budget)
	}
	sizes := index["artifact_sizes"].(map[string]any)
	for _, artifact := range []string{"graph.json", "graph-index.json", "summary.json", "map.md"} {
		if sizes[artifact].(float64) <= 0 {
			t.Fatalf("artifact sizes = %#v, want positive %s", sizes, artifact)
		}
	}
	nodeSlices := index["node_slices"].([]any)
	sourceSlice := findSliceByKind(t, nodeSlices, "unknown")
	if sourceSlice["total"].(float64) <= float64(20) || sourceSlice["truncated"].(float64) == 0 {
		t.Fatalf("source slice = %#v, want bounded truncated sample", sourceSlice)
	}
	if got := len(sourceSlice["samples"].([]any)); got != 20 {
		t.Fatalf("sample count = %d, want 20", got)
	}
	edgeSlices := index["edge_slices"].([]any)
	if len(edgeSlices) == 0 {
		t.Fatalf("edge slices = %#v, want bounded edge refs", edgeSlices)
	}
	findingSlices := index["finding_slices"].([]any)
	if len(findingSlices) == 0 {
		t.Fatalf("finding slices = %#v, want finding refs", findingSlices)
	}
	highDegree := index["high_degree_nodes"].([]any)
	if len(highDegree) == 0 {
		t.Fatalf("high degree nodes = %#v, want graph entrypoints", highDegree)
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
}

func TestRunGraphSliceHelpDescribesSliceModes(t *testing.T) {
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"graph", "slice", "--help"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	out := stdout.String()
	for _, want := range []string{"--bundle", "--repo", "--edge-kind", "--finding-kind", "--out", "-o", "--limit", "summary.json", "graph-index.json"} {
		if !strings.Contains(out, want) {
			t.Fatalf("stdout %q does not contain %q", out, want)
		}
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
}

func TestRunGraphSliceWritesBoundedSlices(t *testing.T) {
	bundle := filepath.Join(t.TempDir(), "run")
	var mapStdout bytes.Buffer
	var mapStderr bytes.Buffer
	if code := Run([]string{"map", "--root", mapCommandFixtureRoot, "--out", bundle, "--force"}, &mapStdout, &mapStderr); code != 0 {
		t.Fatalf("map returned %d, want 0; stderr = %q", code, mapStderr.String())
	}

	t.Run("repo", func(t *testing.T) {
		out := filepath.Join(t.TempDir(), "repo-slice.json")
		var stdout bytes.Buffer
		var stderr bytes.Buffer

		code := Run([]string{"graph", "slice", "--bundle", bundle, "--repo", "root", "--limit", "2", "--out", out}, &stdout, &stderr)

		if code != 0 {
			t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
		}
		slice := readJSONFile(t, out)
		criteria := slice["criteria"].(map[string]any)
		if criteria["mode"] != "repo" || criteria["value"] != "root" {
			t.Fatalf("criteria = %#v, want repo root", criteria)
		}
		if got := len(slice["edges"].([]any)); got != 2 {
			t.Fatalf("repo edges = %d, want limit 2", got)
		}
		truncated := slice["truncated"].(map[string]any)
		if truncated["edges"].(float64) == 0 {
			t.Fatalf("truncated = %#v, want edge truncation", truncated)
		}
		if !strings.Contains(stdout.String(), "wrote graph slice") {
			t.Fatalf("stdout = %q, want graph slice output", stdout.String())
		}
		if stderr.Len() != 0 {
			t.Fatalf("stderr = %q, want empty", stderr.String())
		}
	})

	t.Run("edge kind", func(t *testing.T) {
		out := filepath.Join(t.TempDir(), "edge-slice.json")
		var stdout bytes.Buffer
		var stderr bytes.Buffer

		code := Run([]string{"graph", "slice", "--bundle", bundle, "--edge-kind", "observes", "--limit", "2", "--out", out}, &stdout, &stderr)

		if code != 0 {
			t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
		}
		slice := readJSONFile(t, out)
		if got := len(slice["edges"].([]any)); got != 2 {
			t.Fatalf("edge samples = %d, want limit 2", got)
		}
		for _, raw := range slice["edges"].([]any) {
			edge := raw.(map[string]any)
			if edge["kind"] != "observes" || edge["evidence_state"] == "" {
				t.Fatalf("edge = %#v, want observes with evidence state", edge)
			}
		}
	})

	t.Run("finding kind", func(t *testing.T) {
		out := filepath.Join(t.TempDir(), "finding-slice.json")
		var stdout bytes.Buffer
		var stderr bytes.Buffer

		code := Run([]string{"graph", "slice", "--bundle", bundle, "--finding-kind", "relationships", "--limit", "2", "--out", out}, &stdout, &stderr)

		if code != 0 {
			t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
		}
		slice := readJSONFile(t, out)
		if got := len(slice["findings"].([]any)); got != 2 {
			t.Fatalf("finding samples = %d, want limit 2", got)
		}
		for _, raw := range slice["findings"].([]any) {
			finding := raw.(map[string]any)
			if finding["kind"] != "relationships" || finding["evidence_state"] == "" {
				t.Fatalf("finding = %#v, want relationships with evidence state", finding)
			}
		}
	})

	t.Run("short output flag", func(t *testing.T) {
		out := filepath.Join(t.TempDir(), "short-output-slice.json")
		var stdout bytes.Buffer
		var stderr bytes.Buffer

		code := Run([]string{"graph", "slice", "--bundle", bundle, "--edge-kind", "observes", "--limit", "1", "-o", out}, &stdout, &stderr)

		if code != 0 {
			t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
		}
		slice := readJSONFile(t, out)
		if got := len(slice["edges"].([]any)); got != 1 {
			t.Fatalf("edge samples = %d, want limit 1", got)
		}
	})
}

func TestRunAdapterValidateAcceptsKnownOSSContracts(t *testing.T) {
	for _, fixture := range []string{"jscpd.json", "syft-cyclonedx.json", "semgrep.json"} {
		t.Run(fixture, func(t *testing.T) {
			var stdout bytes.Buffer
			var stderr bytes.Buffer

			code := Run([]string{"adapter", "validate", "--in", filepath.Join("..", "..", "testdata", "oss-adapter-contract", fixture)}, &stdout, &stderr)

			if code != 0 {
				t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
			}
			if !strings.Contains(stdout.String(), "validated adapter") {
				t.Fatalf("stdout = %q, want validation output", stdout.String())
			}
			if stderr.Len() != 0 {
				t.Fatalf("stderr = %q, want empty", stderr.String())
			}
		})
	}
}

func TestRunAdapterValidateRejectsUnsafeContract(t *testing.T) {
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"adapter", "validate", "--in", filepath.Join("..", "..", "testdata", "oss-adapter-contract", "invalid-network-mutating.json")}, &stdout, &stderr)

	if code == 0 {
		t.Fatalf("Run returned %d, want validation failure", code)
	}
	for _, want := range []string{"execution.network", "execution.mutates_target", "redaction_required"} {
		if !strings.Contains(stderr.String(), want) {
			t.Fatalf("stderr = %q, want %q", stderr.String(), want)
		}
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
}

func TestRunAdapterValidateHelp(t *testing.T) {
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"adapter", "validate", "--help"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	for _, want := range []string{"adapter validate", "--in", "network calls"} {
		if !strings.Contains(stdout.String(), want) {
			t.Fatalf("stdout = %q, want %q", stdout.String(), want)
		}
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
}

func TestRunContextPrepareHelpDescribesCursorPack(t *testing.T) {
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"context", "prepare", "--help"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	out := stdout.String()
	for _, want := range []string{"--root", "--out", "--profile", "cursor", "agent-brief.md", "answer-contract.md", "evidence-index.jsonl", "oss-plan.json", "no network"} {
		if !strings.Contains(out, want) {
			t.Fatalf("stdout %q does not contain %q", out, want)
		}
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
}

func TestRunContextPrepareWritesCursorPack(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, "repos", "api", ".git"))
	mustMkdir(t, filepath.Join(root, "repos", "web", ".git"))
	mustMkdir(t, filepath.Join(root, "tool-outputs"))
	mustWrite(t, filepath.Join(root, "tool-outputs", "jscpd-report.json"), `{"duplicates":[]}`)
	mustWrite(t, filepath.Join(root, "tool-outputs", "sbom-api.cyclonedx.json"), `{"bomFormat":"CycloneDX"}`)
	mustWrite(t, filepath.Join(root, "catalog-info.yaml"), "apiVersion: backstage.io/v1alpha1\nkind: Component\n")
	mustWrite(t, filepath.Join(root, "catalog-info.json"), `{"items":[{"kind":"Component"},{"kind":"API"}]}`)
	mustWrite(t, filepath.Join(root, "openapi.json"), `{"openapi":"3.1.0","paths":{"/health":{},"/orders":{}}}`)
	mustWrite(t, filepath.Join(root, "asyncapi.json"), `{"asyncapi":"3.0.0","channels":{"orders":{},"payments":{}}}`)
	mustWrite(t, filepath.Join(root, "workspace.structurizr.json"), `{"workspace":{"model":{"softwareSystems":[{"name":"api","containers":[{"name":"worker"}]}]}}}`)
	out := filepath.Join(root, ".portolan", "context")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"context", "prepare", "--root", root, "--out", out, "--profile", "cursor"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	for _, name := range []string{"agent-brief.md", "answer-contract.md", "query-plan.md", "evidence-index.jsonl", "repos.json", "tool-registry.json", "oss-plan.json", "gaps.jsonl"} {
		if _, err := os.Stat(filepath.Join(out, name)); err != nil {
			t.Fatalf("missing %s: %v", name, err)
		}
	}
	repos := readJSONFile(t, filepath.Join(out, "repos.json"))
	items := repos["repositories"].([]any)
	if len(items) != 2 {
		t.Fatalf("repositories = %#v, want api and web", items)
	}
	for _, raw := range items {
		repo := raw.(map[string]any)
		if repo["evidence_state"] != "source-visible" {
			t.Fatalf("repo = %#v, want source-visible", repo)
		}
	}
	registry := readJSONFile(t, filepath.Join(out, "tool-registry.json"))
	families := map[string]bool{}
	for _, raw := range registry["tools"].([]any) {
		entry := raw.(map[string]any)
		families[entry["family"].(string)] = true
		switch entry["family"] {
		case "jscpd":
			if entry["kind"] != "duplication" || entry["status"] != "observed" {
				t.Fatalf("jscpd entry = %#v, want observed duplication", entry)
			}
			metrics := entry["metrics"].(map[string]any)
			if metrics["duplicate_groups"] != float64(0) {
				t.Fatalf("jscpd metrics = %#v, want duplicate_groups 0", metrics)
			}
		case "cyclonedx":
			if entry["kind"] != "sbom" || entry["status"] != "observed" {
				t.Fatalf("cyclonedx entry = %#v, want observed sbom", entry)
			}
			metrics := entry["metrics"].(map[string]any)
			if metrics["components"] != float64(0) {
				t.Fatalf("cyclonedx metrics = %#v, want components 0", metrics)
			}
		case "backstage":
			if entry["kind"] != "service-catalog" || entry["status"] != "observed" || entry["evidence_state"] != "metadata-visible" {
				t.Fatalf("backstage entry = %#v, want observed service catalog", entry)
			}
			metrics := entry["metrics"].(map[string]any)
			if metrics["entities"] != float64(1) && metrics["entities"] != float64(2) {
				t.Fatalf("backstage metrics = %#v, want entities 1 or 2", metrics)
			}
		case "openapi":
			metrics := entry["metrics"].(map[string]any)
			if entry["status"] != "observed" || entry["evidence_state"] != "metadata-visible" || metrics["paths"] != float64(2) {
				t.Fatalf("openapi entry = %#v, want 2 paths", entry)
			}
		case "asyncapi":
			metrics := entry["metrics"].(map[string]any)
			if entry["status"] != "observed" || entry["evidence_state"] != "metadata-visible" || metrics["channels"] != float64(2) {
				t.Fatalf("asyncapi entry = %#v, want 2 channels", entry)
			}
		case "structurizr":
			metrics := entry["metrics"].(map[string]any)
			if entry["status"] != "observed" || entry["evidence_state"] != "metadata-visible" || metrics["elements"] != float64(2) {
				t.Fatalf("structurizr entry = %#v, want 2 elements", entry)
			}
		}
	}
	for _, want := range []string{"jscpd", "cyclonedx", "backstage", "openapi", "asyncapi", "structurizr"} {
		if !families[want] {
			t.Fatalf("tool families = %#v, want %q", families, want)
		}
	}
	gaps, err := os.ReadFile(filepath.Join(out, "gaps.jsonl"))
	if err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{"semgrep", "code-index", "external-completeness"} {
		if !strings.Contains(string(gaps), want) {
			t.Fatalf("gaps.jsonl = %q, want %q", gaps, want)
		}
	}
	evidenceIndex, err := os.ReadFile(filepath.Join(out, "evidence-index.jsonl"))
	if err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{
		`"kind":"repository"`,
		`"source_artifact":"repos.json"`,
		`"kind":"tool-output"`,
		`"family":"jscpd"`,
		`"source_artifact":"tool-registry.json"`,
		`"kind":"gap"`,
		`"family":"external-completeness"`,
		`"source_artifact":"gaps.jsonl"`,
	} {
		if !strings.Contains(string(evidenceIndex), want) {
			t.Fatalf("evidence-index.jsonl = %q, want %q", evidenceIndex, want)
		}
	}
	ossPlan := readJSONFile(t, filepath.Join(out, "oss-plan.json"))
	plans := ossPlan["tools"].([]any)
	planByID := map[string]map[string]any{}
	for _, raw := range plans {
		plan := raw.(map[string]any)
		planByID[plan["id"].(string)] = plan
	}
	if planByID["jscpd"]["status"] != "input_present" || planByID["cyclonedx"]["status"] != "input_present" {
		t.Fatalf("oss plan = %#v, want existing jscpd and cyclonedx inputs preferred", planByID)
	}
	if planByID["semgrep"]["status"] != "not_assessed" {
		t.Fatalf("semgrep plan = %#v, want not_assessed without local config", planByID["semgrep"])
	}
	brief, err := os.ReadFile(filepath.Join(out, "agent-brief.md"))
	if err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{"Cursor", "answer-contract.md", "oss-plan.json", "unknown", "cannot_verify", "Do not infer"} {
		if !strings.Contains(string(brief), want) {
			t.Fatalf("agent-brief.md missing %q:\n%s", want, brief)
		}
	}
	answerContract, err := os.ReadFile(filepath.Join(out, "answer-contract.md"))
	if err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{
		"Mandatory Answer Shape",
		"findings.jsonl",
		"graph.json",
		"coverage.json",
		"summary.json",
		"evidence-index.jsonl",
		"tool-registry.json",
		"oss-plan.json",
		"gaps.jsonl",
		"duplicate components",
		"implicit knowledge",
		"configuration matters",
		"technical debt",
		"Allowed Next Commands",
		"Do not invent Portolan commands",
		"portolan selection validate --selection <selection.json>",
		"portolan map --selection <selection.json> --out <run-dir> --force",
		"There is no generic `portolan context --manifest` command",
		"not_assessed",
		"cannot_verify",
	} {
		if !strings.Contains(string(answerContract), want) {
			t.Fatalf("answer-contract.md missing %q:\n%s", want, answerContract)
		}
	}
	contractText := string(answerContract)
	taxonomyStart := strings.Index(contractText, "## Relationship Evidence Taxonomy")
	if taxonomyStart < 0 {
		t.Fatalf("answer-contract.md missing relationship taxonomy section:\n%s", answerContract)
	}
	taxonomyEnd := strings.Index(contractText[taxonomyStart+1:], "\n## ")
	taxonomySection := contractText[taxonomyStart:]
	if taxonomyEnd >= 0 {
		taxonomySection = contractText[taxonomyStart : taxonomyStart+1+taxonomyEnd]
	}
	for _, want := range []string{
		"Source dependency",
		"Declared service/API",
		"Runtime communication",
		"Ownership",
		"Lifecycle",
		"Evidence type",
		"`runtime-visible`",
		"evidence-index.jsonl",
		"tool-registry.json",
		"gaps.jsonl",
		"summary.json",
		"graph-index.json",
		"what talks to what?",
		"`claim-only`",
		"`unknown`",
		"`cannot_verify`",
		"runtime topology is `not_assessed`",
	} {
		if !strings.Contains(taxonomySection, want) {
			t.Errorf("answer-contract.md relationship taxonomy missing %q:\n%s", want, taxonomySection)
		}
	}
	if stderr.Len() != 0 {
		t.Fatalf("stderr = %q, want empty", stderr.String())
	}
}

func TestRunContextPrepareWritesOSSExecutionPlan(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, ".git"))
	mustWrite(t, filepath.Join(root, ".semgrep.yml"), "rules: []\n")
	bin := filepath.Join(t.TempDir(), "bin")
	mustMkdir(t, bin)
	for _, name := range []string{"jscpd", "syft", "semgrep"} {
		path := filepath.Join(bin, name)
		mustWrite(t, path, "#!/bin/sh\nexit 0\n")
		if err := os.Chmod(path, 0o755); err != nil {
			t.Fatal(err)
		}
	}
	t.Setenv("PATH", bin)
	out := filepath.Join(root, ".portolan", "context")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"context", "prepare", "--root", root, "--out", out, "--profile", "cursor"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	ossPlan := readJSONFile(t, filepath.Join(out, "oss-plan.json"))
	if ossPlan["schema_version"] != "0.1.0" || ossPlan["root"] != root {
		t.Fatalf("oss plan identity = %#v", ossPlan)
	}
	toolOutputDir := ossPlan["tool_output_dir"].(string)
	if toolOutputDir != filepath.Join(out, "tool-outputs") {
		t.Fatalf("tool_output_dir = %q, want context tool-outputs dir", toolOutputDir)
	}
	plans := ossPlan["tools"].([]any)
	planByID := map[string]map[string]any{}
	for _, raw := range plans {
		plan := raw.(map[string]any)
		planByID[plan["id"].(string)] = plan
	}
	for _, id := range []string{"jscpd", "cyclonedx", "semgrep"} {
		plan := planByID[id]
		if plan["status"] != "available_not_run" || plan["evidence_state"] != "not_assessed" {
			t.Fatalf("%s plan = %#v, want available_not_run/not_assessed", id, plan)
		}
		commands := plan["commands"].([]any)
		if len(commands) != 1 {
			t.Fatalf("%s commands = %#v, want one command", id, commands)
		}
		command := commands[0].(map[string]any)
		if command["mutates_target"] != false || command["requires_user_approval"] != true {
			t.Fatalf("%s command = %#v, want no target mutation and user approval", id, command)
		}
		for _, rawWrite := range command["writes"].([]any) {
			writePath := rawWrite.(string)
			if !strings.HasPrefix(writePath, toolOutputDir+string(filepath.Separator)) {
				t.Fatalf("%s command writes %q outside %q", id, writePath, toolOutputDir)
			}
		}
		args := fmt.Sprint(command["args"])
		if strings.Contains(args, "--config auto") {
			t.Fatalf("%s command args = %q, must not use network-backed config auto", id, args)
		}
	}
	jscpdCommand := planByID["jscpd"]["commands"].([]any)[0].(map[string]any)
	jscpdArgs := fmt.Sprint(jscpdCommand["args"])
	for _, want := range []string{"--max-size 100kb", "--max-lines 1000", "--noSymlinks", "--silent", "**/node_modules/**", "**/.portolan/**"} {
		if !strings.Contains(jscpdArgs, want) {
			t.Fatalf("jscpd args = %s, want bounded argument %q", jscpdArgs, want)
		}
	}
	if strings.Contains(jscpdArgs, "--exitCode") {
		t.Fatalf("jscpd args = %s, must not force producer exit code", jscpdArgs)
	}
	jscpdLimits := jscpdCommand["limits"].([]any)
	wantLimits := []string{
		"max source file size: 100kb",
		"max source file lines: 1000",
		"ignore .git, .portolan, node_modules, vendor, build, dist, target, and generated directories",
		"respect local .gitignore files",
		"producer exit status remains visible to the operator",
	}
	if len(jscpdLimits) != len(wantLimits) {
		t.Fatalf("jscpd limits = %#v, want %d limits", jscpdLimits, len(wantLimits))
	}
	for i, want := range wantLimits {
		if jscpdLimits[i] != want {
			t.Fatalf("jscpd limits[%d] = %q, want %q", i, jscpdLimits[i], want)
		}
	}
}

func TestRunContextPreparePreservesContextToolOutputs(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, ".git"))
	out := filepath.Join(root, ".portolan", "context")
	toolOutputs := filepath.Join(out, "tool-outputs")
	mustMkdir(t, toolOutputs)
	mustWrite(t, filepath.Join(toolOutputs, "syft.cyclonedx.json"), `{"bomFormat":"CycloneDX","components":[{"name":"api"}]}`)
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"context", "prepare", "--root", root, "--out", out, "--profile", "cursor", "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	if _, err := os.Stat(filepath.Join(toolOutputs, "syft.cyclonedx.json")); err != nil {
		t.Fatalf("tool output was not preserved: %v", err)
	}
	registry := readJSONFile(t, filepath.Join(out, "tool-registry.json"))
	tools := registry["tools"].([]any)
	if len(tools) != 1 {
		t.Fatalf("tools = %#v, want preserved CycloneDX output", tools)
	}
	entry := tools[0].(map[string]any)
	if entry["family"] != "cyclonedx" || entry["status"] != "observed" {
		t.Fatalf("entry = %#v, want observed CycloneDX", entry)
	}
	ossPlan := readJSONFile(t, filepath.Join(out, "oss-plan.json"))
	plans := ossPlan["tools"].([]any)
	for _, raw := range plans {
		plan := raw.(map[string]any)
		if plan["id"] == "cyclonedx" && plan["status"] != "input_present" {
			t.Fatalf("cyclonedx plan = %#v, want input_present", plan)
		}
	}
}

func TestRunContextPreparePreservesMalformedToolOutput(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, ".git"))
	mustMkdir(t, filepath.Join(root, "tool-outputs"))
	mustWrite(t, filepath.Join(root, "tool-outputs", "jscpd-report.json"), `{`)
	out := filepath.Join(root, ".portolan", "context")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"context", "prepare", "--root", root, "--out", out, "--profile", "cursor"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	registry := readJSONFile(t, filepath.Join(out, "tool-registry.json"))
	tools := registry["tools"].([]any)
	if len(tools) != 1 {
		t.Fatalf("tools = %#v, want one malformed jscpd entry", tools)
	}
	entry := tools[0].(map[string]any)
	if entry["family"] != "jscpd" || entry["status"] != "cannot_verify" || entry["evidence_state"] != "cannot_verify" {
		t.Fatalf("entry = %#v, want cannot_verify jscpd", entry)
	}
	if !strings.Contains(entry["reason"].(string), "malformed") {
		t.Fatalf("entry = %#v, want malformed reason", entry)
	}
}

func TestRunContextPreparePreservesMalformedRelationshipSurface(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, ".git"))
	mustWrite(t, filepath.Join(root, "openapi.json"), `{`)
	out := filepath.Join(root, ".portolan", "context")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"context", "prepare", "--root", root, "--out", out, "--profile", "cursor"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	registry := readJSONFile(t, filepath.Join(out, "tool-registry.json"))
	tools := registry["tools"].([]any)
	if len(tools) != 1 {
		t.Fatalf("tools = %#v, want one malformed openapi entry", tools)
	}
	entry := tools[0].(map[string]any)
	if entry["family"] != "openapi" || entry["status"] != "cannot_verify" || entry["evidence_state"] != "cannot_verify" {
		t.Fatalf("entry = %#v, want cannot_verify openapi", entry)
	}
	if !strings.Contains(entry["reason"].(string), "malformed") {
		t.Fatalf("entry = %#v, want malformed reason", entry)
	}
}

func TestRunContextPrepareCountsAsyncAPIYAMLDirectChannels(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, ".git"))
	mustWrite(t, filepath.Join(root, "asyncapi.yaml"), `asyncapi: 3.0.0
channels:
  orders:
    address: orders
    messages:
      orderCreated:
        payload:
          type: object
  payments:
    address: payments
operations:
  publishOrder:
    action: send
`)
	out := filepath.Join(root, ".portolan", "context")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"context", "prepare", "--root", root, "--out", out, "--profile", "cursor"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	registry := readJSONFile(t, filepath.Join(out, "tool-registry.json"))
	tools := registry["tools"].([]any)
	if len(tools) != 1 {
		t.Fatalf("tools = %#v, want one asyncapi entry", tools)
	}
	entry := tools[0].(map[string]any)
	metrics := entry["metrics"].(map[string]any)
	if entry["family"] != "asyncapi" || entry["status"] != "observed" || metrics["channels"] != float64(2) {
		t.Fatalf("entry = %#v, want 2 direct asyncapi channels", entry)
	}
}

func TestRunContextPrepareKeepsEmptyStructurizrJSONCandidate(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, ".git"))
	mustWrite(t, filepath.Join(root, "structurizr.json"), `{"workspace":{"model":{}}}`)
	out := filepath.Join(root, ".portolan", "context")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"context", "prepare", "--root", root, "--out", out, "--profile", "cursor"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	registry := readJSONFile(t, filepath.Join(out, "tool-registry.json"))
	tools := registry["tools"].([]any)
	if len(tools) != 1 {
		t.Fatalf("tools = %#v, want one structurizr entry", tools)
	}
	entry := tools[0].(map[string]any)
	metrics := entry["metrics"].(map[string]any)
	if entry["family"] != "structurizr" || entry["status"] != "candidate" || metrics["elements"] != float64(0) {
		t.Fatalf("entry = %#v, want structurizr candidate with 0 counted elements", entry)
	}
}

func TestRunContextPrepareExplainsRepoLikeFixtureWithoutGit(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, "repos", "api"))
	mustMkdir(t, filepath.Join(root, "repos", "web"))
	mustWrite(t, filepath.Join(root, "selection.json"), `{"schema_version":"0.1.0","targets":[]}`)
	out := filepath.Join(root, ".portolan", "context")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"context", "prepare", "--root", root, "--out", out, "--profile", "cursor"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	repos := readJSONFile(t, filepath.Join(out, "repos.json"))
	if got := len(repos["repositories"].([]any)); got != 0 {
		t.Fatalf("repositories = %d, want 0 source-visible git repositories", got)
	}
	registry := readJSONFile(t, filepath.Join(out, "tool-registry.json"))
	if got := len(registry["tools"].([]any)); got != 0 {
		t.Fatalf("tools = %d, want empty array", got)
	}
	gaps, err := os.ReadFile(filepath.Join(out, "gaps.jsonl"))
	if err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{"gap-repo-like-structure-without-git", "selection.json", "repo-like child directories", "not Git repositories"} {
		if !strings.Contains(string(gaps), want) {
			t.Fatalf("gaps.jsonl = %q, want %q", gaps, want)
		}
	}
}

func TestRunMapSelectionWritesLandscapeArtifactBundle(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--selection", landscapeMapSelection, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	for _, name := range []string{"run.json", "coverage.json", "graph.json", "graph-index.json", "findings.jsonl", "summary.json", "map.md"} {
		if _, err := os.Stat(filepath.Join(out, name)); err != nil {
			t.Fatalf("missing %s: %v", name, err)
		}
	}
	result := readGraph(t, filepath.Join(out, "graph.json"))
	for _, id := range []string{"repo-api", "repo-worker", "repo-web", "repo-data", "sbom-api", "duplication-web", "config-data"} {
		findNode(t, result, id)
	}
	for _, prefix := range []string{"sbom-api:component:", "size-worker:language:", "duplication-web:duplicate:", "config-data:config:"} {
		findNodeWithPrefix(t, result, prefix)
	}
	findEdge(t, result, "repo-api", "repo-api:source:go.mod", "observes")
	coverage := readJSONFile(t, filepath.Join(out, "coverage.json"))
	scope := coverage["scope"].(map[string]any)
	if scope["selection_path"] != landscapeMapSelection || scope["require_full_corpus"] != false {
		t.Fatalf("coverage scope = %#v, want selection path and non-full-corpus scope", scope)
	}
	summary := coverage["summary"].(map[string]any)
	if summary["status:visible"].(float64) < 8 {
		t.Fatalf("coverage summary = %#v, want visible selected inputs", summary)
	}
	mapText, err := os.ReadFile(filepath.Join(out, "map.md"))
	if err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{"## Landscape Inventory", "## Repo/Product Matrix", "## Contracts And Surfaces", "## Duplication", "## Configuration", "## Legacy And Debt", "## Unknowns And Cannot Verify", "## Next-Agent Tasks"} {
		if !strings.Contains(string(mapText), want) {
			t.Fatalf("map.md missing %q:\n%s", want, mapText)
		}
	}
}

func TestRunMapRejectsRootAndSelectionTogether(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", mapCommandFixtureRoot, "--selection", landscapeMapSelection, "--out", out}, &stdout, &stderr)

	if code == 0 {
		t.Fatalf("Run returned 0, want mutual exclusion error")
	}
	if !strings.Contains(stderr.String(), "mutually exclusive") {
		t.Fatalf("stderr = %q, want mutual exclusion error", stderr.String())
	}
}

func TestRunMapRootStillWritesExistingBundleWithCoverage(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", mapCommandFixtureRoot, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	readGraph(t, filepath.Join(out, "graph.json"))
	coverage := readJSONFile(t, filepath.Join(out, "coverage.json"))
	if coverage["schema_version"] != "0.1.0" {
		t.Fatalf("coverage = %#v, want schema version", coverage)
	}
}

func TestRunMapRootDiscoversLandscapeRepositories(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, "api", ".git"))
	mustMkdir(t, filepath.Join(root, "repos", "web", ".git"))
	mustWrite(t, filepath.Join(root, "api", "go.mod"), "module example.com/api\n")
	mustWrite(t, filepath.Join(root, "repos", "web", "README.md"), "fixture")
	mustWrite(t, filepath.Join(root, "notes.txt"), "not a repository")
	out := filepath.Join(root, ".portolan", "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", root, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	graph := readGraph(t, filepath.Join(out, "graph.json"))
	nodeIDs := map[string]bool{}
	for _, raw := range graph["nodes"].([]any) {
		node := raw.(map[string]any)
		nodeIDs[node["id"].(string)] = true
	}
	for _, want := range []string{"api", "web"} {
		if !nodeIDs[want] {
			t.Fatalf("graph node ids = %#v, want discovered repo %q", nodeIDs, want)
		}
	}
	coverage := readJSONFile(t, filepath.Join(out, "coverage.json"))
	records := coverage["records"].([]any)
	seen := map[string]map[string]any{}
	for _, raw := range records {
		record := raw.(map[string]any)
		seen[record["id"].(string)] = record
	}
	for _, want := range []string{"api", "web"} {
		record := seen[want]
		if record == nil || record["kind"] != "repository" || record["status"] != "visible" || record["evidence_state"] != "source-visible" {
			t.Fatalf("coverage[%s] = %#v, want visible source repository", want, record)
		}
	}
	record := seen["external-completeness"]
	if record == nil || record["status"] != "unknown" || record["evidence_state"] != "unknown" {
		t.Fatalf("external completeness = %#v, want unknown", record)
	}
	record = seen["non-repository-children"]
	if record == nil || record["status"] != "not_assessed" || record["evidence_state"] != "unknown" {
		t.Fatalf("non-repository children = %#v, want not_assessed unknown", record)
	}
}

func TestRunMapRootRecordsRepoLikeMismatchWithoutGit(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, "repos", "api"))
	mustWrite(t, filepath.Join(root, "selection.json"), `{"schema_version":"0.1.0","targets":[]}`)
	out := filepath.Join(root, ".portolan", "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", root, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	coverage := readJSONFile(t, filepath.Join(out, "coverage.json"))
	records := coverage["records"].([]any)
	foundMismatch := false
	for _, raw := range records {
		record := raw.(map[string]any)
		if record["id"] == "repo-like-structure-without-git" {
			foundMismatch = true
			if record["status"] != "unknown" || record["evidence_state"] != "unknown" {
				t.Fatalf("record = %#v, want unknown repo-like mismatch", record)
			}
		}
	}
	if !foundMismatch {
		t.Fatalf("coverage records = %#v, want repo-like mismatch record", records)
	}
}

func TestRunMapRootRecordsDirectChildRepoLikeMismatchWithoutGit(t *testing.T) {
	root := t.TempDir()
	mustMkdir(t, filepath.Join(root, "api"))
	mustMkdir(t, filepath.Join(root, "worker"))
	out := filepath.Join(root, ".portolan", "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", root, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	coverage := readJSONFile(t, filepath.Join(out, "coverage.json"))
	records := coverage["records"].([]any)
	seen := map[string]map[string]any{}
	for _, raw := range records {
		record := raw.(map[string]any)
		seen[record["id"].(string)] = record
	}
	record := seen["repo-like-structure-without-git"]
	if record == nil || record["status"] != "unknown" || record["evidence_state"] != "unknown" {
		t.Fatalf("repo-like mismatch = %#v, want unknown", record)
	}
	if seen["root"] != nil {
		t.Fatalf("coverage records = %#v, did not expect legacy root repository when repo-like children have no git", records)
	}
}

func TestRunMapRootRecordsSourceMarkedRepoLikeChildrenWithoutGit(t *testing.T) {
	root := t.TempDir()
	mustWrite(t, filepath.Join(root, "go.mod"), "module example.com/root\n")
	mustMkdir(t, filepath.Join(root, "api"))
	mustMkdir(t, filepath.Join(root, "worker"))
	mustMkdir(t, filepath.Join(root, "cmd"))
	out := filepath.Join(root, ".portolan", "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", root, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	coverage := readJSONFile(t, filepath.Join(out, "coverage.json"))
	records := coverage["records"].([]any)
	seen := map[string]map[string]any{}
	for _, raw := range records {
		record := raw.(map[string]any)
		seen[record["id"].(string)] = record
	}
	record := seen["repo-like-structure-without-git"]
	if record == nil || record["status"] != "unknown" || record["evidence_state"] != "unknown" {
		t.Fatalf("repo-like mismatch = %#v, want unknown", record)
	}
	record = seen["non-git-child-directories"]
	if record == nil || !strings.Contains(record["reason"].(string), "2 child directories") {
		t.Fatalf("non-git child dirs = %#v, want api/worker count only", record)
	}
}

func TestRunMapIncompleteBigtopCorpusBlocksBeforeArtifacts(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--selection", "../../testdata/apache-bigtop-landscape/incomplete-selection.json", "--out", out}, &stdout, &stderr)

	if code == 0 {
		t.Fatalf("Run returned 0, want full corpus gate error")
	}
	if !strings.Contains(stderr.String(), "full corpus gate blocked") || !strings.Contains(stderr.String(), "apache-airflow") {
		t.Fatalf("stderr = %q, want missing active product", stderr.String())
	}
	if _, err := os.Stat(out); !os.IsNotExist(err) {
		t.Fatalf("output exists after full-corpus startup block; err = %v", err)
	}
}

func TestRunMapFullCorpusRequiresManifest(t *testing.T) {
	root := t.TempDir()
	repo := filepath.Join(root, "repo")
	mustMkdir(t, repo)
	mustWrite(t, filepath.Join(repo, "README.md"), "fixture")
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{
		"schema_version":"0.1.0",
		"require_full_corpus":true,
		"targets":[{"id":"repo","kind":"repository","path":`+quote(repo)+`}]
	}`)
	out := filepath.Join(root, "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--selection", selection, "--out", out}, &stdout, &stderr)

	if code == 0 {
		t.Fatalf("Run returned 0, want missing manifest gate error")
	}
	if !strings.Contains(stderr.String(), "require_full_corpus") {
		t.Fatalf("stderr = %q, want full-corpus manifest error", stderr.String())
	}
	if _, err := os.Stat(out); !os.IsNotExist(err) {
		t.Fatalf("output exists after full-corpus startup block; err = %v", err)
	}
}

func TestRunMapSelectionReportsExtraLocalRepositoryScope(t *testing.T) {
	root := t.TempDir()
	api := filepath.Join(root, "api")
	extra := filepath.Join(root, "extra-tooling")
	mustMkdir(t, api)
	mustMkdir(t, extra)
	manifest := filepath.Join(root, "manifest.json")
	mustWrite(t, manifest, `{
		"schema_version":"0.1.0",
		"id":"fixture-estate",
		"targets":[
			{"id":"api","label":"API","kind":"repository","lifecycle":"active","role":"service","evidence_state":"metadata-visible"},
			{"id":"worker","label":"Worker","kind":"repository","lifecycle":"active","role":"service","evidence_state":"metadata-visible"}
		]
	}`)
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{
		"schema_version":"0.1.0",
		"corpus_manifest":"manifest.json",
		"targets":[
			{"id":"api","kind":"repository","path":"api"},
			{"id":"extra-tooling","kind":"repository","path":"extra-tooling"}
		]
	}`)
	out := filepath.Join(root, "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--selection", selection, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	coverage := readJSONFile(t, filepath.Join(out, "coverage.json"))
	summary := coverage["summary"].(map[string]any)
	if summary["status:extra"] != float64(1) || summary["status:missing"] != float64(1) {
		t.Fatalf("coverage summary = %#v, want extra and missing scope counts", summary)
	}
	runSummary := readJSONFile(t, filepath.Join(out, "summary.json"))
	coverageSummary := runSummary["coverage"].(map[string]any)
	weakRecords := coverageSummary["weak_records"].([]any)
	seen := map[string]bool{}
	for _, raw := range weakRecords {
		record := raw.(map[string]any)
		seen[record["id"].(string)] = true
		if record["id"] == "extra:extra-tooling" && (record["status"] != "extra" || record["evidence_state"] != "source-visible") {
			t.Fatalf("extra weak record = %#v, want extra source-visible", record)
		}
	}
	if !seen["extra:extra-tooling"] || !seen["manifest:worker"] {
		t.Fatalf("weak coverage records = %#v, want extra and missing records", weakRecords)
	}
}

func TestRunMapSelectionMapAgreesWithCoverageSummary(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--selection", landscapeMapSelection, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	coverage := readJSONFile(t, filepath.Join(out, "coverage.json"))
	summary := coverage["summary"].(map[string]any)
	mapText, err := os.ReadFile(filepath.Join(out, "map.md"))
	if err != nil {
		t.Fatal(err)
	}
	want := fmt.Sprintf("- Coverage records: %.0f", summary["total"].(float64))
	if !strings.Contains(string(mapText), want) {
		t.Fatalf("map.md missing coverage total %q:\n%s", want, mapText)
	}
}

func TestRunMapSelectionStableCountsAcrossRuns(t *testing.T) {
	root := t.TempDir()
	first := filepath.Join(root, "first")
	second := filepath.Join(root, "second")
	for _, out := range []string{first, second} {
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"map", "--selection", landscapeMapSelection, "--out", out, "--force"}, &stdout, &stderr)
		if code != 0 {
			t.Fatalf("Run returned %d for %s, want 0; stderr = %q", code, out, stderr.String())
		}
	}
	firstCoverage := readJSONFile(t, filepath.Join(first, "coverage.json"))
	secondCoverage := readJSONFile(t, filepath.Join(second, "coverage.json"))
	if fmt.Sprint(firstCoverage["summary"]) != fmt.Sprint(secondCoverage["summary"]) {
		t.Fatalf("coverage summaries differ: %#v vs %#v", firstCoverage["summary"], secondCoverage["summary"])
	}
	firstFindings := readFindings(t, filepath.Join(first, "findings.jsonl"))
	secondFindings := readFindings(t, filepath.Join(second, "findings.jsonl"))
	if len(firstFindings) != len(secondFindings) {
		t.Fatalf("finding counts differ: %d vs %d", len(firstFindings), len(secondFindings))
	}
}

func TestRunMapSelectionRejectsRepositorySymlinkAsSourceVisible(t *testing.T) {
	root := t.TempDir()
	target := filepath.Join(root, "target")
	mustMkdir(t, target)
	mustWrite(t, filepath.Join(target, "README.md"), "fixture")
	link := filepath.Join(root, "repo-link")
	if err := os.Symlink(target, link); err != nil {
		t.Skipf("symlink unavailable: %v", err)
	}
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{
		"schema_version":"0.1.0",
		"targets":[{"id":"repo-link","kind":"repository","path":`+quote(link)+`}]
	}`)
	out := filepath.Join(root, "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--selection", selection, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	result := readGraph(t, filepath.Join(out, "graph.json"))
	node := findNode(t, result, "repo-link")
	evidence := node["evidence"].(map[string]any)
	if evidence["state"] != "unknown" {
		t.Fatalf("evidence = %#v, want symlink not source-visible", evidence)
	}
	coverage := readJSONFile(t, filepath.Join(out, "coverage.json"))
	records := coverage["records"].([]any)
	for _, raw := range records {
		record := raw.(map[string]any)
		if record["id"] != "repo-link" {
			continue
		}
		if record["status"] != "cannot_verify" || record["evidence_state"] != "cannot_verify" {
			t.Fatalf("coverage record = %#v, want cannot_verify for repository symlink", record)
		}
		return
	}
	t.Fatalf("coverage records = %#v, want repo-link record", records)
}

func TestRunMapRejectsMissingRootWithoutPartialBundle(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", "../../testdata/map-command/missing", "--out", out}, &stdout, &stderr)

	if code == 0 {
		t.Fatalf("Run returned 0, want error")
	}
	if stdout.Len() != 0 {
		t.Fatalf("stdout = %q, want empty", stdout.String())
	}
	if !strings.Contains(stderr.String(), "root path does not exist") {
		t.Fatalf("stderr = %q, want missing root error", stderr.String())
	}
	if _, err := os.Stat(out); !os.IsNotExist(err) {
		t.Fatalf("output exists after startup validation failure; err = %v", err)
	}
}

func TestRunMapOutputSafety(t *testing.T) {
	root := t.TempDir()
	out := filepath.Join(root, "run")
	if err := os.Mkdir(out, 0o755); err != nil {
		t.Fatal(err)
	}
	mustWrite(t, filepath.Join(out, "old.txt"), "preserve me")

	t.Run("existing output requires force", func(t *testing.T) {
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"map", "--root", mapCommandFixtureRoot, "--out", out}, &stdout, &stderr)
		if code == 0 || !strings.Contains(stderr.String(), "--force") {
			t.Fatalf("code = %d stderr = %q, want force error", code, stderr.String())
		}
		if _, err := os.Stat(filepath.Join(out, "old.txt")); err != nil {
			t.Fatalf("existing output changed: %v", err)
		}
	})

	t.Run("force replaces existing output", func(t *testing.T) {
		var stdout bytes.Buffer
		var stderr bytes.Buffer
		code := Run([]string{"map", "--root", mapCommandFixtureRoot, "--out", out, "--force"}, &stdout, &stderr)
		if code != 0 {
			t.Fatalf("code = %d stderr = %q, want success", code, stderr.String())
		}
		if _, err := os.Stat(filepath.Join(out, "old.txt")); !os.IsNotExist(err) {
			t.Fatalf("old output still exists; err = %v", err)
		}
		readGraph(t, filepath.Join(out, "graph.json"))
	})
}

func TestRunMapCreatesPortolanParentOnFirstUse(t *testing.T) {
	root := t.TempDir()
	mustWrite(t, filepath.Join(root, "README.md"), "fixture")
	out := filepath.Join(root, ".portolan", "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", root, "--out", out}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	readGraph(t, filepath.Join(out, "graph.json"))
}

func TestRunMapRejectsMissingRequiredFlags(t *testing.T) {
	tests := []struct {
		name string
		args []string
		want string
	}{
		{
			name: "missing root or selection",
			args: []string{"map", "--out", filepath.Join(t.TempDir(), "run")},
			want: "--root or --selection is required",
		},
		{
			name: "missing output",
			args: []string{"map", "--root", mapCommandFixtureRoot},
			want: "--out is required",
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

func TestRunMapRejectsDangerousForceOutput(t *testing.T) {
	root := t.TempDir()
	mustWrite(t, filepath.Join(root, "README.md"), "fixture")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", root, "--out", root, "--force"}, &stdout, &stderr)

	if code == 0 {
		t.Fatalf("Run returned 0, want dangerous output rejection")
	}
	if !strings.Contains(stderr.String(), "unsafe") && !strings.Contains(stderr.String(), "under .portolan") {
		t.Fatalf("stderr = %q, want unsafe output error", stderr.String())
	}
}

func TestRunMapRejectsOutputAncestorOfRoot(t *testing.T) {
	parent := t.TempDir()
	root := filepath.Join(parent, "project")
	if err := os.Mkdir(root, 0o755); err != nil {
		t.Fatal(err)
	}
	mustWrite(t, filepath.Join(root, "README.md"), "fixture")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", root, "--out", parent, "--force"}, &stdout, &stderr)

	if code == 0 {
		t.Fatalf("Run returned 0, want ancestor output rejection")
	}
	if !strings.Contains(stderr.String(), "must not contain mapped root") {
		t.Fatalf("stderr = %q, want ancestor output error", stderr.String())
	}
	if _, err := os.Stat(filepath.Join(root, "README.md")); err != nil {
		t.Fatalf("mapped root was modified: %v", err)
	}
}

func TestRunMapFindingsJSONLHasRequiredFields(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", mapCommandFixtureRoot, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	data, err := os.ReadFile(filepath.Join(out, "findings.jsonl"))
	if err != nil {
		t.Fatal(err)
	}
	lines := strings.Split(strings.TrimSpace(string(data)), "\n")
	if len(lines) < 5 {
		t.Fatalf("findings lines = %d, want at least 5:\n%s", len(lines), data)
	}
	kinds := map[string]bool{}
	for _, line := range lines {
		var finding map[string]any
		if err := json.Unmarshal([]byte(line), &finding); err != nil {
			t.Fatalf("parse finding %q: %v", line, err)
		}
		for _, field := range []string{"id", "kind", "summary", "severity", "evidence_state", "evidence_source", "status"} {
			if finding[field] == "" {
				t.Fatalf("finding missing %s: %#v", field, finding)
			}
		}
		if _, ok := finding["confidence"].(float64); !ok {
			t.Fatalf("finding missing numeric confidence: %#v", finding)
		}
		kinds[finding["kind"].(string)] = true
	}
	for _, want := range []string{"inventory", "relationships", "duplication", "configuration", "technical-debt"} {
		if !kinds[want] {
			t.Fatalf("finding kinds = %#v, want %q", kinds, want)
		}
	}
}

func TestRunMapFindingsJSONLHasUniqueIDs(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", relationshipFixtureRoot, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	findings := readFindings(t, filepath.Join(out, "findings.jsonl"))
	seen := map[string]bool{}
	for _, finding := range findings {
		id := finding["id"].(string)
		if seen[id] {
			t.Fatalf("duplicate finding id %q in %#v", id, findings)
		}
		seen[id] = true
	}
}

func TestRunMapDetectsGoSourceImportRelationships(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", relationshipFixtureRoot, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	result := readGraph(t, filepath.Join(out, "graph.json"))
	assertSchemaShape(t, result)
	edge := findEdge(t, result, "source:cmd/example/main.go", "package:github.com/example/direct", "imports")
	evidence := edge["evidence"].(map[string]any)
	if evidence["state"] != "source-visible" {
		t.Fatalf("edge evidence = %#v, want source-visible", evidence)
	}
	if !strings.Contains(evidence["source"].(string), "cmd/example/main.go") {
		t.Fatalf("edge evidence = %#v, want source file", evidence)
	}
}

func TestRunMapDetectsGoModDependencyRelationships(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", relationshipFixtureRoot, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	result := readGraph(t, filepath.Join(out, "graph.json"))
	for _, dep := range []string{"package:github.com/example/direct", "package:example.com/block/dependency"} {
		edge := findEdge(t, result, "package:example.com/relationship-fixture", dep, "depends-on")
		evidence := edge["evidence"].(map[string]any)
		if evidence["state"] != "metadata-visible" {
			t.Fatalf("edge %s evidence = %#v, want metadata-visible", dep, evidence)
		}
		if !strings.Contains(evidence["source"].(string), "go.mod") {
			t.Fatalf("edge %s evidence = %#v, want go.mod source", dep, evidence)
		}
	}
}

func TestRunMapRelationshipFindingsReplacePlaceholder(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", relationshipFixtureRoot, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	findings := readFindings(t, filepath.Join(out, "findings.jsonl"))
	seenSourceObserved := false
	seenManifestObserved := false
	for _, finding := range findings {
		if finding["id"] == "finding-relationships-not-assessed" {
			t.Fatalf("relationship placeholder was not replaced: %#v", finding)
		}
		if finding["id"] == "finding-relationships-source-imports-observed" {
			seenSourceObserved = true
			if finding["status"] != "observed" || finding["evidence_state"] != "source-visible" {
				t.Fatalf("source relationship finding = %#v, want observed source-visible", finding)
			}
		}
		if finding["id"] == "finding-relationships-manifest-dependencies-observed" {
			seenManifestObserved = true
			if finding["status"] != "observed" || finding["evidence_state"] != "metadata-visible" {
				t.Fatalf("manifest relationship finding = %#v, want observed metadata-visible", finding)
			}
		}
	}
	if !seenSourceObserved || !seenManifestObserved {
		t.Fatalf("findings = %#v, want source and manifest relationship findings", findings)
	}
}

func TestRunMapDetectsExactSourceAndConfigDuplication(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", duplicationFixtureRoot, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	findings := readFindings(t, filepath.Join(out, "findings.jsonl"))
	source := findFindingByID(findings, "finding-duplication-exact-source-001")
	if source == nil {
		t.Fatalf("findings = %#v, want exact source duplication finding", findings)
	}
	if source["status"] != "observed" || source["evidence_state"] != "source-visible" {
		t.Fatalf("source duplication finding = %#v, want observed source-visible", source)
	}
	for _, want := range []string{"src/retry_a.go", "src/retry_b.go"} {
		if !strings.Contains(source["evidence_source"].(string), want) {
			t.Fatalf("source duplication evidence = %#v, want %s", source, want)
		}
	}
	if strings.Contains(source["summary"].(string), "attempts := 3") {
		t.Fatalf("source duplication summary leaked source snippet: %#v", source)
	}

	config := findFindingByID(findings, "finding-duplication-exact-config-001")
	if config == nil {
		t.Fatalf("findings = %#v, want exact config duplication finding", findings)
	}
	if config["status"] != "observed" || config["evidence_state"] != "source-visible" {
		t.Fatalf("config duplication finding = %#v, want observed source-visible", config)
	}
	for _, want := range []string{"config/prod.json", "config/staging.json"} {
		if !strings.Contains(config["evidence_source"].(string), want) {
			t.Fatalf("config duplication evidence = %#v, want %s", config, want)
		}
	}

	graph := readGraph(t, filepath.Join(out, "graph.json"))
	findNode(t, graph, "duplication-exact-source-001")
	findNode(t, graph, "duplication-exact-config-001")
}

func TestRunMapSelectionDetectsPrefixedDuplication(t *testing.T) {
	root, err := filepath.Abs(duplicationFixtureRoot)
	if err != nil {
		t.Fatal(err)
	}
	selectionPath := writeSelection(t, t.TempDir(), "duplication", `{
  "schema_version": "0.1.0",
  "targets": [
    {"id": "dup", "kind": "repository", "path": `+quote(root)+`}
  ]
}`)
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--selection", selectionPath, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	findings := readFindings(t, filepath.Join(out, "findings.jsonl"))
	source := findFindingByID(findings, "dup-finding-duplication-exact-source-001")
	if source == nil {
		t.Fatalf("findings = %#v, want prefixed source duplication finding", findings)
	}
	if source["status"] != "observed" || !strings.Contains(source["evidence_source"].(string), "dup:src/retry_a.go") {
		t.Fatalf("prefixed source duplication finding = %#v", source)
	}
	graph := readGraph(t, filepath.Join(out, "graph.json"))
	findNode(t, graph, "dup:duplication-exact-source-001")
}

func TestRunMapDetectsConfigurationSurfacesWithoutSecretValues(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", configurationFixtureRoot, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	findings := readFindings(t, filepath.Join(out, "findings.jsonl"))
	for _, id := range []string{
		"finding-configuration-env-var-observed",
		"finding-configuration-port-observed",
		"finding-configuration-container-observed",
		"finding-configuration-workflow-observed",
		"finding-configuration-manifest-observed",
		"finding-configuration-feature-flag-observed",
		"finding-configuration-secret-reference-observed",
	} {
		finding := findFindingByID(findings, id)
		if finding == nil {
			t.Fatalf("findings = %#v, want %s", findings, id)
		}
		if finding["status"] != "observed" || finding["evidence_state"] != "source-visible" {
			t.Fatalf("finding %s = %#v, want observed source-visible", id, finding)
		}
	}

	graph := readGraph(t, filepath.Join(out, "graph.json"))
	findNode(t, graph, "configuration:env-var:payments-api-url")
	findNode(t, graph, "configuration:port:8080")
	findNode(t, graph, "configuration:secret-reference:payments-api-token")
	findNode(t, graph, "configuration:feature-flag:feature-fast-checkout")

	for _, artifact := range []string{"graph.json", "graph-index.json", "findings.jsonl", "summary.json", "map.md"} {
		data, err := os.ReadFile(filepath.Join(out, artifact))
		if err != nil {
			t.Fatal(err)
		}
		for _, forbidden := range []string{"super-secret", "postgres://", "password-value"} {
			if strings.Contains(string(data), forbidden) {
				t.Fatalf("%s leaked secret payload %q:\n%s", artifact, forbidden, data)
			}
		}
	}
}

func TestRunMapSelectionDetectsPrefixedConfigurationSurfaces(t *testing.T) {
	root, err := filepath.Abs(configurationFixtureRoot)
	if err != nil {
		t.Fatal(err)
	}
	selectionPath := writeSelection(t, t.TempDir(), "configuration", `{
  "schema_version": "0.1.0",
  "targets": [
    {"id": "cfg", "kind": "repository", "path": `+quote(root)+`}
  ]
}`)
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--selection", selectionPath, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	findings := readFindings(t, filepath.Join(out, "findings.jsonl"))
	finding := findFindingByID(findings, "cfg-finding-configuration-env-var-observed")
	if finding == nil {
		t.Fatalf("findings = %#v, want prefixed configuration finding", findings)
	}
	if finding["status"] != "observed" || !strings.Contains(finding["evidence_source"].(string), "cfg:cmd/server/main.go") {
		t.Fatalf("prefixed configuration finding = %#v", finding)
	}
	graph := readGraph(t, filepath.Join(out, "graph.json"))
	findNode(t, graph, "cfg:configuration:env-var:payments-api-url")
}

func TestRunMapDerivesConcreteTechnicalDebtFindings(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", technicalDebtFixtureRoot, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	findings := readFindings(t, filepath.Join(out, "findings.jsonl"))
	for _, id := range []string{
		"finding-technical-debt-relationship-follow-up",
		"finding-technical-debt-duplication-follow-up",
		"finding-technical-debt-configuration-follow-up",
		"finding-technical-debt-unresolved-findings",
	} {
		finding := findFindingByID(findings, id)
		if finding == nil {
			t.Fatalf("findings = %#v, want %s", findings, id)
		}
		if finding["kind"] != "technical-debt" {
			t.Fatalf("finding %s = %#v, want technical-debt", id, finding)
		}
	}
	for _, finding := range findings {
		if finding["kind"] != "technical-debt" {
			continue
		}
		summary := strings.ToLower(finding["summary"].(string))
		for _, forbidden := range []string{"ready", "readiness", "pass", "fail", "rewrite", "moderni"} {
			if strings.Contains(summary, forbidden) {
				t.Fatalf("technical-debt finding uses verdict language %q: %#v", forbidden, finding)
			}
		}
	}
	run := readRunMetadata(t, filepath.Join(out, "run.json"))
	enabled := map[string]bool{}
	for _, surface := range run["enabled_surfaces"].([]any) {
		enabled[surface.(string)] = true
	}
	if !enabled["technical-debt-findings"] {
		t.Fatalf("enabled surfaces = %#v, want technical-debt-findings", enabled)
	}
}

func TestRunMapDerivesCoverageBackedUnresolvedDebtFinding(t *testing.T) {
	root, err := filepath.Abs(technicalDebtFixtureRoot)
	if err != nil {
		t.Fatal(err)
	}
	selectionPath := writeSelection(t, t.TempDir(), "debt-weak-coverage", `{
  "schema_version": "0.1.0",
  "targets": [
    {"id": "debt", "kind": "repository", "path": `+quote(root)+`}
  ],
  "claims": [
    {"id": "missing-claims", "path": "missing-claims.json"}
  ]
}`)
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--selection", selectionPath, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	findings := readFindings(t, filepath.Join(out, "findings.jsonl"))
	finding := findFindingByID(findings, "finding-technical-debt-unresolved-coverage")
	if finding == nil {
		t.Fatalf("findings = %#v, want coverage-backed unresolved debt finding", findings)
	}
	if finding["status"] != "unknown" || finding["evidence_state"] != "unknown" || finding["evidence_source"] != "coverage.json" {
		t.Fatalf("finding = %#v, want unknown coverage-backed technical debt", finding)
	}
}

func TestRunMapUnsupportedDetectorFindingsRemainNotAssessed(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "README.md"), []byte("# no supported detector inputs\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", root, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	findings := readFindings(t, filepath.Join(out, "findings.jsonl"))
	wantNotAssessed := map[string]bool{"duplication": true, "configuration": true}
	for _, finding := range findings {
		kind, _ := finding["kind"].(string)
		if !wantNotAssessed[kind] {
			continue
		}
		if finding["status"] != "not_assessed" || finding["evidence_state"] != "not_assessed" {
			t.Fatalf("finding = %#v, want not_assessed", finding)
		}
		delete(wantNotAssessed, kind)
	}
	if len(wantNotAssessed) != 0 {
		t.Fatalf("missing not_assessed findings: %#v", wantNotAssessed)
	}
	debt := findFindingByID(findings, "finding-technical-debt-unresolved-findings")
	if debt == nil {
		t.Fatalf("findings = %#v, want unresolved technical debt finding", findings)
	}
	if debt["status"] != "unknown" || debt["evidence_state"] != "unknown" {
		t.Fatalf("technical debt finding = %#v, want unknown unresolved evidence", debt)
	}
}

func TestRunMapUnsupportedRelationshipSubsurfacesRemainNotAssessed(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", relationshipFixtureRoot, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	findings := readFindings(t, filepath.Join(out, "findings.jsonl"))
	wantFindings := map[string]bool{
		"finding-relationships-non-go-source-not-assessed":      true,
		"finding-relationships-runtime-inference-not-assessed":  true,
		"finding-relationships-lifecycle-modeling-not-assessed": true,
		"finding-relationships-service-topology-not-assessed":   true,
	}
	for _, finding := range findings {
		id, _ := finding["id"].(string)
		if !wantFindings[id] {
			continue
		}
		if finding["kind"] != "relationships" || finding["status"] != "not_assessed" || finding["evidence_state"] != "not_assessed" {
			t.Fatalf("finding = %#v, want relationship not_assessed", finding)
		}
		delete(wantFindings, id)
	}
	if len(wantFindings) != 0 {
		t.Fatalf("missing relationship not_assessed findings: %#v", wantFindings)
	}

	run := readRunMetadata(t, filepath.Join(out, "run.json"))
	skipped := map[string]bool{}
	for _, surface := range run["skipped_surfaces"].([]any) {
		skipped[surface.(string)] = true
	}
	for _, want := range []string{
		"relationship-non-go-source",
		"relationship-runtime-inference",
		"relationship-lifecycle-modeling",
		"relationship-service-topology-inference",
	} {
		if !skipped[want] {
			t.Fatalf("skipped surfaces = %#v, want %q", skipped, want)
		}
	}
}

func TestRunMapRelationshipEdgesHaveEvidenceStateAndSource(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", relationshipFixtureRoot, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	result := readGraph(t, filepath.Join(out, "graph.json"))
	for _, item := range result["edges"].([]any) {
		edge := item.(map[string]any)
		if edge["kind"] != "imports" && edge["kind"] != "depends-on" {
			continue
		}
		if edge["from"] == "" || edge["to"] == "" {
			t.Fatalf("relationship edge missing endpoint: %#v", edge)
		}
		evidence := edge["evidence"].(map[string]any)
		if evidence["state"] == "" || evidence["source"] == "" {
			t.Fatalf("relationship edge missing evidence state or source: %#v", edge)
		}
	}
}

func TestRunScanRelationshipFixturePreservesClaimMetadataAndUnknownEvidence(t *testing.T) {
	root := t.TempDir()
	metadataPath, err := filepath.Abs("../../testdata/relationship-detection/metadata/payments.json")
	if err != nil {
		t.Fatal(err)
	}
	claimsPath, err := filepath.Abs("../../testdata/relationship-detection/claims/payments.json")
	if err != nil {
		t.Fatal(err)
	}
	selection := filepath.Join(root, "selection.json")
	mustWrite(t, selection, `{
		"schema_version":"0.1.0",
		"black_boxes":[{
			"id":"payments-api",
			"kind":"service",
			"label":"Payments API",
			"metadata":[{"id":"payments-metadata","path":`+quote(metadataPath)+`}],
			"claims":[{"id":"payments-claims","path":`+quote(claimsPath)+`}],
			"expected":["dependencies","runtime-endpoints"]
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
	states := evidenceStates(t, result)
	for _, want := range []string{"metadata-visible", "claim-only", "unknown"} {
		if !states[want] {
			t.Fatalf("states = %#v, want %q", states, want)
		}
	}
	foundClaim := false
	foundMetadata := false
	for _, item := range result["edges"].([]any) {
		edge := item.(map[string]any)
		evidence := edge["evidence"].(map[string]any)
		if edge["from"] == "payments-api" && edge["to"] == "ledger-api" && edge["kind"] == "depends-on" && evidence["state"] == "claim-only" {
			foundClaim = true
		}
		if edge["from"] == "payments-api" && edge["to"] == "ledger-api" && edge["kind"] == "depends-on" && evidence["state"] == "metadata-visible" {
			foundMetadata = true
		}
	}
	if !foundClaim || !foundMetadata {
		t.Fatalf("edges = %#v, want both claim-only and metadata-visible overlapping dependency", result["edges"])
	}
}

func TestRunMapRunJSONRecordsAuditMetadata(t *testing.T) {
	out := filepath.Join(t.TempDir(), "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", mapCommandFixtureRoot, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	data, err := os.ReadFile(filepath.Join(out, "run.json"))
	if err != nil {
		t.Fatal(err)
	}
	var run map[string]any
	if err := json.Unmarshal(data, &run); err != nil {
		t.Fatal(err)
	}
	if run["command"] != "portolan map" || run["version"] != "dev" {
		t.Fatalf("run metadata = %#v, want command and version", run)
	}
	for _, field := range []string{"root", "output_path"} {
		if run[field] == "" {
			t.Fatalf("run metadata missing %s: %#v", field, run)
		}
	}
	artifacts := run["artifacts"].(map[string]any)
	for _, name := range []string{"run", "coverage", "graph", "findings", "packet"} {
		if artifacts[name] == "" {
			t.Fatalf("artifacts missing %s: %#v", name, artifacts)
		}
	}
	if len(run["enabled_surfaces"].([]any)) == 0 || len(run["skipped_surfaces"].([]any)) == 0 {
		t.Fatalf("surfaces missing: %#v", run)
	}
	if len(run["warnings"].([]any)) == 0 {
		t.Fatalf("warnings missing: %#v", run)
	}
}

func TestRunMapAllowsPortolanOutputInsideRootAndExcludesGeneratedArtifacts(t *testing.T) {
	root := t.TempDir()
	mustWrite(t, filepath.Join(root, "README.md"), "fixture")
	if err := os.MkdirAll(filepath.Join(root, ".portolan", "run"), 0o755); err != nil {
		t.Fatal(err)
	}
	mustWrite(t, filepath.Join(root, ".portolan", "run", "stale.txt"), "stale artifact")
	out := filepath.Join(root, ".portolan", "run")
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", root, "--out", out, "--force"}, &stdout, &stderr)

	if code != 0 {
		t.Fatalf("Run returned %d, want 0; stderr = %q", code, stderr.String())
	}
	graph := readGraph(t, filepath.Join(out, "graph.json"))
	for _, item := range graph["nodes"].([]any) {
		node := item.(map[string]any)
		if strings.Contains(node["id"].(string), ".portolan") {
			t.Fatalf("graph included generated artifact node: %#v", node)
		}
	}
}

func TestRunMapRejectsOutputInsideRootThroughSymlinkOutsidePortolan(t *testing.T) {
	root := t.TempDir()
	mustWrite(t, filepath.Join(root, "README.md"), "fixture")
	parent := t.TempDir()
	link := filepath.Join(parent, "linked-root")
	if err := os.Symlink(root, link); err != nil {
		t.Skipf("symlink unavailable: %v", err)
	}
	var stdout bytes.Buffer
	var stderr bytes.Buffer

	code := Run([]string{"map", "--root", root, "--out", filepath.Join(link, "run"), "--force"}, &stdout, &stderr)

	if code == 0 {
		t.Fatalf("Run returned 0, want symlink-contained output rejection")
	}
	if !strings.Contains(stderr.String(), "under .portolan") {
		t.Fatalf("stderr = %q, want .portolan containment error", stderr.String())
	}
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

func readRunMetadata(t *testing.T, path string) map[string]any {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var run map[string]any
	if err := json.Unmarshal(data, &run); err != nil {
		t.Fatal(err)
	}
	return run
}

func readJSONFile(t *testing.T, path string) map[string]any {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var value map[string]any
	if err := json.Unmarshal(data, &value); err != nil {
		t.Fatal(err)
	}
	return value
}

func readFindings(t *testing.T, path string) []map[string]any {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var findings []map[string]any
	for _, line := range strings.Split(strings.TrimSpace(string(data)), "\n") {
		if line == "" {
			continue
		}
		var finding map[string]any
		if err := json.Unmarshal([]byte(line), &finding); err != nil {
			t.Fatalf("parse finding %q: %v", line, err)
		}
		findings = append(findings, finding)
	}
	return findings
}

func findFindingByID(findings []map[string]any, id string) map[string]any {
	for _, finding := range findings {
		if finding["id"] == id {
			return finding
		}
	}
	return nil
}

func findSliceByKind(t *testing.T, slices []any, kind string) map[string]any {
	t.Helper()
	for _, item := range slices {
		slice := item.(map[string]any)
		if slice["kind"] == kind {
			return slice
		}
	}
	t.Fatalf("slices = %#v, want kind %q", slices, kind)
	return nil
}

func findEdge(t *testing.T, graph map[string]any, from, to, kind string) map[string]any {
	t.Helper()
	for _, item := range graph["edges"].([]any) {
		edge := item.(map[string]any)
		if edge["from"] == from && edge["to"] == to && edge["kind"] == kind {
			return edge
		}
	}
	t.Fatalf("edges = %#v, want %s %s -> %s", graph["edges"], kind, from, to)
	return nil
}

func findNode(t *testing.T, graph map[string]any, id string) map[string]any {
	t.Helper()
	for _, item := range graph["nodes"].([]any) {
		node := item.(map[string]any)
		if node["id"] == id {
			return node
		}
	}
	t.Fatalf("nodes = %#v, want %s", graph["nodes"], id)
	return nil
}

func findNodeWithPrefix(t *testing.T, graph map[string]any, prefix string) map[string]any {
	t.Helper()
	for _, item := range graph["nodes"].([]any) {
		node := item.(map[string]any)
		id, _ := node["id"].(string)
		if strings.HasPrefix(id, prefix) {
			return node
		}
	}
	t.Fatalf("nodes = %#v, want prefix %s", graph["nodes"], prefix)
	return nil
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
	validNodeKinds := map[string]bool{"repository": true, "service": true, "package": true, "runtime": true, "team": true, "claim": true, "duplication": true, "configuration": true, "unknown": true}
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
