// Package staleness computes a bounded tree signature of a target root so that
// /portolan:map can decide whether the snapshot is stale without rerunning the
// full collector. The signature is a SHA-256 over sorted (relative-path, size)
// pairs of regular files under the root; excluded directories (such as .git,
// .portolan, node_modules) are skipped so generated/output trees do not
// dominate the signal.
//
// The signature is a structural staleness heuristic, not a content hash:
// same-size in-place edits are not detected. That trade-off keeps the walk
// stat-only (no file reads) and cheap enough to run on every /portolan:map.
// A consumer that needs a guaranteed rebuild can force it.
package staleness

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// Algorithm is the signature scheme identifier persisted alongside a signature.
const Algorithm = "tree-signature-sha256-v1"

// defaultExcludes are directory names (at any depth) skipped by the walk. They
// cover VCS, Portolan output, dependency caches, and common build artifacts.
var defaultExcludes = map[string]bool{
	".git":          true,
	".hg":           true,
	".svn":          true,
	".portolan":     true,
	"node_modules":  true,
	"vendor":        true,
	".next":         true,
	".cache":        true,
	"__pycache__":   true,
	".pytest_cache": true,
	"target":        true,
	"build":         true,
	"dist":          true,
	".gradle":       true,
}

// Signature is a persisted tree signature plus enough provenance to interpret
// it across runs. RootFingerprint is a short hash of the resolved root path —
// it enables cross-root reuse detection without leaking the absolute path.
type Signature struct {
	Algorithm       string    `json:"algorithm"`
	Hash            string    `json:"hash"`
	FileCount       int       `json:"file_count"`
	RootFingerprint string    `json:"root_fingerprint"`
	GeneratedAt     time.Time `json:"generated_at"`
}

// Options configures the walk. The zero value uses the defaults.
type Options struct {
	// Excludes overrides the default excluded directory names. When non-nil the
	// caller fully replaces the set; pass nil to keep the defaults.
	Excludes map[string]bool
}

func (o Options) excludes() map[string]bool {
	if o.Excludes != nil {
		return o.Excludes
	}
	return defaultExcludes
}

// Compute walks root (bounded by the exclude set) and returns a tree signature.
// root must be an existing directory. Symlinks are not followed; symlinked
// files and directories are skipped so the signature stays rooted and
// deterministic.
func Compute(root string, opts ...Options) (Signature, error) {
	resolved, err := resolveRoot(root)
	if err != nil {
		return Signature{}, err
	}
	o := Options{}
	if len(opts) > 0 {
		o = opts[0]
	}
	excludes := o.excludes()

	type entry struct {
		rel  string
		size int64
	}
	var entries []entry
	walkErr := filepath.WalkDir(resolved, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			// Root-level walk failures (e.g. permission flip, race removal) are
			// fatal — an empty signature from a broken root is not a meaningful
			// staleness signal. Non-root read errors (unreadable subtree) are
			// tolerated: the shorter entry list is itself a structural change.
			if path == resolved {
				return err
			}
			return nil
		}
		if path == resolved {
			return nil
		}
		name := d.Name()
		info, err := d.Info()
		if err != nil {
			return nil
		}
		if info.Mode()&os.ModeSymlink != 0 {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if d.IsDir() {
			if excludes[name] {
				return filepath.SkipDir
			}
			return nil
		}
		if !info.Mode().IsRegular() {
			return nil
		}
		rel, err := filepath.Rel(resolved, path)
		if err != nil {
			return nil
		}
		entries = append(entries, entry{rel: filepath.ToSlash(rel), size: info.Size()})
		return nil
	})
	if walkErr != nil {
		return Signature{}, fmt.Errorf("walk root: %w", walkErr)
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].rel < entries[j].rel })

	h := sha256.New()
	for _, e := range entries {
		h.Write([]byte(e.rel))
		h.Write([]byte{0})
		h.Write([]byte(fmt.Sprintf("%d", e.size)))
		h.Write([]byte{0})
	}
	return Signature{
		Algorithm:       Algorithm,
		Hash:            hex.EncodeToString(h.Sum(nil)),
		FileCount:       len(entries),
		RootFingerprint: rootFingerprint(resolved),
		GeneratedAt:     time.Now().UTC(),
	}, nil
}

// IsStale reports whether the snapshot is stale relative to a stored signature
// file. It is stale when: storedPath is absent/unreadable, the stored algorithm
// differs, or the freshly computed hash differs. An empty root or missing root
// is an error, not a stale verdict.
func IsStale(root, storedPath string, opts ...Options) (bool, string, error) {
	current, err := Compute(root, opts...)
	if err != nil {
		return false, "", err
	}
	stored, err := Read(storedPath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return true, "no stored tree signature", nil
		}
		return true, "stored tree signature unreadable: " + err.Error(), nil
	}
	if stored.Algorithm != current.Algorithm {
		return true, fmt.Sprintf("signature algorithm changed (%q -> %q)", stored.Algorithm, current.Algorithm), nil
	}
	if stored.RootFingerprint != current.RootFingerprint {
		return true, "signature recorded for a different root", nil
	}
	if stored.Hash != current.Hash {
		return true, "target tree changed", nil
	}
	return false, "tree signature unchanged", nil
}

// Write persists a signature as indented JSON to path. It writes to a temp file
// in the same directory then renames, so a crash cannot leave a partial file.
func Write(path string, sig Signature) error {
	if strings.TrimSpace(path) == "" {
		return errors.New("staleness: path is required")
	}
	data, err := json.MarshalIndent(sig, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal signature: %w", err)
	}
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("create signature parent: %w", err)
	}
	tmp, err := os.CreateTemp(dir, ".tree-signature.*")
	if err != nil {
		return fmt.Errorf("create temp signature: %w", err)
	}
	tmpName := tmp.Name()
	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		os.Remove(tmpName)
		return fmt.Errorf("write signature: %w", err)
	}
	if err := tmp.Close(); err != nil {
		os.Remove(tmpName)
		return fmt.Errorf("close signature: %w", err)
	}
	if err := os.Rename(tmpName, path); err != nil {
		os.Remove(tmpName)
		return fmt.Errorf("rename signature: %w", err)
	}
	return nil
}

// Read loads a signature from a JSON file.
func Read(path string) (Signature, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return Signature{}, err
	}
	var sig Signature
	if err := json.Unmarshal(data, &sig); err != nil {
		return Signature{}, fmt.Errorf("parse signature: %w", err)
	}
	return sig, nil
}

func resolveRoot(root string) (string, error) {
	if strings.TrimSpace(root) == "" {
		return "", errors.New("staleness: root is required")
	}
	abs, err := filepath.Abs(root)
	if err != nil {
		return "", fmt.Errorf("resolve root: %w", err)
	}
	resolved, err := filepath.EvalSymlinks(abs)
	if err != nil {
		if os.IsNotExist(err) {
			return "", fmt.Errorf("staleness: root does not exist")
		}
		return "", fmt.Errorf("resolve root: %w", err)
	}
	info, err := os.Stat(resolved)
	if err != nil {
		return "", fmt.Errorf("inspect root: %w", err)
	}
	if !info.IsDir() {
		return "", errors.New("staleness: root must be a directory")
	}
	return resolved, nil
}

// rootFingerprint returns a short, non-reversible hash of the resolved root
// path. It is persisted in the signature so IsStale can detect cross-root reuse
// (a signature file from root A applied to root B) without leaking the
// absolute filesystem path.
func rootFingerprint(resolved string) string {
	h := sha256.Sum256([]byte(resolved))
	return hex.EncodeToString(h[:])[:12]
}
