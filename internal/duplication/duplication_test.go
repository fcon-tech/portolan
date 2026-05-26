package duplication

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDetectFindsExactSourceAndConfigClusters(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "src", "a.go"), `package src

func copied() string {
	return "same"
}
`)
	write(t, filepath.Join(root, "src", "b.go"), `package src

func copied() string {
	return "same"
}
`)
	write(t, filepath.Join(root, "config", "prod.json"), `{"timeout":30,"retries":3,"service":"orders"}`)
	write(t, filepath.Join(root, "config", "staging.json"), `{"timeout":30,"retries":3,"service":"orders"}`)
	write(t, filepath.Join(root, ".portolan", "old", "copy.go"), `package src

func copied() string {
	return "same"
}
`)

	result := Detect(root)

	if !hasCluster(result, "exact-source", "src/a.go", "src/b.go") {
		t.Fatalf("clusters = %#v, want exact source cluster", result.Clusters)
	}
	if !hasCluster(result, "exact-config", "config/prod.json", "config/staging.json") {
		t.Fatalf("clusters = %#v, want exact config cluster", result.Clusters)
	}
	if hasCluster(result, "exact-source", ".portolan/old/copy.go", "src/a.go") {
		t.Fatalf("clusters = %#v, did not expect .portolan output", result.Clusters)
	}
}

func TestDetectDoesNotClusterNearDuplicates(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "src", "a.go"), `package src

func copied() string {
	return "same"
}
`)
	write(t, filepath.Join(root, "src", "b.go"), `package src

func copied() string {
	return "different"
}
`)

	result := Detect(root)

	if len(result.Clusters) != 0 {
		t.Fatalf("clusters = %#v, want no near-clone cluster", result.Clusters)
	}
}

func TestDetectSkipsNoisyPrivateHeavyInputs(t *testing.T) {
	root := t.TempDir()
	copied := `package src

func copied() string {
	return "same"
}
`
	write(t, filepath.Join(root, "src", "base.go"), copied)
	write(t, filepath.Join(root, ".git", "copy.go"), copied)
	write(t, filepath.Join(root, "vendor", "copy.go"), copied)
	write(t, filepath.Join(root, "node_modules", "copy.go"), copied)
	write(t, filepath.Join(root, "build", "copy.go"), copied)
	write(t, filepath.Join(root, "src", "generated_copy.go"), copied)
	write(t, filepath.Join(root, "package-lock.json"), `{"lockfileVersion":3,"packages":{"a":{"version":"1.0.0"}}}`)
	write(t, filepath.Join(root, "other", "package-lock.json"), `{"lockfileVersion":3,"packages":{"a":{"version":"1.0.0"}}}`)
	writeBytes(t, filepath.Join(root, "src", "binary.go"), []byte{'p', 'a', 'c', 'k', 'a', 'g', 'e', 0, 'x'})

	result := Detect(root)

	if len(result.Clusters) != 0 {
		t.Fatalf("clusters = %#v, want skipped inputs not to form clusters", result.Clusters)
	}
}

func TestDetectReportsLargeCandidateAsNotAssessed(t *testing.T) {
	root := t.TempDir()
	data := make([]byte, MaxCandidateBytes+1)
	for i := range data {
		data[i] = 'a'
	}
	if err := os.MkdirAll(filepath.Join(root, "src"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "src", "large.go"), data, 0o644); err != nil {
		t.Fatal(err)
	}

	result := Detect(root)

	if len(result.Issues) != 1 {
		t.Fatalf("issues = %#v, want one large-file issue", result.Issues)
	}
	if result.Issues[0].Status != "not_assessed" {
		t.Fatalf("issue = %#v, want not_assessed", result.Issues[0])
	}
}

func hasCluster(result Result, kind string, files ...string) bool {
	want := map[string]bool{}
	for _, file := range files {
		want[file] = true
	}
	for _, cluster := range result.Clusters {
		if cluster.Kind != kind {
			continue
		}
		remaining := map[string]bool{}
		for file := range want {
			remaining[file] = true
		}
		for _, file := range cluster.Files {
			delete(remaining, file)
		}
		if len(remaining) == 0 {
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

func writeBytes(t *testing.T, path string, data []byte) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		t.Fatal(err)
	}
}
