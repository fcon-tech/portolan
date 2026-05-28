package importer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/fall-out-bug/portolan/internal/graph"
)

type graphifyGraph struct {
	Nodes []graphifyNode `json:"nodes"`
	Links []graphifyLink `json:"links"`
	Edges []graphifyLink `json:"edges"`
}

type graphifyNode struct {
	ID              string `json:"id"`
	Label           string `json:"label"`
	FileType        string `json:"file_type"`
	Type            string `json:"type"`
	SourceFile      string `json:"source_file"`
	SourceLocation  string `json:"source_location"`
	Confidence      string `json:"confidence"`
	ConfidenceScore string `json:"confidence_score"`
	Community       string `json:"community"`
}

type graphifyLink struct {
	Source          string  `json:"source"`
	Target          string  `json:"target"`
	Relation        string  `json:"relation"`
	Confidence      string  `json:"confidence"`
	ConfidenceScore string  `json:"confidence_score"`
	SourceFile      string  `json:"source_file"`
	SourceLocation  string  `json:"source_location"`
	Weight          float64 `json:"weight"`
}

func RunGraphify(opts Options) (graph.Graph, error) {
	if opts.InputPath == "" {
		return graph.Graph{}, fmt.Errorf("--in is required")
	}
	if opts.OutputPath == "" {
		return graph.Graph{}, fmt.Errorf("--out is required")
	}
	if err := validateOutputPath(opts.OutputPath, opts.Force); err != nil {
		return graph.Graph{}, err
	}

	data, err := os.ReadFile(opts.InputPath)
	if err != nil {
		g := graph.New()
		g.Nodes = append(g.Nodes, graphifySourceNode(opts.InputPath, graph.CannotVerify, fmt.Sprintf("read Graphify JSON: %v", err)))
		return g, nil
	}

	var raw graphifyGraph
	decoder := json.NewDecoder(bytes.NewReader(data))
	if err := decoder.Decode(&raw); err != nil {
		g := graph.New()
		g.Nodes = append(g.Nodes, graphifySourceNode(opts.InputPath, graph.CannotVerify, "malformed Graphify JSON: "+err.Error()))
		return g, nil
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		g := graph.New()
		g.Nodes = append(g.Nodes, graphifySourceNode(opts.InputPath, graph.CannotVerify, "malformed Graphify JSON: trailing JSON content"))
		return g, nil
	}
	links := raw.Links
	if len(links) == 0 {
		links = raw.Edges
	}
	if len(raw.Nodes) == 0 && len(links) == 0 {
		g := graph.New()
		g.Nodes = append(g.Nodes, graphifySourceNode(opts.InputPath, graph.CannotVerify, "Graphify JSON contains no nodes or links"))
		return g, nil
	}

	g := graph.New()
	sourceRoot := graphifySourceRoot(opts)
	knownNodes := map[string]struct{}{}
	for _, node := range raw.Nodes {
		id := strings.TrimSpace(node.ID)
		if id == "" {
			continue
		}
		knownNodes[id] = struct{}{}
		state, reason := graphifyEvidence(sourceRoot, node.SourceFile, node.Confidence, node.ConfidenceScore)
		g.Nodes = append(g.Nodes, graph.Node{
			ID:    "graphify:" + id,
			Kind:  graphifyNodeKind(node),
			Label: graphifyNodeLabel(node),
			Evidence: graph.Evidence{
				State:  state,
				Source: graphifyEvidenceSource(opts.InputPath, node.SourceFile, node.SourceLocation),
				Reason: appendReason(reason, graphifyNodeMetadataReason(node)),
			},
		})
	}

	for _, link := range links {
		source := strings.TrimSpace(link.Source)
		target := strings.TrimSpace(link.Target)
		if source == "" || target == "" {
			continue
		}
		state, reason := graphifyEvidence(sourceRoot, link.SourceFile, link.Confidence, link.ConfidenceScore)
		if _, ok := knownNodes[source]; !ok {
			g.Nodes = append(g.Nodes, graphifyMissingNode(source, opts.InputPath, "link source was not present in Graphify nodes"))
			knownNodes[source] = struct{}{}
			state = graph.CannotVerify
			reason = appendReason(reason, "link source was not present in Graphify nodes")
		}
		if _, ok := knownNodes[target]; !ok {
			g.Nodes = append(g.Nodes, graphifyMissingNode(target, opts.InputPath, "link target was not present in Graphify nodes"))
			knownNodes[target] = struct{}{}
			state = graph.CannotVerify
			reason = appendReason(reason, "link target was not present in Graphify nodes")
		}
		g.Edges = append(g.Edges, graph.Edge{
			From: "graphify:" + source,
			To:   "graphify:" + target,
			Kind: graphifyRelation(link.Relation),
			Evidence: graph.Evidence{
				State:  state,
				Source: graphifyEvidenceSource(opts.InputPath, link.SourceFile, link.SourceLocation),
				Reason: appendReason(reason, graphifyLinkMetadataReason(link)),
			},
		})
	}

	sortGraph(&g)
	return g, nil
}

func graphifySourceNode(path string, state graph.EvidenceState, reason string) graph.Node {
	return graph.Node{
		ID:    "graphify:source",
		Kind:  "unknown",
		Label: "graphify graph.json",
		Evidence: graph.Evidence{
			State:  state,
			Source: path,
			Reason: reason,
		},
	}
}

func graphifyMissingNode(id string, source string, reason string) graph.Node {
	return graph.Node{
		ID:    "graphify:" + id,
		Kind:  "unknown",
		Label: id,
		Evidence: graph.Evidence{
			State:  graph.CannotVerify,
			Source: source,
			Reason: reason,
		},
	}
}

func graphifyNodeKind(node graphifyNode) string {
	for _, value := range []string{node.FileType, node.Type} {
		value = strings.TrimSpace(strings.ToLower(value))
		switch value {
		case "repository", "service", "package", "runtime", "team", "claim", "duplication", "configuration":
			return value
		}
	}
	return "unknown"
}

func graphifyNodeLabel(node graphifyNode) string {
	label := strings.TrimSpace(node.Label)
	if label != "" {
		return label
	}
	return strings.TrimSpace(node.ID)
}

func graphifyRelation(relation string) string {
	switch strings.TrimSpace(strings.ToLower(relation)) {
	case "owns", "depends-on", "exposes", "imports", "observes", "claims":
		return strings.TrimSpace(strings.ToLower(relation))
	case "contains":
		return "owns"
	case "calls", "references", "uses":
		return "depends-on"
	default:
		return "unknown"
	}
}

func graphifyEvidence(sourceRoot string, sourceFile string, confidence string, confidenceScore string) (graph.EvidenceState, string) {
	state := graphifyEvidenceState(confidence)
	reason := graphifyEvidenceReason(confidence, confidenceScore)
	if state != graph.MetadataVisible {
		return state, reason
	}
	if sourceRoot == "" || strings.TrimSpace(sourceFile) == "" {
		return state, reason
	}
	if ok, resolved := graphifySourceVisible(sourceRoot, sourceFile); ok {
		return graph.SourceVisible, appendReason(reason, "Portolan inspected local source path "+resolved)
	}
	return graph.CannotVerify, appendReason(reason, "source_file was not readable inside --root")
}

func graphifyEvidenceState(confidence string) graph.EvidenceState {
	switch strings.ToUpper(strings.TrimSpace(confidence)) {
	case "EXTRACTED":
		return graph.MetadataVisible
	case "INFERRED":
		return graph.ClaimOnly
	case "AMBIGUOUS":
		return graph.CannotVerify
	default:
		return graph.CannotVerify
	}
}

func graphifyEvidenceReason(confidence string, confidenceScore string) string {
	score := ""
	if confidenceScore = strings.TrimSpace(confidenceScore); confidenceScore != "" {
		score = " confidence_score " + confidenceScore
	}
	switch strings.ToUpper(strings.TrimSpace(confidence)) {
	case "EXTRACTED":
		return "Graphify extracted this fact" + score
	case "INFERRED":
		return "Graphify inferred this fact; keep as claim-only" + score
	case "AMBIGUOUS":
		return "Graphify marked this fact ambiguous" + score
	default:
		return "Graphify confidence is missing or unsupported" + score
	}
}

func graphifyEvidenceSource(inputPath string, sourceFile string, sourceLocation string) string {
	var parts []string
	if sourceFile = strings.TrimSpace(sourceFile); sourceFile != "" {
		parts = append(parts, sourceFile)
	}
	if sourceLocation = strings.TrimSpace(sourceLocation); sourceLocation != "" {
		parts = append(parts, sourceLocation)
	}
	if len(parts) == 0 {
		return inputPath
	}
	return strings.Join(parts, ":")
}

func appendReason(left string, right string) string {
	left = strings.TrimSpace(left)
	right = strings.TrimSpace(right)
	if left == "" {
		return right
	}
	if right == "" {
		return left
	}
	return left + "; " + right
}

func graphifySourceRoot(opts Options) string {
	root := strings.TrimSpace(opts.RootPath)
	if root == "" {
		return ""
	}
	abs, err := filepath.Abs(root)
	if err != nil {
		return ""
	}
	return abs
}

func graphifySourceVisible(root string, sourceFile string) (bool, string) {
	sourceFile = strings.TrimSpace(sourceFile)
	if sourceFile == "" || filepath.IsAbs(sourceFile) {
		return false, ""
	}
	candidate := filepath.Clean(filepath.Join(root, sourceFile))
	rel, err := filepath.Rel(root, candidate)
	if err != nil || rel == "." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) || rel == ".." {
		return false, candidate
	}
	info, err := os.Stat(candidate)
	if err != nil || info.IsDir() {
		return false, candidate
	}
	data, err := os.ReadFile(candidate)
	if err != nil || len(data) == 0 {
		return false, candidate
	}
	return true, candidate
}

func graphifyNodeMetadataReason(node graphifyNode) string {
	var parts []string
	if node.Community != "" {
		parts = append(parts, "community "+strings.TrimSpace(node.Community))
	}
	return strings.Join(parts, "; ")
}

func graphifyLinkMetadataReason(link graphifyLink) string {
	if link.Weight == 0 {
		return ""
	}
	return fmt.Sprintf("weight %.4g", link.Weight)
}
