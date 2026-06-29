package relationships

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDetectSwiftPackageSwift(t *testing.T) {
	dir := t.TempDir()
	pkgPath := filepath.Join(dir, "Package.swift")
	content := `
let package = Package(
    name: "MyApp",
    dependencies: [
        .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.0.0"),
        .package(url: "https://github.com/SnapKit/SnapKit.git", from: "5.6.0"),
        .package(path: "../SharedLib"),
    ]
)
`
	os.WriteFile(pkgPath, []byte(content), 0644)

	result := Detect(dir)
	depEdges := 0
	for _, e := range result.Edges {
		if e.Kind == "depends-on" {
			depEdges++
		}
	}
	// 2 URL deps + 1 path dep = 3
	if depEdges != 3 {
		t.Errorf("expected 3 depends-on edges, got %d", depEdges)
	}
}

func TestDetectPubspecYaml(t *testing.T) {
	dir := t.TempDir()
	pkgPath := filepath.Join(dir, "pubspec.yaml")
	content := `
name: my_flutter_app
dependencies:
  flutter:
    sdk: flutter
  http: ^0.13.0
  shared_preferences: ^2.0.0
dev_dependencies:
  flutter_test:
    sdk: flutter_test
  mockito: ^5.0.0
`
	os.WriteFile(pkgPath, []byte(content), 0644)

	result := Detect(dir)
	depEdges := 0
	for _, e := range result.Edges {
		if e.Kind == "depends-on" {
			depEdges++
		}
	}
	// http + shared_preferences (deps) + mockito (dev_dep) = 3
	// flutter: sdk: flutter is skipped (sdk entry)
	// flutter_test: sdk is skipped
	if depEdges != 3 {
		t.Errorf("expected 3 depends-on edges (sdk deps skipped), got %d", depEdges)
	}
}
