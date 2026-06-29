package maprun

import (
	"os"
	"path/filepath"
	"testing"
)

// makeTargetRoot creates a minimal root with a source file and a .git marker so
// root discovery treats it as a repository.
func makeTargetRoot(t *testing.T) string {
	t.Helper()
	root := t.TempDir()
	if err := os.MkdirAll(filepath.Join(root, ".git"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "main.go"), []byte("package main\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	return root
}

func TestMapIfStaleBuildsOnFirstRun(t *testing.T) {
	root := makeTargetRoot(t)
	out := filepath.Join(root, ".portolan", "run")

	result, err := Run(Options{RootPath: root, OutputPath: out, IfStale: true})
	if err != nil {
		t.Fatalf("Run: %v", err)
	}
	if result.Skipped {
		t.Fatal("first run must build, not skip")
	}
	if _, err := os.Stat(filepath.Join(out, "summary.json")); err != nil {
		t.Fatalf("summary.json missing after build: %v", err)
	}
	if _, err := os.Stat(filepath.Join(out, treeSignatureFile)); err != nil {
		t.Fatalf("%s missing after build: %v", treeSignatureFile, err)
	}
}

func TestMapIfStaleSkipsWhenUnchanged(t *testing.T) {
	root := makeTargetRoot(t)
	out := filepath.Join(root, ".portolan", "run")

	if _, err := Run(Options{RootPath: root, OutputPath: out, IfStale: true}); err != nil {
		t.Fatalf("first Run: %v", err)
	}

	summaryBefore, err := os.ReadFile(filepath.Join(out, "summary.json"))
	if err != nil {
		t.Fatalf("read summary: %v", err)
	}

	result, err := Run(Options{RootPath: root, OutputPath: out, IfStale: true})
	if err != nil {
		t.Fatalf("second Run: %v", err)
	}
	if !result.Skipped {
		t.Fatal("second run with unchanged root must skip")
	}
	if result.StaleReason == "" {
		t.Fatal("expected a non-empty skip reason")
	}

	summaryAfter, err := os.ReadFile(filepath.Join(out, "summary.json"))
	if err != nil {
		t.Fatalf("read summary after: %v", err)
	}
	if string(summaryBefore) != string(summaryAfter) {
		t.Fatal("summary.json was rewritten on a skip; the bundle must be untouched")
	}
}

func TestMapIfStaleRebuildsAfterChange(t *testing.T) {
	root := makeTargetRoot(t)
	out := filepath.Join(root, ".portolan", "run")

	if _, err := Run(Options{RootPath: root, OutputPath: out, IfStale: true}); err != nil {
		t.Fatalf("first Run: %v", err)
	}

	// Add a new source file — the tree signature must change.
	if err := os.WriteFile(filepath.Join(root, "util.go"), []byte("package main\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	result, err := Run(Options{RootPath: root, OutputPath: out, IfStale: true})
	if err != nil {
		t.Fatalf("second Run: %v", err)
	}
	if result.Skipped {
		t.Fatal("run after a target change must rebuild, not skip")
	}
}

func TestMapIfStaleArtifactsPopulatedOnSkip(t *testing.T) {
	root := makeTargetRoot(t)
	out := filepath.Join(root, ".portolan", "run")

	if _, err := Run(Options{RootPath: root, OutputPath: out, IfStale: true}); err != nil {
		t.Fatalf("first Run: %v", err)
	}

	result, err := Run(Options{RootPath: root, OutputPath: out, IfStale: true})
	if err != nil {
		t.Fatalf("second Run: %v", err)
	}
	if !result.Skipped {
		t.Fatal("expected skip")
	}
	if result.Artifacts.Summary == "" {
		t.Fatal("skipped result must still report artifact paths")
	}
	if result.OutputPath != out {
		t.Fatalf("output path = %q, want %q", result.OutputPath, out)
	}
}
