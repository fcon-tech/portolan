package maprun

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

	"github.com/fall-out-bug/portolan/internal/graph"
	"github.com/fall-out-bug/portolan/internal/packet"
	"github.com/fall-out-bug/portolan/internal/relationships"
)

type Options struct {
	RootPath   string
	OutputPath string
	Force      bool
	Version    string
}

type Result struct {
	OutputPath string
	Artifacts  Artifacts
}

type Artifacts struct {
	Run      string `json:"run"`
	Graph    string `json:"graph"`
	Findings string `json:"findings"`
	Packet   string `json:"packet"`
}

type RunMetadata struct {
	SchemaVersion   string    `json:"schema_version"`
	Command         string    `json:"command"`
	Version         string    `json:"version"`
	GeneratedAt     time.Time `json:"generated_at"`
	Root            string    `json:"root"`
	OutputPath      string    `json:"output_path"`
	Artifacts       Artifacts `json:"artifacts"`
	EnabledSurfaces []string  `json:"enabled_surfaces"`
	SkippedSurfaces []string  `json:"skipped_surfaces"`
	Warnings        []string  `json:"warnings"`
}

type Finding struct {
	ID             string  `json:"id"`
	Kind           string  `json:"kind"`
	Summary        string  `json:"summary"`
	Severity       string  `json:"severity"`
	EvidenceState  string  `json:"evidence_state"`
	EvidenceSource string  `json:"evidence_source"`
	Confidence     float64 `json:"confidence"`
	Status         string  `json:"status"`
}

const SchemaVersion = "0.1.0"

func Run(opts Options) (Result, error) {
	if opts.RootPath == "" {
		return Result{}, errors.New("--root is required")
	}
	if opts.OutputPath == "" {
		return Result{}, errors.New("--out is required")
	}
	if opts.Version == "" {
		opts.Version = "dev"
	}

	root, out, err := validateStartup(opts)
	if err != nil {
		return Result{}, err
	}

	parent := filepath.Dir(out)
	temp, err := os.MkdirTemp(parent, "."+filepath.Base(out)+".tmp-*")
	if err != nil {
		return Result{}, fmt.Errorf("create temporary bundle: %w", err)
	}
	defer os.RemoveAll(temp)

	artifacts := Artifacts{
		Run:      filepath.Join(out, "run.json"),
		Graph:    filepath.Join(out, "graph.json"),
		Findings: filepath.Join(out, "findings.jsonl"),
		Packet:   filepath.Join(out, "map.md"),
	}
	g, walkWarnings := graphForRoot(root)
	relationshipResult := relationships.Detect(root)
	g.Nodes = append(g.Nodes, relationshipResult.Nodes...)
	g.Edges = append(g.Edges, relationshipResult.Edges...)
	sortGraph(&g)
	findings := findingsForRoot(root, relationshipResult)
	skippedSurfaces := []string{
		"relationship-non-go-source",
		"relationship-runtime-inference",
		"relationship-lifecycle-modeling",
		"relationship-service-topology-inference",
		"duplication-detection",
		"configuration-surfaces",
		"technical-debt-findings",
	}
	warnings := append([]string{
		"relationship sub-surfaces beyond Go imports and go.mod manifests are not implemented; placeholder findings are not_assessed",
		"duplication, configuration, and technical-debt detectors are not implemented; placeholder findings are not_assessed",
	}, walkWarnings...)
	for _, issue := range relationshipResult.Issues {
		warnings = append(warnings, "relationship detection: "+issue.Path+": "+issue.Reason)
	}
	metadata := RunMetadata{
		SchemaVersion:   SchemaVersion,
		Command:         "portolan map",
		Version:         opts.Version,
		GeneratedAt:     time.Now().UTC(),
		Root:            root,
		OutputPath:      out,
		Artifacts:       artifacts,
		EnabledSurfaces: []string{"source-inventory", "relationship-detection"},
		SkippedSurfaces: skippedSurfaces,
		Warnings:        warnings,
	}

	if err := writeGraph(filepath.Join(temp, "graph.json"), g); err != nil {
		return Result{}, err
	}
	if err := WriteFindings(filepath.Join(temp, "findings.jsonl"), findings); err != nil {
		return Result{}, err
	}
	if err := writeRun(filepath.Join(temp, "run.json"), metadata); err != nil {
		return Result{}, err
	}
	if err := writeMap(filepath.Join(temp, "map.md"), g, findings); err != nil {
		return Result{}, err
	}

	if err := replaceOutput(temp, out, opts.Force); err != nil {
		return Result{}, fmt.Errorf("replace output bundle: %w", err)
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
	if _, err := os.ReadDir(root); err != nil {
		return "", "", fmt.Errorf("read root: %w", err)
	}

	outAbs, err := filepath.Abs(opts.OutputPath)
	if err != nil {
		return "", "", fmt.Errorf("resolve output: %w", err)
	}
	out, err := resolveOutputPath(outAbs)
	if err != nil {
		return "", "", err
	}
	parent := filepath.Dir(out)
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
	if isWithin(root, out) {
		return "", "", fmt.Errorf("output path must not contain mapped root")
	}
	if dangerousOutputPath(out, root) {
		return "", "", fmt.Errorf("output path is too broad or unsafe")
	}
	if err := os.MkdirAll(parent, 0o755); err != nil {
		return "", "", fmt.Errorf("create output parent: %w", err)
	}
	return root, out, nil
}

func resolveOutputPath(path string) (string, error) {
	clean := filepath.Clean(path)
	existing := clean
	var suffix []string
	for {
		if info, err := os.Stat(existing); err == nil {
			if !info.IsDir() {
				return "", fmt.Errorf("output parent is not a directory")
			}
			resolved, err := filepath.EvalSymlinks(existing)
			if err != nil {
				return "", fmt.Errorf("resolve output parent: %w", err)
			}
			for i := len(suffix) - 1; i >= 0; i-- {
				resolved = filepath.Join(resolved, suffix[i])
			}
			return filepath.Clean(resolved), nil
		} else if !os.IsNotExist(err) {
			return "", fmt.Errorf("inspect output parent: %w", err)
		}
		parent := filepath.Dir(existing)
		if parent == existing {
			return "", fmt.Errorf("output parent must exist")
		}
		suffix = append(suffix, filepath.Base(existing))
		existing = parent
	}
}

func dangerousOutputPath(out, root string) bool {
	clean := filepath.Clean(out)
	if clean == filepath.Clean(root) {
		return true
	}
	if filepath.Dir(clean) == clean {
		return true
	}
	if clean == filepath.Clean(os.TempDir()) {
		return true
	}
	home, err := os.UserHomeDir()
	if err == nil && clean == filepath.Clean(home) {
		return true
	}
	return false
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

func graphForRoot(root string) (graph.Graph, []string) {
	g := graph.New()
	label := filepath.Base(root)
	if label == "." || label == string(filepath.Separator) {
		label = root
	}
	g.Nodes = append(g.Nodes, graph.Node{
		ID:    "root",
		Kind:  "repository",
		Label: label,
		Evidence: graph.Evidence{
			State:  graph.SourceVisible,
			Source: root,
		},
	})
	entries, warnings := visibleEntries(root)
	for _, entry := range entries {
		g.Nodes = append(g.Nodes, graph.Node{
			ID:    "source:" + entry,
			Kind:  "unknown",
			Label: entry,
			Evidence: graph.Evidence{
				State:  graph.SourceVisible,
				Source: filepath.Join(root, filepath.FromSlash(entry)),
			},
		})
		g.Edges = append(g.Edges, graph.Edge{
			From: "root",
			To:   "source:" + entry,
			Kind: "observes",
			Evidence: graph.Evidence{
				State:  graph.SourceVisible,
				Source: root,
			},
		})
	}
	sortGraph(&g)
	return g, warnings
}

func visibleEntries(root string) ([]string, []string) {
	var entries []string
	var warnings []string
	_ = filepath.WalkDir(root, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			warnings = append(warnings, fmt.Sprintf("cannot read %s: %v", path, err))
			return nil
		}
		if path == root {
			return nil
		}
		rel, relErr := filepath.Rel(root, path)
		if relErr != nil {
			return nil
		}
		rel = filepath.ToSlash(rel)
		if pathHasHiddenPortolan(rel) {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if entry.IsDir() {
			return nil
		}
		entries = append(entries, rel)
		return nil
	})
	sort.Strings(entries)
	sort.Strings(warnings)
	return entries, warnings
}

func pathHasHiddenPortolan(path string) bool {
	for _, part := range strings.Split(filepath.ToSlash(path), "/") {
		if part == ".portolan" {
			return true
		}
	}
	return false
}

func findingsForRoot(root string, relationshipResult relationships.Result) []Finding {
	findings := []Finding{
		{
			ID:             "finding-inventory-root",
			Kind:           "inventory",
			Summary:        "Repository root is locally visible.",
			Severity:       "info",
			EvidenceState:  string(graph.SourceVisible),
			EvidenceSource: root,
			Confidence:     1.0,
			Status:         "observed",
		},
	}
	findings = append(findings, relationshipFindings(root, relationshipResult)...)
	findings = append(findings,
		notAssessedFinding("finding-duplication-not-assessed", "duplication", "Duplication detection is not implemented in this map slice."),
		notAssessedFinding("finding-configuration-not-assessed", "configuration", "Configuration surface detection is not implemented in this map slice."),
		notAssessedFinding("finding-technical-debt-not-assessed", "technical-debt", "Technical-debt finding rules are not implemented in this map slice."),
	)
	return findings
}

func relationshipFindings(root string, result relationships.Result) []Finding {
	var findings []Finding
	total := result.SourceImportCount + result.ManifestRequireCount
	if total > 0 {
		if result.SourceImportCount > 0 {
			findings = append(findings, Finding{
				ID:             "finding-relationships-source-imports-observed",
				Kind:           "relationships",
				Summary:        fmt.Sprintf("Detected %d source import relationships from local Go source files.", result.SourceImportCount),
				Severity:       "info",
				EvidenceState:  string(graph.SourceVisible),
				EvidenceSource: root,
				Confidence:     1.0,
				Status:         "observed",
			})
		}
		if result.ManifestRequireCount > 0 {
			findings = append(findings, Finding{
				ID:             "finding-relationships-manifest-dependencies-observed",
				Kind:           "relationships",
				Summary:        fmt.Sprintf("Detected %d manifest dependency relationships from local go.mod files.", result.ManifestRequireCount),
				Severity:       "info",
				EvidenceState:  string(graph.MetadataVisible),
				EvidenceSource: root,
				Confidence:     1.0,
				Status:         "observed",
			})
		}
	} else {
		findings = append(findings, notAssessedFinding("finding-relationships-not-assessed", "relationships", "Relationship detection currently supports Go imports and go.mod manifests; no supported relationship inputs were observed."))
	}
	findings = append(findings, unsupportedRelationshipFindings()...)
	for i, issue := range result.Issues {
		findings = append(findings, Finding{
			ID:             fmt.Sprintf("finding-relationships-cannot-verify-%03d", i+1),
			Kind:           "relationships",
			Summary:        "Could not verify relationship input: " + issue.Reason,
			Severity:       "info",
			EvidenceState:  string(graph.CannotVerify),
			EvidenceSource: issue.Path,
			Confidence:     0,
			Status:         "cannot_verify",
		})
	}
	return findings
}

func unsupportedRelationshipFindings() []Finding {
	return []Finding{
		notAssessedFinding("finding-relationships-non-go-source-not-assessed", "relationships", "Non-Go source relationship detection is not implemented in this map slice."),
		notAssessedFinding("finding-relationships-runtime-inference-not-assessed", "relationships", "Runtime relationship inference is not implemented in this map slice."),
		notAssessedFinding("finding-relationships-lifecycle-modeling-not-assessed", "relationships", "Lifecycle relationship modeling is not implemented in this map slice."),
		notAssessedFinding("finding-relationships-service-topology-not-assessed", "relationships", "Service-topology inference is not implemented in this map slice."),
	}
}

func notAssessedFinding(id, kind, summary string) Finding {
	return Finding{
		ID:             id,
		Kind:           kind,
		Summary:        summary,
		Severity:       "info",
		EvidenceState:  "not_assessed",
		EvidenceSource: "portolan map",
		Confidence:     0,
		Status:         "not_assessed",
	}
}

func WriteFindings(path string, findings []Finding) error {
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("create findings: %w", err)
	}
	writer := bufio.NewWriter(file)
	encoder := json.NewEncoder(writer)
	for _, finding := range findings {
		if err := validateFinding(finding); err != nil {
			file.Close()
			return err
		}
		if err := encoder.Encode(finding); err != nil {
			file.Close()
			return fmt.Errorf("write findings: %w", err)
		}
	}
	if err := writer.Flush(); err != nil {
		file.Close()
		return fmt.Errorf("write findings: %w", err)
	}
	if err := file.Close(); err != nil {
		return fmt.Errorf("write findings: %w", err)
	}
	return nil
}

func validateFinding(finding Finding) error {
	if finding.ID == "" || finding.Kind == "" || finding.Summary == "" || finding.Severity == "" || finding.EvidenceState == "" || finding.EvidenceSource == "" || finding.Status == "" {
		return fmt.Errorf("finding %q is incomplete", finding.ID)
	}
	switch finding.Kind {
	case "inventory", "relationships", "duplication", "configuration", "technical-debt":
	default:
		return fmt.Errorf("finding %q kind %q is not supported", finding.ID, finding.Kind)
	}
	switch finding.Severity {
	case "info", "low", "medium", "high":
	default:
		return fmt.Errorf("finding %q severity %q is not supported", finding.ID, finding.Severity)
	}
	switch finding.EvidenceState {
	case string(graph.SourceVisible), string(graph.MetadataVisible), string(graph.RuntimeVisible), string(graph.ClaimOnly), string(graph.Unknown), string(graph.CannotVerify), "not_assessed":
	default:
		return fmt.Errorf("finding %q evidence_state %q is not supported", finding.ID, finding.EvidenceState)
	}
	switch finding.Status {
	case "observed", "not_assessed", "unknown", "cannot_verify":
	default:
		return fmt.Errorf("finding %q status %q is not supported", finding.ID, finding.Status)
	}
	if finding.Confidence < 0 || finding.Confidence > 1 {
		return fmt.Errorf("finding %q confidence must be between 0 and 1", finding.ID)
	}
	return nil
}

func writeGraph(path string, g graph.Graph) error {
	data, err := json.MarshalIndent(g, "", "  ")
	if err != nil {
		return fmt.Errorf("encode graph: %w", err)
	}
	return os.WriteFile(path, append(data, '\n'), 0o644)
}

func writeRun(path string, metadata RunMetadata) error {
	data, err := json.MarshalIndent(metadata, "", "  ")
	if err != nil {
		return fmt.Errorf("encode run metadata: %w", err)
	}
	return os.WriteFile(path, append(data, '\n'), 0o644)
}

func writeMap(path string, g graph.Graph, findings []Finding) error {
	var b strings.Builder
	b.WriteString("# Portolan Map\n\n")
	fmt.Fprintf(&b, "- Findings: %d\n", len(findings))
	fmt.Fprintf(&b, "- Nodes: %d\n", len(g.Nodes))
	fmt.Fprintf(&b, "- Edges: %d\n\n", len(g.Edges))
	b.WriteString("## Skipped Surfaces\n\n")
	wroteSkipped := false
	for _, finding := range findings {
		if finding.Status != "not_assessed" {
			continue
		}
		wroteSkipped = true
		fmt.Fprintf(&b, "- `%s`: %s\n", finding.Kind, finding.Summary)
	}
	if !wroteSkipped {
		b.WriteString("- None.\n")
	}
	b.WriteString("\n")
	b.WriteString("## Findings\n\n")
	for _, finding := range findings {
		fmt.Fprintf(&b, "- `%s` [%s]: %s (%s).\n", finding.ID, finding.Status, finding.Summary, finding.EvidenceState)
	}
	b.WriteString("\n")
	b.Write(packet.RenderMarkdown(g))
	return os.WriteFile(path, []byte(b.String()), 0o644)
}

func isWithin(path, root string) bool {
	cleanPath := filepath.Clean(path)
	cleanRoot := filepath.Clean(root)
	if cleanPath == cleanRoot {
		return true
	}
	rel, err := filepath.Rel(cleanRoot, cleanPath)
	return err == nil && rel != "." && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}

func sortGraph(g *graph.Graph) {
	sort.Slice(g.Nodes, func(i, j int) bool {
		return g.Nodes[i].ID < g.Nodes[j].ID
	})
	sort.Slice(g.Edges, func(i, j int) bool {
		if g.Edges[i].From != g.Edges[j].From {
			return g.Edges[i].From < g.Edges[j].From
		}
		if g.Edges[i].To != g.Edges[j].To {
			return g.Edges[i].To < g.Edges[j].To
		}
		return g.Edges[i].Kind < g.Edges[j].Kind
	})
}
