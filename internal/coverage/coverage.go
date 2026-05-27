package coverage

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"

	"github.com/fall-out-bug/portolan/internal/graph"
	"github.com/fall-out-bug/portolan/internal/selection"
)

const SchemaVersion = "0.1.0"

type Ledger struct {
	SchemaVersion string         `json:"schema_version"`
	GeneratedBy   string         `json:"generated_by"`
	Scope         Scope          `json:"scope"`
	Records       []Record       `json:"records"`
	Summary       map[string]int `json:"summary"`
}

type Scope struct {
	SelectionPath     string `json:"selection_path,omitempty"`
	CorpusManifest    string `json:"corpus_manifest,omitempty"`
	RequireFullCorpus bool   `json:"require_full_corpus"`
}

type Record struct {
	ID            string `json:"id"`
	Kind          string `json:"kind"`
	Status        string `json:"status"`
	EvidenceState string `json:"evidence_state"`
	Source        string `json:"source"`
	Reason        string `json:"reason"`
}

type Manifest struct {
	SchemaVersion string           `json:"schema_version"`
	ID            string           `json:"id"`
	Targets       []ManifestTarget `json:"targets"`
}

type ManifestTarget struct {
	ID            string   `json:"id"`
	Label         string   `json:"label"`
	Kind          string   `json:"kind"`
	Lifecycle     string   `json:"lifecycle"`
	Role          string   `json:"role"`
	EvidenceState string   `json:"evidence_state"`
	DependsOn     []string `json:"depends_on"`
}

func Build(sel selection.Selection, selectionPath string, manifestPath string) (Ledger, error) {
	records := recordsForSelection(sel)
	if manifestPath == "" && sel.RequireFullCorpus {
		records = append(records, Record{
			ID:            "corpus-manifest",
			Kind:          "corpus-manifest",
			Status:        "blocked",
			EvidenceState: string(graph.CannotVerify),
			Source:        "",
			Reason:        "require_full_corpus is true but corpus_manifest is not set",
		})
	}
	if manifestPath != "" {
		manifest, err := LoadManifest(manifestPath)
		if err != nil {
			status := "cannot_verify"
			if sel.RequireFullCorpus {
				status = "blocked"
			}
			records = append(records, Record{
				ID:            "corpus-manifest",
				Kind:          "corpus-manifest",
				Status:        status,
				EvidenceState: string(graph.CannotVerify),
				Source:        manifestPath,
				Reason:        err.Error(),
			})
		} else {
			records = append(records, recordsForManifest(sel, manifest, manifestPath)...)
		}
	}
	sortRecords(records)
	return Ledger{
		SchemaVersion: SchemaVersion,
		GeneratedBy:   "portolan",
		Scope: Scope{
			SelectionPath:     selectionPath,
			CorpusManifest:    manifestPath,
			RequireFullCorpus: sel.RequireFullCorpus,
		},
		Records: records,
		Summary: summarize(records),
	}, nil
}

func BlockingReasons(ledger Ledger) []string {
	var reasons []string
	for _, record := range ledger.Records {
		if record.Status == "blocked" {
			reasons = append(reasons, record.ID+": "+record.Reason)
		}
	}
	sort.Strings(reasons)
	return reasons
}

func Write(path string, ledger Ledger) error {
	data, err := json.MarshalIndent(ledger, "", "  ")
	if err != nil {
		return fmt.Errorf("encode coverage: %w", err)
	}
	return os.WriteFile(path, append(data, '\n'), 0o644)
}

func LoadManifest(path string) (Manifest, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return Manifest{}, fmt.Errorf("read corpus manifest: %w", err)
	}
	var manifest Manifest
	decoder := json.NewDecoder(bytes.NewReader(data))
	if err := decoder.Decode(&manifest); err != nil {
		return Manifest{}, fmt.Errorf("parse corpus manifest: %w", err)
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		return Manifest{}, fmt.Errorf("parse corpus manifest: trailing JSON content")
	}
	if manifest.SchemaVersion != SchemaVersion {
		return Manifest{}, fmt.Errorf("corpus manifest schema_version must be %q", SchemaVersion)
	}
	return manifest, nil
}

func recordsForSelection(sel selection.Selection) []Record {
	var records []Record
	for _, target := range sel.Targets {
		records = append(records, pathRecord(target.ID, target.Kind, string(graph.SourceVisible), target.Path, true))
	}
	for _, source := range sel.Metadata {
		records = append(records, pathRecord(source.ID, "metadata", string(graph.MetadataVisible), source.Path, false))
	}
	for _, source := range sel.Runtime {
		records = append(records, pathRecord(source.ID, "runtime", string(graph.RuntimeVisible), source.Path, false))
	}
	for _, source := range sel.Claims {
		records = append(records, pathRecord(source.ID, "claim", string(graph.ClaimOnly), source.Path, false))
	}
	for _, blackBox := range sel.BlackBoxes {
		records = append(records, Record{
			ID:            blackBox.ID,
			Kind:          "black-box-" + blackBox.Kind,
			Status:        "represented",
			EvidenceState: string(graph.Unknown),
			Source:        blackBox.Label,
			Reason:        "black-box target represented without direct source access",
		})
	}
	for _, source := range sel.ToolOutputs {
		record := pathRecord(source.ID, "tool-output-"+source.Kind, string(graph.MetadataVisible), source.Path, false)
		if len(source.Limitations) > 0 {
			record.Reason = record.Reason + "; limitations declared"
		}
		records = append(records, record)
	}
	return records
}

func pathRecord(id, kind, state, path string, directory bool) Record {
	record := Record{ID: id, Kind: kind, EvidenceState: state, Source: path}
	if directory {
		linkInfo, err := os.Lstat(path)
		if err != nil {
			record.Status = "missing"
			record.EvidenceState = string(graph.Unknown)
			record.Reason = "path does not exist"
			if !os.IsNotExist(err) {
				record.Status = "cannot_verify"
				record.EvidenceState = string(graph.CannotVerify)
				record.Reason = err.Error()
			}
			return record
		}
		if linkInfo.Mode()&os.ModeSymlink != 0 {
			record.Status = "cannot_verify"
			record.EvidenceState = string(graph.CannotVerify)
			record.Reason = "path is a symlink"
			return record
		}
	}
	info, err := os.Stat(path)
	if err != nil {
		record.Status = "missing"
		record.EvidenceState = string(graph.Unknown)
		record.Reason = "path does not exist"
		if !os.IsNotExist(err) {
			record.Status = "cannot_verify"
			record.EvidenceState = string(graph.CannotVerify)
			record.Reason = err.Error()
		}
		return record
	}
	if directory && !info.IsDir() {
		record.Status = "cannot_verify"
		record.EvidenceState = string(graph.CannotVerify)
		record.Reason = "path is not a directory"
		return record
	}
	if !directory && info.IsDir() {
		record.Status = "cannot_verify"
		record.EvidenceState = string(graph.CannotVerify)
		record.Reason = "path is a directory"
		return record
	}
	record.Status = "visible"
	record.Reason = "local path visible"
	return record
}

func recordsForManifest(sel selection.Selection, manifest Manifest, manifestPath string) []Record {
	selected := map[string]selection.Target{}
	for _, target := range sel.Targets {
		selected[target.ID] = target
	}
	expected := map[string]struct{}{}
	records := []Record{{
		ID:            manifest.ID,
		Kind:          "corpus-manifest",
		Status:        "visible",
		EvidenceState: string(graph.MetadataVisible),
		Source:        manifestPath,
		Reason:        "corpus manifest visible",
	}}
	for _, target := range manifest.Targets {
		expected[target.ID] = struct{}{}
		record := Record{
			ID:            "manifest:" + target.ID,
			Kind:          "manifest-" + target.Kind,
			Status:        "represented",
			EvidenceState: target.EvidenceState,
			Source:        manifestPath,
			Reason:        "manifest target represented",
		}
		selectedTarget, ok := selected[target.ID]
		if requiresSourceRepository(target) {
			if !ok {
				record.Status = "missing"
				if sel.RequireFullCorpus {
					record.Status = "blocked"
				}
				record.EvidenceState = string(graph.Unknown)
				record.Reason = "required active or external source repository is absent from selection"
			} else if !sourceVisibleDirectory(selectedTarget.Path) {
				record.Status = "blocked"
				record.EvidenceState = string(graph.CannotVerify)
				record.Source = selectedTarget.Path
				record.Reason = "required active or external source repository is not source-visible locally"
			} else {
				record.Status = "visible"
				record.EvidenceState = string(graph.SourceVisible)
				record.Source = selectedTarget.Path
				record.Reason = "required source repository is local and visible"
			}
		}
		records = append(records, record)
	}
	for _, target := range sel.Targets {
		if _, ok := expected[target.ID]; ok {
			continue
		}
		record := pathRecord("extra:"+target.ID, "selected-extra-"+target.Kind, string(graph.SourceVisible), target.Path, true)
		switch record.Status {
		case "visible":
			record.Status = "extra"
			record.Reason = "selected local target is visible but absent from corpus manifest"
		case "missing":
			record.Status = "cannot_verify"
			record.Reason = "selected local target is absent from corpus manifest, but local path is missing"
		default:
			record.Status = "cannot_verify"
			record.Reason = "selected local target is absent from corpus manifest, but local path cannot be verified"
		}
		records = append(records, record)
	}
	return records
}

func requiresSourceRepository(target ManifestTarget) bool {
	return target.Kind == "repository" && (target.Lifecycle == "active" || target.Lifecycle == "external")
}

func sourceVisibleDirectory(path string) bool {
	linkInfo, err := os.Lstat(path)
	if err != nil || linkInfo.Mode()&os.ModeSymlink != 0 {
		return false
	}
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}

func summarize(records []Record) map[string]int {
	summary := map[string]int{}
	for _, record := range records {
		summary["total"]++
		summary["status:"+record.Status]++
		summary["evidence_state:"+record.EvidenceState]++
	}
	return summary
}

func sortRecords(records []Record) {
	sort.Slice(records, func(i, j int) bool {
		if records[i].Kind != records[j].Kind {
			return records[i].Kind < records[j].Kind
		}
		return records[i].ID < records[j].ID
	})
}

func ResolveSelectionPaths(sel selection.Selection, selectionPath string) selection.Selection {
	base := filepath.Dir(selectionPath)
	for i := range sel.Targets {
		sel.Targets[i].Path = resolveRelative(base, sel.Targets[i].Path)
	}
	for i := range sel.Metadata {
		sel.Metadata[i].Path = resolveRelative(base, sel.Metadata[i].Path)
	}
	for i := range sel.Runtime {
		sel.Runtime[i].Path = resolveRelative(base, sel.Runtime[i].Path)
	}
	for i := range sel.Claims {
		sel.Claims[i].Path = resolveRelative(base, sel.Claims[i].Path)
	}
	for i := range sel.ToolOutputs {
		sel.ToolOutputs[i].Path = resolveRelative(base, sel.ToolOutputs[i].Path)
	}
	for i := range sel.BlackBoxes {
		for j := range sel.BlackBoxes[i].Metadata {
			sel.BlackBoxes[i].Metadata[j].Path = resolveRelative(base, sel.BlackBoxes[i].Metadata[j].Path)
		}
		for j := range sel.BlackBoxes[i].Runtime {
			sel.BlackBoxes[i].Runtime[j].Path = resolveRelative(base, sel.BlackBoxes[i].Runtime[j].Path)
		}
		for j := range sel.BlackBoxes[i].Claims {
			sel.BlackBoxes[i].Claims[j].Path = resolveRelative(base, sel.BlackBoxes[i].Claims[j].Path)
		}
	}
	if sel.CorpusManifest != "" {
		sel.CorpusManifest = resolveRelative(base, sel.CorpusManifest)
	}
	return sel
}

func resolveRelative(base, path string) string {
	if path == "" || filepath.IsAbs(path) {
		return path
	}
	return filepath.Clean(filepath.Join(base, path))
}
