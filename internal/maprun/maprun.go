package maprun

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"hash/fnv"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/fcon-tech/portolan/internal/blackbox"
	"github.com/fcon-tech/portolan/internal/configuration"
	"github.com/fcon-tech/portolan/internal/coverage"
	"github.com/fcon-tech/portolan/internal/graph"
	"github.com/fcon-tech/portolan/internal/packet"
	"github.com/fcon-tech/portolan/internal/relationships"
	"github.com/fcon-tech/portolan/internal/selection"
	"github.com/fcon-tech/portolan/internal/staleness"
)

type Options struct {
	RootPath      string
	SelectionPath string
	OutputPath    string
	Force         bool
	IfStale       bool
	Version       string
}

type Result struct {
	OutputPath  string
	Artifacts   Artifacts
	Skipped     bool
	StaleReason string
}

type Artifacts struct {
	Run        string `json:"run"`
	Coverage   string `json:"coverage"`
	Graph      string `json:"graph"`
	GraphIndex string `json:"graph_index"`
	Findings   string `json:"findings"`
	Summary    string `json:"summary"`
	Packet     string `json:"packet"`
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

// treeSignatureFile is the staleness signature persisted inside the bundle.
const treeSignatureFile = "tree-signature.json"

const summaryRecordLimit = 100
const graphIndexSampleLimit = 20
const graphIndexHighDegreeLimit = 25

// Selected tool-output normalization is intentionally in-memory and bounded.
// Larger producer outputs should use a streaming/importer path or remain
// cannot_verify until a later spec approves a larger graph budget.
// These limits are vars so focused tests can lower them without allocating
// large producer fixtures.
var maxSelectedToolOutputBytes int64 = 64 * 1024 * 1024
var maxSelectedSymbolDocuments = 5000
var maxSelectedSymbols = 50000

type Summary struct {
	SchemaVersion string          `json:"schema_version"`
	GeneratedBy   string          `json:"generated_by"`
	GeneratedAt   time.Time       `json:"generated_at"`
	Command       string          `json:"command"`
	Root          string          `json:"root,omitempty"`
	Selection     string          `json:"selection,omitempty"`
	OutputPath    string          `json:"output_path"`
	Artifacts     Artifacts       `json:"artifacts"`
	Graph         graphSummary    `json:"graph"`
	Findings      findingSummary  `json:"findings"`
	Coverage      coverageSummary `json:"coverage"`
	FileSurfaces  map[string]int  `json:"file_surfaces"`
	Navigation    navigationIndex `json:"navigation"`
	Skipped       []string        `json:"skipped_surfaces"`
	Warnings      []string        `json:"warnings"`
}

type graphSummary struct {
	Nodes          int            `json:"nodes"`
	Edges          int            `json:"edges"`
	EvidenceStates map[string]int `json:"evidence_states"`
	NodeKinds      map[string]int `json:"node_kinds"`
}

type findingSummary struct {
	Total            int            `json:"total"`
	ByKind           map[string]int `json:"by_kind"`
	ByStatus         map[string]int `json:"by_status"`
	ByEvidenceState  map[string]int `json:"by_evidence_state"`
	NotAssessedTotal int            `json:"not_assessed_total"`
}

type coverageSummary struct {
	Records               int                     `json:"records"`
	ByKind                map[string]int          `json:"by_kind"`
	ByStatus              map[string]int          `json:"by_status"`
	ByEvidenceState       map[string]int          `json:"by_evidence_state"`
	Repositories          []coverageSummaryRecord `json:"repositories"`
	RepositoriesTruncated int                     `json:"repositories_truncated"`
	WeakRecords           []coverageSummaryRecord `json:"weak_records"`
	WeakRecordsTruncated  int                     `json:"weak_records_truncated"`
}

type coverageSummaryRecord struct {
	ID            string `json:"id"`
	Kind          string `json:"kind"`
	Status        string `json:"status"`
	EvidenceState string `json:"evidence_state"`
	Source        string `json:"source,omitempty"`
	Reason        string `json:"reason,omitempty"`
}

type GraphIndex struct {
	SchemaVersion string                   `json:"schema_version"`
	GeneratedBy   string                   `json:"generated_by"`
	GeneratedAt   time.Time                `json:"generated_at"`
	Command       string                   `json:"command"`
	Root          string                   `json:"root,omitempty"`
	Selection     string                   `json:"selection,omitempty"`
	OutputPath    string                   `json:"output_path"`
	Artifacts     Artifacts                `json:"artifacts"`
	Budget        graphIndexBudget         `json:"budget"`
	ArtifactSizes map[string]int64         `json:"artifact_sizes"`
	Graph         graphSummary             `json:"graph"`
	Findings      findingSummary           `json:"findings"`
	NodeSlices    []graphIndexNodeSlice    `json:"node_slices"`
	EdgeSlices    []graphIndexEdgeSlice    `json:"edge_slices"`
	FindingSlices []graphIndexFindingSlice `json:"finding_slices"`
	HighDegree    []graphIndexDegreeNode   `json:"high_degree_nodes"`
	Navigation    navigationIndex          `json:"navigation"`
	Rules         []string                 `json:"rules"`
}

type graphIndexBudget struct {
	NodeSamplesPerKind    int `json:"node_samples_per_kind"`
	EdgeSamplesPerKind    int `json:"edge_samples_per_kind"`
	FindingSamplesPerKind int `json:"finding_samples_per_kind"`
	HighDegreeNodes       int `json:"high_degree_nodes"`
}

type graphIndexNodeSlice struct {
	Kind      string                 `json:"kind"`
	Total     int                    `json:"total"`
	Truncated int                    `json:"truncated"`
	Samples   []graphIndexNodeSample `json:"samples"`
}

type graphIndexNodeSample struct {
	ID             string `json:"id"`
	Label          string `json:"label,omitempty"`
	EvidenceState  string `json:"evidence_state"`
	EvidenceSource string `json:"evidence_source"`
}

type graphIndexEdgeSlice struct {
	Kind      string                 `json:"kind"`
	Total     int                    `json:"total"`
	Truncated int                    `json:"truncated"`
	Samples   []graphIndexEdgeSample `json:"samples"`
}

type graphIndexEdgeSample struct {
	From           string `json:"from"`
	To             string `json:"to"`
	EvidenceState  string `json:"evidence_state"`
	EvidenceSource string `json:"evidence_source"`
}

type graphIndexFindingSlice struct {
	Kind      string                    `json:"kind"`
	Total     int                       `json:"total"`
	Truncated int                       `json:"truncated"`
	Samples   []graphIndexFindingSample `json:"samples"`
}

type graphIndexFindingSample struct {
	ID             string  `json:"id"`
	Status         string  `json:"status"`
	EvidenceState  string  `json:"evidence_state"`
	EvidenceSource string  `json:"evidence_source"`
	Confidence     float64 `json:"confidence"`
	Summary        string  `json:"summary"`
}

type graphIndexDegreeNode struct {
	ID            string `json:"id"`
	Kind          string `json:"kind"`
	Label         string `json:"label,omitempty"`
	EvidenceState string `json:"evidence_state"`
	InEdges       int    `json:"in_edges"`
	OutEdges      int    `json:"out_edges"`
	TotalDegree   int    `json:"total_degree"`
}

type navigationIndex struct {
	ReadOrder      []string                `json:"read_order"`
	DoNotOpenFirst []string                `json:"do_not_open_first"`
	NextDrillDown  []string                `json:"next_drill_down"`
	HighDegreeHubs []graphIndexDegreeNode  `json:"high_degree_hubs,omitempty"`
	UnknownNodes   unknownNavigationBucket `json:"unknown_nodes"`
	Warnings       []string                `json:"warnings,omitempty"`
}

type unknownNavigationBucket struct {
	Total          int            `json:"total"`
	Majority       bool           `json:"majority"`
	SurfaceBuckets map[string]int `json:"surface_buckets,omitempty"`
	Reason         string         `json:"reason,omitempty"`
}

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
		if opts.IfStale {
			return Result{}, errors.New("--if-stale is not supported with --selection (root path only)")
		}
		return runSelection(opts)
	}

	// Staleness short-circuit (root path only): skip the rebuild when the tree
	// signature recorded in the existing bundle still matches the target. This
	// is the agent-atlas "build if stale" contract for /portolan:map.
	if opts.IfStale {
		outAbs, err := filepath.Abs(opts.OutputPath)
		if err != nil {
			return Result{}, fmt.Errorf("resolve output: %w", err)
		}
		// Validate the existing output path before trusting its signature: a
		// symlinked or non-directory output must not produce a false skip.
		if info, err := os.Lstat(outAbs); err == nil {
			if info.Mode()&os.ModeSymlink != 0 {
				return Result{}, fmt.Errorf("output path must not be a symlink: %s", outAbs)
			}
			if !info.IsDir() {
				return Result{}, fmt.Errorf("output path must be a directory: %s", outAbs)
			}
		} else if !os.IsNotExist(err) {
			return Result{}, fmt.Errorf("inspect output path: %w", err)
		}
		sigPath := filepath.Join(outAbs, treeSignatureFile)
		stale, reason, err := staleness.IsStale(opts.RootPath, sigPath)
		if err != nil {
			return Result{}, err
		}
		if !stale {
			return Result{
				OutputPath:  filepath.Clean(outAbs),
				Artifacts:   artifactsFor(filepath.Clean(outAbs)),
				Skipped:     true,
				StaleReason: reason,
			}, nil
		}
		// Refreshing in place: the rebuild must overwrite the existing bundle.
		opts.Force = true
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
		Run:        filepath.Join(out, "run.json"),
		Coverage:   filepath.Join(out, "coverage.json"),
		Graph:      filepath.Join(out, "graph.json"),
		GraphIndex: filepath.Join(out, "graph-index.json"),
		Findings:   filepath.Join(out, "findings.jsonl"),
		Summary:    filepath.Join(out, "summary.json"),
		Packet:     filepath.Join(out, "map.md"),
	}
	rootSelection, discoveryRecords, discoveryWarnings := selectionForRootDiscovery(root)
	g, findings, walkWarnings := graphAndFindingsForSelection(rootSelection)
	skippedSurfaces := []string{
		"relationship-non-go-source",
		"relationship-runtime-inference",
		"relationship-lifecycle-modeling",
		"relationship-service-topology-inference",
		"duplication-native-detection",
		"configuration-semantic-analysis",
	}
	warnings := append([]string{
		"relationship sub-surfaces beyond Go imports and go.mod manifests are reported as not_assessed until supported local evidence is observed",
		"duplication detection is OSS/tool-output backed; duplication findings are not_assessed when no supported local duplication output is observed",
		"external ecosystem completeness is unknown without a manifest or explicit inventory",
	}, append(discoveryWarnings, walkWarnings...)...)
	metadata := RunMetadata{
		SchemaVersion:   SchemaVersion,
		Command:         "portolan map",
		Version:         opts.Version,
		GeneratedAt:     time.Now().UTC(),
		Root:            root,
		OutputPath:      out,
		Artifacts:       artifacts,
		EnabledSurfaces: []string{"source-inventory", "relationship-detection", "duplication-tool-output-import", "configuration-surface-detection", "technical-debt-findings"},
		SkippedSurfaces: skippedSurfaces,
		Warnings:        warnings,
	}
	ledger, err := coverage.Build(rootSelection, "", "")
	if err != nil {
		return Result{}, err
	}
	ledger.Records = append(ledger.Records, discoveryRecords...)
	ledger.Records = append(ledger.Records, externalCompletenessRecord())
	sortCoverageRecords(ledger.Records)
	ledger.Summary = summarizeCoverageRecords(ledger.Records)
	findings = append(findings, deriveTechnicalDebtFindings(findings, ledger)...)
	findings = dedupeFindings(findings)
	sortFindings(findings)
	summary := summarizeRun(metadata, g, findings, ledger)

	if err := writeGraph(filepath.Join(temp, "graph.json"), g); err != nil {
		return Result{}, err
	}
	if err := coverage.Write(filepath.Join(temp, "coverage.json"), ledger); err != nil {
		return Result{}, err
	}
	if err := WriteFindings(filepath.Join(temp, "findings.jsonl"), findings); err != nil {
		return Result{}, err
	}
	if err := writeSummary(filepath.Join(temp, "summary.json"), summary); err != nil {
		return Result{}, err
	}
	if err := writeRun(filepath.Join(temp, "run.json"), metadata); err != nil {
		return Result{}, err
	}
	if err := writeMapFromArtifacts(temp); err != nil {
		return Result{}, err
	}
	if err := writeGraphIndex(filepath.Join(temp, "graph-index.json"), buildGraphIndex(metadata, g, findings, temp)); err != nil {
		return Result{}, err
	}

	if err := replaceOutput(temp, out, opts.Force); err != nil {
		return Result{}, fmt.Errorf("replace output bundle: %w", err)
	}
	if opts.IfStale {
		sig, err := staleness.Compute(root)
		if err != nil {
			return Result{}, fmt.Errorf("compute tree signature: %w", err)
		}
		if err := staleness.Write(filepath.Join(out, treeSignatureFile), sig); err != nil {
			return Result{}, fmt.Errorf("write tree signature: %w", err)
		}
	}
	return Result{OutputPath: out, Artifacts: artifacts}, nil
}

// artifactsFor builds the canonical Artifacts layout for a given output dir. It
// is used both after a rebuild and for the staleness skip result so consumers
// always see the same artifact paths.
func artifactsFor(out string) Artifacts {
	return Artifacts{
		Run:        filepath.Join(out, "run.json"),
		Coverage:   filepath.Join(out, "coverage.json"),
		Graph:      filepath.Join(out, "graph.json"),
		GraphIndex: filepath.Join(out, "graph-index.json"),
		Findings:   filepath.Join(out, "findings.jsonl"),
		Summary:    filepath.Join(out, "summary.json"),
		Packet:     filepath.Join(out, "map.md"),
	}
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
		Run:        filepath.Join(out, "run.json"),
		Coverage:   filepath.Join(out, "coverage.json"),
		Graph:      filepath.Join(out, "graph.json"),
		GraphIndex: filepath.Join(out, "graph-index.json"),
		Findings:   filepath.Join(out, "findings.jsonl"),
		Summary:    filepath.Join(out, "summary.json"),
		Packet:     filepath.Join(out, "map.md"),
	}
	g, findings, warnings := graphAndFindingsForSelection(sel)
	findings = append(findings, deriveTechnicalDebtFindings(findings, ledger)...)
	findings = dedupeFindings(findings)
	sortFindings(findings)
	skippedSurfaces := []string{
		"relationship-non-go-source",
		"relationship-runtime-inference",
		"relationship-lifecycle-modeling",
		"relationship-service-topology-inference",
		"duplication-native-detection",
		"configuration-semantic-analysis",
	}
	metadata := RunMetadata{
		SchemaVersion:   SchemaVersion,
		Command:         "portolan map --selection",
		Version:         opts.Version,
		GeneratedAt:     time.Now().UTC(),
		Selection:       opts.SelectionPath,
		OutputPath:      out,
		Artifacts:       artifacts,
		EnabledSurfaces: []string{"source-inventory", "relationship-detection", "duplication-tool-output-import", "configuration-surface-detection", "technical-debt-findings", "coverage", "tool-output-import"},
		SkippedSurfaces: skippedSurfaces,
		Warnings:        warnings,
	}
	summary := summarizeRun(metadata, g, findings, ledger)

	if err := writeGraph(filepath.Join(temp, "graph.json"), g); err != nil {
		return Result{}, err
	}
	if err := coverage.Write(filepath.Join(temp, "coverage.json"), ledger); err != nil {
		return Result{}, err
	}
	if err := WriteFindings(filepath.Join(temp, "findings.jsonl"), findings); err != nil {
		return Result{}, err
	}
	if err := writeSummary(filepath.Join(temp, "summary.json"), summary); err != nil {
		return Result{}, err
	}
	if err := writeRun(filepath.Join(temp, "run.json"), metadata); err != nil {
		return Result{}, err
	}
	if err := writeMapFromArtifacts(temp); err != nil {
		return Result{}, err
	}
	if err := writeGraphIndex(filepath.Join(temp, "graph-index.json"), buildGraphIndex(metadata, g, findings, temp)); err != nil {
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

func selectionForRootDiscovery(root string) (selection.Selection, []coverage.Record, []string) {
	discovery := discoverLandscapeRepositories(root)
	if len(discovery.targets) > 0 {
		return selection.Selection{
			SchemaVersion: selection.SchemaVersion,
			Targets:       discovery.targets,
		}, discovery.records, discovery.warnings
	}
	if discovery.hasRepoLikeInputs {
		discovery.records = append(discovery.records, coverage.Record{
			ID:            "repo-like-structure-without-git",
			Kind:          "repository-discovery",
			Status:        "unknown",
			EvidenceState: string(graph.Unknown),
			Source:        root,
			Reason:        "selection.json, repos/*, or repo-like child directories are present, but bounded discovery found no .git directories",
		})
		return selection.Selection{SchemaVersion: selection.SchemaVersion}, discovery.records, discovery.warnings
	}
	return selection.Selection{
			SchemaVersion: selection.SchemaVersion,
			Targets: []selection.Target{{
				ID:   "root",
				Kind: "repository",
				Path: root,
			}},
		}, append(discovery.records, coverage.Record{
			ID:            "root-git-not-found",
			Kind:          "repository-discovery",
			Status:        "unknown",
			EvidenceState: string(graph.Unknown),
			Source:        root,
			Reason:        "legacy single-root mapping is source-visible, but no .git boundary was found; do not treat it as a verified Git repository",
		}), discovery.warnings
}

type rootDiscoveryResult struct {
	targets           []selection.Target
	records           []coverage.Record
	warnings          []string
	hasRepoLikeInputs bool
	hasSourceMarker   bool
	nonRepoChildCount int
	nonGitChildCount  int
	seenPaths         map[string]bool
	usedIDs           map[string]bool
}

func discoverLandscapeRepositories(root string) rootDiscoveryResult {
	result := rootDiscoveryResult{
		hasSourceMarker: hasSourceMarker(root),
		seenPaths:       map[string]bool{},
		usedIDs:         map[string]bool{},
	}
	if isGitRepository(root) {
		result.addRepository("root", root)
	}
	if info, err := os.Stat(filepath.Join(root, "selection.json")); err == nil && info.Mode().IsRegular() {
		result.hasRepoLikeInputs = true
	}
	result.scanChildren(root, "direct child repository")
	result.scanChildren(filepath.Join(root, "repos"), "repos child repository")
	result.addAggregateDiscoveryRecords(root)
	sort.Slice(result.targets, func(i, j int) bool {
		return result.targets[i].ID < result.targets[j].ID
	})
	sortCoverageRecords(result.records)
	sort.Strings(result.warnings)
	return result
}

func (result *rootDiscoveryResult) scanChildren(parent, discovery string) {
	entries, err := os.ReadDir(parent)
	if err != nil {
		if os.IsNotExist(err) {
			return
		}
		result.records = append(result.records, coverage.Record{
			ID:            "read-" + stableID(parent),
			Kind:          "repository-discovery",
			Status:        "cannot_verify",
			EvidenceState: string(graph.CannotVerify),
			Source:        parent,
			Reason:        "cannot read discovery directory: " + err.Error(),
		})
		result.warnings = append(result.warnings, "repository discovery: cannot read "+parent+": "+err.Error())
		return
	}
	for _, entry := range entries {
		path := filepath.Join(parent, entry.Name())
		info, err := os.Lstat(path)
		if err != nil {
			result.records = append(result.records, coverage.Record{
				ID:            "inspect-" + stableID(path),
				Kind:          "repository-discovery",
				Status:        "cannot_verify",
				EvidenceState: string(graph.CannotVerify),
				Source:        path,
				Reason:        "cannot inspect candidate path: " + err.Error(),
			})
			continue
		}
		if info.Mode()&os.ModeSymlink != 0 {
			result.records = append(result.records, coverage.Record{
				ID:            "symlink-" + stableID(path),
				Kind:          "repository-discovery",
				Status:        "cannot_verify",
				EvidenceState: string(graph.CannotVerify),
				Source:        path,
				Reason:        "symlinked repository candidates are not followed by root discovery",
			})
			continue
		}
		if strings.HasPrefix(entry.Name(), ".") {
			continue
		}
		if !info.IsDir() {
			if filepath.Dir(parent) != parent && filepath.Base(parent) != "repos" && !strings.HasPrefix(entry.Name(), ".") {
				result.nonRepoChildCount++
			}
			continue
		}
		if filepath.Base(parent) == "repos" {
			result.hasRepoLikeInputs = true
		}
		if !isGitRepository(path) {
			if filepath.Base(parent) != "repos" && entry.Name() == "repos" {
				continue
			}
			if filepath.Base(parent) == "repos" || !result.hasSourceMarker || repoLikeChildName(entry.Name()) {
				result.hasRepoLikeInputs = true
				result.nonGitChildCount++
			}
			continue
		}
		result.addRepository(entry.Name(), path)
		result.warnings = append(result.warnings, "repository discovery: "+discovery+" "+path)
	}
}

func (result *rootDiscoveryResult) addAggregateDiscoveryRecords(root string) {
	if result.nonRepoChildCount > 0 {
		result.records = append(result.records, coverage.Record{
			ID:            "non-repository-children",
			Kind:          "repository-discovery",
			Status:        "not_assessed",
			EvidenceState: string(graph.Unknown),
			Source:        root,
			Reason:        fmt.Sprintf("%d direct child file(s) were not assessed as repository candidates", result.nonRepoChildCount),
		})
	}
	if result.nonGitChildCount > 0 {
		result.records = append(result.records, coverage.Record{
			ID:            "non-git-child-directories",
			Kind:          "repository-discovery",
			Status:        "unknown",
			EvidenceState: string(graph.Unknown),
			Source:        root,
			Reason:        fmt.Sprintf("%d child directories looked landscape-like but had no .git boundary", result.nonGitChildCount),
		})
	}
}

func hasSourceMarker(root string) bool {
	for _, name := range []string{"go.mod", "package.json", "pyproject.toml", "Cargo.toml", "pom.xml", "build.gradle", "settings.gradle"} {
		if info, err := os.Stat(filepath.Join(root, name)); err == nil && info.Mode().IsRegular() {
			return true
		}
	}
	return false
}

func repoLikeChildName(name string) bool {
	switch strings.ToLower(name) {
	case "api", "apis", "app", "apps", "backend", "frontend", "gateway", "service", "services", "web", "worker", "workers", "jobs":
		return true
	default:
		return false
	}
}

func (result *rootDiscoveryResult) addRepository(name, path string) {
	if result.seenPaths[path] {
		return
	}
	id := uniqueDiscoveryID(stableID(name), result.usedIDs)
	result.targets = append(result.targets, selection.Target{
		ID:   id,
		Kind: "repository",
		Path: path,
	})
	result.seenPaths[path] = true
	result.usedIDs[id] = true
}

func uniqueDiscoveryID(base string, used map[string]bool) string {
	if base == "" || base == "unknown" {
		base = "repository"
	}
	id := base
	for i := 2; used[id]; i++ {
		id = fmt.Sprintf("%s-%d", base, i)
	}
	return id
}

func isGitRepository(path string) bool {
	info, err := os.Lstat(filepath.Join(path, ".git"))
	return err == nil && info.Mode()&os.ModeSymlink == 0
}

func externalCompletenessRecord() coverage.Record {
	return coverage.Record{
		ID:            "external-completeness",
		Kind:          "external-completeness",
		Status:        "unknown",
		EvidenceState: string(graph.Unknown),
		Source:        "",
		Reason:        "no manifest or curated inventory was supplied; local repository discovery does not prove complete ecosystem coverage",
	}
}

func sortCoverageRecords(records []coverage.Record) {
	sort.Slice(records, func(i, j int) bool {
		if records[i].Kind != records[j].Kind {
			return records[i].Kind < records[j].Kind
		}
		return records[i].ID < records[j].ID
	})
}

func summarizeCoverageRecords(records []coverage.Record) map[string]int {
	summary := map[string]int{}
	for _, record := range records {
		summary["total"]++
		summary["status:"+record.Status]++
		summary["evidence_state:"+record.EvidenceState]++
	}
	return summary
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
		prefixRelationships := shouldPrefixRelationshipGraph(sel, target)
		if prefixRelationships {
			prefixRelationshipGraph(target.ID, &relationshipResult)
		}
		g.Nodes = append(g.Nodes, relationshipResult.Nodes...)
		g.Edges = append(g.Edges, relationshipResult.Edges...)
		if prefixRelationships {
			findings = append(findings, prefixedRelationshipFindings(target.ID, target.Path, relationshipResult)...)
		} else {
			findings = append(findings, relationshipFindings(target.Path, relationshipResult)...)
		}
		for _, issue := range relationshipResult.Issues {
			warnings = append(warnings, "relationship detection: "+issue.Path+": "+issue.Reason)
		}
		configurationResult := configuration.Detect(target.Path)
		prefixConfiguration := shouldPrefixRelationshipGraph(sel, target)
		g.Nodes = append(g.Nodes, configurationNodes(target.ID, prefixConfiguration, configurationResult)...)
		if prefixConfiguration {
			findings = append(findings, prefixedConfigurationFindings(target.ID, configurationResult)...)
		} else {
			findings = append(findings, configurationFindings(configurationResult)...)
		}
		for _, issue := range configurationResult.Issues {
			warnings = append(warnings, "configuration detection: "+issue.Path+": "+issue.Reason)
		}
	}
	for _, source := range sel.Metadata {
		g.Nodes = append(g.Nodes, inputNode(source.ID, "metadata", graph.MetadataVisible, source.Path, ""))
		findings = append(findings, observedFinding("finding-metadata-"+source.ID, "inventory", "Metadata input is locally visible.", graph.MetadataVisible, source.Path))
	}
	for _, source := range sel.Runtime {
		nodes, edges, runtimeFinding := normalizeRuntimeInput(source)
		g.Nodes = append(g.Nodes, nodes...)
		g.Edges = append(g.Edges, edges...)
		findings = append(findings, runtimeFinding)
	}
	for _, source := range sel.Claims {
		g.Nodes = append(g.Nodes, inputNode(source.ID, "claim", graph.ClaimOnly, source.Path, "claim source selected"))
		findings = append(findings, observedFinding("finding-claim-"+source.ID, "inventory", "Claim input is represented as claim-only evidence.", graph.ClaimOnly, source.Path))
	}
	nodeIDs := graphNodeIDs(g)
	for _, blackBox := range sel.BlackBoxes {
		label := blackBox.Label
		if label == "" {
			label = blackBox.ID
		}
		result := blackbox.Normalize(blackBox, nodeIDs)
		for _, node := range result.Nodes {
			g.Nodes = append(g.Nodes, node)
			nodeIDs[node.ID] = struct{}{}
		}
		g.Edges = append(g.Edges, result.Edges...)
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
	findings = append(findings, relationshipProducerGapFindings(sel.ToolOutputs)...)
	findings = append(findings, unsupportedRelationshipFindings()...)
	findings = append(findings, ensureSurfaceCoverageFindings(findings)...)
	sortGraph(&g)
	sortFindings(findings)
	sort.Strings(warnings)
	return g, findings, warnings
}

func graphNodeIDs(g graph.Graph) map[string]struct{} {
	ids := map[string]struct{}{}
	for _, node := range g.Nodes {
		ids[node.ID] = struct{}{}
	}
	return ids
}

func shouldPrefixRelationshipGraph(sel selection.Selection, target selection.Target) bool {
	return len(sel.Targets) != 1 || target.ID != "root"
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
		additions = append(additions, notAssessedFinding("finding-duplication-not-assessed", "duplication", "No supported local duplication tool output was selected for this map run."))
	}
	if !covered["configuration"] {
		additions = append(additions, notAssessedFinding("finding-configuration-not-assessed", "configuration", "No supported configuration or contract-surface tool output was selected for this map run."))
	}
	additions = append(additions, notAssessedFinding("finding-unsupported-languages-not-assessed", "relationships", "Unsupported language relationship detectors remain not_assessed."))
	return additions
}

func relationshipProducerGapFindings(outputs []selection.ToolOutput) []Finding {
	hasDependency := false
	hasSymbol := false
	for _, output := range outputs {
		switch output.Kind {
		case "sbom", "dependency":
			hasDependency = true
		case "symbol-index":
			hasSymbol = true
		}
	}
	var findings []Finding
	if !hasDependency {
		findings = append(findings, notAssessedFinding(
			"finding-relationships-dependency-evidence-not-assessed",
			"relationships",
			"No selected local dependency or SBOM producer output was available; dependency relationships beyond native detectors remain not_assessed.",
		))
	}
	if !hasSymbol {
		findings = append(findings, notAssessedFinding(
			"finding-relationships-symbol-evidence-not-assessed",
			"relationships",
			"No selected local symbol-index producer output was available; symbol/reference relationships remain not_assessed.",
		))
	}
	return findings
}

func deriveTechnicalDebtFindings(findings []Finding, ledger coverage.Ledger) []Finding {
	var derived []Finding
	weakCount := 0
	for _, record := range ledger.Records {
		if record.Kind == "external-completeness" || record.Kind == "repository-discovery" {
			continue
		}
		if record.EvidenceState == string(graph.Unknown) || record.EvidenceState == string(graph.CannotVerify) || record.EvidenceState == "not_assessed" {
			weakCount++
		}
	}
	if weakCount > 0 {
		derived = append(derived, Finding{
			ID:             "finding-technical-debt-unresolved-coverage",
			Kind:           "technical-debt",
			Summary:        fmt.Sprintf("%d coverage record(s) have unresolved evidence states and need follow-up before architecture conclusions.", weakCount),
			Severity:       "medium",
			EvidenceState:  string(graph.Unknown),
			EvidenceSource: "coverage.json",
			Confidence:     0.7,
			Status:         "unknown",
		})
	}
	relationshipCount := 0
	duplicationCount := 0
	configurationCount := 0
	unresolvedFindingCount := 0
	for _, finding := range findings {
		if finding.Kind == "technical-debt" {
			continue
		}
		if finding.Status == "not_assessed" || finding.Status == "unknown" || finding.Status == "cannot_verify" ||
			finding.EvidenceState == "not_assessed" || finding.EvidenceState == string(graph.Unknown) || finding.EvidenceState == string(graph.CannotVerify) {
			unresolvedFindingCount++
			continue
		}
		switch finding.Kind {
		case "relationships":
			relationshipCount++
		case "duplication":
			duplicationCount++
		case "configuration":
			configurationCount++
		}
	}
	if relationshipCount > 0 {
		derived = append(derived, Finding{
			ID:             "finding-technical-debt-relationship-follow-up",
			Kind:           "technical-debt",
			Summary:        fmt.Sprintf("%d observed relationship finding(s) should be reviewed as coupling and dependency debt candidates.", relationshipCount),
			Severity:       "low",
			EvidenceState:  string(graph.MetadataVisible),
			EvidenceSource: "findings.jsonl",
			Confidence:     0.6,
			Status:         "observed",
		})
	}
	if duplicationCount > 0 {
		derived = append(derived, Finding{
			ID:             "finding-technical-debt-duplication-follow-up",
			Kind:           "technical-debt",
			Summary:        fmt.Sprintf("%d observed duplication finding(s) should be reviewed as maintainability debt candidates.", duplicationCount),
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
			Summary:        fmt.Sprintf("%d runtime or configuration surface finding(s) should be reviewed as operational debt candidates.", configurationCount),
			Severity:       "low",
			EvidenceState:  string(graph.MetadataVisible),
			EvidenceSource: "findings.jsonl",
			Confidence:     0.6,
			Status:         "observed",
		})
	}
	if unresolvedFindingCount > 0 {
		derived = append(derived, Finding{
			ID:             "finding-technical-debt-unresolved-findings",
			Kind:           "technical-debt",
			Summary:        fmt.Sprintf("%d map finding(s) have unresolved evidence states and need follow-up before architecture conclusions.", unresolvedFindingCount),
			Severity:       "medium",
			EvidenceState:  string(graph.Unknown),
			EvidenceSource: "findings.jsonl",
			Confidence:     0.7,
			Status:         "unknown",
		})
	}
	if len(derived) == 0 {
		derived = append(derived, notAssessedFinding("finding-technical-debt-not-assessed", "technical-debt", "No supported technical-debt input signals were observed."))
	}
	return derived
}

func dedupeFindings(findings []Finding) []Finding {
	seen := map[string]bool{}
	deduped := make([]Finding, 0, len(findings))
	for _, finding := range findings {
		if seen[finding.ID] {
			continue
		}
		seen[finding.ID] = true
		deduped = append(deduped, finding)
	}
	return deduped
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

type runtimeInputDocument struct {
	SchemaVersion string                    `json:"schema_version"`
	Observations  []runtimeInputObservation `json:"observations"`
	Source        string                    `json:"source"`
}

type runtimeInputObservation struct {
	ID         string `json:"id"`
	ObservedAt string `json:"observed_at"`
	From       string `json:"from"`
	To         string `json:"to"`
	Kind       string `json:"kind"`
	Coverage   string `json:"coverage"`
	Source     string `json:"source"`
}

func normalizeRuntimeInput(source selection.InputSource) ([]graph.Node, []graph.Edge, Finding) {
	data, err := os.ReadFile(source.Path)
	if err != nil {
		reason := runtimeReadErrorReason(err)
		return []graph.Node{inputNode(source.ID, "runtime", graph.CannotVerify, source.Path, reason)}, nil, Finding{
			ID:             "finding-runtime-" + source.ID,
			Kind:           "configuration",
			Summary:        "Runtime export input could not be read.",
			Severity:       "info",
			EvidenceState:  string(graph.CannotVerify),
			EvidenceSource: source.Path,
			Confidence:     0,
			Status:         "cannot_verify",
		}
	}

	var doc runtimeInputDocument
	if err := json.Unmarshal(data, &doc); err != nil {
		return []graph.Node{inputNode(source.ID, "runtime", graph.CannotVerify, source.Path, "malformed runtime JSON")}, nil, runtimeInputCannotVerifyFinding(source, "Runtime export input is malformed and cannot be verified.")
	}
	if doc.SchemaVersion != "" && doc.SchemaVersion != selection.SchemaVersion {
		return []graph.Node{inputNode(source.ID, "runtime", graph.CannotVerify, source.Path, fmt.Sprintf("runtime schema_version must be %q", selection.SchemaVersion))}, nil, runtimeInputCannotVerifyFinding(source, fmt.Sprintf("Runtime export input schema_version must be %q.", selection.SchemaVersion))
	}
	defaultSource := source.Path
	if doc.Source != "" {
		if unsafeRuntimeSource(doc.Source) {
			return []graph.Node{inputNode(source.ID, "runtime", graph.CannotVerify, source.Path, "runtime source label must be local and redacted")}, nil, runtimeInputCannotVerifyFinding(source, "Runtime export input source label looks unsafe or unredacted.")
		}
		defaultSource = doc.Source
	}

	nodesByID := map[string]graph.Node{
		source.ID: inputNode(source.ID, "runtime", graph.RuntimeVisible, source.Path, ""),
	}
	var edges []graph.Edge
	invalid := false
	partialCoverageRecorded := false
	for _, observation := range doc.Observations {
		observationSource := defaultSource
		if observation.Source != "" {
			if unsafeRuntimeSource(observation.Source) {
				invalid = true
				node := runtimeInvalidObservationNode(source.ID, "unsafe-observation", runtimeObservationID(observation), observation.Source, "runtime observation source label must be local and redacted")
				nodesByID[node.ID] = node
				continue
			}
			observationSource = observation.Source
		}
		coverage, ok := normalizeRuntimeInputCoverage(observation.Coverage)
		if !ok {
			invalid = true
			node := runtimeInvalidObservationNode(source.ID, "invalid-coverage", runtimeObservationID(observation), observationSource, fmt.Sprintf("runtime observation has unsupported coverage %q", observation.Coverage))
			nodesByID[node.ID] = node
			continue
		}
		if strings.TrimSpace(observation.From) == "" || strings.TrimSpace(observation.To) == "" {
			invalid = true
			node := runtimeInvalidObservationNode(source.ID, "invalid-observation", runtimeObservationID(observation), observationSource, "runtime observation requires from and to")
			nodesByID[node.ID] = node
			continue
		}

		fromID := runtimeSubjectID(observation.From)
		toID := runtimeSubjectID(observation.To)
		reason := runtimeInputObservationReason(observation, coverage)
		nodesByID[fromID] = graph.Node{
			ID:    fromID,
			Kind:  "runtime",
			Label: strings.TrimSpace(observation.From),
			Evidence: graph.Evidence{
				State:  graph.RuntimeVisible,
				Source: observationSource,
				Reason: reason,
			},
		}
		nodesByID[toID] = graph.Node{
			ID:    toID,
			Kind:  "runtime",
			Label: strings.TrimSpace(observation.To),
			Evidence: graph.Evidence{
				State:  graph.RuntimeVisible,
				Source: observationSource,
				Reason: reason,
			},
		}
		edges = append(edges, graph.Edge{
			From: fromID,
			To:   toID,
			Kind: "observes",
			Evidence: graph.Evidence{
				State:  graph.RuntimeVisible,
				Source: observationSource,
				Reason: reason,
			},
		})
		if coverage != "complete" && !partialCoverageRecorded {
			unknownID := source.ID + ":unknown:runtime-topology"
			unknownReason := fmt.Sprintf("%s runtime observation coverage does not prove complete topology", coverage)
			nodesByID[unknownID] = graph.Node{
				ID:    unknownID,
				Kind:  "unknown",
				Label: "runtime topology",
				Evidence: graph.Evidence{
					State:  graph.Unknown,
					Source: observationSource,
					Reason: unknownReason,
				},
			}
			edges = append(edges, graph.Edge{
				From: source.ID,
				To:   unknownID,
				Kind: "unknown",
				Evidence: graph.Evidence{
					State:  graph.Unknown,
					Source: observationSource,
					Reason: unknownReason,
				},
			})
			partialCoverageRecorded = true
		}
	}

	nodes := make([]graph.Node, 0, len(nodesByID))
	for _, node := range nodesByID {
		nodes = append(nodes, node)
	}
	finding := observedFinding("finding-runtime-"+source.ID, "configuration", "Runtime export input is locally visible and runtime observations were imported.", graph.RuntimeVisible, source.Path)
	if invalid {
		finding.Status = "cannot_verify"
		finding.EvidenceState = string(graph.CannotVerify)
		finding.Confidence = 0
		finding.Summary = "Runtime export input includes observations that cannot be verified."
	}
	return nodes, edges, finding
}

func runtimeReadErrorReason(err error) string {
	if os.IsNotExist(err) {
		return "path does not exist"
	}
	return err.Error()
}

func runtimeInputCannotVerifyFinding(source selection.InputSource, summary string) Finding {
	return Finding{
		ID:             "finding-runtime-" + source.ID,
		Kind:           "configuration",
		Summary:        summary,
		Severity:       "info",
		EvidenceState:  string(graph.CannotVerify),
		EvidenceSource: source.Path,
		Confidence:     0,
		Status:         "cannot_verify",
	}
}

func runtimeInvalidObservationNode(sourceID, prefix, label, evidenceSource, reason string) graph.Node {
	return graph.Node{
		ID:    sourceID + ":" + prefix + ":" + runtimeSubjectID(label),
		Kind:  "unknown",
		Label: label,
		Evidence: graph.Evidence{
			State:  graph.CannotVerify,
			Source: evidenceSource,
			Reason: reason,
		},
	}
}

func runtimeObservationID(observation runtimeInputObservation) string {
	if observation.ID != "" {
		return observation.ID
	}
	if observation.From != "" || observation.To != "" {
		return strings.TrimSpace(observation.From + " -> " + observation.To)
	}
	return "runtime observation"
}

func normalizeRuntimeInputCoverage(value string) (string, bool) {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "":
		return "unknown", true
	case "complete", "partial", "unknown", "not_assessed":
		return strings.ToLower(strings.TrimSpace(value)), true
	default:
		return "", false
	}
}

func runtimeInputObservationReason(observation runtimeInputObservation, coverage string) string {
	parts := []string{}
	if observation.ID != "" {
		parts = append(parts, "id "+observation.ID)
	}
	if observation.Kind != "" {
		parts = append(parts, "kind "+observation.Kind)
	}
	if coverage != "" {
		parts = append(parts, "coverage "+coverage)
	}
	if observation.ObservedAt != "" {
		parts = append(parts, "observed_at "+observation.ObservedAt)
	}
	if len(parts) == 0 {
		return "runtime observation"
	}
	return "runtime observation " + strings.Join(parts, "; ")
}

func runtimeSubjectID(value string) string {
	id := stableID(value)
	if id == "unknown" {
		return "runtime-subject-" + shortRuntimeHash(value)
	}
	return id
}

func shortRuntimeHash(value string) string {
	hash := fnv.New32a()
	_, _ = hash.Write([]byte(value))
	return fmt.Sprintf("%08x", hash.Sum32())
}

func unsafeRuntimeSource(source string) bool {
	lower := strings.ToLower(strings.TrimSpace(source))
	if strings.Contains(lower, "://") {
		return true
	}
	for _, prefix := range []string{"data:", "javascript:"} {
		if strings.HasPrefix(lower, prefix) {
			return true
		}
	}
	for _, marker := range []string{"token=", "password", "credential", "authorization", "bearer ", "secret"} {
		if strings.Contains(lower, marker) {
			return true
		}
	}
	return false
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

func configurationNodes(prefix string, prefixed bool, result configuration.Result) []graph.Node {
	var nodes []graph.Node
	for _, surface := range result.Surfaces {
		id := configurationSurfaceID(surface.Kind, surface.Name)
		if prefixed {
			id = prefix + ":" + id
		}
		nodes = append(nodes, graph.Node{
			ID:    id,
			Kind:  "configuration",
			Label: configurationSurfaceLabel(surface),
			Evidence: graph.Evidence{
				State:  surface.EvidenceState,
				Source: strings.Join(surface.Sources, "; "),
			},
		})
	}
	return nodes
}

func prefixedConfigurationFindings(prefix string, result configuration.Result) []Finding {
	findings := configurationFindings(result)
	for i := range findings {
		findings[i].ID = prefix + "-" + findings[i].ID
		findings[i].EvidenceSource = prefix + ":" + findings[i].EvidenceSource
	}
	return findings
}

func configurationFindings(result configuration.Result) []Finding {
	counts := map[string]int{}
	sources := map[string]map[string]bool{}
	for _, surface := range result.Surfaces {
		counts[surface.Kind]++
		if sources[surface.Kind] == nil {
			sources[surface.Kind] = map[string]bool{}
		}
		for _, source := range surface.Sources {
			sources[surface.Kind][source] = true
		}
	}
	var findings []Finding
	for _, kind := range sortedConfigKinds(counts) {
		findings = append(findings, Finding{
			ID:             "finding-configuration-" + stableID(kind) + "-observed",
			Kind:           "configuration",
			Summary:        configurationFindingSummary(kind, counts[kind]),
			Severity:       "info",
			EvidenceState:  string(graph.SourceVisible),
			EvidenceSource: strings.Join(sortedMapKeys(sources[kind]), "; "),
			Confidence:     0.8,
			Status:         "observed",
		})
	}
	for i, issue := range result.Issues {
		findings = append(findings, Finding{
			ID:             fmt.Sprintf("finding-configuration-%s-%03d", issue.Status, i+1),
			Kind:           "configuration",
			Summary:        "Could not assess configuration candidate: " + issue.Reason,
			Severity:       "info",
			EvidenceState:  string(issue.EvidenceState),
			EvidenceSource: issue.Path,
			Confidence:     0,
			Status:         issue.Status,
		})
	}
	return findings
}

func configurationSurfaceID(kind, name string) string {
	return "configuration:" + stableID(kind) + ":" + stableID(name)
}

func configurationSurfaceLabel(surface configuration.Surface) string {
	switch surface.Kind {
	case "secret-reference":
		return "secret reference " + surface.Name
	default:
		return surface.Kind + " " + surface.Name
	}
}

func configurationFindingSummary(kind string, count int) string {
	switch kind {
	case "container":
		return fmt.Sprintf("Detected %d container configuration surface(s) from local files.", count)
	case "env-var":
		return fmt.Sprintf("Detected %d environment variable reference(s) by name only.", count)
	case "feature-flag":
		return fmt.Sprintf("Detected %d feature flag reference(s) by name only.", count)
	case "manifest":
		return fmt.Sprintf("Detected %d package or dependency manifest surface(s).", count)
	case "port":
		return fmt.Sprintf("Detected %d port declaration surface(s) from local files.", count)
	case "secret-reference":
		return fmt.Sprintf("Detected %d secret reference(s) by name only; values are not recorded.", count)
	case "workflow":
		return fmt.Sprintf("Detected %d CI/CD workflow surface(s).", count)
	default:
		return fmt.Sprintf("Detected %d configuration surface(s) of type %s.", count, kind)
	}
}

func sortedConfigKinds(counts map[string]int) []string {
	var kinds []string
	for kind := range counts {
		kinds = append(kinds, kind)
	}
	sort.Strings(kinds)
	return kinds
}

func sortedMapKeys(values map[string]bool) []string {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
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
	data, err := readSelectedToolOutput(source.Path)
	if err != nil {
		nodes[0].Evidence.State = graph.CannotVerify
		nodes[0].Evidence.Reason = err.Error()
		return nodes, nil, []Finding{toolOutputFinding(source, nodes[0].Evidence.State, "Tool output could not be read: "+err.Error(), 0)}
	}
	var doc toolOutputDocument
	if err := decodeToolOutputDocument(data, &doc); err != nil {
		nodes[0].Evidence.State = graph.CannotVerify
		nodes[0].Evidence.Reason = err.Error()
	}
	if nodes[0].Evidence.State != graph.CannotVerify {
		if err := validateToolOutputDocument(source, doc); err != nil {
			nodes[0].Evidence.State = graph.CannotVerify
			nodes[0].Evidence.Reason = err.Error()
		}
	}
	var factNodes []graph.Node
	var factEdges []graph.Edge
	if nodes[0].Evidence.State != graph.CannotVerify {
		factNodes, factEdges = toolOutputFacts(source, doc)
	}
	nodes = append(nodes, factNodes...)
	nodes = append(nodes, edgeEndpointNodes(source, nodes, factEdges)...)
	summary := toolOutputSummary(source, doc)
	if nodes[0].Evidence.State == graph.CannotVerify {
		summary = "Malformed or unsupported local " + source.Kind + " output from " + source.Tool + ": " + nodes[0].Evidence.Reason
	}
	if len(source.Limitations) > 0 {
		limitationReason := strings.Join(source.Limitations, "; ")
		if nodes[0].Evidence.Reason == "" {
			nodes[0].Evidence.Reason = limitationReason
		} else {
			nodes[0].Evidence.Reason += "; " + limitationReason
		}
	}
	confidence := toolOutputConfidence(source, doc.Confidence)
	if nodes[0].Evidence.State == graph.CannotVerify {
		confidence = 0
	}
	findings := []Finding{toolOutputFinding(source, nodes[0].Evidence.State, summary, confidence)}
	return nodes, factEdges, findings
}

func readSelectedToolOutput(path string) ([]byte, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}
	if !info.Mode().IsRegular() {
		return nil, fmt.Errorf("tool output path must be a regular file")
	}
	if maxSelectedToolOutputBytes > 0 && info.Size() > maxSelectedToolOutputBytes {
		return nil, fmt.Errorf("tool output size %d exceeds selected-output limit %d", info.Size(), maxSelectedToolOutputBytes)
	}
	return os.ReadFile(path)
}

func decodeToolOutputDocument(data []byte, doc *toolOutputDocument) error {
	decoder := json.NewDecoder(strings.NewReader(string(data)))
	if err := decoder.Decode(doc); err != nil {
		return fmt.Errorf("malformed tool output JSON: %w", err)
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		return fmt.Errorf("malformed tool output JSON: trailing JSON content")
	}
	return nil
}

func toolOutputFinding(source selection.ToolOutput, state graph.EvidenceState, summary string, confidence float64) Finding {
	return Finding{
		ID:             "finding-tool-output-" + source.ID,
		Kind:           findingKindForToolOutput(source.Kind),
		Summary:        summary,
		Severity:       "info",
		EvidenceState:  string(state),
		EvidenceSource: source.Path,
		Confidence:     confidence,
		Status:         statusForEvidence(state),
	}
}

func validateToolOutputDocument(source selection.ToolOutput, doc toolOutputDocument) error {
	if source.Kind != "symbol-index" {
		return nil
	}
	documents := len(doc.Documents)
	if documents == 0 {
		return fmt.Errorf("symbol-index output contains no documents")
	}
	if documents > maxSelectedSymbolDocuments {
		return fmt.Errorf("symbol-index document count %d exceeds selected-output limit %d", documents, maxSelectedSymbolDocuments)
	}
	symbols := countToolOutputSymbols(doc.Documents)
	if symbols > maxSelectedSymbols {
		return fmt.Errorf("symbol-index symbol count %d exceeds selected-output limit %d", symbols, maxSelectedSymbols)
	}
	return nil
}

type toolOutputDocument struct {
	Summary          string           `json:"summary"`
	Confidence       *float64         `json:"confidence"`
	BOMFormat        string           `json:"bomFormat"`
	Components       []map[string]any `json:"components"`
	Dependencies     []map[string]any `json:"dependencies"`
	Producer         string           `json:"producer"`
	Documents        []map[string]any `json:"documents"`
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
		knownComponents := map[string]bool{}
		for _, component := range doc.Components {
			ref := stringField(component, "bom-ref")
			if ref == "" {
				ref = stringField(component, "name")
			}
			if ref == "" {
				continue
			}
			nodeID := source.ID + ":component:" + stableID(ref)
			knownComponents[nodeID] = true
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
			if from == "" {
				continue
			}
			fromID := source.ID + ":component:" + stableID(from)
			if !knownComponents[fromID] {
				nodes = append(nodes, missingToolComponentNode(fromID, from, source.Path))
				knownComponents[fromID] = true
			}
			for _, to := range stringSliceField(dep, "dependsOn") {
				toID := source.ID + ":component:" + stableID(to)
				state := graph.MetadataVisible
				reason := ""
				if !knownComponents[toID] {
					nodes = append(nodes, missingToolComponentNode(toID, to, source.Path))
					knownComponents[toID] = true
					state = graph.CannotVerify
					reason = "dependency ref was not present in producer components"
				}
				edges = append(edges, graph.Edge{
					From: fromID,
					To:   toID,
					Kind: "depends-on",
					Evidence: graph.Evidence{
						State:  state,
						Source: source.Path,
						Reason: reason,
					},
				})
			}
		}
	case "symbol-index":
		for _, document := range doc.Documents {
			docPath := documentPath(document)
			if docPath == "" {
				continue
			}
			docID := source.ID + ":document:" + stableID(docPath)
			nodes = append(nodes, graph.Node{
				ID:    docID,
				Kind:  "unknown",
				Label: docPath,
				Evidence: graph.Evidence{
					State:  graph.MetadataVisible,
					Source: source.Path,
					Reason: reasonWithValue(stringField(document, "language"), "document listed by local symbol-index export"),
				},
			})
			edges = append(edges, graph.Edge{
				From: source.ID,
				To:   docID,
				Kind: "owns",
				Evidence: graph.Evidence{
					State:  graph.MetadataVisible,
					Source: source.Path,
					Reason: "symbol-index document ownership; not a complete call graph",
				},
			})
			for _, symbol := range mapSliceField(document, "symbols") {
				symbolIDValue := stringField(symbol, "id")
				if symbolIDValue == "" {
					symbolIDValue = stringField(symbol, "name")
				}
				if symbolIDValue == "" {
					continue
				}
				symbolID := source.ID + ":symbol:" + stableID(symbolIDValue)
				nodes = append(nodes, graph.Node{
					ID:    symbolID,
					Kind:  "unknown",
					Label: symbolLabel(symbol),
					Evidence: graph.Evidence{
						State:  graph.MetadataVisible,
						Source: symbolSource(source.Path, docPath, stringField(symbol, "range")),
						Reason: reasonWithValue(stringField(symbol, "kind"), "symbol identity/range listed by local export; semantic correctness not assessed"),
					},
				})
				edges = append(edges, graph.Edge{
					From: docID,
					To:   symbolID,
					Kind: "owns",
					Evidence: graph.Evidence{
						State:  graph.MetadataVisible,
						Source: symbolSource(source.Path, docPath, stringField(symbol, "range")),
						Reason: reasonWithValue(stringField(symbol, "role"), "symbol occurrence listed by local export; not a complete call graph"),
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
			return fmt.Sprintf("Imported CycloneDX dependency evidence%s with %d components and %d dependency records.", toolOutputScope(source), len(doc.Components), len(doc.Dependencies))
		}
	case "symbol-index":
		if len(doc.Documents) > 0 {
			return fmt.Sprintf("Imported symbol-index evidence%s with %d documents and %d symbols; not a complete call graph.", toolOutputScope(source), len(doc.Documents), countToolOutputSymbols(doc.Documents))
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

func toolOutputScope(source selection.ToolOutput) string {
	if strings.TrimSpace(source.Repository) == "" {
		return ""
	}
	return " for repository " + strings.TrimSpace(source.Repository)
}

func countToolOutputSymbols(documents []map[string]any) int {
	count := 0
	for _, document := range documents {
		count += len(mapSliceField(document, "symbols"))
	}
	return count
}

func missingToolComponentNode(id string, label string, source string) graph.Node {
	return graph.Node{
		ID:    id,
		Kind:  "package",
		Label: label,
		Evidence: graph.Evidence{
			State:  graph.CannotVerify,
			Source: source,
			Reason: "dependency ref was not present in producer components",
		},
	}
}

func documentPath(document map[string]any) string {
	if path := stringField(document, "path"); path != "" {
		return boundedMetadataValue(path)
	}
	return boundedMetadataValue(stringField(document, "uri"))
}

func symbolLabel(symbol map[string]any) string {
	if name := stringField(symbol, "name"); name != "" {
		return boundedMetadataValue(name)
	}
	return boundedMetadataValue(stringField(symbol, "id"))
}

func symbolSource(inputPath string, documentPath string, symbolRange string) string {
	parts := []string{inputPath}
	if documentPath = strings.TrimSpace(documentPath); documentPath != "" {
		parts = append(parts, documentPath)
	}
	if symbolRange = strings.TrimSpace(symbolRange); symbolRange != "" {
		parts = append(parts, symbolRange)
	}
	return strings.Join(parts, ":")
}

func boundedMetadataValue(value string) string {
	value = strings.TrimSpace(value)
	const maxMetadataValueLength = 240
	if len(value) <= maxMetadataValueLength {
		return value
	}
	return value[:maxMetadataValueLength] + "...truncated"
}

func reasonWithValue(value string, reason string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return reason
	}
	return reason + " (" + value + ")"
}

func stringField(value map[string]any, key string) string {
	raw, _ := value[key].(string)
	return raw
}

func mapSliceField(value map[string]any, key string) []map[string]any {
	raw, ok := value[key].([]any)
	if !ok {
		return nil
	}
	out := make([]map[string]any, 0, len(raw))
	for _, item := range raw {
		mapped, ok := item.(map[string]any)
		if ok {
			out = append(out, mapped)
		}
	}
	return out
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
	case "sbom", "dependency", "symbol-index":
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
		findings = append(findings, notAssessedFinding("finding-relationships-not-assessed", "relationships", "Relationship detection currently supports Go imports and go.mod manifests; no supported Go/go.mod relationship inputs were observed, and primary-language coupling remains not_assessed unless local producer evidence is supplied."))
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

func writeSummary(path string, summary Summary) error {
	data, err := json.MarshalIndent(summary, "", "  ")
	if err != nil {
		return fmt.Errorf("encode summary: %w", err)
	}
	return os.WriteFile(path, append(data, '\n'), 0o644)
}

func writeGraphIndex(path string, index GraphIndex) error {
	if index.ArtifactSizes == nil {
		index.ArtifactSizes = map[string]int64{}
	}
	for range 3 {
		data, err := json.MarshalIndent(index, "", "  ")
		if err != nil {
			return fmt.Errorf("encode graph index: %w", err)
		}
		if err := os.WriteFile(path, append(data, '\n'), 0o644); err != nil {
			return err
		}
		info, err := os.Stat(path)
		if err != nil {
			return fmt.Errorf("size graph index: %w", err)
		}
		if index.ArtifactSizes["graph-index.json"] == info.Size() {
			return nil
		}
		index.ArtifactSizes["graph-index.json"] = info.Size()
	}
	data, err := json.MarshalIndent(index, "", "  ")
	if err != nil {
		return fmt.Errorf("encode graph index: %w", err)
	}
	return os.WriteFile(path, append(data, '\n'), 0o644)
}

func summarizeRun(run RunMetadata, g graph.Graph, findings []Finding, ledger coverage.Ledger) Summary {
	return Summary{
		SchemaVersion: SchemaVersion,
		GeneratedBy:   "portolan",
		GeneratedAt:   run.GeneratedAt,
		Command:       run.Command,
		Root:          run.Root,
		Selection:     run.Selection,
		OutputPath:    run.OutputPath,
		Artifacts:     run.Artifacts,
		Graph:         summarizeGraph(g),
		Findings:      summarizeFindings(findings),
		Coverage:      summarizeCoverage(ledger),
		FileSurfaces:  summarizeFileSurfaces(g),
		Navigation:    buildNavigationIndex(g),
		Skipped:       append([]string(nil), run.SkippedSurfaces...),
		Warnings:      append([]string(nil), run.Warnings...),
	}
}

func buildGraphIndex(run RunMetadata, g graph.Graph, findings []Finding, artifactDir string) GraphIndex {
	return GraphIndex{
		SchemaVersion: SchemaVersion,
		GeneratedBy:   "portolan",
		GeneratedAt:   run.GeneratedAt,
		Command:       run.Command,
		Root:          run.Root,
		Selection:     run.Selection,
		OutputPath:    run.OutputPath,
		Artifacts:     run.Artifacts,
		Budget: graphIndexBudget{
			NodeSamplesPerKind:    graphIndexSampleLimit,
			EdgeSamplesPerKind:    graphIndexSampleLimit,
			FindingSamplesPerKind: graphIndexSampleLimit,
			HighDegreeNodes:       graphIndexHighDegreeLimit,
		},
		ArtifactSizes: artifactSizes(artifactDir),
		Graph:         summarizeGraph(g),
		Findings:      summarizeFindings(findings),
		NodeSlices:    graphIndexNodeSlices(g),
		EdgeSlices:    graphIndexEdgeSlices(g),
		FindingSlices: graphIndexFindingSlices(findings),
		HighDegree:    graphIndexHighDegreeNodes(g),
		Navigation:    buildNavigationIndex(g),
		Rules:         graphIndexRules(g),
	}
}

func buildNavigationIndex(g graph.Graph) navigationIndex {
	unknownNodes := graphNodeKindCount(g, "unknown")
	highDegree := graphIndexHighDegreeNodes(g)
	nav := navigationIndex{
		ReadOrder: []string{
			"summary.json",
			"graph-index.json",
			"portolan query findings",
			"portolan query gaps",
			"portolan graph slice",
		},
		DoNotOpenFirst: []string{"graph.json"},
		NextDrillDown: []string{
			"portolan graph slice --bundle <run-dir> --repo <repo-id> --out <slice.json> --limit <n>",
			"portolan graph slice --bundle <run-dir> --edge-kind <edge-kind> --out <slice.json> --limit <n>",
			"portolan query gaps --bundle <run-dir> --limit 20",
		},
		HighDegreeHubs: append([]graphIndexDegreeNode(nil), highDegree...),
		UnknownNodes: unknownNavigationBucket{
			Total:          unknownNodes,
			Majority:       unknownNodes > len(g.Nodes)/2,
			SurfaceBuckets: summarizeFileSurfaces(g),
		},
		Warnings: []string{
			"Use bounded navigation artifacts before graph.json; graph.json is canonical but not a first-read agent artifact.",
		},
	}
	if unknownNodes > 0 {
		nav.UnknownNodes.Reason = "Unknown nodes are unclassified inventory, not semantic architecture coverage; surface_buckets classify only nodes where kind == \"unknown\", not all graph nodes."
		nav.Warnings = append(nav.Warnings, fmt.Sprintf("Node kind \"unknown\" appears %d times; use unknown_nodes.surface_buckets and graph slice before making architecture claims.", unknownNodes))
	}
	if nav.UnknownNodes.Majority {
		nav.Warnings = append(nav.Warnings, "Unknown nodes are the majority of this graph; do not treat graph size as architecture coverage.")
	}
	for _, node := range highDegree {
		if node.Kind == "tool-output-sbom" {
			nav.Warnings = append(nav.Warnings, fmt.Sprintf("SBOM tool-output node %q has %d outgoing package edges; treat this as package inventory fan-out, not service topology or runtime coupling.", node.ID, node.OutEdges))
			break
		}
	}
	return nav
}

func graphIndexRules(g graph.Graph) []string {
	rules := []string{
		"Read summary.json and graph-index.json before loading graph.json.",
		"Use portolan graph slice --bundle <run-dir> for the next bounded drill-down by repo, edge kind, or finding kind.",
		"Use graph-index.json as bounded navigation; graph.json remains the canonical graph.",
		"Preserve unknown, cannot_verify, and not_assessed evidence states in answers.",
	}
	unknownNodes := graphNodeKindCount(g, "unknown")
	if unknownNodes > 0 {
		rules = append(rules, fmt.Sprintf("Node kind \"unknown\" appears %d times; treat these as unclassified inventory, not semantic coverage.", unknownNodes))
	}
	if unknownNodes > len(g.Nodes)/2 {
		rules = append(rules, "Unknown nodes are the majority of this graph; do not treat graph size as architecture coverage.")
	}
	if hasTruncatedGraphIndexSlice(g) {
		rules = append(rules, "When graph-index samples are truncated, rerun graph slice with --repo <id>, a narrower --edge-kind or --finding-kind, and an explicit --limit before making precise claims.")
	}
	return rules
}

func graphNodeKindCount(g graph.Graph, kind string) int {
	count := 0
	for _, node := range g.Nodes {
		if node.Kind == kind {
			count++
		}
	}
	return count
}

func hasTruncatedGraphIndexSlice(g graph.Graph) bool {
	nodeKinds := map[string]int{}
	for _, node := range g.Nodes {
		nodeKinds[node.Kind]++
		if nodeKinds[node.Kind] > graphIndexSampleLimit {
			return true
		}
	}
	edgeKinds := map[string]int{}
	for _, edge := range g.Edges {
		edgeKinds[edge.Kind]++
		if edgeKinds[edge.Kind] > graphIndexSampleLimit {
			return true
		}
	}
	return false
}

func artifactSizes(dir string) map[string]int64 {
	sizes := map[string]int64{}
	for _, name := range []string{"run.json", "coverage.json", "graph.json", "graph-index.json", "findings.jsonl", "summary.json", "map.md"} {
		info, err := os.Stat(filepath.Join(dir, name))
		if err == nil {
			sizes[name] = info.Size()
		}
	}
	return sizes
}

func graphIndexNodeSlices(g graph.Graph) []graphIndexNodeSlice {
	type accumulator struct {
		total   int
		samples []graphIndexNodeSample
	}
	byKind := map[string]*accumulator{}
	for _, node := range g.Nodes {
		acc := byKind[node.Kind]
		if acc == nil {
			acc = &accumulator{}
			byKind[node.Kind] = acc
		}
		acc.total++
		if len(acc.samples) < graphIndexSampleLimit {
			acc.samples = append(acc.samples, graphIndexNodeSample{
				ID:             node.ID,
				Label:          node.Label,
				EvidenceState:  string(node.Evidence.State),
				EvidenceSource: node.Evidence.Source,
			})
		}
	}
	kinds := sortedKeys(byKind)
	slices := make([]graphIndexNodeSlice, 0, len(kinds))
	for _, kind := range kinds {
		acc := byKind[kind]
		slices = append(slices, graphIndexNodeSlice{
			Kind:      kind,
			Total:     acc.total,
			Truncated: max(0, acc.total-len(acc.samples)),
			Samples:   acc.samples,
		})
	}
	return slices
}

func graphIndexEdgeSlices(g graph.Graph) []graphIndexEdgeSlice {
	type accumulator struct {
		total   int
		samples []graphIndexEdgeSample
	}
	byKind := map[string]*accumulator{}
	for _, edge := range g.Edges {
		acc := byKind[edge.Kind]
		if acc == nil {
			acc = &accumulator{}
			byKind[edge.Kind] = acc
		}
		acc.total++
		if len(acc.samples) < graphIndexSampleLimit {
			acc.samples = append(acc.samples, graphIndexEdgeSample{
				From:           edge.From,
				To:             edge.To,
				EvidenceState:  string(edge.Evidence.State),
				EvidenceSource: edge.Evidence.Source,
			})
		}
	}
	kinds := sortedKeys(byKind)
	slices := make([]graphIndexEdgeSlice, 0, len(kinds))
	for _, kind := range kinds {
		acc := byKind[kind]
		slices = append(slices, graphIndexEdgeSlice{
			Kind:      kind,
			Total:     acc.total,
			Truncated: max(0, acc.total-len(acc.samples)),
			Samples:   acc.samples,
		})
	}
	return slices
}

func graphIndexFindingSlices(findings []Finding) []graphIndexFindingSlice {
	type accumulator struct {
		total   int
		samples []graphIndexFindingSample
	}
	byKind := map[string]*accumulator{}
	for _, finding := range findings {
		acc := byKind[finding.Kind]
		if acc == nil {
			acc = &accumulator{}
			byKind[finding.Kind] = acc
		}
		acc.total++
		if len(acc.samples) < graphIndexSampleLimit {
			acc.samples = append(acc.samples, graphIndexFindingSample{
				ID:             finding.ID,
				Status:         finding.Status,
				EvidenceState:  finding.EvidenceState,
				EvidenceSource: finding.EvidenceSource,
				Confidence:     finding.Confidence,
				Summary:        finding.Summary,
			})
		}
	}
	kinds := sortedKeys(byKind)
	slices := make([]graphIndexFindingSlice, 0, len(kinds))
	for _, kind := range kinds {
		acc := byKind[kind]
		slices = append(slices, graphIndexFindingSlice{
			Kind:      kind,
			Total:     acc.total,
			Truncated: max(0, acc.total-len(acc.samples)),
			Samples:   acc.samples,
		})
	}
	return slices
}

func graphIndexHighDegreeNodes(g graph.Graph) []graphIndexDegreeNode {
	nodeByID := map[string]graph.Node{}
	inEdges := map[string]int{}
	outEdges := map[string]int{}
	for _, node := range g.Nodes {
		nodeByID[node.ID] = node
	}
	for _, edge := range g.Edges {
		outEdges[edge.From]++
		inEdges[edge.To]++
	}
	nodes := make([]graphIndexDegreeNode, 0, len(nodeByID))
	for id, node := range nodeByID {
		in := inEdges[id]
		out := outEdges[id]
		total := in + out
		if total == 0 {
			continue
		}
		nodes = append(nodes, graphIndexDegreeNode{
			ID:            id,
			Kind:          node.Kind,
			Label:         node.Label,
			EvidenceState: string(node.Evidence.State),
			InEdges:       in,
			OutEdges:      out,
			TotalDegree:   total,
		})
	}
	sort.Slice(nodes, func(i, j int) bool {
		if nodes[i].TotalDegree != nodes[j].TotalDegree {
			return nodes[i].TotalDegree > nodes[j].TotalDegree
		}
		return nodes[i].ID < nodes[j].ID
	})
	if len(nodes) > graphIndexHighDegreeLimit {
		nodes = nodes[:graphIndexHighDegreeLimit]
	}
	return nodes
}

func sortedKeys[T any](values map[string]T) []string {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}

func summarizeGraph(g graph.Graph) graphSummary {
	summary := graphSummary{
		Nodes:          len(g.Nodes),
		Edges:          len(g.Edges),
		EvidenceStates: map[string]int{},
		NodeKinds:      map[string]int{},
	}
	for _, node := range g.Nodes {
		summary.EvidenceStates[string(node.Evidence.State)]++
		summary.NodeKinds[node.Kind]++
	}
	for _, edge := range g.Edges {
		summary.EvidenceStates[string(edge.Evidence.State)]++
	}
	return summary
}

func summarizeFindings(findings []Finding) findingSummary {
	summary := findingSummary{
		Total:           len(findings),
		ByKind:          map[string]int{},
		ByStatus:        map[string]int{},
		ByEvidenceState: map[string]int{},
	}
	for _, finding := range findings {
		summary.ByKind[finding.Kind]++
		summary.ByStatus[finding.Status]++
		summary.ByEvidenceState[finding.EvidenceState]++
		if finding.Status == "not_assessed" {
			summary.NotAssessedTotal++
		}
	}
	return summary
}

func summarizeCoverage(ledger coverage.Ledger) coverageSummary {
	summary := coverageSummary{
		Records:         len(ledger.Records),
		ByKind:          map[string]int{},
		ByStatus:        map[string]int{},
		ByEvidenceState: map[string]int{},
	}
	for _, record := range ledger.Records {
		summary.ByKind[record.Kind]++
		summary.ByStatus[record.Status]++
		summary.ByEvidenceState[record.EvidenceState]++
		if record.Kind == "repository" || record.Kind == "manifest-repository" {
			appendLimitedCoverageRecord(&summary.Repositories, &summary.RepositoriesTruncated, record)
		}
		if isWeakCoverageRecord(record) {
			appendLimitedCoverageRecord(&summary.WeakRecords, &summary.WeakRecordsTruncated, record)
		}
	}
	return summary
}

func appendLimitedCoverageRecord(records *[]coverageSummaryRecord, truncated *int, record coverage.Record) {
	if len(*records) >= summaryRecordLimit {
		*truncated = *truncated + 1
		return
	}
	*records = append(*records, coverageSummaryRecord{
		ID:            record.ID,
		Kind:          record.Kind,
		Status:        record.Status,
		EvidenceState: record.EvidenceState,
		Source:        record.Source,
		Reason:        record.Reason,
	})
}

func isWeakCoverageRecord(record coverage.Record) bool {
	return record.Status == "unknown" ||
		record.Status == "missing" ||
		record.Status == "cannot_verify" ||
		record.Status == "not_assessed" ||
		record.Status == "extra" ||
		record.Status == "blocked" ||
		record.EvidenceState == string(graph.Unknown) ||
		record.EvidenceState == string(graph.CannotVerify) ||
		record.EvidenceState == "not_assessed"
}

func summarizeFileSurfaces(g graph.Graph) map[string]int {
	counts := map[string]int{}
	for _, node := range g.Nodes {
		if node.Kind != "unknown" {
			continue
		}
		label := node.Label
		if label == "" {
			label = node.ID
		}
		counts[classifyFileSurface(label)]++
	}
	return counts
}

func classifyFileSurface(path string) string {
	lower := strings.ToLower(filepath.ToSlash(path))
	base := filepath.Base(lower)
	ext := filepath.Ext(base)
	switch {
	case strings.HasPrefix(lower, ".github/workflows/") || strings.Contains(lower, "/.github/workflows/") || strings.HasPrefix(lower, ".gitlab-ci") || strings.Contains(lower, "/.gitlab-ci") || base == "jenkinsfile" || base == "buildkite.yml" || base == "buildkite.yaml":
		return "workflow"
	case base == "dockerfile" || base == "containerfile" || strings.HasPrefix(base, "dockerfile.") || strings.Contains(base, "compose."):
		return "container"
	case base == "go.mod" || base == "go.sum" || base == "package.json" || base == "pom.xml" || base == "build.gradle" || base == "build.gradle.kts" || base == "requirements.txt" || base == "pyproject.toml" || base == "cargo.toml" || base == "cargo.lock" || base == "gemfile" || base == "mix.exs":
		return "manifest"
	case strings.HasSuffix(base, ".lock") || base == "package-lock.json" || base == "yarn.lock" || base == "pnpm-lock.yaml" || strings.Contains(lower, "/vendor/") || strings.Contains(lower, "/node_modules/"):
		return "generated_or_lock"
	case ext == ".yaml" || ext == ".yml" || ext == ".json" || ext == ".toml" || ext == ".ini" || ext == ".conf" || ext == ".cfg" || ext == ".properties" || ext == ".env":
		return "config"
	case strings.Contains(lower, "/test/") || strings.Contains(lower, "/tests/") || strings.Contains(lower, "/spec/") || strings.Contains(lower, "_test.") || strings.Contains(lower, ".test.") || strings.Contains(lower, ".spec."):
		return "test"
	case ext == ".md" || ext == ".rst" || ext == ".adoc" || ext == ".txt":
		return "doc"
	case isSourceExtension(ext):
		return "source"
	default:
		return "unknown"
	}
}

func isSourceExtension(ext string) bool {
	switch ext {
	case ".go", ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".kt", ".kts", ".scala", ".rb", ".rs", ".c", ".h", ".cc", ".cpp", ".hpp", ".cs", ".php", ".swift", ".m", ".mm", ".sh", ".bash", ".zsh", ".fish", ".sql", ".lua", ".ex", ".exs", ".erl", ".hrl", ".clj", ".cljs":
		return true
	default:
		return false
	}
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
	reader := bufio.NewReader(file)
	for {
		line, err := reader.ReadString('\n')
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			var finding Finding
			if err := json.Unmarshal([]byte(trimmed), &finding); err != nil {
				return nil, fmt.Errorf("parse finding: %w", err)
			}
			findings = append(findings, finding)
		}
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return nil, fmt.Errorf("read findings: %w", err)
		}
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
	b.WriteString("- Inspect `summary.json` and `graph-index.json` before loading full `graph.json` into an agent context.\n")
	b.WriteString("- Inspect `summary.json.navigation` and `graph-index.json.navigation` for high-degree hubs, unknown-node buckets, and safe drill-down order.\n")
	b.WriteString("- Use `portolan graph slice --bundle <run-dir>` for bounded repo, edge-kind, or finding-kind drill-downs.\n")
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
	if unknownNodes := kindCounts["unknown"]; unknownNodes > 0 {
		fmt.Fprintf(b, "- Unknown node kinds: %d unclassified inventory records. Treat them as navigation coverage gaps, not semantic architecture coverage.\n", unknownNodes)
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
