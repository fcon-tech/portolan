package relationships

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDetectFindsGoImportsAndGoModDependencies(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "go.mod"), `module example.com/app

go 1.26.3

require (
	example.com/lib v1.0.0
)
`)
	write(t, filepath.Join(root, "main.go"), `package main

import "example.com/lib"
`)
	write(t, filepath.Join(root, ".portolan", "run", "stale.go"), `package stale

import "example.com/stale"
`)

	result := Detect(root)

	if result.SourceImportCount != 1 || result.ManifestRequireCount != 1 {
		t.Fatalf("counts = source %d manifest %d, want 1/1", result.SourceImportCount, result.ManifestRequireCount)
	}
	if !hasEdge(result, "source:main.go", "package:example.com/lib", "imports") {
		t.Fatalf("edges = %#v, want source import edge", result.Edges)
	}
	if !hasEdge(result, "package:example.com/app", "package:example.com/lib", "depends-on") {
		t.Fatalf("edges = %#v, want module dependency edge", result.Edges)
	}
	if hasEdge(result, "source:.portolan/run/stale.go", "package:example.com/stale", "imports") {
		t.Fatalf("edges = %#v, did not expect .portolan import edge", result.Edges)
	}
}

func TestDetectReportsMalformedRelationshipInputs(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "go.mod"), `module`)
	write(t, filepath.Join(root, "broken.go"), `package main

import "unterminated
`)

	result := Detect(root)

	if len(result.Issues) < 2 {
		t.Fatalf("issues = %#v, want malformed go.mod and Go source issues", result.Issues)
	}
}

func hasEdge(result Result, from, to, kind string) bool {
	for _, edge := range result.Edges {
		if edge.From == from && edge.To == to && edge.Kind == kind {
			return true
		}
	}
	return false
}

func write(t *testing.T, path, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}
