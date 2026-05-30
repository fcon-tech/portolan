package coverage

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/fcon-tech/portolan/internal/selection"
)

func TestBuildClassifiesManifestMissingAndExtraScope(t *testing.T) {
	root := t.TempDir()
	apiPath := filepath.Join(root, "api")
	extraPath := filepath.Join(root, "extra-tooling")
	t.Chdir(root)
	mkdir(t, apiPath)
	mkdir(t, extraPath)
	manifestPath := filepath.Join(root, "manifest.json")
	writeFile(t, manifestPath, `{
		"schema_version":"0.1.0",
		"id":"fixture-estate",
		"targets":[
			{"id":"api","label":"API","kind":"repository","lifecycle":"active","role":"service","evidence_state":"metadata-visible"},
			{"id":"worker","label":"Worker","kind":"repository","lifecycle":"active","role":"service","evidence_state":"metadata-visible"}
		]
	}`)
	sel := selection.Selection{
		SchemaVersion:  SchemaVersion,
		CorpusManifest: manifestPath,
		Targets: []selection.Target{
			{ID: "api", Kind: "repository", Path: apiPath},
			{ID: "extra-tooling", Kind: "repository", Path: extraPath},
		},
	}

	ledger, err := Build(sel, "selection.json", manifestPath)
	if err != nil {
		t.Fatal(err)
	}

	records := recordsByID(ledger.Records)
	if got := records["manifest:worker"]; got.Status != "missing" || got.EvidenceState != "unknown" {
		t.Fatalf("manifest:worker = %#v, want missing unknown", got)
	}
	if got := records["extra:extra-tooling"]; got.Status != "extra" || got.EvidenceState != "source-visible" {
		t.Fatalf("extra:extra-tooling = %#v, want extra source-visible", got)
	}
	if ledger.Summary["status:missing"] != 1 || ledger.Summary["status:extra"] != 1 {
		t.Fatalf("summary = %#v, want missing and extra counts", ledger.Summary)
	}
}

func TestBuildBlocksMissingRequiredManifestTargetWhenFullCorpusRequired(t *testing.T) {
	root := t.TempDir()
	manifestPath := filepath.Join(root, "manifest.json")
	writeFile(t, manifestPath, `{
		"schema_version":"0.1.0",
		"id":"fixture-estate",
		"targets":[
			{"id":"worker","label":"Worker","kind":"repository","lifecycle":"active","role":"service","evidence_state":"metadata-visible"}
		]
	}`)
	sel := selection.Selection{
		SchemaVersion:     SchemaVersion,
		CorpusManifest:    manifestPath,
		RequireFullCorpus: true,
	}

	ledger, err := Build(sel, "selection.json", manifestPath)
	if err != nil {
		t.Fatal(err)
	}

	if got := recordsByID(ledger.Records)["manifest:worker"]; got.Status != "blocked" {
		t.Fatalf("manifest:worker = %#v, want blocked", got)
	}
}

func TestBuildDoesNotConfirmExtraWhenSelectedPathIsMissing(t *testing.T) {
	root := t.TempDir()
	manifestPath := filepath.Join(root, "manifest.json")
	writeFile(t, manifestPath, `{
		"schema_version":"0.1.0",
		"id":"fixture-estate",
		"targets":[]
	}`)
	sel := selection.Selection{
		SchemaVersion:     SchemaVersion,
		CorpusManifest:    manifestPath,
		RequireFullCorpus: true,
		Targets: []selection.Target{
			{ID: "ghost", Kind: "repository", Path: filepath.Join(root, "ghost")},
		},
	}

	ledger, err := Build(sel, "selection.json", manifestPath)
	if err != nil {
		t.Fatal(err)
	}

	if got := recordsByID(ledger.Records)["extra:ghost"]; got.Status != "cannot_verify" || got.EvidenceState != "unknown" {
		t.Fatalf("extra:ghost = %#v, want cannot_verify unknown", got)
	}
}

func recordsByID(records []Record) map[string]Record {
	byID := map[string]Record{}
	for _, record := range records {
		byID[record.ID] = record
	}
	return byID
}

func mkdir(t *testing.T, path string) {
	t.Helper()
	if err := os.MkdirAll(path, 0o755); err != nil {
		t.Fatal(err)
	}
}

func writeFile(t *testing.T, path, contents string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(contents), 0o644); err != nil {
		t.Fatal(err)
	}
}
