package diff

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"reflect"
	"sort"

	"github.com/fcon-tech/portolan/internal/graph"
)

type Options struct {
	BasePath string
	HeadPath string
}

type Result struct {
	SchemaVersion string      `json:"schema_version"`
	GeneratedBy   string      `json:"generated_by"`
	Base          string      `json:"base"`
	Head          string      `json:"head"`
	Nodes         NodeChanges `json:"nodes"`
	Edges         EdgeChanges `json:"edges"`
}

type NodeChanges struct {
	Added     []graph.Node `json:"added"`
	Removed   []graph.Node `json:"removed"`
	Unchanged []graph.Node `json:"unchanged"`
	Changed   []NodeChange `json:"changed"`
}

type EdgeChanges struct {
	Added     []graph.Edge `json:"added"`
	Removed   []graph.Edge `json:"removed"`
	Unchanged []graph.Edge `json:"unchanged"`
	Changed   []EdgeChange `json:"changed"`
}

type NodeChange struct {
	ID                      string     `json:"id"`
	Before                  graph.Node `json:"before"`
	After                   graph.Node `json:"after"`
	EvidenceStateTransition string     `json:"evidence_state_transition,omitempty"`
	EvidenceStateBefore     string     `json:"evidence_state_before,omitempty"`
	EvidenceStateAfter      string     `json:"evidence_state_after,omitempty"`
}

type EdgeChange struct {
	ID                      string     `json:"id"`
	Before                  graph.Edge `json:"before"`
	After                   graph.Edge `json:"after"`
	EvidenceStateTransition string     `json:"evidence_state_transition,omitempty"`
	EvidenceStateBefore     string     `json:"evidence_state_before,omitempty"`
	EvidenceStateAfter      string     `json:"evidence_state_after,omitempty"`
}

func Run(opts Options) (Result, error) {
	if opts.BasePath == "" {
		return Result{}, errors.New("--base is required")
	}
	if opts.HeadPath == "" {
		return Result{}, errors.New("--head is required")
	}
	base, err := readGraph(opts.BasePath)
	if err != nil {
		return Result{}, fmt.Errorf("read base graph: %w", err)
	}
	head, err := readGraph(opts.HeadPath)
	if err != nil {
		return Result{}, fmt.Errorf("read head graph: %w", err)
	}

	result := Result{
		SchemaVersion: graph.SchemaVersion,
		GeneratedBy:   "portolan",
		Base:          opts.BasePath,
		Head:          opts.HeadPath,
		Nodes:         diffNodes(base.Nodes, head.Nodes),
		Edges:         diffEdges(base.Edges, head.Edges),
	}
	return result, nil
}

func Write(path string, result Result, force bool) error {
	if err := validateOutputPath(path, force); err != nil {
		return err
	}
	data, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal diff: %w", err)
	}
	data = append(data, '\n')
	return os.WriteFile(path, data, 0o644)
}

func readGraph(path string) (graph.Graph, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return graph.Graph{}, err
	}
	var g graph.Graph
	decoder := json.NewDecoder(bytes.NewReader(data))
	if err := decoder.Decode(&g); err != nil {
		return graph.Graph{}, fmt.Errorf("parse graph: %w", err)
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		return graph.Graph{}, errors.New("parse graph: trailing JSON content")
	}
	return g, nil
}

func diffNodes(base []graph.Node, head []graph.Node) NodeChanges {
	baseByID := map[string]graph.Node{}
	headByID := map[string]graph.Node{}
	ids := map[string]struct{}{}
	for _, node := range base {
		baseByID[node.ID] = node
		ids[node.ID] = struct{}{}
	}
	for _, node := range head {
		headByID[node.ID] = node
		ids[node.ID] = struct{}{}
	}

	changes := NodeChanges{Added: []graph.Node{}, Removed: []graph.Node{}, Unchanged: []graph.Node{}, Changed: []NodeChange{}}
	for _, id := range sortedKeys(ids) {
		before, inBase := baseByID[id]
		after, inHead := headByID[id]
		switch {
		case !inBase:
			changes.Added = append(changes.Added, after)
		case !inHead:
			changes.Removed = append(changes.Removed, before)
		case reflect.DeepEqual(before, after):
			changes.Unchanged = append(changes.Unchanged, before)
		default:
			changes.Changed = append(changes.Changed, NodeChange{
				ID:                      id,
				Before:                  before,
				After:                   after,
				EvidenceStateTransition: transition(before.Evidence.State, after.Evidence.State),
				EvidenceStateBefore:     string(before.Evidence.State),
				EvidenceStateAfter:      string(after.Evidence.State),
			})
		}
	}
	return changes
}

func diffEdges(base []graph.Edge, head []graph.Edge) EdgeChanges {
	baseByID := map[string]graph.Edge{}
	headByID := map[string]graph.Edge{}
	ids := map[string]struct{}{}
	for _, edge := range base {
		id := edgeID(edge)
		baseByID[id] = edge
		ids[id] = struct{}{}
	}
	for _, edge := range head {
		id := edgeID(edge)
		headByID[id] = edge
		ids[id] = struct{}{}
	}

	changes := EdgeChanges{Added: []graph.Edge{}, Removed: []graph.Edge{}, Unchanged: []graph.Edge{}, Changed: []EdgeChange{}}
	for _, id := range sortedKeys(ids) {
		before, inBase := baseByID[id]
		after, inHead := headByID[id]
		switch {
		case !inBase:
			changes.Added = append(changes.Added, after)
		case !inHead:
			changes.Removed = append(changes.Removed, before)
		case reflect.DeepEqual(before, after):
			changes.Unchanged = append(changes.Unchanged, before)
		default:
			changes.Changed = append(changes.Changed, EdgeChange{
				ID:                      id,
				Before:                  before,
				After:                   after,
				EvidenceStateTransition: transition(before.Evidence.State, after.Evidence.State),
				EvidenceStateBefore:     string(before.Evidence.State),
				EvidenceStateAfter:      string(after.Evidence.State),
			})
		}
	}
	return changes
}

func edgeID(edge graph.Edge) string {
	return edge.From + "\x00" + edge.Kind + "\x00" + edge.To
}

func transition(before graph.EvidenceState, after graph.EvidenceState) string {
	if before == after {
		return ""
	}
	return string(before) + " -> " + string(after)
}

func sortedKeys(values map[string]struct{}) []string {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}

func validateOutputPath(path string, force bool) error {
	if path == "" {
		return errors.New("--out is required")
	}
	parent := filepath.Dir(path)
	info, err := os.Stat(parent)
	if err != nil {
		return fmt.Errorf("output parent must exist: %w", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("output parent is not a directory")
	}
	if info, err := os.Lstat(path); err == nil {
		if info.Mode()&os.ModeSymlink != 0 {
			return errors.New("output path must not be a symlink")
		}
		if info.IsDir() {
			return errors.New("output path must not be a directory")
		}
		if !force {
			return errors.New("output path already exists; use --force to overwrite")
		}
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("inspect output path: %w", err)
	}
	return nil
}
