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

	"github.com/governor/portolan/internal/coverage"
	"github.com/governor/portolan/internal/graph"
	"github.com/governor/portolan/internal/packet"
	"github.com/governor/portolan/internal/relationships"
	"github.com/governor/portolan/internal/selection"
)

type Options struct {
	RootPath      string
	SelectionPath string
	OutputPath    string
	Force         bool
	Version       string
}

type Result struct {
	OutputPath string
	Artifacts  Artifacts
}

type Artifacts struct {
	Run      string `json:"run"`
	Coverage string `json:"coverage"`
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
	Selection       string    `json:"selection,omitempty"`
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
	if opts.RootPath == "" && opts.SelectionPath == "" {
		return Result{}, errors.New("--root or --selection is required")
	}
	if opts.RootPath != "" && opts.SelectionPath != "" {
		return Result{}, errors.New("--root and --selection are mutually exclusive")
	}
	if opts.OutputPath == "" {
		return Result{}, errors.New("--out is required")
	}
	if opts.Version == "" {
		opts.Version = "dev"
	}

	if opts.SelectionPath != "" {
		return runSelection(opts)
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
		Coverage: filepath.Join(out, "coverage.json"),
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
	rootSelection := selection.Selection{
		SchemaVersion: selection.SchemaVersion,
		Targets: []selection.Target{{
			ID:   "root",
			Kind: "repository",
			Path: root,
		}},
	}
	ledger, err := coverage.Build(rootSelection, "", "")
	if err != nil {
		return Result{}, err
	}
	findings = append(findings, deriveTechnicalDebtFindings(findings, ledger)...)
	sortFindings(findings)

	if err := writeGraph(filepath.Join(temp, "graph.json"), g); err != nil {
		return Result{}, err
	}
	if err := coverage.Write(filepath.Join(temp, "coverage.json"), ledger); err != nil {
		return Result{}, err
	}
	if err := WriteFindings(filepath.Join(temp, "findings.jsonl"), findings); err != nil {
		return Result{}, err
	}
	if err := writeRun(filepath.Join(temp, "run.json"), metadata); err != nil {
		return Result{}, err
	}
	if err := writeMapFromArtifacts(temp); err != nil {
		return Result{}, err
	}

	if err := replaceOutput(temp, out, opts.Force); err != nil {
		return Result{}, fmt.Errorf("replace output bundle: %w", err)
	}
	return Result{OutputPath: out, Artifacts: artifacts}, nil
}

func runSelection(opts Options) (Result, error) {
	sel, err := selection.Load(opts.SelectionPath)
	if err != nil {
		return Result{}, err
	}
	sel = coverage.ResolveSelectionPaths(sel, opts.SelectionPath)
	out, err := validateSelectionOutput(opts, sel)
	if err != nil {
		return Result{}, err
	}
	manifestPath := sel.CorpusManifest
	ledger, err := coverage.Build(sel, opts.SelectionPath, manifestPath)
	if err != nil {
		return Result{}, err
	}
	blockers := coverage.BlockingReasons(ledger)
	if sel.RequireFullCorpus && len(blockers) > 0 {
		return Result{}, fmt.Errorf("full corpus gate blocked: %s", strings.Join(blockers, "; "))
	}

	parent := filepath.Dir(out)
	temp, err := os.MkdirTemp(parent, "."+filepath.Base(out)+".tmp-*")
	if err != nil {
		return Result{}, fmt.Errorf("create temporary bundle: %w", err)
	}
	defer os.RemoveAll(temp)

	artifacts := Artifacts{
		Run:      filepath.Join(out, "run.json"),
		Coverage: filepath.Join(out, "coverage.json"),
		Graph:    filepath.Join(out, "graph.json"),
		Findings: filepath.Join(out, "findings.jsonl"),
		Packet:   filepath.Join(out, "map.md"),
	}
	g, findings, warnings := graphAndFindingsForSelection(sel)
	findings = append(findings, deriveTechnicalDebtFindings(findings, ledger)...)
	sortFindings(findings)
	skippedSurfaces := []string{
		"relationship-non-go-source",
		"relationship-runtime-inference",
		"relationship-lifecycle-modeling",
		"relationship-service-topology-inference",
		"duplication-native-detection",
		"configuration-native-detection",
	}
	metadata := RunMetadata{
		SchemaVersion:   SchemaVersion,
		Command:         "portolan map --selection",
		Version:         opts.Version,
		GeneratedAt:     time.Now().UTC(),
		Selection:       opts.SelectionPath,
		OutputPath:      out,
		Artifacts:       artifacts,
		EnabledSurfaces: []string{"source-inventory", "relationship-detection", "coverage", "tool-output-import"},
		SkippedSurfaces: skippedSurfaces,
		Warnings:        warnings,
	}

	if err := writeGraph(filepath.Join(temp, "graph.json"), g); err != nil {
		return Result{}, err
	}
	if err := coverage.Write(filepath.Join(temp, "coverage.json"), ledger); err != nil {
		return Result{}, err
	}
	if err := WriteFindings(filepath.Join(temp, "findings.jsonl"), findings); err != nil {
		return Result{}, err
	}
	if err := writeRun(filepath.Join(temp, "run.json"), metadata); err != nil {
		return Result{}, err
	}
	if err := writeMapFromArtifacts(temp); err != nil {
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

func validateSelectionOutput(opts Options, sel selection.Selection) (string, error) {
	outAbs, err := filepath.Abs(opts.OutputPath)
	if err != nil {
		return "", fmt.Errorf("resolve output: %w", err)
	}
	out, err := resolveOutputPath(outAbs)
	if err != nil {
		return "", err
	}
	parent := filepath.Dir(out)
	if existing, err := os.Lstat(out); err == nil {
		if existing.Mode()&os.ModeSymlink != 0 {
			return "", fmt.Errorf("output path must not be a symlink")
		}
		if !existing.IsDir() {
			return "", fmt.Errorf("output path must be a directory")
		}
		if !opts.Force {
			return "", fmt.Errorf("output path already exists; use --force to overwrite")
		}
	} else if !os.IsNotExist(err) {
		return "", fmt.Errorf("inspect output path: %w", err)
	}
	for _, target := range sel.Targets {
		if target.Kind != "repository" {
			continue
		}
		rootAbs, err := filepath.Abs(target.Path)
		if err != nil {
			return "", fmt.Errorf("resolve target %q: %w", target.ID, err)
		}
		root := filepath.Clean(rootAbs)
		if resolved, err := filepath.EvalSymlinks(rootAbs); err == nil {
			root = resolved
		}
		if isWithin(out, root) && !isWithin(out, filepath.Join(root, ".portolan")) {
			return "", fmt.Errorf("output path inside selected repository %q must be under .portolan", target.ID)
		}
		if isWithin(root, out) {
			return "", fmt.Errorf("output path must not contain selected repository %q", target.ID)
		}
		if dangerousOutputPath(out, root) {
			return "", fmt.Errorf("output path is too broad or unsafe")
		}
	}
	if err := os.MkdirAll(parent, 0o755); err != nil {
		return "", fmt.Errorf("create output parent: %w", err)
	}
	return out, nil
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

func graphAndFindingsForSelection(sel selection.Selection) (graph.Graph, []Finding, []string) {
	g := graph.New()
	var findings []Finding
	var warnings []string

	for _, target := range sel.Targets {
		targetGraph, targetWarnings := graphForTarget(target)
		g.Nodes = append(g.Nodes, targetGraph.Nodes...)
		g.Edges = append(g.Edges, targetGraph.Edges...)
		warnings = append(warnings, targetWarnings...)
		findings = append(findings, inventoryFinding(target))
		if target.Kind != "repository" || !targetSourceVisible(target) {
			continue
		}
		relationshipResult := relationships.Detect(target.Path)
		prefixRelationshipGraph(target.ID, &relationshipResult)
		g.Nodes = append(g.Nodes, relationshipResult.Nodes...)
		g.Edges = append(g.Edges, relationshipResult.Edges...)
		findings = append(findings, prefixedRelationshipFindings(target.ID, target.Path, relationshipResult)...)
		for _, issue := range relationshipResult.Issues {
			warnings = append(warnings, "relationship detection: "+issue.Path+": "+issue.Reason)
		}
	}
	for _, source := range sel.Metadata {
		g.Nodes = append(g.Nodes, inputNode(source.ID, "metadata", graph.MetadataVisible, source.Path, ""))
		findings = append(findings, observedFinding("finding-metadata-"+source.ID, "inventory", "Metadata input is locally visible.", graph.MetadataVisible, source.Path))
	}
	for _, source := range sel.Runtime {
		g.Nodes = append(g.Nodes, inputNode(source.ID, "runtime", graph.RuntimeVisible, source.Path, ""))
		findings = append(findings, observedFinding("finding-runtime-"+source.ID, "configuration", "Runtime export input is locally visible.", graph.RuntimeVisible, source.Path))
	}
	for _, source := range sel.Claims {
		g.Nodes = append(g.Nodes, inputNode(source.ID, "claim", graph.ClaimOnly, source.Path, "claim source selected"))
		findings = append(findings, observedFinding("finding-claim-"+source.ID, "inventory", "Claim input is represented as claim-only evidence.", graph.ClaimOnly, source.Path))
	}
	for _, blackBox := range sel.BlackBoxes {
		label := blackBox.Label
		if label == "" {
			label = blackBox.ID
		}
		g.Nodes = append(g.Nodes, graph.Node{
			ID:    blackBox.ID,
			Kind:  "black-box-" + blackBox.Kind,
			Label: label,
			Evidence: graph.Evidence{
				State:  graph.Unknown,
				Source: label,
				Reason: "black-box target represented without direct source access",
			},
		})
		findings = append(findings, Finding{
			ID:             "finding-black-box-" + blackBox.ID,
			Kind:           "inventory",
			Summary:        "Black-box target is represented without direct source access.",
			Severity:       "info",
			EvidenceState:  string(graph.Unknown),
			EvidenceSource: label,
			Confidence:     0,
			Status:         "unknown",
		})
	}
	for _, source := range sel.ToolOutputs {
		nodes, edges, toolFindings := normalizeToolOutput(source)
		g.Nodes = append(g.Nodes, nodes...)
		g.Edges = append(g.Edges, edges...)
		findings = append(findings, toolFindings...)
	}
	findings = append(findings, unsupportedRelationshipFindings()...)
	findings = append(findings, ensureSurfaceCoverageFindings(findings)...)
	sortGraph(&g)
	sortFindings(findings)
	sort.Strings(warnings)
	return g, findings, warnings
}

func ensureSurfaceCoverageFindings(findings []Finding) []Finding {
	covered := map[string]bool{}
	for _, finding := range findings {
		if finding.Status != "not_assessed" {
			covered[finding.Kind] = true
		}
	}
	var additions []Finding
	if !covered["duplication"] {
		additions = append(additions, notAssessedFinding("finding-duplication-not-assessed", "duplication", "No supported duplication tool output was selected for this map run."))
	}
	if !covered["configuration"] {
		additions = append(additions, notAssessedFinding("finding-configuration-not-assessed", "configuration", "No supported configuration or contract-surface tool output was selected for this map run."))
	}
	additions = append(additions, notAssessedFinding("finding-unsupported-languages-not-assessed", "relationships", "Unsupported language relationship detectors remain not_assessed."))
	return additions
}

func deriveTechnicalDebtFindings(findings []Finding, ledger coverage.Ledger) []Finding {
	var derived []Finding
	weakCount := 0
	for _, record := range ledger.Records {
		if record.EvidenceState == string(graph.Unknown) || record.EvidenceState == string(graph.CannotVerify) || record.EvidenceState == "not_assessed" {
			weakCount++
		}
	}
	if weakCount > 0 {
		derived = append(derived, Finding{
			ID:             "finding-technical-debt-unresolved-evidence",
			Kind:           "technical-debt",
			Summary:        fmt.Sprintf("%d landscape coverage records remain unknown, cannot_verify, or not_assessed and require follow-up before architecture conclusions.", weakCount),
			Severity:       "medium",
			EvidenceState:  string(graph.Unknown),
			EvidenceSource: "coverage.json",
			Confidence:     0.7,
			Status:         "unknown",
		})
	}
	duplicationCount := 0
	configurationCount := 0
	for _, finding := range findings {
		if finding.Status == "not_assessed" {
			continue
		}
		switch finding.Kind {
		case "duplication":
			duplicationCount++
		case "configuration":
			configurationCount++
		}
	}
	if duplicationCount > 0 {
		derived = append(derived, Finding{
			ID:             "finding-technical-debt-duplication-follow-up",
			Kind:           "technical-debt",
			Summary:        fmt.Sprintf("%d imported duplication findings should be reviewed as maintainability debt candidates without treating them as readiness verdicts.", duplicationCount),
			Severity:       "low",
			EvidenceState:  string(graph.MetadataVisible),
			EvidenceSource: "findings.jsonl",
			Confidence:     0.6,
			Status:         "observed",
		})
	}
	if configurationCount > 0 {
		derived = append(derived, Finding{
			ID:             "finding-technical-debt-configuration-follow-up",
			Kind:           "technical-debt",
			Summary:        fmt.Sprintf("%d runtime or configuration surface findings should be reviewed as operational debt candidates without treating them as pass/fail verdicts.", configurationCount),
			Severity:       "low",
			EvidenceState:  string(graph.MetadataVisible),
			EvidenceSource: "findings.jsonl",
			Confidence:     0.6,
			Status:         "observed",
		})
	}
	if len(derived) == 0 {
		derived = append(derived, notAssessedFinding("finding-technical-debt-not-assessed", "technical-debt", "No supported technical-debt input signals were observed."))
	}
	return derived
}

func graphForTarget(target selection.Target) (graph.Graph, []string) {
	g := graph.New()
	state := graph.SourceVisible
	reason := ""
	if !targetSourceVisible(target) {
		state = graph.Unknown
		reason = "path is not a visible local directory"
	}
	g.Nodes = append(g.Nodes, graph.Node{
		ID:    target.ID,
		Kind:  target.Kind,
		Label: labelForSelectionTarget(target),
		Evidence: graph.Evidence{
			State:  state,
			Source: target.Path,
			Reason: reason,
		},
	})
	if state != graph.SourceVisible || target.Kind != "repository" {
		return g, nil
	}
	entries, warnings := visibleEntries(target.Path)
	for _, entry := range entries {
		nodeID := target.ID + ":source:" + entry
		g.Nodes = append(g.Nodes, graph.Node{
			ID:    nodeID,
			Kind:  "unknown",
			Label: entry,
			Evidence: graph.Evidence{
				State:  graph.SourceVisible,
				Source: filepath.Join(target.Path, filepath.FromSlash(entry)),
			},
		})
		g.Edges = append(g.Edges, graph.Edge{
			From: target.ID,
			To:   nodeID,
			Kind: "observes",
			Evidence: graph.Evidence{
				State:  graph.SourceVisible,
				Source: target.Path,
			},
		})
	}
	return g, warnings
}

func targetSourceVisible(target selection.Target) bool {
	info, err := os.Lstat(target.Path)
	if err != nil || info.Mode()&os.ModeSymlink != 0 {
		return false
	}
	info, err = os.Stat(target.Path)
	return err == nil && info.IsDir()
}

func labelForSelectionTarget(target selection.Target) string {
	if base := filepath.Base(target.Path); base != "." && base != string(filepath.Separator) {
		return base
	}
	return target.ID
}

func inputNode(id, kind string, state graph.EvidenceState, source, reason string) graph.Node {
	return graph.Node{
		ID:    id,
		Kind:  kind,
		Label: id,
		Evidence: graph.Evidence{
			State:  state,
			Source: source,
			Reason: reason,
		},
	}
}

func inventoryFinding(target selection.Target) Finding {
	if targetSourceVisible(target) {
		return observedFinding("finding-inventory-"+target.ID, "inventory", "Selected repository is locally visible.", graph.SourceVisible, target.Path)
	}
	return Finding{
		ID:             "finding-inventory-" + target.ID,
		Kind:           "inventory",
		Summary:        "Selected target is not visible as a local repository.",
		Severity:       "info",
		EvidenceState:  string(graph.Unknown),
		EvidenceSource: target.Path,
		Confidence:     0,
		Status:         "unknown",
	}
}

func observedFinding(id, kind, summary string, state graph.EvidenceState, source string) Finding {
	return Finding{
		ID:             id,
		Kind:           kind,
		Summary:        summary,
		Severity:       "info",
		EvidenceState:  string(state),
		EvidenceSource: source,
		Confidence:     1,
		Status:         "observed",
	}
}

func prefixRelationshipGraph(prefix string, result *relationships.Result) {
	for i := range result.Nodes {
		result.Nodes[i].ID = prefix + ":rel:" + result.Nodes[i].ID
		if result.Nodes[i].Evidence.Source != "" {
			result.Nodes[i].Evidence.Source = prefix + ":" + result.Nodes[i].Evidence.Source
		}
	}
	for i := range result.Edges {
		result.Edges[i].From = prefix + ":rel:" + result.Edges[i].From
		result.Edges[i].To = prefix + ":rel:" + result.Edges[i].To
	}
}

func prefixedRelationshipFindings(prefix, root string, result relationships.Result) []Finding {
	findings := relationshipFindings(root, result)
	for i := range findings {
		findings[i].ID = prefix + "-" + findings[i].ID
	}
	return findings
}

func normalizeToolOutput(source selection.ToolOutput) ([]graph.Node, []graph.Edge, []Finding) {
	nodes := []graph.Node{{
		ID:    source.ID,
		Kind:  "tool-output-" + source.Kind,
		Label: source.Tool,
		Evidence: graph.Evidence{
			State:  graph.MetadataVisible,
			Source: source.Path,
		},
	}}
	data, err := os.ReadFile(source.Path)
	if err != nil {
		nodes[0].Evidence.State = graph.CannotVerify
		nodes[0].Evidence.Reason = err.Error()
		return nodes, nil, []Finding{{
			ID:             "finding-tool-output-" + source.ID,
			Kind:           findingKindForToolOutput(source.Kind),
			Summary:        "Tool output could not be read: " + source.Tool,
			Severity:       "info",
			EvidenceState:  string(graph.CannotVerify),
			EvidenceSource: source.Path,
			Confidence:     0,
			Status:         "cannot_verify",
		}}
	}
	var doc toolOutputDocument
	if err := json.Unmarshal(data, &doc); err != nil {
		nodes[0].Evidence.State = graph.CannotVerify
		nodes[0].Evidence.Reason = "malformed tool output JSON"
	}
	factNodes, factEdges := toolOutputFacts(source, doc)
	nodes = append(nodes, factNodes...)
	nodes = append(nodes, edgeEndpointNodes(source, nodes, factEdges)...)
	summary := toolOutputSummary(source, doc)
	if len(source.Limitations) > 0 {
		nodes[0].Evidence.Reason = strings.Join(source.Limitations, "; ")
	}
	confidence := toolOutputConfidence(source, doc.Confidence)
	findings := []Finding{{
		ID:             "finding-tool-output-" + source.ID,
		Kind:           findingKindForToolOutput(source.Kind),
		Summary:        summary,
		Severity:       "info",
		EvidenceState:  string(nodes[0].Evidence.State),
		EvidenceSource: source.Path,
		Confidence:     confidence,
		Status:         statusForEvidence(nodes[0].Evidence.State),
	}}
	return nodes, factEdges, findings
}

type toolOutputDocument struct {
	Summary          string           `json:"summary"`
	Confidence       *float64         `json:"confidence"`
	BOMFormat        string           `json:"bomFormat"`
	Components       []map[string]any `json:"components"`
	Dependencies     []map[string]any `json:"dependencies"`
	Languages        []map[string]any `json:"languages"`
	Duplicates       []map[string]any `json:"duplicates"`
	Results          []map[string]any `json:"Results"`
	LowercaseResults []map[string]any `json:"results"`
}

func toolOutputFacts(source selection.ToolOutput, doc toolOutputDocument) ([]graph.Node, []graph.Edge) {
	var nodes []graph.Node
	var edges []graph.Edge
	switch source.Kind {
	case "sbom", "dependency":
		for _, component := range doc.Components {
			ref := stringField(component, "bom-ref")
			if ref == "" {
				ref = stringField(component, "name")
			}
			if ref == "" {
				continue
			}
			nodeID := source.ID + ":component:" + stableID(ref)
			nodes = append(nodes, graph.Node{
				ID:    nodeID,
				Kind:  "package",
				Label: ref,
				Evidence: graph.Evidence{
					State:  graph.MetadataVisible,
					Source: source.Path,
				},
			})
			edges = append(edges, graph.Edge{From: source.ID, To: nodeID, Kind: "observes", Evidence: graph.Evidence{State: graph.MetadataVisible, Source: source.Path}})
		}
		for _, dep := range doc.Dependencies {
			from := stringField(dep, "ref")
			for _, to := range stringSliceField(dep, "dependsOn") {
				edges = append(edges, graph.Edge{
					From: source.ID + ":component:" + stableID(from),
					To:   source.ID + ":component:" + stableID(to),
					Kind: "depends-on",
					Evidence: graph.Evidence{
						State:  graph.MetadataVisible,
						Source: source.Path,
					},
				})
			}
		}
	case "language-inventory", "code-size":
		for _, language := range doc.Languages {
			name := stringField(language, "name")
			if name == "" {
				continue
			}
			nodes = append(nodes, graph.Node{
				ID:    source.ID + ":language:" + stableID(name),
				Kind:  "language",
				Label: name,
				Evidence: graph.Evidence{
					State:  graph.MetadataVisible,
					Source: source.Path,
				},
			})
		}
	case "duplication":
		for i := range doc.Duplicates {
			nodes = append(nodes, graph.Node{
				ID:    fmt.Sprintf("%s:duplicate:%03d", source.ID, i+1),
				Kind:  "duplication",
				Label: fmt.Sprintf("duplicate group %d", i+1),
				Evidence: graph.Evidence{
					State:  graph.MetadataVisible,
					Source: source.Path,
				},
			})
		}
	case "configuration", "contract-surface":
		results := doc.Results
		if len(results) == 0 {
			results = doc.LowercaseResults
		}
		for i, result := range results {
			label := stringField(result, "Target")
			if label == "" {
				label = stringField(result, "target")
			}
			if label == "" {
				label = fmt.Sprintf("configuration result %d", i+1)
			}
			nodes = append(nodes, graph.Node{
				ID:    fmt.Sprintf("%s:config:%03d", source.ID, i+1),
				Kind:  "configuration",
				Label: label,
				Evidence: graph.Evidence{
					State:  graph.MetadataVisible,
					Source: source.Path,
				},
			})
		}
	}
	return nodes, edges
}

func toolOutputSummary(source selection.ToolOutput, doc toolOutputDocument) string {
	if doc.Summary != "" {
		return doc.Summary
	}
	switch source.Kind {
	case "sbom", "dependency":
		if doc.BOMFormat == "CycloneDX" {
			return fmt.Sprintf("Imported CycloneDX evidence with %d components and %d dependency records.", len(doc.Components), len(doc.Dependencies))
		}
	case "language-inventory", "code-size":
		if len(doc.Languages) > 0 {
			return fmt.Sprintf("Imported language inventory evidence for %d languages.", len(doc.Languages))
		}
	case "duplication":
		if len(doc.Duplicates) > 0 {
			return fmt.Sprintf("Imported duplication evidence with %d duplicate groups.", len(doc.Duplicates))
		}
	case "configuration", "contract-surface":
		results := len(doc.Results)
		if results == 0 {
			results = len(doc.LowercaseResults)
		}
		if results > 0 {
			return fmt.Sprintf("Imported configuration surface evidence with %d result groups.", results)
		}
	}
	return "Imported local " + source.Kind + " output from " + source.Tool + " with unsupported detailed shape; retained as attributed metadata evidence."
}

func stringField(value map[string]any, key string) string {
	raw, _ := value[key].(string)
	return raw
}

func stringSliceField(value map[string]any, key string) []string {
	raw, ok := value[key].([]any)
	if !ok {
		return nil
	}
	var out []string
	for _, item := range raw {
		text, ok := item.(string)
		if ok && text != "" {
			out = append(out, text)
		}
	}
	return out
}

func stableID(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	var b strings.Builder
	for _, r := range value {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			continue
		}
		b.WriteByte('-')
	}
	result := strings.Trim(b.String(), "-")
	if result == "" {
		return "unknown"
	}
	return result
}

func edgeEndpointNodes(source selection.ToolOutput, existing []graph.Node, edges []graph.Edge) []graph.Node {
	seen := map[string]struct{}{}
	for _, node := range existing {
		seen[node.ID] = struct{}{}
	}
	var nodes []graph.Node
	for _, edge := range edges {
		for _, id := range []string{edge.From, edge.To} {
			if _, ok := seen[id]; ok || id == "" || id == source.ID {
				continue
			}
			seen[id] = struct{}{}
			nodes = append(nodes, graph.Node{
				ID:    id,
				Kind:  "package",
				Label: id,
				Evidence: graph.Evidence{
					State:  graph.MetadataVisible,
					Source: source.Path,
				},
			})
		}
	}
	return nodes
}

func toolOutputConfidence(source selection.ToolOutput, value *float64) float64 {
	if value != nil && *value >= 0 && *value <= 1 {
		return *value
	}
	if len(source.Limitations) > 0 {
		return 0.5
	}
	return 0.6
}

func findingKindForToolOutput(kind string) string {
	switch kind {
	case "duplication":
		return "duplication"
	case "configuration", "contract-surface":
		return "configuration"
	case "sbom", "dependency":
		return "relationships"
	default:
		return "inventory"
	}
}

func statusForEvidence(state graph.EvidenceState) string {
	switch state {
	case graph.CannotVerify:
		return "cannot_verify"
	case graph.Unknown:
		return "unknown"
	default:
		return "observed"
	}
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
		if pathHasSkippedInventoryDir(rel) {
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

func pathHasSkippedInventoryDir(path string) bool {
	for _, part := range strings.Split(filepath.ToSlash(path), "/") {
		if part == ".portolan" || part == ".git" {
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

func writeMapFromArtifacts(dir string) error {
	run, err := readRun(filepath.Join(dir, "run.json"))
	if err != nil {
		return err
	}
	ledger, err := readCoverage(filepath.Join(dir, "coverage.json"))
	if err != nil {
		return err
	}
	g, err := packet.LoadGraph(filepath.Join(dir, "graph.json"))
	if err != nil {
		return err
	}
	findings, err := readFindings(filepath.Join(dir, "findings.jsonl"))
	if err != nil {
		return err
	}
	return writeMap(filepath.Join(dir, "map.md"), run, g, findings, ledger)
}

func readRun(path string) (RunMetadata, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return RunMetadata{}, fmt.Errorf("read run metadata: %w", err)
	}
	var run RunMetadata
	if err := json.Unmarshal(data, &run); err != nil {
		return RunMetadata{}, fmt.Errorf("parse run metadata: %w", err)
	}
	return run, nil
}

func readCoverage(path string) (coverage.Ledger, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return coverage.Ledger{}, fmt.Errorf("read coverage: %w", err)
	}
	var ledger coverage.Ledger
	if err := json.Unmarshal(data, &ledger); err != nil {
		return coverage.Ledger{}, fmt.Errorf("parse coverage: %w", err)
	}
	return ledger, nil
}

func readFindings(path string) ([]Finding, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("read findings: %w", err)
	}
	defer file.Close()
	var findings []Finding
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		var finding Finding
		if err := json.Unmarshal([]byte(line), &finding); err != nil {
			return nil, fmt.Errorf("parse finding: %w", err)
		}
		findings = append(findings, finding)
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("read findings: %w", err)
	}
	return findings, nil
}

func writeMap(path string, run RunMetadata, g graph.Graph, findings []Finding, ledger coverage.Ledger) error {
	var b strings.Builder
	b.WriteString("# Portolan Map\n\n")
	fmt.Fprintf(&b, "- Command: `%s`\n", run.Command)
	fmt.Fprintf(&b, "- Findings: %d\n", len(findings))
	fmt.Fprintf(&b, "- Nodes: %d\n", len(g.Nodes))
	fmt.Fprintf(&b, "- Edges: %d\n", len(g.Edges))
	fmt.Fprintf(&b, "- Coverage records: %d\n\n", len(ledger.Records))
	b.WriteString("## Landscape Inventory\n\n")
	if len(ledger.Records) == 0 {
		b.WriteString("- None.\n")
	} else {
		for _, record := range ledger.Records {
			fmt.Fprintf(&b, "- `%s` (%s): %s / %s from `%s`", record.ID, record.Kind, record.Status, record.EvidenceState, record.Source)
			if record.Reason != "" {
				fmt.Fprintf(&b, " - %s", record.Reason)
			}
			b.WriteString("\n")
		}
	}
	b.WriteString("\n")
	b.WriteString("## Repo/Product Matrix\n\n")
	wroteRepo := false
	for _, record := range ledger.Records {
		if record.Kind != "repository" && record.Kind != "manifest-repository" {
			continue
		}
		wroteRepo = true
		fmt.Fprintf(&b, "- `%s`: %s (%s).\n", record.ID, record.Status, record.EvidenceState)
	}
	if !wroteRepo {
		b.WriteString("- None.\n")
	}
	b.WriteString("\n")
	writeFindingSection(&b, "## Contracts And Surfaces", findings, map[string]bool{"relationships": true, "configuration": true})
	writeFindingSection(&b, "## Duplication", findings, map[string]bool{"duplication": true})
	writeFindingSection(&b, "## Configuration", findings, map[string]bool{"configuration": true})
	writeFindingSection(&b, "## Legacy And Debt", findings, map[string]bool{"technical-debt": true})
	writeWeakCoverageSection(&b, ledger)
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
	writeMachineArtifactSummary(&b, g)
	b.WriteString("## Next-Agent Tasks\n\n")
	b.WriteString("- Inspect `coverage.json` before treating the map as complete.\n")
	b.WriteString("- Resolve `unknown`, `cannot_verify`, and `not_assessed` records before making architecture claims.\n")
	return os.WriteFile(path, []byte(b.String()), 0o644)
}

func writeMachineArtifactSummary(b *strings.Builder, g graph.Graph) {
	stateCounts := map[graph.EvidenceState]int{}
	kindCounts := map[string]int{}
	for _, node := range g.Nodes {
		stateCounts[node.Evidence.State]++
		kindCounts[node.Kind]++
	}
	for _, edge := range g.Edges {
		stateCounts[edge.Evidence.State]++
	}

	b.WriteString("## Machine Artifact Summary\n\n")
	fmt.Fprintf(b, "- `graph.json` nodes: %d\n", len(g.Nodes))
	fmt.Fprintf(b, "- `graph.json` edges: %d\n", len(g.Edges))
	for _, state := range orderedEvidenceStates(stateCounts) {
		fmt.Fprintf(b, "- evidence `%s`: %d\n", state, stateCounts[state])
	}
	for _, kind := range orderedStringCounts(kindCounts) {
		fmt.Fprintf(b, "- node kind `%s`: %d\n", kind, kindCounts[kind])
	}
	b.WriteString("\n")
}

func orderedEvidenceStates(counts map[graph.EvidenceState]int) []graph.EvidenceState {
	states := make([]graph.EvidenceState, 0, len(counts))
	for state := range counts {
		states = append(states, state)
	}
	sort.Slice(states, func(i, j int) bool {
		return states[i] < states[j]
	})
	return states
}

func orderedStringCounts(counts map[string]int) []string {
	keys := make([]string, 0, len(counts))
	for key := range counts {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}

func writeFindingSection(b *strings.Builder, title string, findings []Finding, kinds map[string]bool) {
	b.WriteString(title + "\n\n")
	wrote := false
	for _, finding := range findings {
		if !kinds[finding.Kind] {
			continue
		}
		wrote = true
		fmt.Fprintf(b, "- `%s` [%s]: %s (%s).\n", finding.ID, finding.Status, finding.Summary, finding.EvidenceState)
	}
	if !wrote {
		b.WriteString("- None.\n")
	}
	b.WriteString("\n")
}

func writeWeakCoverageSection(b *strings.Builder, ledger coverage.Ledger) {
	b.WriteString("## Unknowns And Cannot Verify\n\n")
	wrote := false
	for _, record := range ledger.Records {
		if record.EvidenceState != string(graph.Unknown) && record.EvidenceState != string(graph.CannotVerify) && record.EvidenceState != "not_assessed" {
			continue
		}
		wrote = true
		fmt.Fprintf(b, "- `%s`: %s (%s) - %s\n", record.ID, record.Status, record.EvidenceState, record.Reason)
	}
	if !wrote {
		b.WriteString("- None.\n")
	}
	b.WriteString("\n")
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

func sortFindings(findings []Finding) {
	sort.Slice(findings, func(i, j int) bool {
		if findings[i].Kind != findings[j].Kind {
			return findings[i].Kind < findings[j].Kind
		}
		return findings[i].ID < findings[j].ID
	})
}
