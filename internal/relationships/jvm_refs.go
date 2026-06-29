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
	importDecl = regexp.MustCompile(`^\s*import\s+(?:static\s+)?([\w.*]+)`)
	// classDecl matches: public class Dataset / abstract interface Relatable
	classDecl = regexp.MustCompile(`^\s*(?:public|private|protected|abstract|final|static)?\s*(?:class|interface|enum|object|trait|case class|case object|record)\s+(\w+)`)
)

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
			// Check for star import (wildcard).
			if strings.HasSuffix(imp, ".*") {
				pkg := strings.TrimSuffix(imp, ".*")
				files, found := packageFiles[pkg]
				if !found || len(files) == 0 {
					// Package not in perimeter — external.
					extID := "jvm:" + pkg
					addPackageNode(&result, nodeIDs, extID, pkg, graph.MetadataVisible, path)
					addEdge(&result, edgeIDs, moduleID, extID, "references", graph.MetadataVisible, path)
				} else {
					// Star import spans files — ambiguous target.
					// Record as not_assessed edge.
					extID := "jvm:" + pkg + ".*"
					addPackageNode(&result, nodeIDs, extID, pkg+".* (star import — ambiguous)", graph.Unknown, path)
					addEdge(&result, edgeIDs, moduleID, extID, "references", graph.Unknown, path)
				}
				continue
			}

			// Exact FQN lookup.
			defPath, found := fqnIndex[imp]
			if found {
				// Resolved to an in-perimeter file — internal reference.
				depID := "jvm:" + imp
				addPackageNode(&result, nodeIDs, depID, imp, graph.MetadataVisible, defPath)
				addEdge(&result, edgeIDs, moduleID, depID, "references", graph.MetadataVisible, path)
			} else {
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
// names from a JVM source file.
func parseJVMDeclarations(path string) (package_ string, classes []string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for scanner.Scan() {
		line := scanner.Text()
		if package_ == "" {
			if m := packageDecl.FindStringSubmatch(line); m != nil {
				package_ = strings.TrimSuffix(m[1], ";")
			}
		}
		if m := classDecl.FindStringSubmatch(line); m != nil {
			classes = append(classes, m[1])
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
		if m := importDecl.FindStringSubmatch(line); m != nil {
			imp := strings.TrimSuffix(m[1], ";")
			if imp != "" {
				imports = append(imports, imp)
			}
		}
	}
	return imports
}
