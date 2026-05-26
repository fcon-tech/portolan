package contextprep

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

const SchemaVersion = "0.1.0"

type Options struct {
	RootPath   string
	OutputPath string
	Profile    string
	Force      bool
	Version    string
}

type Result struct {
	OutputPath string
	Artifacts  Artifacts
}

type Artifacts struct {
	AgentBrief   string `json:"agent_brief"`
	QueryPlan    string `json:"query_plan"`
	Repos        string `json:"repos"`
	ToolRegistry string `json:"tool_registry"`
	Gaps         string `json:"gaps"`
}

type Repository struct {
	ID            string `json:"id"`
	Path          string `json:"path"`
	EvidenceState string `json:"evidence_state"`
	Discovery     string `json:"discovery"`
}

type ToolEntry struct {
	ID            string         `json:"id"`
	Family        string         `json:"family"`
	Kind          string         `json:"kind"`
	Path          string         `json:"path"`
	EvidenceState string         `json:"evidence_state"`
	Status        string         `json:"status"`
	Summary       string         `json:"summary"`
	Confidence    *float64       `json:"confidence,omitempty"`
	Metrics       map[string]int `json:"metrics,omitempty"`
	Reason        string         `json:"reason"`
}

type Gap struct {
	ID            string `json:"id"`
	Family        string `json:"family"`
	Status        string `json:"status"`
	EvidenceState string `json:"evidence_state"`
	Reason        string `json:"reason"`
}

type repoFile struct {
	SchemaVersion string       `json:"schema_version"`
	GeneratedAt   time.Time    `json:"generated_at"`
	Root          string       `json:"root"`
	Profile       string       `json:"profile"`
	Repositories  []Repository `json:"repositories"`
}

type registryFile struct {
	SchemaVersion string      `json:"schema_version"`
	GeneratedAt   time.Time   `json:"generated_at"`
	Root          string      `json:"root"`
	Profile       string      `json:"profile"`
	Tools         []ToolEntry `json:"tools"`
}

var priorityFamilies = []string{
	"jscpd",
	"cyclonedx",
	"semgrep",
	"backstage",
	"openapi",
	"asyncapi",
	"structurizr",
	"code-index",
}

func Run(opts Options) (Result, error) {
	if opts.RootPath == "" {
		return Result{}, errors.New("--root is required")
	}
	if opts.OutputPath == "" {
		return Result{}, errors.New("--out is required")
	}
	if opts.Profile == "" {
		opts.Profile = "cursor"
	}
	if opts.Profile != "cursor" {
		return Result{}, fmt.Errorf("unsupported profile %q", opts.Profile)
	}
	if opts.Version == "" {
		opts.Version = "dev"
	}
	root, out, err := validateStartup(opts)
	if err != nil {
		return Result{}, err
	}

	repos, repoGaps := discoverRepositories(root)
	tools := detectToolOutputs(root, repos)
	gaps := append(repoGaps, gapsForMissingFamilies(tools)...)
	gaps = append(gaps, Gap{
		ID:            "gap-external-completeness",
		Family:        "external-completeness",
		Status:        "unknown",
		EvidenceState: "unknown",
		Reason:        "no manifest or curated inventory was supplied; local repository discovery does not prove complete ecosystem coverage",
	})
	sortRepositories(repos)
	sortToolEntries(tools)
	sortGaps(gaps)

	parent := filepath.Dir(out)
	temp, err := os.MkdirTemp(parent, "."+filepath.Base(out)+".tmp-*")
	if err != nil {
		return Result{}, fmt.Errorf("create temporary context pack: %w", err)
	}
	defer os.RemoveAll(temp)

	artifacts := Artifacts{
		AgentBrief:   filepath.Join(out, "agent-brief.md"),
		QueryPlan:    filepath.Join(out, "query-plan.md"),
		Repos:        filepath.Join(out, "repos.json"),
		ToolRegistry: filepath.Join(out, "tool-registry.json"),
		Gaps:         filepath.Join(out, "gaps.jsonl"),
	}
	now := time.Now().UTC()
	if err := writeJSON(filepath.Join(temp, "repos.json"), repoFile{
		SchemaVersion: SchemaVersion,
		GeneratedAt:   now,
		Root:          root,
		Profile:       opts.Profile,
		Repositories:  repos,
	}); err != nil {
		return Result{}, err
	}
	if err := writeJSON(filepath.Join(temp, "tool-registry.json"), registryFile{
		SchemaVersion: SchemaVersion,
		GeneratedAt:   now,
		Root:          root,
		Profile:       opts.Profile,
		Tools:         tools,
	}); err != nil {
		return Result{}, err
	}
	if err := writeGaps(filepath.Join(temp, "gaps.jsonl"), gaps); err != nil {
		return Result{}, err
	}
	if err := os.WriteFile(filepath.Join(temp, "agent-brief.md"), []byte(renderAgentBrief(root, repos, tools, gaps)), 0o644); err != nil {
		return Result{}, fmt.Errorf("write agent brief: %w", err)
	}
	if err := os.WriteFile(filepath.Join(temp, "query-plan.md"), []byte(renderQueryPlan()), 0o644); err != nil {
		return Result{}, fmt.Errorf("write query plan: %w", err)
	}
	if err := replaceOutput(temp, out, opts.Force); err != nil {
		return Result{}, fmt.Errorf("replace context pack: %w", err)
	}
	return Result{OutputPath: out, Artifacts: artifacts}, nil
}

func validateStartup(opts Options) (string, string, error) {
	rootAbs, err := filepath.Abs(opts.RootPath)
	if err != nil {
		return "", "", fmt.Errorf("resolve root: %w", err)
	}
	root, err := filepath.EvalSymlinks(rootAbs)
	if err != nil {
		if os.IsNotExist(err) {
			return "", "", fmt.Errorf("root path does not exist")
		}
		return "", "", fmt.Errorf("resolve root: %w", err)
	}
	info, err := os.Stat(root)
	if err != nil {
		return "", "", fmt.Errorf("inspect root: %w", err)
	}
	if !info.IsDir() {
		return "", "", fmt.Errorf("root path must be a directory")
	}
	outAbs, err := filepath.Abs(opts.OutputPath)
	if err != nil {
		return "", "", fmt.Errorf("resolve output: %w", err)
	}
	out := filepath.Clean(outAbs)
	if existing, err := os.Lstat(out); err == nil {
		if existing.Mode()&os.ModeSymlink != 0 {
			return "", "", fmt.Errorf("output path must not be a symlink")
		}
		if !existing.IsDir() {
			return "", "", fmt.Errorf("output path must be a directory")
		}
		if !opts.Force {
			return "", "", fmt.Errorf("output path already exists; use --force to overwrite")
		}
	} else if !os.IsNotExist(err) {
		return "", "", fmt.Errorf("inspect output path: %w", err)
	}
	if isWithin(out, root) && !isWithin(out, filepath.Join(root, ".portolan")) {
		return "", "", fmt.Errorf("output path inside root must be under .portolan")
	}
	if err := os.MkdirAll(filepath.Dir(out), 0o755); err != nil {
		return "", "", fmt.Errorf("create output parent: %w", err)
	}
	return root, out, nil
}

func discoverRepositories(root string) ([]Repository, []Gap) {
	repos := []Repository{}
	gaps := []Gap{}
	seen := map[string]bool{}
	if isGitRepository(root) {
		repos = append(repos, Repository{
			ID:            "root",
			Path:          root,
			EvidenceState: "source-visible",
			Discovery:     "root git repository",
		})
		seen[root] = true
	}
	for _, parent := range []struct {
		path      string
		discovery string
	}{
		{path: root, discovery: "direct child repository"},
		{path: filepath.Join(root, "repos"), discovery: "repos child repository"},
	} {
		entries, err := os.ReadDir(parent.path)
		if err != nil {
			if parent.path != root && os.IsNotExist(err) {
				continue
			}
			gaps = append(gaps, Gap{
				ID:            "gap-read-" + safeID(parent.path),
				Family:        "repository-discovery",
				Status:        "cannot_verify",
				EvidenceState: "cannot_verify",
				Reason:        "cannot read discovery directory: " + err.Error(),
			})
			continue
		}
		for _, entry := range entries {
			path := filepath.Join(parent.path, entry.Name())
			info, err := os.Lstat(path)
			if err != nil {
				gaps = append(gaps, Gap{
					ID:            "gap-inspect-" + safeID(path),
					Family:        "repository-discovery",
					Status:        "cannot_verify",
					EvidenceState: "cannot_verify",
					Reason:        "cannot inspect candidate path: " + err.Error(),
				})
				continue
			}
			if info.Mode()&os.ModeSymlink != 0 {
				gaps = append(gaps, Gap{
					ID:            "gap-symlink-" + safeID(path),
					Family:        "repository-discovery",
					Status:        "not_assessed",
					EvidenceState: "cannot_verify",
					Reason:        "symlinked repository candidates are not followed by context preparation",
				})
				continue
			}
			if !info.IsDir() || !isGitRepository(path) || seen[path] {
				continue
			}
			repos = append(repos, Repository{
				ID:            uniqueRepoID(entry.Name(), repos),
				Path:          path,
				EvidenceState: "source-visible",
				Discovery:     parent.discovery,
			})
			seen[path] = true
		}
	}
	if len(repos) == 0 {
		gaps = append(gaps, Gap{
			ID:            "gap-repositories-not-found",
			Family:        "repository-discovery",
			Status:        "unknown",
			EvidenceState: "unknown",
			Reason:        "no Git repositories were discovered under the bounded root/direct-child/repos policy",
		})
		if hasCuratedOrRepoLikeInputs(root) {
			gaps = append(gaps, Gap{
				ID:            "gap-repo-like-structure-without-git",
				Family:        "repository-discovery",
				Status:        "unknown",
				EvidenceState: "unknown",
				Reason:        "selection.json or repo-like child directories are present, but bounded discovery found no .git directories; these paths are not Git repositories and were not marked source-visible",
			})
		}
	}
	return repos, gaps
}

func hasCuratedOrRepoLikeInputs(root string) bool {
	if info, err := os.Stat(filepath.Join(root, "selection.json")); err == nil && info.Mode().IsRegular() {
		return true
	}
	entries, err := os.ReadDir(filepath.Join(root, "repos"))
	if err != nil {
		return false
	}
	for _, entry := range entries {
		if entry.IsDir() {
			return true
		}
	}
	return false
}

func detectToolOutputs(root string, repos []Repository) []ToolEntry {
	candidateDirs := []string{
		root,
		filepath.Join(root, "tool-outputs"),
		filepath.Join(root, "reports"),
		filepath.Join(root, ".portolan"),
	}
	for _, repo := range repos {
		candidateDirs = append(candidateDirs,
			repo.Path,
			filepath.Join(repo.Path, "tool-outputs"),
			filepath.Join(repo.Path, "reports"),
			filepath.Join(repo.Path, ".portolan"),
		)
	}
	seen := map[string]bool{}
	usedIDs := map[string]bool{}
	entries := []ToolEntry{}
	for _, dir := range candidateDirs {
		info, err := os.Stat(dir)
		if err != nil || !info.IsDir() {
			continue
		}
		files, err := os.ReadDir(dir)
		if err != nil {
			continue
		}
		for _, file := range files {
			if file.IsDir() {
				continue
			}
			path := filepath.Join(dir, file.Name())
			if seen[path] {
				continue
			}
			families := familiesForFile(file.Name())
			for _, family := range families {
				id := uniqueID(family+"-"+safeID(path), usedIDs)
				entry := summarizeToolOutput(id, family, path)
				entries = append(entries, entry)
			}
			if len(families) > 0 {
				seen[path] = true
			}
		}
	}
	return entries
}

func summarizeToolOutput(id, family, path string) ToolEntry {
	entry := ToolEntry{
		ID:            id,
		Family:        family,
		Kind:          kindForFamily(family),
		Path:          path,
		EvidenceState: "metadata-visible",
		Status:        "candidate",
		Summary:       "Local OSS/tool-output candidate detected by filename convention.",
		Reason:        "local candidate output detected by filename convention",
	}
	switch family {
	case "jscpd", "cyclonedx", "semgrep":
		return summarizeJSONToolOutput(entry)
	default:
		return entry
	}
}

func summarizeJSONToolOutput(entry ToolEntry) ToolEntry {
	data, err := os.ReadFile(entry.Path)
	if err != nil {
		entry.EvidenceState = "cannot_verify"
		entry.Status = "cannot_verify"
		entry.Summary = "Tool output could not be read."
		entry.Reason = err.Error()
		return entry
	}
	var doc toolSummaryDocument
	decoder := json.NewDecoder(strings.NewReader(string(data)))
	if err := decoder.Decode(&doc); err != nil {
		entry.EvidenceState = "cannot_verify"
		entry.Status = "cannot_verify"
		entry.Summary = "Tool output could not be parsed."
		entry.Reason = "malformed JSON: " + err.Error()
		return entry
	}
	if decoder.Decode(&struct{}{}) == nil {
		entry.EvidenceState = "cannot_verify"
		entry.Status = "cannot_verify"
		entry.Summary = "Tool output could not be parsed."
		entry.Reason = "malformed JSON: trailing content"
		return entry
	}

	entry.Status = "observed"
	entry.Confidence = validConfidence(doc.Confidence)
	switch entry.Family {
	case "jscpd":
		entry.Metrics = map[string]int{"duplicate_groups": len(doc.Duplicates)}
		entry.Summary = "Local jscpd-style duplication evidence with " + formatCount(len(doc.Duplicates), "duplicate group") + "."
	case "cyclonedx":
		if doc.BOMFormat != "CycloneDX" {
			entry.EvidenceState = "cannot_verify"
			entry.Status = "cannot_verify"
			entry.Summary = "SBOM candidate is not CycloneDX JSON."
			entry.Reason = "bomFormat is not CycloneDX"
			return entry
		}
		entry.Metrics = map[string]int{
			"components":         len(doc.Components),
			"dependency_records": len(doc.Dependencies),
		}
		entry.Summary = "Local CycloneDX/Syft-compatible SBOM evidence with " + formatCount(len(doc.Components), "component") + " and " + formatCount(len(doc.Dependencies), "dependency record") + "."
	case "semgrep":
		results := len(doc.Results)
		if results == 0 {
			results = len(doc.LowercaseResults)
		}
		entry.Metrics = map[string]int{"results": results}
		entry.Summary = "Local Semgrep-style structural finding evidence with " + formatCount(results, "result") + "."
	}
	return entry
}

func formatCount(count int, singular string) string {
	if count == 1 {
		return fmt.Sprintf("1 %s", singular)
	}
	return fmt.Sprintf("%d %ss", count, singular)
}

type toolSummaryDocument struct {
	BOMFormat        string           `json:"bomFormat"`
	Confidence       *float64         `json:"confidence"`
	Components       []map[string]any `json:"components"`
	Dependencies     []map[string]any `json:"dependencies"`
	Duplicates       []map[string]any `json:"duplicates"`
	Results          []map[string]any `json:"Results"`
	LowercaseResults []map[string]any `json:"results"`
}

func validConfidence(value *float64) *float64 {
	if value == nil || *value < 0 || *value > 1 {
		return nil
	}
	confidence := *value
	return &confidence
}

func kindForFamily(family string) string {
	switch family {
	case "jscpd":
		return "duplication"
	case "cyclonedx":
		return "sbom"
	case "semgrep":
		return "configuration"
	case "backstage":
		return "service-catalog"
	case "openapi", "asyncapi":
		return "contract-surface"
	case "structurizr":
		return "architecture-model"
	case "code-index":
		return "code-index"
	default:
		return "unknown"
	}
}

func familiesForFile(name string) []string {
	lower := strings.ToLower(name)
	var families []string
	if strings.Contains(lower, "jscpd") || strings.Contains(lower, "duplication") || strings.Contains(lower, "duplicates") {
		families = append(families, "jscpd")
	}
	if strings.Contains(lower, "cyclonedx") || strings.Contains(lower, "syft") || strings.Contains(lower, "sbom") || lower == "bom.json" {
		families = append(families, "cyclonedx")
	}
	if strings.Contains(lower, "semgrep") {
		families = append(families, "semgrep")
	}
	if lower == "catalog-info.yaml" || lower == "catalog-info.yml" {
		families = append(families, "backstage")
	}
	if strings.Contains(lower, "openapi") || strings.Contains(lower, "swagger") {
		families = append(families, "openapi")
	}
	if strings.Contains(lower, "asyncapi") {
		families = append(families, "asyncapi")
	}
	if strings.Contains(lower, "structurizr") || lower == "workspace.dsl" {
		families = append(families, "structurizr")
	}
	if strings.Contains(lower, "scip") || strings.Contains(lower, "lsif") || strings.Contains(lower, "zoekt") || strings.Contains(lower, "opengrok") || strings.Contains(lower, "sourcebot") {
		families = append(families, "code-index")
	}
	return families
}

func gapsForMissingFamilies(tools []ToolEntry) []Gap {
	present := map[string]bool{}
	for _, tool := range tools {
		present[tool.Family] = true
	}
	var gaps []Gap
	for _, family := range priorityFamilies {
		if present[family] {
			continue
		}
		gaps = append(gaps, Gap{
			ID:            "gap-" + family + "-not-assessed",
			Family:        family,
			Status:        "not_assessed",
			EvidenceState: "not_assessed",
			Reason:        "no local candidate output was detected for this OSS/tool family",
		})
	}
	return gaps
}

func renderAgentBrief(root string, repos []Repository, tools []ToolEntry, gaps []Gap) string {
	var b strings.Builder
	observedTools := 0
	cannotVerifyTools := 0
	for _, tool := range tools {
		switch tool.Status {
		case "observed":
			observedTools++
		case "cannot_verify":
			cannotVerifyTools++
		}
	}
	fmt.Fprintf(&b, "# Portolan Agent Brief\n\n")
	fmt.Fprintf(&b, "Profile: Cursor\n\n")
	fmt.Fprintf(&b, "Target root: `%s`\n\n", root)
	fmt.Fprintf(&b, "Start here before answering CTO-level questions about this landscape.\n\n")
	fmt.Fprintf(&b, "## What To Read First\n\n")
	fmt.Fprintf(&b, "1. `repos.json` for discovered local repositories.\n")
	fmt.Fprintf(&b, "2. `tool-registry.json` for local OSS/tool-output candidates.\n")
	fmt.Fprintf(&b, "3. `query-plan.md` for the inspection order.\n")
	fmt.Fprintf(&b, "4. `gaps.jsonl` for `unknown`, `cannot_verify`, and `not_assessed` surfaces.\n\n")
	fmt.Fprintf(&b, "## Current Coverage\n\n")
	fmt.Fprintf(&b, "- Repositories discovered: %d\n", len(repos))
	fmt.Fprintf(&b, "- Local tool-output candidates: %d\n", len(tools))
	fmt.Fprintf(&b, "- Observed OSS/tool-output summaries: %d\n", observedTools)
	fmt.Fprintf(&b, "- Cannot-verify tool outputs: %d\n", cannotVerifyTools)
	fmt.Fprintf(&b, "- Gap records: %d\n", len(gaps))
	fmt.Fprintf(&b, "- External ecosystem completeness: `unknown`\n\n")
	fmt.Fprintf(&b, "Use `tool-registry.json` summaries and metrics as evidence candidates, not final architecture verdicts. Do not infer service relationships, duplicated components, ownership, runtime topology, or technical debt outside local evidence. Preserve `unknown`, `cannot_verify`, and `not_assessed` in the answer.\n")
	return b.String()
}

func renderQueryPlan() string {
	return `# Portolan Query Plan

## Before Answering

1. Read ` + "`repos.json`" + ` and identify the local scope.
2. Read ` + "`tool-registry.json`" + ` and list available OSS/tool-output families.
3. Read ` + "`gaps.jsonl`" + ` and preserve missing surfaces as unknown, cannot_verify, or not_assessed.

## CTO Questions

- Duplicate components: start with jscpd and CycloneDX/Syft summaries in
  ` + "`tool-registry.json`" + `. If they are absent, report duplication as
  not_assessed.
- Implicit knowledge: inspect repository manifests, local catalogs, contracts,
  and index handles. Do not turn naming conventions into facts without evidence.
- Service relationships: start with Backstage, OpenAPI, AsyncAPI, Structurizr,
  deployment manifests, and existing Portolan map artifacts.
- Large codebases: prefer local index handles over loading raw source into the
  prompt. If no index exists, report the index surface as not_assessed.
`
}

func writeJSON(path string, value any) error {
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("create %s: %w", path, err)
	}
	defer file.Close()
	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(value); err != nil {
		return fmt.Errorf("write %s: %w", path, err)
	}
	return nil
}

func writeGaps(path string, gaps []Gap) error {
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("create %s: %w", path, err)
	}
	defer file.Close()
	writer := bufio.NewWriter(file)
	encoder := json.NewEncoder(writer)
	for _, gap := range gaps {
		if err := encoder.Encode(gap); err != nil {
			return fmt.Errorf("write gap: %w", err)
		}
	}
	if err := writer.Flush(); err != nil {
		return fmt.Errorf("flush gaps: %w", err)
	}
	return nil
}

func replaceOutput(temp, out string, force bool) error {
	if !force {
		return os.Rename(temp, out)
	}
	if _, err := os.Lstat(out); os.IsNotExist(err) {
		return os.Rename(temp, out)
	} else if err != nil {
		return err
	}
	backup := out + ".old-" + time.Now().UTC().Format("20060102150405.000000000")
	if err := os.Rename(out, backup); err != nil {
		return err
	}
	if err := os.Rename(temp, out); err != nil {
		restoreErr := os.Rename(backup, out)
		if restoreErr != nil {
			return fmt.Errorf("%w; restore backup %s failed: %v", err, backup, restoreErr)
		}
		return err
	}
	return os.RemoveAll(backup)
}

func isGitRepository(path string) bool {
	info, err := os.Stat(filepath.Join(path, ".git"))
	return err == nil && (info.IsDir() || info.Mode().IsRegular())
}

func isWithin(path, parent string) bool {
	rel, err := filepath.Rel(parent, path)
	return err == nil && rel != "." && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}

func uniqueRepoID(name string, repos []Repository) string {
	base := safeID(name)
	if base == "" {
		base = "repo"
	}
	id := base
	used := map[string]bool{}
	for _, repo := range repos {
		used[repo.ID] = true
	}
	for i := 2; used[id]; i++ {
		id = fmt.Sprintf("%s-%d", base, i)
	}
	return id
}

func uniqueID(base string, used map[string]bool) string {
	if base == "" {
		base = "item"
	}
	id := base
	for i := 2; used[id]; i++ {
		id = fmt.Sprintf("%s-%d", base, i)
	}
	used[id] = true
	return id
}

func safeID(value string) string {
	value = strings.ToLower(filepath.Base(value))
	var b strings.Builder
	lastDash := false
	for _, r := range value {
		ok := (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9')
		if ok {
			b.WriteRune(r)
			lastDash = false
			continue
		}
		if !lastDash {
			b.WriteByte('-')
			lastDash = true
		}
	}
	return strings.Trim(b.String(), "-")
}

func sortRepositories(repos []Repository) {
	sort.Slice(repos, func(i, j int) bool {
		return repos[i].ID < repos[j].ID
	})
}

func sortToolEntries(entries []ToolEntry) {
	sort.Slice(entries, func(i, j int) bool {
		if entries[i].Family == entries[j].Family {
			return entries[i].Path < entries[j].Path
		}
		return entries[i].Family < entries[j].Family
	})
}

func sortGaps(gaps []Gap) {
	sort.Slice(gaps, func(i, j int) bool {
		return gaps[i].ID < gaps[j].ID
	})
}
