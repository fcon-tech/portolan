package scan

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/fall-out-bug/portolan/internal/graph"
	"github.com/fall-out-bug/portolan/internal/selection"
)

type Options struct {
	SelectionPath string
	OutputPath    string
	Force         bool
}

type claimDocument struct {
	Claims []claim `json:"claims"`
}

type claim struct {
	ID        string `json:"id"`
	Subject   string `json:"subject"`
	Predicate string `json:"predicate"`
	Object    string `json:"object"`
	Source    string `json:"source"`
}

func Run(opts Options) (graph.Graph, error) {
	if opts.SelectionPath == "" {
		return graph.Graph{}, errors.New("--selection is required")
	}
	if opts.OutputPath == "" {
		return graph.Graph{}, errors.New("--out is required")
	}

	sel, err := selection.Load(opts.SelectionPath)
	if err != nil {
		return graph.Graph{}, err
	}

	roots, err := selectedRoots(sel.Targets)
	if err != nil {
		return graph.Graph{}, err
	}
	if err := validateOutputPath(opts.OutputPath, roots, opts.Force); err != nil {
		return graph.Graph{}, err
	}

	g := graph.New()
	nodeIDs := map[string]struct{}{}
	for _, target := range sel.Targets {
		nodes := scanTarget(target)
		for _, node := range nodes {
			g.Nodes = append(g.Nodes, node)
			nodeIDs[node.ID] = struct{}{}
		}
	}
	for _, claimSource := range sel.Claims {
		nodes, edges := scanClaimSource(claimSource, nodeIDs)
		for _, node := range nodes {
			g.Nodes = append(g.Nodes, node)
			nodeIDs[node.ID] = struct{}{}
		}
		g.Edges = append(g.Edges, edges...)
	}

	sortGraph(&g)
	return g, nil
}

func Marshal(g graph.Graph) ([]byte, error) {
	data, err := json.MarshalIndent(g, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("encode graph: %w", err)
	}
	return append(data, '\n'), nil
}

func Write(path string, g graph.Graph, force bool) error {
	data, err := Marshal(g)
	if err != nil {
		return err
	}
	parent := filepath.Dir(path)
	temp, err := os.CreateTemp(parent, "."+filepath.Base(path)+".tmp-*")
	if err != nil {
		return fmt.Errorf("create temporary graph: %w", err)
	}
	tempPath := temp.Name()
	defer os.Remove(tempPath)

	if _, err := temp.Write(data); err != nil {
		temp.Close()
		return fmt.Errorf("write graph: %w", err)
	}
	if err := temp.Close(); err != nil {
		return fmt.Errorf("write graph: %w", err)
	}

	if !force {
		if _, err := os.Lstat(path); err == nil {
			return fmt.Errorf("output path already exists; use --force to overwrite")
		} else if !os.IsNotExist(err) {
			return fmt.Errorf("inspect output path: %w", err)
		}
	}
	if info, err := os.Lstat(path); err == nil && info.IsDir() {
		return fmt.Errorf("output path must not be a directory")
	} else if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("inspect output path: %w", err)
	}
	if err := os.Rename(tempPath, path); err != nil {
		return fmt.Errorf("replace graph: %w", err)
	}
	return nil
}

func selectedRoots(targets []selection.Target) ([]string, error) {
	var roots []string
	for _, target := range targets {
		abs, err := filepath.Abs(target.Path)
		if err != nil {
			return nil, fmt.Errorf("resolve target %q: %w", target.ID, err)
		}
		resolved, err := filepath.EvalSymlinks(abs)
		if err == nil {
			roots = append(roots, resolved)
			continue
		}
		if os.IsNotExist(err) {
			roots = append(roots, filepath.Clean(abs))
			continue
		}
		return nil, fmt.Errorf("resolve target %q: %w", target.ID, err)
	}
	return roots, nil
}

func validateOutputPath(path string, selectedRoots []string, force bool) error {
	abs, err := filepath.Abs(path)
	if err != nil {
		return fmt.Errorf("resolve output path: %w", err)
	}
	parent := filepath.Dir(abs)
	info, err := os.Stat(parent)
	if err != nil {
		return fmt.Errorf("output parent must exist: %w", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("output parent is not a directory")
	}
	canonicalParent, err := filepath.EvalSymlinks(parent)
	if err != nil {
		return fmt.Errorf("resolve output parent: %w", err)
	}
	canonicalOutput := filepath.Join(canonicalParent, filepath.Base(abs))
	for _, root := range selectedRoots {
		if isWithin(canonicalOutput, root) {
			return fmt.Errorf("output path must not be inside selected repository %q", root)
		}
	}
	if info, err := os.Lstat(abs); err == nil {
		if info.Mode()&os.ModeSymlink != 0 {
			return fmt.Errorf("output path must not be a symlink")
		}
		if info.IsDir() {
			return fmt.Errorf("output path must not be a directory")
		}
		if !force {
			return fmt.Errorf("output path already exists; use --force to overwrite")
		}
		return nil
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("inspect output path: %w", err)
	}
	return nil
}

func scanTarget(target selection.Target) []graph.Node {
	source := target.Path
	abs, err := filepath.Abs(target.Path)
	if err != nil {
		return []graph.Node{targetNode(target, graph.CannotVerify, source, err.Error())}
	}
	lstat, err := os.Lstat(abs)
	if err != nil {
		if os.IsNotExist(err) {
			return []graph.Node{targetNode(target, graph.Unknown, source, "path does not exist")}
		}
		return []graph.Node{targetNode(target, graph.CannotVerify, source, err.Error())}
	}
	if lstat.Mode()&os.ModeSymlink != 0 {
		return []graph.Node{targetNode(target, graph.CannotVerify, source, "selected root is a symlink")}
	}
	info, err := os.Stat(abs)
	if err != nil {
		return []graph.Node{targetNode(target, graph.CannotVerify, source, err.Error())}
	}
	if !info.IsDir() {
		return []graph.Node{targetNode(target, graph.CannotVerify, source, "path is not a directory")}
	}
	entries, err := os.ReadDir(abs)
	if err != nil {
		return []graph.Node{targetNode(target, graph.CannotVerify, source, "directory is not readable")}
	}
	if !hasVisibleSourceEntry(abs, entries) {
		return []graph.Node{targetNode(target, graph.CannotVerify, source, "directory has no visible source entries")}
	}

	nodes := []graph.Node{targetNode(target, graph.SourceVisible, source, "")}
	nodes = append(nodes, outsideSymlinkNodes(target, abs)...)
	return nodes
}

func hasVisibleSourceEntry(root string, entries []os.DirEntry) bool {
	for _, entry := range entries {
		if entry.Type()&os.ModeSymlink == 0 {
			return true
		}
		resolved, err := filepath.EvalSymlinks(filepath.Join(root, entry.Name()))
		if err == nil && isWithin(resolved, root) {
			return true
		}
	}
	return false
}

func targetNode(target selection.Target, state graph.EvidenceState, source, reason string) graph.Node {
	kind := target.Kind
	if kind == "" {
		kind = "unknown"
	}
	return graph.Node{
		ID:    target.ID,
		Kind:  kind,
		Label: labelForTarget(target),
		Evidence: graph.Evidence{
			State:  state,
			Source: source,
			Reason: reason,
		},
	}
}

func labelForTarget(target selection.Target) string {
	if base := filepath.Base(target.Path); base != "." && base != string(filepath.Separator) {
		return base
	}
	return target.ID
}

func outsideSymlinkNodes(target selection.Target, root string) []graph.Node {
	resolvedRoot, err := filepath.EvalSymlinks(root)
	if err != nil {
		return nil
	}
	var nodes []graph.Node
	_ = filepath.WalkDir(root, func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil || path == root {
			return nil
		}
		if entry.Type()&os.ModeSymlink == 0 {
			return nil
		}
		resolved, err := filepath.EvalSymlinks(path)
		if err != nil || !isWithin(resolved, resolvedRoot) {
			rel, relErr := filepath.Rel(root, path)
			if relErr != nil {
				rel = filepath.Base(path)
			}
			nodes = append(nodes, graph.Node{
				ID:    target.ID + ":symlink:" + filepath.ToSlash(rel),
				Kind:  "unknown",
				Label: filepath.ToSlash(rel),
				Evidence: graph.Evidence{
					State:  graph.CannotVerify,
					Source: path,
					Reason: "symlink resolves outside selected root",
				},
			})
		}
		return nil
	})
	return nodes
}

func scanClaimSource(source selection.ClaimSource, existingNodeIDs map[string]struct{}) ([]graph.Node, []graph.Edge) {
	if info, err := os.Lstat(source.Path); err == nil && info.Mode()&os.ModeSymlink != 0 {
		return []graph.Node{claimSourceNode(source, graph.CannotVerify, "claim path is a symlink")}, nil
	} else if err != nil && !os.IsNotExist(err) {
		return []graph.Node{claimSourceNode(source, graph.CannotVerify, err.Error())}, nil
	}

	data, err := os.ReadFile(source.Path)
	if err != nil {
		state := graph.Unknown
		reason := "path does not exist"
		if !os.IsNotExist(err) {
			state = graph.CannotVerify
			reason = err.Error()
		}
		return []graph.Node{claimSourceNode(source, state, reason)}, nil
	}

	var doc claimDocument
	if err := json.Unmarshal(data, &doc); err != nil {
		return []graph.Node{claimSourceNode(source, graph.CannotVerify, "malformed claim JSON")}, nil
	}

	nodesByID := map[string]graph.Node{
		source.ID: claimSourceNode(source, graph.ClaimOnly, ""),
	}
	var edges []graph.Edge
	for _, claim := range doc.Claims {
		if claim.Subject == "" || claim.Object == "" {
			continue
		}
		sourceLabel := claim.Source
		if sourceLabel == "" {
			sourceLabel = source.Path
		}
		addClaimNode(nodesByID, existingNodeIDs, claim.Subject, sourceLabel)
		addClaimNode(nodesByID, existingNodeIDs, claim.Object, sourceLabel)
		edges = append(edges, graph.Edge{
			From: claim.Subject,
			To:   claim.Object,
			Kind: normalizeEdgeKind(claim.Predicate),
			Evidence: graph.Evidence{
				State:  graph.ClaimOnly,
				Source: sourceLabel,
			},
		})
	}

	nodes := make([]graph.Node, 0, len(nodesByID))
	for _, node := range nodesByID {
		nodes = append(nodes, node)
	}
	return nodes, edges
}

func addClaimNode(nodesByID map[string]graph.Node, existingNodeIDs map[string]struct{}, id, source string) {
	if _, exists := existingNodeIDs[id]; exists {
		return
	}
	if _, exists := nodesByID[id]; exists {
		return
	}
	nodesByID[id] = claimNode(id, source)
}

func claimSourceNode(source selection.ClaimSource, state graph.EvidenceState, reason string) graph.Node {
	return graph.Node{
		ID:    source.ID,
		Kind:  "claim",
		Label: source.ID,
		Evidence: graph.Evidence{
			State:  state,
			Source: source.Path,
			Reason: reason,
		},
	}
}

func claimNode(id, source string) graph.Node {
	return graph.Node{
		ID:    id,
		Kind:  "unknown",
		Label: id,
		Evidence: graph.Evidence{
			State:  graph.ClaimOnly,
			Source: source,
		},
	}
}

func normalizeEdgeKind(kind string) string {
	switch kind {
	case "owns", "depends-on", "exposes", "imports", "observes", "claims":
		return kind
	default:
		return "unknown"
	}
}

func isWithin(path, root string) bool {
	cleanPath := filepath.Clean(path)
	cleanRoot := filepath.Clean(root)
	if cleanPath == cleanRoot {
		return true
	}
	rel, err := filepath.Rel(cleanRoot, cleanPath)
	return err == nil && rel != "." && !strings.HasPrefix(rel, ".."+string(filepath.Separator)) && rel != ".."
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
		if g.Edges[i].Kind != g.Edges[j].Kind {
			return g.Edges[i].Kind < g.Edges[j].Kind
		}
		if g.Edges[i].Evidence.Source != g.Edges[j].Evidence.Source {
			return g.Edges[i].Evidence.Source < g.Edges[j].Evidence.Source
		}
		return g.Edges[i].Evidence.Reason < g.Edges[j].Evidence.Reason
	})
}
