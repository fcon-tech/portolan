package configuration

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDetectFindsConfigSurfacesWithoutSecretValues(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "go.mod"), "module example.com/app\n")
	write(t, filepath.Join(root, "Dockerfile"), "FROM scratch\nEXPOSE 8080\n")
	write(t, filepath.Join(root, ".github", "workflows", "ci.yml"), "name: ci\n")
	write(t, filepath.Join(root, "config", "app.env"), "API_TOKEN=super-secret\nPORT=8080\nFEATURE_FAST_CHECKOUT=true\n")
	write(t, filepath.Join(root, "cmd", "main.go"), `package main

import "os"

func main() {
	_ = os.Getenv("PAYMENTS_API_URL")
}
`)

	result := Detect(root)

	for _, want := range []struct {
		kind string
		name string
	}{
		{"manifest", "GO.MOD"},
		{"container", "DOCKERFILE"},
		{"workflow", ".GITHUB/WORKFLOWS/CI.YML"},
		{"env-var", "PAYMENTS_API_URL"},
		{"env-var", "PORT"},
		{"port", "8080"},
		{"feature-flag", "FEATURE_FAST_CHECKOUT"},
		{"secret-reference", "API_TOKEN"},
	} {
		if !hasSurface(result, want.kind, want.name) {
			t.Fatalf("surfaces = %#v, want %s %s", result.Surfaces, want.kind, want.name)
		}
	}
	for _, surface := range result.Surfaces {
		if strings.Contains(surface.Name, "super-secret") || strings.Contains(strings.Join(surface.Sources, ";"), "super-secret") {
			t.Fatalf("surface leaked secret value: %#v", surface)
		}
	}
}

func TestDetectReportsLargeCandidateAsNotAssessed(t *testing.T) {
	root := t.TempDir()
	data := make([]byte, MaxCandidateBytes+1)
	for i := range data {
		data[i] = 'a'
	}
	writeBytes(t, filepath.Join(root, "config", "large.yaml"), data)

	result := Detect(root)

	if len(result.Issues) != 1 {
		t.Fatalf("issues = %#v, want one large-file issue", result.Issues)
	}
	if result.Issues[0].Status != "not_assessed" {
		t.Fatalf("issue = %#v, want not_assessed", result.Issues[0])
	}
}

func TestDetectSkipsNoisyInputs(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, ".portolan", "run", "config.env"), "PORT=8080\n")
	write(t, filepath.Join(root, "vendor", "config.env"), "PORT=8080\n")
	write(t, filepath.Join(root, "package-lock.json"), `{"scripts":{"start":"node server.js"}}`)
	writeBytes(t, filepath.Join(root, "config", "binary.env"), []byte{'P', 'O', 'R', 'T', 0, '8'})

	result := Detect(root)

	if len(result.Surfaces) != 0 {
		t.Fatalf("surfaces = %#v, want skipped inputs not assessed as surfaces", result.Surfaces)
	}
}

func hasSurface(result Result, kind, name string) bool {
	for _, surface := range result.Surfaces {
		if surface.Kind == kind && surface.Name == name {
			return true
		}
	}
	return false
}

func write(t *testing.T, path, content string) {
	t.Helper()
	writeBytes(t, path, []byte(content))
}

func writeBytes(t *testing.T, path string, data []byte) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		t.Fatal(err)
	}
}
