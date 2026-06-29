package relationships

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/fcon-tech/portolan/internal/graph"
)

// ---------------------------------------------------------------------------
// Language registry (declarative)
// ---------------------------------------------------------------------------

// ManifestFormat identifies a manifest file format.
type ManifestFormat string

const (
	FormatMaven   ManifestFormat = "maven"
	FormatGradle  ManifestFormat = "gradle"
	FormatNpm     ManifestFormat = "npm"
	FormatPython  ManifestFormat = "python"
	FormatCargo   ManifestFormat = "cargo"
	FormatGemfile ManifestFormat = "gemfile"
	FormatSwiftPM ManifestFormat = "swift-pm"
	FormatPubspec ManifestFormat = "pubspec"
)

// LanguageConfig declares a language's manifest detection rules.
type LanguageConfig struct {
	ID         string
	Extensions []string
	Manifests  []ManifestSpec
}

// ManifestSpec declares a manifest filename and its format.
type ManifestSpec struct {
	Filename string
	Format   ManifestFormat
}

// DefaultRegistry is the built-in language registry.
var DefaultRegistry = []LanguageConfig{
	{
		ID:         "go",
		Extensions: []string{".go"},
		Manifests:  []ManifestSpec{{Filename: "go.mod", Format: "go-mod"}},
	},
	{
		ID:         "java",
		Extensions: []string{".java", ".kt", ".scala"},
		Manifests: []ManifestSpec{
			{Filename: "pom.xml", Format: FormatMaven},
			{Filename: "build.gradle", Format: FormatGradle},
			{Filename: "build.gradle.kts", Format: FormatGradle},
		},
	},
	{
		ID:         "javascript",
		Extensions: []string{".js", ".ts", ".jsx", ".tsx"},
		Manifests:  []ManifestSpec{{Filename: "package.json", Format: FormatNpm}},
	},
	{
		ID:         "python",
		Extensions: []string{".py"},
		Manifests: []ManifestSpec{
			{Filename: "requirements.txt", Format: FormatPython},
			{Filename: "pyproject.toml", Format: FormatPython},
		},
	},
	{
		ID:         "rust",
		Extensions: []string{".rs"},
		Manifests:  []ManifestSpec{{Filename: "Cargo.toml", Format: FormatCargo}},
	},
	{
		ID:         "swift",
		Extensions: []string{".swift"},
		Manifests:  []ManifestSpec{{Filename: "Package.swift", Format: FormatSwiftPM}},
	},
	{
		ID:         "dart",
		Extensions: []string{".dart"},
		Manifests:  []ManifestSpec{{Filename: "pubspec.yaml", Format: FormatPubspec}},
	},
}

// manifestFilenamesCache is built once (memoized) to avoid rebuilding the
// map for every file in a large tree.
var manifestFilenamesCache = func() map[string]ManifestFormat {
	m := make(map[string]ManifestFormat)
	for _, lang := range DefaultRegistry {
		for _, spec := range lang.Manifests {
			m[spec.Filename] = spec.Format
		}
	}
	return m
}()

// manifestFilenames returns the memoized set of manifest filenames.
func manifestFilenames() map[string]ManifestFormat {
	return manifestFilenamesCache
}

// ---------------------------------------------------------------------------
// JVM manifest detection (Maven + Gradle)
// ---------------------------------------------------------------------------

// detectMavenPom parses a pom.xml and emits depends-on edges for declared
// dependencies. It reads <dependencies><dependency> blocks but NOT
// <dependencyManagement> (which are version constraints, not active deps).
// Maven property placeholders (${...}) in coordinates are skipped.
func detectMavenPom(path, root string, result *Result, nodeIDs, edgeIDs map[string]struct{}) {
	data, err := os.ReadFile(path)
	if err != nil {
		result.Issues = append(result.Issues, Issue{Path: path, Reason: fmt.Sprintf("read pom.xml: %v", err)})
		return
	}

	type mavenDependency struct {
		GroupID    string `xml:"groupId"`
		ArtifactID string `xml:"artifactId"`
		Version    string `xml:"version"`
		Scope      string `xml:"scope"`
	}

	// Parse the full POM structure, extracting only active dependencies
	// (not dependencyManagement).
	type pomProject struct {
		GroupID      string           `xml:"groupId"`
		ArtifactID   string           `xml:"artifactId"`
		Dependencies []mavenDependency `xml:"dependencies>dependency"`
	}

	var pom pomProject
	if err := xml.Unmarshal(data, &pom); err != nil {
		result.Issues = append(result.Issues, Issue{Path: path, Reason: fmt.Sprintf("parse pom.xml: %v", err)})
		return
	}

	// The source node is the module defined by this POM. Use groupId:artifactId
	// as the canonical ID — Maven modules are uniquely identified by coordinates,
	// not by directory path.
	moduleLabel := pom.GroupID + ":" + pom.ArtifactID
	if pom.GroupID == "" || pom.ArtifactID == "" {
		moduleLabel = filepath.Base(filepath.Dir(path))
	}
	moduleID := "maven:" + moduleLabel

	addPackageNode(result, nodeIDs, moduleID, moduleLabel, graph.MetadataVisible, path)

	for _, dep := range pom.Dependencies {
		if dep.GroupID == "" || dep.ArtifactID == "" {
			continue
		}
		// Skip Maven property-interpolated coordinates (e.g.
		// ${scala.binary.version}). These cannot be resolved without the
		// full <properties> block + parent POM inheritance. Emit an issue
		// so the reader knows a dep was skipped.
		if strings.Contains(dep.GroupID, "${") || strings.Contains(dep.ArtifactID, "${") {
			result.Issues = append(result.Issues, Issue{
				Path:   path,
				Reason: fmt.Sprintf("skip dependency with property placeholder: %s:%s", dep.GroupID, dep.ArtifactID),
			})
			continue
		}
		depLabel := dep.GroupID + ":" + dep.ArtifactID
		if dep.Version != "" && !strings.Contains(dep.Version, "${") {
			depLabel += ":" + dep.Version
		}
		depID := "maven:" + dep.GroupID + ":" + dep.ArtifactID
		addPackageNode(result, nodeIDs, depID, depLabel, graph.MetadataVisible, path)
		addEdge(result, edgeIDs, moduleID, depID, "depends-on", graph.MetadataVisible, path)
		result.ManifestRequireCount++
	}
}

// Gradle dependency declaration patterns. These cover the common forms:
//   implementation 'group:artifact:version'
//   api "group:artifact:version"
//   project(':module-name')
//   implementation platform('group:artifact:version')  (BOM import)
//   classpath 'group:artifact:version'                 (buildscript)
var (
	// gradleStringDep matches GAV coordinates in string declarations.
	// Anchored to avoid false positives inside string literals or comments.
	gradleStringDep = regexp.MustCompile(`^\s*(?:implementation|api|compileOnly|runtimeOnly|testImplementation|testApi|classpath|platform)\s*[(]?\s*['"]([^'"]+)['"]`)
	gradleProjectDep = regexp.MustCompile(`^\s*(?:implementation|api|compileOnly|runtimeOnly)\s*[(]?\s*project\s*\(\s*['"]([^'"]+)['"]\s*\)`)
)

// detectGradle parses a build.gradle / build.gradle.kts and emits depends-on
// edges. Gradle is a Groovy/Kotlin DSL; the parser uses bounded regex
// extraction (not a full AST).
func detectGradle(path, root string, result *Result, nodeIDs, edgeIDs map[string]struct{}) {
	data, err := os.ReadFile(path)
	if err != nil {
		result.Issues = append(result.Issues, Issue{Path: path, Reason: fmt.Sprintf("read build.gradle: %v", err)})
		return
	}

	// The source node is the Gradle project. Use relative path to avoid
	// collisions between same-named directories in different repos.
	relDir, _ := filepath.Rel(root, filepath.Dir(path))
	relDir = filepath.ToSlash(relDir)
	dirLabel := filepath.Base(filepath.Dir(path))
	moduleID := "gradle:" + relDir + ":" + dirLabel
	addPackageNode(result, nodeIDs, moduleID, dirLabel, graph.MetadataVisible, path)

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		// Skip comments. Use precise prefixes to avoid false positives on
		// code lines starting with '*' (e.g. *Pattern.compile).
		if strings.HasPrefix(line, "//") || strings.HasPrefix(line, "/*") || strings.HasPrefix(line, "* ") {
			continue
		}

		// project(':module') — internal module dependency.
		for _, match := range gradleProjectDep.FindAllStringSubmatch(line, -1) {
			if len(match) < 2 {
				continue
			}
			depLabel := match[1]
			depID := "gradle:" + strings.TrimPrefix(depLabel, ":")
			addPackageNode(result, nodeIDs, depID, depLabel, graph.MetadataVisible, path)
			addEdge(result, edgeIDs, moduleID, depID, "depends-on", graph.MetadataVisible, path)
			result.ManifestRequireCount++
		}

		// 'group:artifact:version' — external dependency.
		for _, match := range gradleStringDep.FindAllStringSubmatch(line, -1) {
			if len(match) < 2 {
				continue
			}
			dep := match[1]
			// Only match GAV-style declarations (group:artifact:version).
			parts := strings.Split(dep, ":")
			if len(parts) < 2 {
				continue // Not a GAV coordinate; skip (could be a file path etc.)
			}
			// Skip Gradle property-interpolated coordinates (same as Maven).
			if strings.Contains(parts[0], "$") || strings.Contains(parts[1], "$") {
				result.Issues = append(result.Issues, Issue{
					Path:   path,
					Reason: fmt.Sprintf("skip Gradle dependency with property placeholder: %s", dep),
				})
				continue
			}
			depID := "maven:" + parts[0] + ":" + parts[1]
			addPackageNode(result, nodeIDs, depID, dep, graph.MetadataVisible, path)
			addEdge(result, edgeIDs, moduleID, depID, "depends-on", graph.MetadataVisible, path)
			result.ManifestRequireCount++
		}
	}
}

// ---------------------------------------------------------------------------
// NPM (package.json) dependency detection
// ---------------------------------------------------------------------------

// detectNpmPackageJson parses a package.json and emits depends-on edges.
func detectNpmPackageJson(path, root string, result *Result, nodeIDs, edgeIDs map[string]struct{}) {
	data, err := os.ReadFile(path)
	if err != nil {
		result.Issues = append(result.Issues, Issue{Path: path, Reason: fmt.Sprintf("read package.json: %v", err)})
		return
	}

	type npmPackage struct {
		Name                 string            `json:"name"`
		Dependencies         map[string]string `json:"dependencies"`
		DevDependencies      map[string]string `json:"devDependencies"`
		PeerDependencies     map[string]string `json:"peerDependencies"`
		OptionalDependencies map[string]string `json:"optionalDependencies"`
	}

	var pkg npmPackage
	if err := jsonUnmarshal(data, &pkg); err != nil {
		result.Issues = append(result.Issues, Issue{Path: path, Reason: fmt.Sprintf("parse package.json: %v", err)})
		return
	}

	moduleLabel := pkg.Name
	if moduleLabel == "" {
		moduleLabel = filepath.Base(filepath.Dir(path))
	}
	relDir, _ := filepath.Rel(root, filepath.Dir(path))
	relDir = filepath.ToSlash(relDir)
	moduleID := "npm:" + relDir + ":" + moduleLabel
	addPackageNode(result, nodeIDs, moduleID, moduleLabel, graph.MetadataVisible, path)

	for name, version := range pkg.Dependencies {
		depID := "npm:" + name
		depLabel := name + ":" + version
		addPackageNode(result, nodeIDs, depID, depLabel, graph.MetadataVisible, path)
		addEdge(result, edgeIDs, moduleID, depID, "depends-on", graph.MetadataVisible, path)
		result.ManifestRequireCount++
	}
	// devDependencies are also edges — they describe the landscape.
	for name, version := range pkg.DevDependencies {
		depID := "npm:" + name
		depLabel := name + ":" + version
		addPackageNode(result, nodeIDs, depID, depLabel, graph.MetadataVisible, path)
		addEdge(result, edgeIDs, moduleID, depID, "depends-on", graph.MetadataVisible, path)
		result.ManifestRequireCount++
	}
	// peerDependencies — host packages MUST satisfy them; they are part of
	// the runtime dependency graph.
	for name, version := range pkg.PeerDependencies {
		depID := "npm:" + name
		depLabel := name + ":" + version
		addPackageNode(result, nodeIDs, depID, depLabel, graph.MetadataVisible, path)
		addEdge(result, edgeIDs, moduleID, depID, "depends-on", graph.MetadataVisible, path)
		result.ManifestRequireCount++
	}
	// optionalDependencies — installed if available, but part of the declared
	// landscape.
	for name, version := range pkg.OptionalDependencies {
		depID := "npm:" + name
		depLabel := name + ":" + version
		addPackageNode(result, nodeIDs, depID, depLabel, graph.MetadataVisible, path)
		addEdge(result, edgeIDs, moduleID, depID, "depends-on", graph.MetadataVisible, path)
		result.ManifestRequireCount++
	}
}

// jsonUnmarshal wraps encoding/json.Unmarshal so the import lives in this file
// (the Go-focused relationships.go does not need it).
func jsonUnmarshal(data []byte, v interface{}) error {
	return json.Unmarshal(data, v)
}
