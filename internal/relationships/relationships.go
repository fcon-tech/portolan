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
	manifests := manifestFilenames()

	for _, path := range files {
		base := filepath.Base(path)
		switch {
		case base == "go.mod":
			detectGoMod(path, &result, nodeIDs, edgeIDs)
		case strings.HasSuffix(path, ".go"):
			detectGoImports(root, path, &result, nodeIDs, edgeIDs)
		default:
			// Dispatch to multi-language manifest parsers via the registry.
			if format, ok := manifests[base]; ok {
				detectManifest(path, format, root, &result, nodeIDs, edgeIDs)
			}
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

var skipDirs = map[string]bool{
	".portolan":   true,
	"node_modules": true,
	"vendor":       true,
	"target":       true,
	"build":        true,
	"dist":         true,
	".git":         true,
	"__pycache__":  true,
	".gradle":      true,
	".idea":        true,
	".vscode":      true,
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
		// Skip generated/dependency directories.
		if entry.IsDir() {
			base := filepath.Base(path)
			if skipDirs[base] {
				return filepath.SkipDir
			}
			return nil
		}
		base := filepath.Base(path)
		isRelevant := base == "go.mod" ||
			strings.HasSuffix(path, ".go") ||
			isManifestFile(base)
		if isRelevant {
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

// isManifestFile checks if a filename is a recognized manifest in the
// language registry.
func isManifestFile(filename string) bool {
	_, ok := manifestFilenames()[filename]
	return ok
}

// detectManifest dispatches to the appropriate manifest parser based on format.
func detectManifest(path string, format ManifestFormat, root string, result *Result, nodeIDs, edgeIDs map[string]struct{}) {
	switch format {
	case FormatMaven:
		detectMavenPom(path, root, result, nodeIDs, edgeIDs)
	case FormatGradle:
		detectGradle(path, root, result, nodeIDs, edgeIDs)
	case FormatNpm:
		detectNpmPackageJson(path, root, result, nodeIDs, edgeIDs)
	case FormatPython, FormatCargo, FormatSwiftPM, FormatPubspec, FormatGemfile:
		// Registered but not yet implemented. Emit an issue so the reader
		// knows the manifest was seen but not parsed.
		result.Issues = append(result.Issues, Issue{
			Path:   path,
			Reason: fmt.Sprintf("manifest format %q recognized but not yet implemented", format),
		})
	default:
		result.Issues = append(result.Issues, Issue{
			Path:   path,
			Reason: fmt.Sprintf("unknown manifest format %q", format),
		})
	}
}
