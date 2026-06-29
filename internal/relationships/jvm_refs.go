package relationships

import (
	"bufio"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/fcon-tech/portolan/internal/graph"
)

// ---------------------------------------------------------------------------
// JVM source reference detection (spec 2: jvm-source-references)
// ---------------------------------------------------------------------------

// jvmFileExtensions are the JVM source file extensions we scan.
var jvmFileExtensions = []string{".java", ".kt", ".scala"}

// jvmSourceNodePrefix is the synthetic module node prefix for JVM source
// reference edges. The maprun bridge recognizes this as a manifest source
// node and remaps it to target.ID.
const jvmSourceNodePrefix = "jvm-refs:"

var (
	// packageDecl matches: package org.apache.spark.sql;
	packageDecl = regexp.MustCompile(`^\s*package\s+([\w.]+)`)
	// importDecl matches: import org.apache.spark.sql.Dataset;
	// Also matches Scala _ wildcard imports and selective imports.
	importDecl = regexp.MustCompile(`^\s*import\s+(?:static\s+)?([\w.*_]+)`)
	// classDecl matches declarations with zero or more leading modifiers.
	// Supports Java/Kotlin/Scala modifier keywords including multi-modifier
	// declarations like "public final class Foo".
	classDecl = regexp.MustCompile(`^\s*(?:(?:public|private|protected|abstract|final|static|sealed|open|data|value|inline|non-sealed)\s+)*(?:(?:enum|data|value|sealed)\s+)?(?:class|interface|enum|object|trait|record)\s+(\w+)`)
)

// CountJVMSourceFiles counts .java/.kt/.scala files in a root directory
// without opening them. Used to bound JVM reference detection on large
// codebases.
func CountJVMSourceFiles(root string) int {
	files := findJVMSourceFiles(root)
	return len(files)
}

// DetectJVMReferences scans JVM source files (.java, .kt, .scala) for import
// statements and resolves them against a fully-qualified-name (FQN) index
// built from package + class declarations.
//
// Two-pass algorithm:
//  1. Build pass: scan all JVM files, extract package + class declarations,
//     build FQN → file-path index.
//  2. Resolve pass: scan all JVM files, extract imports, resolve each
//     against the FQN index.
//
// Resolved imports produce `references` edges. Unresolved imports produce
// external nodes + edges. Star imports (* wildcards) that span multiple
// files are marked `not_assessed`.
func DetectJVMReferences(root string) Result {
	jvmFiles := findJVMSourceFiles(root)
	if len(jvmFiles) == 0 {
		return Result{}
	}

	// --- Pass 1: build FQN index ---
	// fqnIndex: "org.apache.spark.sql.Dataset" → file path
	fqnIndex := make(map[string]string)
	// packageFiles: "org.apache.spark.sql" → []file paths (for star imports)
	packageFiles := make(map[string][]string)

	for _, path := range jvmFiles {
		pkg, classes := parseJVMDeclarations(path)
		if pkg == "" {
			continue
		}
		packageFiles[pkg] = append(packageFiles[pkg], path)
		for _, class := range classes {
			fqn := pkg + "." + class
			if _, exists := fqnIndex[fqn]; !exists {
				fqnIndex[fqn] = path
			}
		}
	}

	// --- Pass 2: resolve imports ---
	result := Result{}
	nodeIDs := map[string]struct{}{}
	edgeIDs := map[string]struct{}{}
	moduleID := jvmSourceNodePrefix + root
	addPackageNode(&result, nodeIDs, moduleID, filepath.Base(root), graph.MetadataVisible, root)

	for _, path := range jvmFiles {
		imports := parseJVMImports(path)
		for _, imp := range imports {
			// Handle Scala selective imports: import x.y.{ A, B }
			// (already partially handled by regex — the brace content is
			// captured if no space; but if there's a brace, we need special
			// handling). Skip selective imports for now (honest gap).
			if strings.Contains(imp, "{") {
				continue
			}

			// Check for star/wildcard import (Java * or Scala _).
			isStar := strings.HasSuffix(imp, ".*") || strings.HasSuffix(imp, "._")
			if isStar {
				pkg := ""
				if strings.HasSuffix(imp, ".*") {
					pkg = strings.TrimSuffix(imp, ".*")
				} else {
					pkg = strings.TrimSuffix(imp, "._")
				}
				files, found := packageFiles[pkg]
				if !found || len(files) == 0 {
					extID := "jvm:" + pkg
					addPackageNode(&result, nodeIDs, extID, pkg, graph.MetadataVisible, path)
					addEdge(&result, edgeIDs, moduleID, extID, "references", graph.MetadataVisible, path)
				} else {
					extID := "jvm:" + pkg + ".*"
					addPackageNode(&result, nodeIDs, extID, pkg+".* (star import — ambiguous)", graph.MetadataVisible, path)
					addEdge(&result, edgeIDs, moduleID, extID, "references", "not_assessed", path)
				}
				continue
			}

			// Exact FQN lookup.
			defPath, found := fqnIndex[imp]
			if found {
				depID := "jvm:" + imp
				addPackageNode(&result, nodeIDs, depID, imp, graph.MetadataVisible, defPath)
				addEdge(&result, edgeIDs, moduleID, depID, "references", graph.MetadataVisible, path)
			} else {
				// Try stripping the last segment (static import of a member:
				// import static org.example.Util.square → resolve to
				// org.example.Util).
				lastDot := strings.LastIndex(imp, ".")
				if lastDot > 0 {
					parent := imp[:lastDot]
					if defPath2, found2 := fqnIndex[parent]; found2 {
						depID := "jvm:" + parent
						addPackageNode(&result, nodeIDs, depID, parent, graph.MetadataVisible, defPath2)
						addEdge(&result, edgeIDs, moduleID, depID, "references", graph.MetadataVisible, path)
						continue
					}
				}
				// Not in perimeter — external reference.
				extID := "jvm:" + imp
				addPackageNode(&result, nodeIDs, extID, imp, graph.MetadataVisible, path)
				addEdge(&result, edgeIDs, moduleID, extID, "references", graph.MetadataVisible, path)
			}
		}
	}

	return result
}

// findJVMSourceFiles walks the root and returns all .java/.kt/.scala files.
func findJVMSourceFiles(root string) []string {
	var files []string
	_ = filepath.WalkDir(root, func(path string, entry os.DirEntry, err error) error {
		if err != nil || entry.IsDir() {
			if entry != nil && entry.IsDir() {
				base := filepath.Base(path)
				if skipDirs[base] {
					return filepath.SkipDir
				}
			}
			return nil
		}
		ext := strings.ToLower(filepath.Ext(path))
		for _, jvmExt := range jvmFileExtensions {
			if ext == jvmExt {
				files = append(files, path)
				return nil
			}
		}
		return nil
	})
	return files
}

// parseJVMDeclarations extracts the package and top-level class/interface
// names from a JVM source file. Only top-level declarations are collected
// (inner classes are skipped by stopping at the first opening brace).
func parseJVMDeclarations(path string) (package_ string, classes []string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	braceDepth := 0
	for scanner.Scan() {
		line := scanner.Text()
		// Skip comments.
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "//") || strings.HasPrefix(trimmed, "/*") || strings.HasPrefix(trimmed, "*") {
			continue
		}
		if package_ == "" {
			if m := packageDecl.FindStringSubmatch(line); m != nil {
				package_ = strings.TrimSuffix(m[1], ";")
			}
		}
		// Only collect class declarations at brace depth 0 (top-level).
		if braceDepth == 0 {
			if m := classDecl.FindStringSubmatch(line); m != nil {
				classes = append(classes, m[1])
			}
		}
		// Track brace depth (simplified — counts all braces on the line).
		braceDepth += strings.Count(line, "{") - strings.Count(line, "}")
		if braceDepth < 0 {
			braceDepth = 0
		}
	}
	return
}

// parseJVMImports extracts import statements from a JVM source file.
func parseJVMImports(path string) []string {
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer f.Close()

	var imports []string
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for scanner.Scan() {
		line := scanner.Text()
		// Skip comments.
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "//") || strings.HasPrefix(trimmed, "/*") || strings.HasPrefix(trimmed, "*") {
			continue
		}
		if m := importDecl.FindStringSubmatch(line); m != nil {
			imp := strings.TrimSuffix(m[1], ";")
			if imp != "" {
				imports = append(imports, imp)
			}
		}
	}
	return imports
}
