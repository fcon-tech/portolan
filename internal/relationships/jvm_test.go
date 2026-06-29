package relationships

import (
	"os"
	"path/filepath"
	"sort"
	"testing"
)

func TestDetectMavenPom(t *testing.T) {
	dir := t.TempDir()
	pomPath := filepath.Join(dir, "pom.xml")
	pomContent := `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>org.apache.spark</groupId>
  <artifactId>spark-core_2.12</artifactId>
  <version>3.5.0</version>
  <dependencies>
    <dependency>
      <groupId>org.apache.hadoop</groupId>
      <artifactId>hadoop-common</artifactId>
      <version>3.3.4</version>
    </dependency>
    <dependency>
      <groupId>org.scala-lang</groupId>
      <artifactId>scala-library</artifactId>
      <version>2.12.18</version>
    </dependency>
  </dependencies>
</project>`
	if err := os.WriteFile(pomPath, []byte(pomContent), 0644); err != nil {
		t.Fatal(err)
	}

	result := Detect(dir)

	// Should have the module node + 2 dependency nodes = 3 nodes
	if len(result.Nodes) < 3 {
		t.Errorf("expected >= 3 nodes, got %d", len(result.Nodes))
	}

	// Should have 2 depends-on edges
	depEdges := 0
	for _, e := range result.Edges {
		if e.Kind == "depends-on" {
			depEdges++
		}
	}
	if depEdges != 2 {
		t.Errorf("expected 2 depends-on edges, got %d", depEdges)
	}

	// All edges should be metadata-visible
	for _, e := range result.Edges {
		if e.Evidence.State != "metadata-visible" {
			t.Errorf("expected metadata-visible, got %s for edge %s->%s", e.Evidence.State, e.From, e.To)
		}
	}
}

func TestDetectMavenPomSkipsDependencyManagement(t *testing.T) {
	dir := t.TempDir()
	pomPath := filepath.Join(dir, "pom.xml")
	pomContent := `<project>
  <groupId>com.example</groupId>
  <artifactId>my-app</artifactId>
  <version>1.0</version>
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>4.13</version>
      </dependency>
    </dependencies>
  </dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>com.google.guava</groupId>
      <artifactId>guava</artifactId>
      <version>32.0</version>
    </dependency>
  </dependencies>
</project>`
	if err := os.WriteFile(pomPath, []byte(pomContent), 0644); err != nil {
		t.Fatal(err)
	}

	result := Detect(dir)

	// Should have only 1 active dependency (guava), NOT junit (it's in
	// dependencyManagement).
	depEdges := 0
	for _, e := range result.Edges {
		if e.Kind == "depends-on" {
			depEdges++
		}
	}
	if depEdges != 1 {
		t.Errorf("expected 1 depends-on edge (dependencyManagement should be skipped), got %d", depEdges)
	}
}

func TestDetectGradle(t *testing.T) {
	dir := t.TempDir()
	gradlePath := filepath.Join(dir, "build.gradle")
	gradleContent := `
apply plugin: 'java'

repositories { mavenCentral() }

dependencies {
    implementation 'org.apache.spark:spark-core_2.12:3.5.0'
    api 'org.scala-lang:scala-library:2.12.18'
    compileOnly 'org.apache.hadoop:hadoop-common:3.3.4'
    testImplementation 'junit:junit:4.13'
    implementation project(':shared-module')
}`
	if err := os.WriteFile(gradlePath, []byte(gradleContent), 0644); err != nil {
		t.Fatal(err)
	}

	result := Detect(dir)

	depEdges := 0
	for _, e := range result.Edges {
		if e.Kind == "depends-on" {
			depEdges++
		}
	}
	// 4 string deps + 1 project dep = 5
	if depEdges != 5 {
		t.Errorf("expected 5 depends-on edges, got %d", depEdges)
	}

	// All edges should be metadata-visible
	for _, e := range result.Edges {
		if e.Evidence.State != "metadata-visible" {
			t.Errorf("expected metadata-visible, got %s", e.Evidence.State)
		}
	}
}

func TestDetectGradleKts(t *testing.T) {
	dir := t.TempDir()
	gradlePath := filepath.Join(dir, "build.gradle.kts")
	gradleContent := `
dependencies {
    implementation("org.apache.spark:spark-sql_2.12:3.5.0")
    api(project(":core"))
}`
	if err := os.WriteFile(gradlePath, []byte(gradleContent), 0644); err != nil {
		t.Fatal(err)
	}

	result := Detect(dir)

	depEdges := 0
	for _, e := range result.Edges {
		if e.Kind == "depends-on" {
			depEdges++
		}
	}
	// 1 string dep + 1 project dep = 2
	if depEdges != 2 {
		t.Errorf("expected 2 depends-on edges, got %d", depEdges)
	}
}

func TestDetectNpmPackageJson(t *testing.T) {
	dir := t.TempDir()
	pkgPath := filepath.Join(dir, "package.json")
	pkgContent := `{
  "name": "my-app",
  "dependencies": {
    "express": "^4.18.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}`
	if err := os.WriteFile(pkgPath, []byte(pkgContent), 0644); err != nil {
		t.Fatal(err)
	}

	result := Detect(dir)

	depEdges := 0
	for _, e := range result.Edges {
		if e.Kind == "depends-on" {
			depEdges++
		}
	}
	// 2 deps + 1 devDep = 3
	if depEdges != 3 {
		t.Errorf("expected 3 depends-on edges, got %d", depEdges)
	}
}

func TestDetectMixedManifests(t *testing.T) {
	dir := t.TempDir()

	// Go module
	goModPath := filepath.Join(dir, "go.mod")
	os.WriteFile(goModPath, []byte("module example.com/myapp\ngo 1.21\nrequire (\n\tgithub.com/pkg/errors v0.9.1\n)\n"), 0644)

	// Maven POM in a subdirectory
	subDir := filepath.Join(dir, "java-module")
	os.MkdirAll(subDir, 0755)
	pomPath := filepath.Join(subDir, "pom.xml")
	os.WriteFile(pomPath, []byte(`<project>
  <groupId>com.example</groupId>
  <artifactId>java-module</artifactId>
  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.13</version>
    </dependency>
  </dependencies>
</project>`), 0644)

	result := Detect(dir)

	depEdges := 0
	for _, e := range result.Edges {
		if e.Kind == "depends-on" {
			depEdges++
		}
	}
	// 1 go.mod require + 1 maven dep = 2
	if depEdges != 2 {
		t.Errorf("expected 2 depends-on edges (1 go.mod + 1 maven), got %d", depEdges)
	}
}

func TestDetectNoManifestYieldsNoEdges(t *testing.T) {
	dir := t.TempDir()
	// Only a Python file with no manifest.
	os.WriteFile(filepath.Join(dir, "app.py"), []byte("print('hello')"), 0644)

	result := Detect(dir)
	if len(result.Edges) != 0 {
		t.Errorf("expected 0 edges for unmanaged file, got %d", len(result.Edges))
	}
}

func TestLanguageRegistryContainsJVM(t *testing.T) {
	hasJava := false
	hasKotlin := false
	for _, lang := range DefaultRegistry {
		if lang.ID == "java" {
			hasJava = true
			// Check .java extension is registered.
			foundExt := false
			for _, ext := range lang.Extensions {
				if ext == ".java" {
					foundExt = true
				}
			}
			if !foundExt {
				t.Error("java language config missing .java extension")
			}
			// Check pom.xml manifest is registered.
			foundMaven := false
			for _, m := range lang.Manifests {
				if m.Filename == "pom.xml" && m.Format == FormatMaven {
					foundMaven = true
				}
			}
			if !foundMaven {
				t.Error("java language config missing pom.xml manifest")
			}
		}
		for _, ext := range lang.Extensions {
			if ext == ".kt" {
				hasKotlin = true
			}
		}
	}
	if !hasJava {
		t.Error("language registry missing java config")
	}
	if !hasKotlin {
		t.Error("language registry missing .kt extension")
	}
}

func TestManifestFilenamesComplete(t *testing.T) {
	filenames := manifestFilenames()
	expected := []string{"go.mod", "pom.xml", "build.gradle", "build.gradle.kts", "package.json", "requirements.txt", "pyproject.toml", "Cargo.toml", "Package.swift", "pubspec.yaml"}
	for _, f := range expected {
		if _, ok := filenames[f]; !ok {
			t.Errorf("manifest filename %q not in registry", f)
		}
	}
}

func TestIsManifestFile(t *testing.T) {
	if !isManifestFile("pom.xml") {
		t.Error("pom.xml should be recognized")
	}
	if !isManifestFile("build.gradle") {
		t.Error("build.gradle should be recognized")
	}
	if !isManifestFile("package.json") {
		t.Error("package.json should be recognized")
	}
	if isManifestFile("Makefile") {
		t.Error("Makefile should NOT be recognized")
	}
}

func TestDetectSortsResults(t *testing.T) {
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "pom.xml"), []byte(`<project>
  <groupId>com.b</groupId><artifactId>b</artifactId>
  <dependencies><dependency><groupId>com.a</groupId><artifactId>a</artifactId></dependency></dependencies>
</project>`), 0644)

	result := Detect(dir)

	// Nodes should be sorted by ID.
	sortedNodes := make([]string, len(result.Nodes))
	for i, n := range result.Nodes {
		sortedNodes[i] = n.ID
	}
	if !sort.StringsAreSorted(sortedNodes) {
		t.Error("nodes are not sorted by ID")
	}
}
