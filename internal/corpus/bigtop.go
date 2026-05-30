package corpus

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"

	"github.com/fcon-tech/portolan/internal/coverage"
	"github.com/fcon-tech/portolan/internal/selection"
)

type BigtopSelectionOptions struct {
	ManifestPath string
	RepoDir      string
	OutputPath   string
	Force        bool
}

func GenerateBigtopSelection(opts BigtopSelectionOptions) (selection.Selection, error) {
	if opts.ManifestPath == "" {
		return selection.Selection{}, errors.New("--manifest is required")
	}
	if opts.RepoDir == "" {
		return selection.Selection{}, errors.New("--repo-dir is required")
	}
	if opts.OutputPath == "" {
		return selection.Selection{}, errors.New("--out is required")
	}
	manifestPath, err := filepath.Abs(opts.ManifestPath)
	if err != nil {
		return selection.Selection{}, fmt.Errorf("resolve manifest: %w", err)
	}
	manifest, err := coverage.LoadManifest(manifestPath)
	if err != nil {
		return selection.Selection{}, err
	}
	repoDir, err := filepath.Abs(opts.RepoDir)
	if err != nil {
		return selection.Selection{}, fmt.Errorf("resolve repo dir: %w", err)
	}
	if info, err := os.Stat(repoDir); err != nil {
		return selection.Selection{}, fmt.Errorf("inspect repo dir: %w", err)
	} else if !info.IsDir() {
		return selection.Selection{}, fmt.Errorf("repo dir must be a directory")
	}

	sel := selection.Selection{
		SchemaVersion:     selection.SchemaVersion,
		Targets:           []selection.Target{},
		Metadata:          []selection.InputSource{{ID: manifest.ID + "-manifest", Path: manifestPath}},
		CorpusManifest:    manifestPath,
		RequireFullCorpus: true,
	}
	for _, target := range manifest.Targets {
		if target.Kind != "repository" || (target.Lifecycle != "active" && target.Lifecycle != "external") {
			continue
		}
		sel.Targets = append(sel.Targets, selection.Target{
			ID:   target.ID,
			Kind: "repository",
			Path: filepath.Join(repoDir, target.ID),
		})
	}
	sort.Slice(sel.Targets, func(i, j int) bool {
		return sel.Targets[i].ID < sel.Targets[j].ID
	})
	if err := sel.Validate(); err != nil {
		return selection.Selection{}, err
	}
	if err := writeSelection(opts.OutputPath, sel, opts.Force); err != nil {
		return selection.Selection{}, err
	}
	return sel, nil
}

func writeSelection(path string, sel selection.Selection, force bool) error {
	if path == "" {
		return errors.New("--out is required")
	}
	parent := filepath.Dir(path)
	info, err := os.Stat(parent)
	if err != nil {
		return fmt.Errorf("output parent must exist: %w", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("output parent is not a directory")
	}
	if existing, err := os.Lstat(path); err == nil {
		if existing.Mode()&os.ModeSymlink != 0 {
			return fmt.Errorf("output path must not be a symlink")
		}
		if existing.IsDir() {
			return fmt.Errorf("output path must not be a directory")
		}
		if !force {
			return fmt.Errorf("output path already exists; use --force to overwrite")
		}
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("inspect output path: %w", err)
	}
	data, err := json.MarshalIndent(sel, "", "  ")
	if err != nil {
		return fmt.Errorf("encode selection: %w", err)
	}
	return os.WriteFile(path, append(data, '\n'), 0o644)
}
