package preflight

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
)

const toolchainSchemaVersion = "preflight-toolchain/v1"

var knownArtifactNames = []string{
	"agent-brief.md",
	"answer-contract.md",
	"query-plan.md",
	"evidence-index.jsonl",
	"repos.json",
	"tool-registry.json",
	"oss-plan.json",
	"gaps.jsonl",
	"summary.json",
	"graph-index.json",
	"findings.jsonl",
	"map.md",
}

type Options struct {
	Root      string
	Artifacts string
	Out       string
}

type Result struct {
	OutputPath string
}

type Bundle struct {
	Target    TargetShape
	Artifacts []ArtifactLink
	Gaps      []PreflightGap
	Toolchain Toolchain
}

type TargetShape struct {
	Root             string   `json:"root"`
	Scope            string   `json:"scope"`
	Repositories     int      `json:"repositories,omitempty"`
	EcosystemSignals []string `json:"ecosystem_signals,omitempty"`
}

type ArtifactLink struct {
	Kind   string `json:"kind"`
	Path   string `json:"path,omitempty"`
	Status string `json:"status"`
}

type PreflightGap struct {
	ID             string `json:"id"`
	EvidenceFamily string `json:"evidence_family"`
	Reason         string `json:"reason"`
	NextProbe      string `json:"next_probe"`
	Status         string `json:"status"`
}

type Toolchain struct {
	SchemaVersion string                    `json:"schema_version"`
	Target        TargetShape               `json:"target"`
	Tools         []ToolchainRecommendation `json:"tools"`
}

type ToolchainRecommendation struct {
	Tool             string   `json:"tool"`
	Job              string   `json:"job"`
	Status           string   `json:"status"`
	EvidenceFamily   string   `json:"evidence_family"`
	ApprovalBoundary []string `json:"approval_boundary"`
	Risk             []string `json:"risk"`
	NextAction       string   `json:"next_action"`
	EvidenceState    string   `json:"evidence_state"`
}

func Run(options Options) (Result, error) {
	root, artifacts, out, err := resolveOptions(options)
	if err != nil {
		return Result{}, err
	}
	bundle := Build(root, artifacts)
	if err := os.MkdirAll(out, 0o755); err != nil {
		return Result{}, fmt.Errorf("create output directory: %w", err)
	}
	if err := ensureInside(out, out); err != nil {
		return Result{}, err
	}
	files := map[string][]byte{}
	files["preflight.md"] = []byte(RenderPreflightMarkdown(bundle))
	files["toolchain.json"] = mustMarshalToolchain(bundle.Toolchain)
	files["agent-handoff.md"] = []byte(RenderAgentHandoff(bundle))
	files["preflight-gaps.jsonl"] = []byte(RenderGapsJSONL(bundle.Gaps))
	for name, data := range files {
		path := filepath.Join(out, name)
		if err := ensureInside(out, path); err != nil {
			return Result{}, err
		}
		if err := os.WriteFile(path, data, 0o644); err != nil {
			return Result{}, fmt.Errorf("write %s: %w", name, err)
		}
	}
	return Result{OutputPath: out}, nil
}

func Build(root string, artifacts string) Bundle {
	target := TargetShape{
		Root:             root,
		Scope:            detectScope(root),
		Repositories:     countRepositories(root),
		EcosystemSignals: detectSignals(root),
	}
	links, gaps := discoverArtifacts(artifacts)
	gaps = append(readGapRecords(filepath.Join(artifacts, "gaps.jsonl")), gaps...)
	toolchain := Toolchain{
		SchemaVersion: toolchainSchemaVersion,
		Target:        target,
		Tools:         recommendTools(artifacts),
	}
	sort.Slice(toolchain.Tools, func(i, j int) bool {
		return toolchain.Tools[i].Tool < toolchain.Tools[j].Tool
	})
	return Bundle{Target: target, Artifacts: links, Gaps: gaps, Toolchain: toolchain}
}

func ValidateToolchain(toolchain Toolchain) error {
	if toolchain.SchemaVersion != toolchainSchemaVersion {
		return fmt.Errorf("schema_version must be %q", toolchainSchemaVersion)
	}
	if strings.TrimSpace(toolchain.Target.Root) == "" {
		return errors.New("target.root is required")
	}
	validStatus := map[string]bool{"installed": true, "missing": true, "supplied-output": true, "approval-required": true, "parked": true, "rejected": true}
	for _, tool := range toolchain.Tools {
		if strings.TrimSpace(tool.Tool) == "" || strings.TrimSpace(tool.Job) == "" || strings.TrimSpace(tool.NextAction) == "" {
			return fmt.Errorf("tool %q has missing required fields", tool.Tool)
		}
		if strings.TrimSpace(tool.EvidenceFamily) == "" {
			return fmt.Errorf("tool %q evidence_family is required", tool.Tool)
		}
		if len(tool.ApprovalBoundary) == 0 {
			return fmt.Errorf("tool %q approval_boundary is required", tool.Tool)
		}
		if !validStatus[tool.Status] {
			return fmt.Errorf("tool %q has invalid status %q", tool.Tool, tool.Status)
		}
		if tool.EvidenceState != "not_evidence" {
			return fmt.Errorf("tool %q evidence_state must be not_evidence", tool.Tool)
		}
	}
	return nil
}

func RenderPreflightMarkdown(bundle Bundle) string {
	var b strings.Builder
	fmt.Fprintf(&b, "# Brownfield Preflight\n\n")
	fmt.Fprintf(&b, "## Target Shape\n\n")
	fmt.Fprintf(&b, "- Root: `%s`\n", escapeInline(bundle.Target.Root))
	fmt.Fprintf(&b, "- Scope: `%s`\n", escapeInline(bundle.Target.Scope))
	fmt.Fprintf(&b, "- Visible repositories: `%d`\n", bundle.Target.Repositories)
	if len(bundle.Target.EcosystemSignals) > 0 {
		fmt.Fprintf(&b, "- Ecosystem signals: `%s`\n", escapeInline(strings.Join(bundle.Target.EcosystemSignals, ", ")))
	}
	fmt.Fprintf(&b, "\n## Source Artifacts\n\n")
	for _, artifact := range bundle.Artifacts {
		fmt.Fprintf(&b, "- `%s`: `%s`\n", escapeInline(artifact.Kind), escapeInline(artifact.Status))
	}
	fmt.Fprintf(&b, "\n## Blind Spots\n\n")
	for _, gap := range firstGaps(bundle.Gaps, 8) {
		fmt.Fprintf(&b, "- `%s`: %s\n", escapeInline(gap.ID), escapeText(gap.Reason))
	}
	fmt.Fprintf(&b, "\n## Next Probes\n\n")
	fmt.Fprintf(&b, "- Read `agent-handoff.md` before asking an AI agent to change code.\n")
	fmt.Fprintf(&b, "- Read `toolchain.json` before installing or running additional tools.\n")
	fmt.Fprintf(&b, "- No network, install, mutation, global config, MCP, daemon, or watcher action is approved by default.\n")
	return b.String()
}

func RenderAgentHandoff(bundle Bundle) string {
	var b strings.Builder
	fmt.Fprintf(&b, "# Agent Handoff\n\n")
	fmt.Fprintf(&b, "## Start Here\n\n")
	for _, name := range []string{"preflight.md", "toolchain.json", "preflight-gaps.jsonl"} {
		fmt.Fprintf(&b, "- `%s`\n", name)
	}
	for _, artifact := range bundle.Artifacts {
		if artifact.Status == "present" {
			fmt.Fprintf(&b, "- `%s`\n", escapeInline(artifact.Kind))
		}
	}
	fmt.Fprintf(&b, "\n## Allowed Claims\n\n")
	fmt.Fprintf(&b, "- Describe only local visible shape and linked artifacts.\n")
	fmt.Fprintf(&b, "- Treat candidate tools as recommendations, not evidence.\n")
	fmt.Fprintf(&b, "- Preserve complete architecture, runtime topology, and call graph as unknown or cannot_verify unless local evidence exists.\n")
	fmt.Fprintf(&b, "\n## Blind Spots\n\n")
	for _, gap := range firstGaps(bundle.Gaps, 6) {
		fmt.Fprintf(&b, "- `%s`: %s (`%s`)\n", escapeInline(gap.ID), escapeText(gap.Reason), escapeInline(gap.Status))
	}
	fmt.Fprintf(&b, "\n## Safe Probes\n\n")
	fmt.Fprintf(&b, "- Inspect linked Portolan artifacts first.\n")
	fmt.Fprintf(&b, "- Ask for explicit approval before running external tools or install commands.\n")
	fmt.Fprintf(&b, "\n## Approval Required\n\n")
	fmt.Fprintf(&b, "- Network access, tool installation, target repository mutation, global agent configuration, MCP registration, daemon startup, and watcher startup.\n")
	return b.String()
}

func RenderGapsJSONL(gaps []PreflightGap) string {
	var b strings.Builder
	enc := json.NewEncoder(&b)
	for _, gap := range gaps {
		_ = enc.Encode(gap)
	}
	return b.String()
}

func resolveOptions(options Options) (string, string, string, error) {
	if strings.TrimSpace(options.Root) == "" {
		return "", "", "", errors.New("--root is required")
	}
	if strings.TrimSpace(options.Artifacts) == "" {
		return "", "", "", errors.New("--artifacts is required")
	}
	if strings.TrimSpace(options.Out) == "" {
		return "", "", "", errors.New("--out is required")
	}
	if hasTraversal(options.Out) {
		return "", "", "", errors.New("--out must not contain path traversal")
	}
	root, err := filepath.Abs(options.Root)
	if err != nil {
		return "", "", "", fmt.Errorf("resolve root: %w", err)
	}
	artifacts, err := filepath.Abs(options.Artifacts)
	if err != nil {
		return "", "", "", fmt.Errorf("resolve artifacts: %w", err)
	}
	out, err := filepath.Abs(options.Out)
	if err != nil {
		return "", "", "", fmt.Errorf("resolve out: %w", err)
	}
	if info, err := os.Stat(root); err != nil {
		return "", "", "", fmt.Errorf("root: %w", err)
	} else if !info.IsDir() {
		return "", "", "", errors.New("root must be a directory")
	}
	if info, err := os.Stat(artifacts); err != nil {
		return "", "", "", fmt.Errorf("artifacts: %w", err)
	} else if !info.IsDir() {
		return "", "", "", errors.New("artifacts must be a directory")
	}
	return root, artifacts, out, nil
}

func discoverArtifacts(dir string) ([]ArtifactLink, []PreflightGap) {
	links := make([]ArtifactLink, 0, len(knownArtifactNames))
	var gaps []PreflightGap
	for _, name := range knownArtifactNames {
		path := filepath.Join(dir, name)
		link := ArtifactLink{Kind: name, Path: name, Status: "missing"}
		if info, err := os.Stat(path); err == nil && !info.IsDir() {
			link.Status = "present"
			if isJSONArtifact(name) {
				if err := validateJSONArtifact(path, strings.HasSuffix(name, ".jsonl")); err != nil {
					link.Status = "malformed"
					gaps = append(gaps, PreflightGap{
						ID:             "malformed-artifact-" + slug(name),
						EvidenceFamily: "artifact-validity",
						Reason:         fmt.Sprintf("%s is malformed: %v", name, err),
						NextProbe:      "Regenerate or remove the malformed local artifact before relying on it.",
						Status:         "blocked",
					})
				}
			}
		} else {
			gaps = append(gaps, PreflightGap{
				ID:             "missing-artifact-" + slug(name),
				EvidenceFamily: artifactFamily(name),
				Reason:         fmt.Sprintf("%s is not present in the artifact directory", name),
				NextProbe:      "Generate or supply the local Portolan artifact when this evidence family is needed.",
				Status:         "not_assessed",
			})
		}
		links = append(links, link)
	}
	return links, gaps
}

func recommendTools(artifacts string) []ToolchainRecommendation {
	tools := []ToolchainRecommendation{
		tool("ast-index", "symbol/reference/module indexing", "symbol-reference evidence", []string{"tool-execution"}, []string{"index format and target mutation posture must be reviewed"}, "Use only if preflight gaps show symbol/reference evidence is the next best move."),
		tool("ctags", "bounded definition/import-reference extraction", "source-visible symbol/reference candidates", []string{"tool-execution"}, []string{"language coverage is partial"}, "Run a bounded local command only after operator approval."),
		tool("graphify", "graph exploration over supplied outputs", "metadata-visible graph exploration candidates", []string{"tool-execution"}, []string{"LLM/MCP/dashboard behavior remains separate from Portolan evidence"}, "Use supplied output or run separately with explicit approval."),
		tool("jdeps", "JVM artifact dependency inspection", "metadata-visible JVM dependency evidence", []string{"tool-execution"}, []string{"requires compiled artifacts"}, "Use only against existing local class or jar artifacts."),
		tool("jscpd", "near-duplicate detection", "source-visible duplication evidence", []string{"tool-execution"}, []string{"large roots can be unbounded"}, "Use sharded local execution after approval."),
		tool("semgrep", "local static pattern checks", "source-visible static findings", []string{"tool-execution"}, []string{"rule packs and telemetry posture must be explicit"}, "Use local rules only after approval."),
		tool("syft", "SBOM/component inventory", "metadata-visible component inventory", []string{"tool-execution"}, []string{"dependency coordinates can be private"}, "Use local output when supplied or run after approval."),
		tool("understand-anything", "agent-facing code understanding UI", "claim-only navigation aid until outputs are imported", []string{"tool-execution"}, []string{"LLM-authored graphs are not Portolan evidence"}, "Park unless it supplies local bounded output for import."),
	}
	for i := range tools {
		tools[i].Status = classifyTool(tools[i].Tool, artifacts)
	}
	return tools
}

func tool(name, job, family string, boundary []string, risk []string, next string) ToolchainRecommendation {
	return ToolchainRecommendation{
		Tool:             name,
		Job:              job,
		Status:           "missing",
		EvidenceFamily:   family,
		ApprovalBoundary: boundary,
		Risk:             risk,
		NextAction:       next,
		EvidenceState:    "not_evidence",
	}
}

func classifyTool(name string, artifacts string) string {
	outputNames := map[string][]string{
		"semgrep": {"semgrep.json", "semgrep.sarif"},
		"jscpd":   {"jscpd.json"},
		"syft":    {"sbom.cdx.json", "cyclonedx.json"},
	}
	for _, output := range outputNames[name] {
		if _, err := os.Stat(filepath.Join(artifacts, output)); err == nil {
			return "supplied-output"
		}
	}
	if _, err := exec.LookPath(name); err == nil {
		return "installed"
	}
	switch name {
	case "graphify", "understand-anything", "ast-index":
		return "parked"
	default:
		return "approval-required"
	}
}

func readGapRecords(path string) []PreflightGap {
	file, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer file.Close()
	var gaps []PreflightGap
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		var raw map[string]any
		if err := json.Unmarshal([]byte(line), &raw); err != nil {
			continue
		}
		gaps = append(gaps, PreflightGap{
			ID:             stringValue(raw, "id", "gap"),
			EvidenceFamily: stringValue(raw, "evidence_family", "existing-gap"),
			Reason:         stringValue(raw, "reason", "existing local gap record"),
			NextProbe:      stringValue(raw, "next_probe", "Inspect the source gap artifact."),
			Status:         stringValue(raw, "status", "not_assessed"),
		})
	}
	return gaps
}

func detectScope(root string) string {
	if countRepositories(root) > 1 {
		return "partial-multi-repo"
	}
	if _, err := os.Stat(filepath.Join(root, ".git")); err == nil {
		return "single-repo"
	}
	return "unknown"
}

func countRepositories(root string) int {
	count := 0
	if _, err := os.Stat(filepath.Join(root, ".git")); err == nil {
		count++
	}
	entries, err := os.ReadDir(root)
	if err != nil {
		return count
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		if _, err := os.Stat(filepath.Join(root, entry.Name(), ".git")); err == nil {
			count++
		}
	}
	return count
}

func detectSignals(root string) []string {
	checks := map[string]string{
		"go.mod":             "go",
		"pom.xml":            "maven",
		"build.gradle":       "gradle",
		"package.json":       "node",
		"Dockerfile":         "docker",
		"docker-compose.yml": "compose",
		"Chart.yaml":         "helm",
	}
	var signals []string
	for filename, signal := range checks {
		if _, err := os.Stat(filepath.Join(root, filename)); err == nil {
			signals = append(signals, signal)
		}
	}
	sort.Strings(signals)
	return signals
}

func validateJSONArtifact(path string, jsonl bool) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	if strings.TrimSpace(string(data)) == "" {
		return nil
	}
	if !jsonl {
		var raw any
		return json.Unmarshal(data, &raw)
	}
	scanner := bufio.NewScanner(strings.NewReader(string(data)))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		var raw any
		if err := json.Unmarshal([]byte(line), &raw); err != nil {
			return err
		}
	}
	return scanner.Err()
}

func isJSONArtifact(name string) bool {
	return strings.HasSuffix(name, ".json") || strings.HasSuffix(name, ".jsonl")
}

func artifactFamily(name string) string {
	switch name {
	case "summary.json", "graph-index.json", "map.md":
		return "map-orientation"
	case "findings.jsonl":
		return "finding-evidence"
	case "tool-registry.json", "oss-plan.json":
		return "toolchain-planning"
	case "gaps.jsonl":
		return "known-gaps"
	default:
		return "agent-context"
	}
}

func mustMarshalToolchain(toolchain Toolchain) []byte {
	if err := ValidateToolchain(toolchain); err != nil {
		panic(err)
	}
	data, err := json.MarshalIndent(toolchain, "", "  ")
	if err != nil {
		panic(err)
	}
	return append(data, '\n')
}

func firstGaps(gaps []PreflightGap, limit int) []PreflightGap {
	if len(gaps) <= limit {
		return gaps
	}
	return gaps[:limit]
}

func stringValue(raw map[string]any, key string, fallback string) string {
	if value, ok := raw[key].(string); ok && strings.TrimSpace(value) != "" {
		return value
	}
	return fallback
}

func slug(value string) string {
	value = strings.ToLower(value)
	value = strings.ReplaceAll(value, ".", "-")
	value = strings.ReplaceAll(value, "_", "-")
	return value
}

func hasTraversal(path string) bool {
	for _, part := range strings.Split(filepath.ToSlash(path), "/") {
		if part == ".." {
			return true
		}
	}
	return false
}

func ensureInside(base string, path string) error {
	if filepath.Clean(base) == filepath.Clean(path) {
		return nil
	}
	baseEval, err := filepath.EvalSymlinks(base)
	if err != nil {
		baseEval = base
	}
	pathEval, err := filepath.EvalSymlinks(filepath.Dir(path))
	if err != nil {
		pathEval = filepath.Dir(path)
	}
	rel, err := filepath.Rel(baseEval, pathEval)
	if err != nil {
		return err
	}
	if rel == ".." || strings.HasPrefix(rel, ".."+string(os.PathSeparator)) {
		return fmt.Errorf("output path %s escapes output directory %s", path, base)
	}
	return nil
}

func escapeInline(value string) string {
	value = strings.ReplaceAll(value, "`", "'")
	return escapeText(value)
}

func escapeText(value string) string {
	value = html.EscapeString(value)
	value = strings.ReplaceAll(value, "\n", " ")
	value = strings.ReplaceAll(value, "\r", " ")
	if len(value) > 240 {
		return value[:240] + "..."
	}
	return value
}
