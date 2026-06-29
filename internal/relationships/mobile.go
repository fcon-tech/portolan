package relationships

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/fcon-tech/portolan/internal/graph"
)

// ---------------------------------------------------------------------------
// Mobile framework manifest parsers (spec 3: mobile-framework-detection)
// ---------------------------------------------------------------------------

// Swift Package.swift dependency patterns.
var (
	swiftPackageURL  = regexp.MustCompile(`\.package\(\s*url:\s*"([^"]+)"`)
	swiftPackagePath = regexp.MustCompile(`\.package\(\s*path:\s*"([^"]+)"`)
)

// detectSwiftPackageSwift parses a Package.swift file and emits depends-on
// edges for declared dependencies. Swift Package Manager uses a Swift DSL;
// the parser uses bounded regex extraction.
func detectSwiftPackageSwift(path, root string, result *Result, nodeIDs, edgeIDs map[string]struct{}) {
	data, err := os.ReadFile(path)
	if err != nil {
		result.Issues = append(result.Issues, Issue{Path: path, Reason: fmt.Sprintf("read Package.swift: %v", err)})
		return
	}

	relDir, _ := filepath.Rel(root, filepath.Dir(path))
	relDir = filepath.ToSlash(relDir)
	dirLabel := filepath.Base(filepath.Dir(path))
	moduleID := "swift:" + relDir + ":" + dirLabel
	addPackageNode(result, nodeIDs, moduleID, dirLabel, graph.MetadataVisible, path)

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		// URL-based external dependency.
		for _, match := range swiftPackageURL.FindAllStringSubmatch(line, -1) {
			if len(match) < 2 {
				continue
			}
			url := match[1]
			depLabel := extractSwiftPackageName(url)
			depID := "swift:" + depLabel
			addPackageNode(result, nodeIDs, depID, depLabel, graph.MetadataVisible, path)
			addEdge(result, edgeIDs, moduleID, depID, "depends-on", graph.MetadataVisible, path)
			result.ManifestRequireCount++
		}
		// Local path dependency (internal).
		for _, match := range swiftPackagePath.FindAllStringSubmatch(line, -1) {
			if len(match) < 2 {
				continue
			}
			p := match[1]
			depLabel := filepath.Base(p)
			depID := "swift:" + depLabel
			addPackageNode(result, nodeIDs, depID, depLabel, graph.MetadataVisible, path)
			addEdge(result, edgeIDs, moduleID, depID, "depends-on", graph.MetadataVisible, path)
			result.ManifestRequireCount++
		}
	}
}

// extractSwiftPackageName extracts a package name from a Swift URL.
// e.g., "https://github.com/Alamofire/Alamofire.git" → "Alamofire"
func extractSwiftPackageName(url string) string {
	// Strip .git suffix.
	u := strings.TrimSuffix(url, ".git")
	// Take the last path segment.
	parts := strings.Split(u, "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return url
}

// detectPubspecYaml parses a Flutter/Dart pubspec.yaml file and emits
// depends-on edges for declared dependencies. Uses line-based parsing
// (no YAML library dependency).
func detectPubspecYaml(path, root string, result *Result, nodeIDs, edgeIDs map[string]struct{}) {
	data, err := os.ReadFile(path)
	if err != nil {
		result.Issues = append(result.Issues, Issue{Path: path, Reason: fmt.Sprintf("read pubspec.yaml: %v", err)})
		return
	}

	relDir, _ := filepath.Rel(root, filepath.Dir(path))
	relDir = filepath.ToSlash(relDir)
	dirLabel := filepath.Base(filepath.Dir(path))
	moduleID := "dart:" + relDir + ":" + dirLabel
	addPackageNode(result, nodeIDs, moduleID, dirLabel, graph.MetadataVisible, path)

	lines := strings.Split(string(data), "\n")
	inDeps := false
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		// Detect section headers (no indentation).
		if !strings.HasPrefix(line, " ") && !strings.HasPrefix(line, "\t") {
			if trimmed == "dependencies:" || trimmed == "dev_dependencies:" {
				inDeps = true
			} else {
				inDeps = false
			}
			continue
		}
		if !inDeps {
			continue
		}
		// Parse dependency entry: "  http: ^0.13.0" or "  flutter:\n    sdk: flutter"
		depMatch := regexp.MustCompile(`^[\s]+([\w_-]+):\s*(.*)$`).FindStringSubmatch(line)
		if depMatch == nil || len(depMatch) < 3 {
			continue
		}
		name := depMatch[1]
		version := strings.TrimSpace(depMatch[2])
		// Skip SDK entries (flutter: sdk: flutter) and nested keys.
		if name == "sdk" || version == "" || strings.Contains(version, "sdk:") {
			continue
		}
		depID := "dart:" + name
		depLabel := name + ":" + version
		addPackageNode(result, nodeIDs, depID, depLabel, graph.MetadataVisible, path)
		addEdge(result, edgeIDs, moduleID, depID, "depends-on", graph.MetadataVisible, path)
		result.ManifestRequireCount++
	}
}
