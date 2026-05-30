package graphslice

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/fcon-tech/portolan/internal/graph"
	"github.com/fcon-tech/portolan/internal/packet"
)

const SchemaVersion = "0.1.0"
const defaultLimit = 100
const maxLimit = 1000

type Options struct {
	BundlePath  string
	OutputPath  string
	RepoID      string
	EdgeKind    string
	FindingKind string
	Limit       int
	Force       bool
}

type Result struct {
	OutputPath string
}

type Slice struct {
	SchemaVersion string          `json:"schema_version"`
	GeneratedBy   string          `json:"generated_by"`
	GeneratedAt   time.Time       `json:"generated_at"`
	BundlePath    string          `json:"bundle_path"`
	Criteria      Criteria        `json:"criteria"`
	Limit         int             `json:"limit"`
	Totals        Totals          `json:"totals"`
	Truncated     Truncated       `json:"truncated"`
	Nodes         []NodeSample    `json:"nodes"`
	Edges         []EdgeSample    `json:"edges"`
	Findings      []FindingSample `json:"findings"`
	Rules         []string        `json:"rules"`
}

type Criteria struct {
	Mode  string `json:"mode"`
	Value string `json:"value"`
}

type Totals struct {
	GraphNodes       int `json:"graph_nodes"`
	GraphEdges       int `json:"graph_edges"`
	Findings         int `json:"findings"`
	MatchingNodes    int `json:"matching_nodes"`
	MatchingEdges    int `json:"matching_edges"`
	MatchingFindings int `json:"matching_findings"`
}

type Truncated struct {
	Nodes    int `json:"nodes"`
	Edges    int `json:"edges"`
	Findings int `json:"findings"`
}

type NodeSample struct {
	ID             string `json:"id"`
	Kind           string `json:"kind"`
	Label          string `json:"label,omitempty"`
	EvidenceState  string `json:"evidence_state"`
	EvidenceSource string `json:"evidence_source"`
}

type EdgeSample struct {
	From           string `json:"from"`
	To             string `json:"to"`
	Kind           string `json:"kind"`
	EvidenceState  string `json:"evidence_state"`
	EvidenceSource string `json:"evidence_source"`
}

type FindingSample struct {
	ID             string  `json:"id"`
	Kind           string  `json:"kind"`
	Status         string  `json:"status"`
	Severity       string  `json:"severity"`
	EvidenceState  string  `json:"evidence_state"`
	EvidenceSource string  `json:"evidence_source"`
	Confidence     float64 `json:"confidence"`
	Summary        string  `json:"summary"`
}

type findingRecord struct {
	ID             string  `json:"id"`
	Kind           string  `json:"kind"`
	Summary        string  `json:"summary"`
	Severity       string  `json:"severity"`
	EvidenceState  string  `json:"evidence_state"`
	EvidenceSource string  `json:"evidence_source"`
	Confidence     float64 `json:"confidence"`
	Status         string  `json:"status"`
}

func Run(opts Options) (Result, error) {
	if opts.BundlePath == "" {
		return Result{}, errors.New("--bundle is required")
	}
	if opts.OutputPath == "" {
		return Result{}, errors.New("--out is required")
	}
	mode, value, err := criteria(opts)
	if err != nil {
		return Result{}, err
	}
	limit := opts.Limit
	if limit == 0 {
		limit = defaultLimit
	}
	if limit < 1 || limit > maxLimit {
		return Result{}, fmt.Errorf("--limit must be between 1 and %d", maxLimit)
	}
	bundle, err := filepath.Abs(opts.BundlePath)
	if err != nil {
		return Result{}, fmt.Errorf("resolve bundle: %w", err)
	}
	bundle = filepath.Clean(bundle)
	info, err := os.Stat(bundle)
	if err != nil {
		return Result{}, fmt.Errorf("inspect bundle: %w", err)
	}
	if !info.IsDir() {
		return Result{}, fmt.Errorf("--bundle must be a directory")
	}
	out, err := filepath.Abs(opts.OutputPath)
	if err != nil {
		return Result{}, fmt.Errorf("resolve output: %w", err)
	}
	out = filepath.Clean(out)
	if existing, err := os.Lstat(out); err == nil {
		if existing.Mode()&os.ModeSymlink != 0 {
			return Result{}, fmt.Errorf("output path must not be a symlink")
		}
		if existing.IsDir() {
			return Result{}, fmt.Errorf("output path must be a file")
		}
		if !opts.Force {
			return Result{}, fmt.Errorf("output path already exists; use --force to overwrite")
		}
	} else if !os.IsNotExist(err) {
		return Result{}, fmt.Errorf("inspect output path: %w", err)
	}
	if err := os.MkdirAll(filepath.Dir(out), 0o755); err != nil {
		return Result{}, fmt.Errorf("create output parent: %w", err)
	}

	g, err := packet.LoadGraph(filepath.Join(bundle, "graph.json"))
	if err != nil {
		return Result{}, err
	}
	findings, err := readFindings(filepath.Join(bundle, "findings.jsonl"))
	if err != nil {
		return Result{}, err
	}
	slice := buildSlice(bundle, mode, value, limit, g, findings)
	if err := writeSlice(out, slice); err != nil {
		return Result{}, err
	}
	return Result{OutputPath: out}, nil
}

func criteria(opts Options) (string, string, error) {
	selected := 0
	mode := ""
	value := ""
	if opts.RepoID != "" {
		selected++
		mode = "repo"
		value = opts.RepoID
	}
	if opts.EdgeKind != "" {
		selected++
		mode = "edge-kind"
		value = opts.EdgeKind
	}
	if opts.FindingKind != "" {
		selected++
		mode = "finding-kind"
		value = opts.FindingKind
	}
	if selected != 1 {
		return "", "", fmt.Errorf("exactly one of --repo, --edge-kind, or --finding-kind is required")
	}
	return mode, value, nil
}

func buildSlice(bundle string, mode string, value string, limit int, g graph.Graph, findings []findingRecord) Slice {
	nodeByID := map[string]graph.Node{}
	for _, node := range g.Nodes {
		nodeByID[node.ID] = node
	}
	var matchingNodes []graph.Node
	var matchingEdges []graph.Edge
	var matchingFindings []findingRecord

	switch mode {
	case "repo":
		if node, ok := nodeByID[value]; ok {
			matchingNodes = append(matchingNodes, node)
		}
		for _, edge := range g.Edges {
			if edge.From == value || edge.To == value {
				matchingEdges = append(matchingEdges, edge)
				if node, ok := nodeByID[edge.From]; ok {
					matchingNodes = append(matchingNodes, node)
				}
				if node, ok := nodeByID[edge.To]; ok {
					matchingNodes = append(matchingNodes, node)
				}
			}
		}
		for _, finding := range findings {
			if strings.HasPrefix(finding.ID, value+"-") || strings.Contains(finding.EvidenceSource, value) {
				matchingFindings = append(matchingFindings, finding)
			}
		}
	case "edge-kind":
		for _, edge := range g.Edges {
			if edge.Kind == value {
				matchingEdges = append(matchingEdges, edge)
				if node, ok := nodeByID[edge.From]; ok {
					matchingNodes = append(matchingNodes, node)
				}
				if node, ok := nodeByID[edge.To]; ok {
					matchingNodes = append(matchingNodes, node)
				}
			}
		}
	case "finding-kind":
		for _, finding := range findings {
			if finding.Kind == value {
				matchingFindings = append(matchingFindings, finding)
			}
		}
	}

	matchingNodes = uniqueNodes(matchingNodes)
	sortNodes(matchingNodes)
	sortEdges(matchingEdges)
	sortFindings(matchingFindings)

	nodeSamples := sampleNodes(matchingNodes, limit)
	edgeSamples := sampleEdges(matchingEdges, limit)
	findingSamples := sampleFindings(matchingFindings, limit)

	return Slice{
		SchemaVersion: SchemaVersion,
		GeneratedBy:   "portolan",
		GeneratedAt:   time.Now().UTC(),
		BundlePath:    bundle,
		Criteria:      Criteria{Mode: mode, Value: value},
		Limit:         limit,
		Totals: Totals{
			GraphNodes:       len(g.Nodes),
			GraphEdges:       len(g.Edges),
			Findings:         len(findings),
			MatchingNodes:    len(matchingNodes),
			MatchingEdges:    len(matchingEdges),
			MatchingFindings: len(matchingFindings),
		},
		Truncated: Truncated{
			Nodes:    max(0, len(matchingNodes)-len(nodeSamples)),
			Edges:    max(0, len(matchingEdges)-len(edgeSamples)),
			Findings: max(0, len(matchingFindings)-len(findingSamples)),
		},
		Nodes:    nodeSamples,
		Edges:    edgeSamples,
		Findings: findingSamples,
		Rules: []string{
			"This is a bounded slice from a Portolan map bundle, not the full graph.",
			"Use graph.json only when this slice and graph-index.json are insufficient.",
			"Preserve unknown, cannot_verify, and not_assessed evidence states in answers.",
		},
	}
}

func uniqueNodes(nodes []graph.Node) []graph.Node {
	seen := map[string]bool{}
	var unique []graph.Node
	for _, node := range nodes {
		if seen[node.ID] {
			continue
		}
		seen[node.ID] = true
		unique = append(unique, node)
	}
	return unique
}

func sampleNodes(nodes []graph.Node, limit int) []NodeSample {
	if len(nodes) > limit {
		nodes = nodes[:limit]
	}
	samples := make([]NodeSample, 0, len(nodes))
	for _, node := range nodes {
		samples = append(samples, NodeSample{
			ID:             node.ID,
			Kind:           node.Kind,
			Label:          node.Label,
			EvidenceState:  string(node.Evidence.State),
			EvidenceSource: node.Evidence.Source,
		})
	}
	return samples
}

func sampleEdges(edges []graph.Edge, limit int) []EdgeSample {
	if len(edges) > limit {
		edges = edges[:limit]
	}
	samples := make([]EdgeSample, 0, len(edges))
	for _, edge := range edges {
		samples = append(samples, EdgeSample{
			From:           edge.From,
			To:             edge.To,
			Kind:           edge.Kind,
			EvidenceState:  string(edge.Evidence.State),
			EvidenceSource: edge.Evidence.Source,
		})
	}
	return samples
}

func sampleFindings(findings []findingRecord, limit int) []FindingSample {
	if len(findings) > limit {
		findings = findings[:limit]
	}
	samples := make([]FindingSample, 0, len(findings))
	for _, finding := range findings {
		samples = append(samples, FindingSample{
			ID:             finding.ID,
			Kind:           finding.Kind,
			Status:         finding.Status,
			Severity:       finding.Severity,
			EvidenceState:  finding.EvidenceState,
			EvidenceSource: finding.EvidenceSource,
			Confidence:     finding.Confidence,
			Summary:        finding.Summary,
		})
	}
	return samples
}

func sortNodes(nodes []graph.Node) {
	sort.Slice(nodes, func(i, j int) bool {
		if nodes[i].Kind != nodes[j].Kind {
			return nodes[i].Kind < nodes[j].Kind
		}
		return nodes[i].ID < nodes[j].ID
	})
}

func sortEdges(edges []graph.Edge) {
	sort.Slice(edges, func(i, j int) bool {
		if edges[i].Kind != edges[j].Kind {
			return edges[i].Kind < edges[j].Kind
		}
		if edges[i].From != edges[j].From {
			return edges[i].From < edges[j].From
		}
		return edges[i].To < edges[j].To
	})
}

func sortFindings(findings []findingRecord) {
	sort.Slice(findings, func(i, j int) bool {
		if findings[i].Kind != findings[j].Kind {
			return findings[i].Kind < findings[j].Kind
		}
		return findings[i].ID < findings[j].ID
	})
}

func readFindings(path string) ([]findingRecord, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("read findings: %w", err)
	}
	defer file.Close()
	var findings []findingRecord
	reader := bufio.NewReader(file)
	for {
		line, err := reader.ReadString('\n')
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			var finding findingRecord
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

func writeSlice(path string, value Slice) error {
	file, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return fmt.Errorf("write graph slice: %w", err)
	}
	defer file.Close()
	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(value); err != nil {
		return fmt.Errorf("write graph slice: %w", err)
	}
	return nil
}
