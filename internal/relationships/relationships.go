package relationships

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"golang.org/x/mod/modfile"

	"github.com/fcon-tech/portolan/internal/graph"
)

type Result struct {
	Nodes                []graph.Node
	Edges                []graph.Edge
	Issues               []Issue
	SourceImportCount    int
	ManifestRequireCount int
}

type Issue struct {
	Path   string
	Reason string
}

func Detect(root string) Result {
	files, issues := relationshipFiles(root)
	result := Result{Issues: issues}
	nodeIDs := map[string]struct{}{}
	edgeIDs := map[string]struct{}{}

	for _, path := range files {
		switch {
		case filepath.Base(path) == "go.mod":
			detectGoMod(path, &result, nodeIDs, edgeIDs)
		case strings.HasSuffix(path, ".go"):
			detectGoImports(root, path, &result, nodeIDs, edgeIDs)
		}
	}

	sort.Slice(result.Nodes, func(i, j int) bool {
		return result.Nodes[i].ID < result.Nodes[j].ID
	})
	sort.Slice(result.Edges, func(i, j int) bool {
		if result.Edges[i].From != result.Edges[j].From {
			return result.Edges[i].From < result.Edges[j].From
		}
		if result.Edges[i].To != result.Edges[j].To {
			return result.Edges[i].To < result.Edges[j].To
		}
		if result.Edges[i].Kind != result.Edges[j].Kind {
			return result.Edges[i].Kind < result.Edges[j].Kind
		}
		return result.Edges[i].Evidence.Source < result.Edges[j].Evidence.Source
	})
	sort.Slice(result.Issues, func(i, j int) bool {
		if result.Issues[i].Path != result.Issues[j].Path {
			return result.Issues[i].Path < result.Issues[j].Path
		}
		return result.Issues[i].Reason < result.Issues[j].Reason
	})
	return result
}

func relationshipFiles(root string) ([]string, []Issue) {
	var files []string
	var issues []Issue
	_ = filepath.WalkDir(root, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			issues = append(issues, Issue{Path: path, Reason: err.Error()})
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
		if hasPortolanPath(rel) {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if entry.IsDir() {
			return nil
		}
		if filepath.Base(path) == "go.mod" || strings.HasSuffix(path, ".go") {
			files = append(files, path)
		}
		return nil
	})
	sort.Slice(files, func(i, j int) bool {
		leftMod := filepath.Base(files[i]) == "go.mod"
		rightMod := filepath.Base(files[j]) == "go.mod"
		if leftMod != rightMod {
			return leftMod
		}
		return files[i] < files[j]
	})
	return files, issues
}

func detectGoImports(root, path string, result *Result, nodeIDs map[string]struct{}, edgeIDs map[string]struct{}) {
	rel, err := filepath.Rel(root, path)
	if err != nil {
		result.Issues = append(result.Issues, Issue{Path: path, Reason: fmt.Sprintf("resolve Go source path: %v", err)})
		return
	}
	rel = filepath.ToSlash(rel)
	file, err := parser.ParseFile(token.NewFileSet(), path, nil, parser.ImportsOnly)
	if err != nil {
		result.Issues = append(result.Issues, Issue{Path: path, Reason: fmt.Sprintf("parse Go imports: %v", err)})
		return
	}
	sourceID := "source:" + rel
	for _, spec := range file.Imports {
		importPath, err := importPath(spec)
		if err != nil {
			result.Issues = append(result.Issues, Issue{Path: path, Reason: err.Error()})
			continue
		}
		packageID := packageNodeID(importPath)
		addPackageNode(result, nodeIDs, packageID, importPath, graph.SourceVisible, path)
		addEdge(result, edgeIDs, sourceID, packageID, "imports", graph.SourceVisible, path)
		result.SourceImportCount++
	}
}

func detectGoMod(path string, result *Result, nodeIDs map[string]struct{}, edgeIDs map[string]struct{}) {
	data, err := os.ReadFile(path)
	if err != nil {
		result.Issues = append(result.Issues, Issue{Path: path, Reason: fmt.Sprintf("read go.mod: %v", err)})
		return
	}
	parsed, err := modfile.Parse(path, data, nil)
	if err != nil {
		result.Issues = append(result.Issues, Issue{Path: path, Reason: fmt.Sprintf("parse go.mod: %v", err)})
		return
	}
	if parsed.Module == nil || parsed.Module.Mod.Path == "" {
		result.Issues = append(result.Issues, Issue{Path: path, Reason: "go.mod has no module path"})
		return
	}
	modulePath := parsed.Module.Mod.Path
	moduleID := packageNodeID(modulePath)
	addPackageNode(result, nodeIDs, moduleID, modulePath, graph.MetadataVisible, path)
	for _, req := range parsed.Require {
		if req == nil || req.Mod.Path == "" {
			continue
		}
		depID := packageNodeID(req.Mod.Path)
		addPackageNode(result, nodeIDs, depID, req.Mod.Path, graph.MetadataVisible, path)
		addEdge(result, edgeIDs, moduleID, depID, "depends-on", graph.MetadataVisible, path)
		result.ManifestRequireCount++
	}
}

func importPath(spec *ast.ImportSpec) (string, error) {
	value, err := strconv.Unquote(spec.Path.Value)
	if err != nil {
		return "", fmt.Errorf("parse import path %q: %w", spec.Path.Value, err)
	}
	if value == "" {
		return "", fmt.Errorf("empty import path")
	}
	return value, nil
}

func addPackageNode(result *Result, nodeIDs map[string]struct{}, id, label string, state graph.EvidenceState, source string) {
	if _, ok := nodeIDs[id]; ok {
		return
	}
	nodeIDs[id] = struct{}{}
	result.Nodes = append(result.Nodes, graph.Node{
		ID:    id,
		Kind:  "package",
		Label: label,
		Evidence: graph.Evidence{
			State:  state,
			Source: source,
		},
	})
}

func addEdge(result *Result, edgeIDs map[string]struct{}, from, to, kind string, state graph.EvidenceState, source string) {
	id := from + "\x00" + to + "\x00" + kind + "\x00" + string(state) + "\x00" + source
	if _, ok := edgeIDs[id]; ok {
		return
	}
	edgeIDs[id] = struct{}{}
	result.Edges = append(result.Edges, graph.Edge{
		From: from,
		To:   to,
		Kind: kind,
		Evidence: graph.Evidence{
			State:  state,
			Source: source,
		},
	})
}

func packageNodeID(importPath string) string {
	return "package:" + importPath
}

func hasPortolanPath(path string) bool {
	for _, part := range strings.Split(filepath.ToSlash(path), "/") {
		if part == ".portolan" {
			return true
		}
	}
	return false
}
