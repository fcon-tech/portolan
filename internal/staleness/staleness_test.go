package staleness

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeFiles(t *testing.T, root string, files map[string]string) {
	t.Helper()
	for rel, content := range files {
		p := filepath.Join(root, filepath.FromSlash(rel))
		if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
			t.Fatalf("mkdir %s: %v", filepath.Dir(p), err)
		}
		if err := os.WriteFile(p, []byte(content), 0o644); err != nil {
			t.Fatalf("write %s: %v", p, err)
		}
	}
}

func TestComputeDeterministic(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{
		"a.txt":         "hello",
		"src/main.go":   "package main",
		"README.md":     "# project",
		"src/util/a.go": "package util",
	})
	sig1, err := Compute(dir)
	if err != nil {
		t.Fatalf("Compute: %v", err)
	}
	sig2, err := Compute(dir)
	if err != nil {
		t.Fatalf("Compute again: %v", err)
	}
	if sig1.Hash != sig2.Hash {
		t.Fatalf("non-deterministic: %q != %q", sig1.Hash, sig2.Hash)
	}
	if sig1.Algorithm != Algorithm {
		t.Fatalf("algorithm = %q, want %q", sig1.Algorithm, Algorithm)
	}
	if sig1.FileCount != 4 {
		t.Fatalf("file_count = %d, want 4", sig1.FileCount)
	}
}

func TestComputeDetectsAdditions(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{"a.txt": "a"})
	base, err := Compute(dir)
	if err != nil {
		t.Fatalf("Compute: %v", err)
	}
	writeFiles(t, dir, map[string]string{"b.txt": "b"})
	after, err := Compute(dir)
	if err != nil {
		t.Fatalf("Compute after add: %v", err)
	}
	if base.Hash == after.Hash {
		t.Fatal("adding a file did not change the signature")
	}
}

func TestComputeDetectsSizeChange(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{"a.txt": "aa"})
	base, err := Compute(dir)
	if err != nil {
		t.Fatalf("Compute: %v", err)
	}
	writeFiles(t, dir, map[string]string{"a.txt": "aaa"})
	after, err := Compute(dir)
	if err != nil {
		t.Fatalf("Compute after edit: %v", err)
	}
	if base.Hash == after.Hash {
		t.Fatal("a size change did not change the signature")
	}
}

func TestComputeSkipsExcludedDirs(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{
		"src/a.go":           "package src",
		".git/config":        "[core]",
		".portolan/run.json": "{}",
		"node_modules/x":     "dep",
	})
	sig, err := Compute(dir)
	if err != nil {
		t.Fatalf("Compute: %v", err)
	}
	if sig.FileCount != 1 {
		t.Fatalf("file_count = %d, want 1 (only src/a.go)", sig.FileCount)
	}
}

func TestComputeDoesNotFollowSymlinks(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{"real.txt": "data"})
	link := filepath.Join(dir, "link.txt")
	if err := os.Symlink(filepath.Join(dir, "real.txt"), link); err != nil {
		t.Skipf("symlink not supported: %v", err)
	}
	sig, err := Compute(dir)
	if err != nil {
		t.Fatalf("Compute: %v", err)
	}
	if sig.FileCount != 1 {
		t.Fatalf("file_count = %d, want 1 (symlink skipped)", sig.FileCount)
	}
}

func TestComputeErrorsOnMissingRoot(t *testing.T) {
	if _, err := Compute(filepath.Join(t.TempDir(), "nope")); err == nil {
		t.Fatal("expected error for missing root")
	}
}

func TestComputeErrorsOnNonDirRoot(t *testing.T) {
	dir := t.TempDir()
	f := filepath.Join(dir, "file")
	if err := os.WriteFile(f, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := Compute(f); err == nil {
		t.Fatal("expected error for non-directory root")
	}
}

func TestComputeCustomExcludes(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{
		"a.txt":  "a",
		"skip/b": "b",
	})
	sig, err := Compute(dir, Options{Excludes: map[string]bool{"skip": true}})
	if err != nil {
		t.Fatalf("Compute: %v", err)
	}
	if sig.FileCount != 1 {
		t.Fatalf("file_count = %d, want 1", sig.FileCount)
	}
}

func TestIsStaleNoStoredSignature(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{"a.txt": "a"})
	stale, _, err := IsStale(dir, filepath.Join(t.TempDir(), "missing.json"))
	if err != nil {
		t.Fatalf("IsStale: %v", err)
	}
	if !stale {
		t.Fatal("expected stale when no stored signature exists")
	}
}

func TestIsStaleUnchangedAfterWrite(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{"a.txt": "a", "b/c.go": "package b"})
	sig, err := Compute(dir)
	if err != nil {
		t.Fatalf("Compute: %v", err)
	}
	stored := filepath.Join(t.TempDir(), "sig.json")
	if err := Write(stored, sig); err != nil {
		t.Fatalf("Write: %v", err)
	}
	stale, _, err := IsStale(dir, stored)
	if err != nil {
		t.Fatalf("IsStale: %v", err)
	}
	if stale {
		t.Fatal("expected not stale after writing the matching signature")
	}
}

func TestIsStaleAfterChange(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{"a.txt": "a"})
	sig, err := Compute(dir)
	if err != nil {
		t.Fatalf("Compute: %v", err)
	}
	stored := filepath.Join(t.TempDir(), "sig.json")
	if err := Write(stored, sig); err != nil {
		t.Fatalf("Write: %v", err)
	}
	writeFiles(t, dir, map[string]string{"a.txt": "changed content"})
	stale, reason, err := IsStale(dir, stored)
	if err != nil {
		t.Fatalf("IsStale: %v", err)
	}
	if !stale {
		t.Fatal("expected stale after target changed")
	}
	if reason == "" {
		t.Fatal("expected a non-empty staleness reason")
	}
}

func TestIsStaleAlgorithmMismatch(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{"a.txt": "a"})
	stored := filepath.Join(t.TempDir(), "sig.json")
	if err := Write(stored, Signature{Algorithm: "old-v0", Hash: "x"}); err != nil {
		t.Fatalf("Write: %v", err)
	}
	stale, _, err := IsStale(dir, stored)
	if err != nil {
		t.Fatalf("IsStale: %v", err)
	}
	if !stale {
		t.Fatal("expected stale on algorithm mismatch")
	}
}

func TestWriteReadRoundTrip(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{"a.txt": "a"})
	sig, err := Compute(dir)
	if err != nil {
		t.Fatalf("Compute: %v", err)
	}
	path := filepath.Join(t.TempDir(), "nested", "sig.json")
	if err := Write(path, sig); err != nil {
		t.Fatalf("Write: %v", err)
	}
	loaded, err := Read(path)
	if err != nil {
		t.Fatalf("Read: %v", err)
	}
	if loaded.Hash != sig.Hash || loaded.FileCount != sig.FileCount || loaded.Algorithm != sig.Algorithm {
		t.Fatalf("round-trip mismatch: %#v vs %#v", loaded, sig)
	}
}

func TestIsStaleCorruptStoredFile(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{"a.txt": "a"})
	stored := filepath.Join(t.TempDir(), "sig.json")
	if err := os.WriteFile(stored, []byte("{not json"), 0o644); err != nil {
		t.Fatal(err)
	}
	stale, reason, err := IsStale(dir, stored)
	if err != nil {
		t.Fatalf("IsStale: %v", err)
	}
	if !stale {
		t.Fatal("expected stale when stored signature is corrupt")
	}
	if reason == "" {
		t.Fatal("expected a non-empty reason for corrupt signature")
	}
}

func TestIsStaleDifferentRoot(t *testing.T) {
	dirA := t.TempDir()
	dirB := t.TempDir()
	writeFiles(t, dirA, map[string]string{"a.txt": "a"})
	writeFiles(t, dirB, map[string]string{"a.txt": "a"})
	sigA, err := Compute(dirA)
	if err != nil {
		t.Fatalf("Compute: %v", err)
	}
	stored := filepath.Join(t.TempDir(), "sig.json")
	if err := Write(stored, sigA); err != nil {
		t.Fatalf("Write: %v", err)
	}
	// dirB has the same content but a different root — fingerprint must differ.
	stale, reason, err := IsStale(dirB, stored)
	if err != nil {
		t.Fatalf("IsStale: %v", err)
	}
	if !stale {
		t.Fatal("expected stale when stored signature is for a different root")
	}
	if !strings.Contains(reason, "different root") {
		t.Fatalf("reason = %q, want 'different root'", reason)
	}
}

func TestComputeNilExcludesUsesDefaults(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{
		"src/a.go":         "package src",
		".git/config":      "[core]",
		"node_modules/dep": "dep",
	})
	// No options → defaults exclude .git and node_modules.
	sig, err := Compute(dir)
	if err != nil {
		t.Fatalf("Compute: %v", err)
	}
	if sig.FileCount != 1 {
		t.Fatalf("file_count = %d, want 1 (only src/a.go)", sig.FileCount)
	}
	// Explicit nil Excludes → same as no options.
	sig2, err := Compute(dir, Options{Excludes: nil})
	if err != nil {
		t.Fatalf("Compute with nil excludes: %v", err)
	}
	if sig2.Hash != sig.Hash {
		t.Fatal("nil Excludes should match default behavior")
	}
}

func TestRootFingerprintDoesNotLeakPath(t *testing.T) {
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{"a.txt": "a"})
	sig, err := Compute(dir)
	if err != nil {
		t.Fatalf("Compute: %v", err)
	}
	if sig.RootFingerprint == "" {
		t.Fatal("RootFingerprint should be non-empty")
	}
	if strings.Contains(sig.RootFingerprint, dir) {
		t.Fatal("RootFingerprint should not contain the raw path")
	}
}

func TestComputeToleratesUnreadableSubtree(t *testing.T) {
	if os.Geteuid() == 0 {
		t.Skip("permission test is meaningless when running as root")
	}
	dir := t.TempDir()
	writeFiles(t, dir, map[string]string{"readable.go": "package main"})
	unreadable := filepath.Join(dir, "secret")
	if err := os.MkdirAll(unreadable, 0o755); err != nil {
		t.Fatal(err)
	}
	writeFiles(t, dir, map[string]string{"secret/private.go": "package secret"})
	if err := os.Chmod(unreadable, 0o000); err != nil {
		t.Fatal(err)
	}
	defer os.Chmod(unreadable, 0o755) // restore so cleanup works
	sig, err := Compute(dir)
	if err != nil {
		t.Fatalf("Compute should tolerate an unreadable subtree, got: %v", err)
	}
	// The unreadable subtree is skipped (tolerated), so only readable.go is counted.
	if sig.FileCount != 1 {
		t.Fatalf("file_count = %d, want 1 (unreadable subtree skipped)", sig.FileCount)
	}
}
