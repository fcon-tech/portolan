package query

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestRunFindingsReturnsBoundedRecordsWithReferences(t *testing.T) {
	bundle := writeBundle(t, map[string]string{
		"coverage.json": `{
  "schema_version": "0.1.0",
  "generated_by": "portolan",
  "records": [],
  "summary": {}
}`,
		"findings.jsonl": strings.Join([]string{
			`{"id":"finding-alpha","kind":"relationships","summary":"alpha relationship","severity":"medium","evidence_state":"source-visible","evidence_source":"graph.json","confidence":0.9,"status":"observed"}`,
			`{"id":"finding-beta","kind":"relationships","summary":"beta relationship","severity":"low","evidence_state":"metadata-visible","evidence_source":"findings.jsonl","confidence":0.7,"status":"observed"}`,
			`{"id":"finding-gamma","kind":"relationships","summary":"gamma relationship","severity":"low","evidence_state":"claim-only","evidence_source":"claims.json","confidence":0.5,"status":"claim-only"}`,
			`{"id":"finding-duplication","kind":"duplication","summary":"duplicate config","severity":"low","evidence_state":"source-visible","evidence_source":"findings.jsonl","confidence":0.8,"status":"observed"}`,
		}, "\n") + "\n",
	})

	result, err := Run(Options{
		BundlePath: bundle,
		Family:     FamilyFindings,
		Kind:       "relationships",
		Limit:      2,
	})
	if err != nil {
		t.Fatalf("Run returned error: %v", err)
	}

	if result.SchemaVersion != SchemaVersion {
		t.Fatalf("schema_version = %q, want %q", result.SchemaVersion, SchemaVersion)
	}
	if result.Query.Family != FamilyFindings || result.Query.Kind != "relationships" || result.Query.Limit != 2 {
		t.Fatalf("query = %#v, want findings relationships limit 2", result.Query)
	}
	if got := len(result.Records); got != 2 {
		t.Fatalf("records = %d, want 2", got)
	}
	if !result.Truncated || result.TruncatedRecords != 1 {
		t.Fatalf("truncation = %v/%d, want true/1", result.Truncated, result.TruncatedRecords)
	}
	first := result.Records[0]
	if first.ID != "finding-alpha" || first.RecordID != "finding-alpha" {
		t.Fatalf("first id = %#v, want finding-alpha", first)
	}
	if first.Reference != "portolan://bundle/findings/finding-alpha" {
		t.Fatalf("reference = %q, want stable finding reference", first.Reference)
	}
	if first.BundlePath != bundle || first.Artifact != "findings.jsonl" || first.EvidenceSource != "graph.json" {
		t.Fatalf("first record = %#v, want bundle/artifact/evidence source", first)
	}
	if first.EvidenceState != "source-visible" || first.Status != "observed" {
		t.Fatalf("first record = %#v, want preserved evidence state/status", first)
	}
}

func TestRunGapsIncludesWeakCoverageAndFindingRecords(t *testing.T) {
	bundle := writeBundle(t, map[string]string{
		"coverage.json": `{
  "schema_version": "0.1.0",
  "generated_by": "portolan",
  "records": [
    {"id":"repo-visible","kind":"repository","status":"visible","evidence_state":"source-visible","source":"repo","reason":"local path visible"},
    {"id":"external-completeness","kind":"external-completeness","status":"unknown","evidence_state":"unknown","source":"coverage.json","reason":"external estate completeness was not assessed"},
    {"id":"runtime-topology","kind":"runtime","status":"not_assessed","evidence_state":"not_assessed","source":"coverage.json","reason":"runtime observations were not supplied"}
  ],
  "summary": {}
}`,
		"findings.jsonl": strings.Join([]string{
			`{"id":"finding-observed","kind":"relationships","summary":"observed relationship","severity":"low","evidence_state":"source-visible","evidence_source":"graph.json","confidence":0.9,"status":"observed"}`,
			`{"id":"finding-unsupported-languages-not-assessed","kind":"relationships","summary":"Unsupported language relationship detectors remain not_assessed.","severity":"info","evidence_state":"not_assessed","evidence_source":"findings.jsonl","confidence":0,"status":"not_assessed"}`,
			`{"id":"finding-unresolved","kind":"technical-debt","summary":"Coverage must be resolved before architecture conclusions.","severity":"medium","evidence_state":"unknown","evidence_source":"coverage.json","confidence":0.7,"status":"unknown"}`,
		}, "\n") + "\n",
	})

	result, err := Run(Options{
		BundlePath: bundle,
		Family:     FamilyGaps,
		Limit:      10,
	})
	if err != nil {
		t.Fatalf("Run returned error: %v", err)
	}

	if result.Query.Family != FamilyGaps {
		t.Fatalf("query = %#v, want gaps", result.Query)
	}
	if result.Truncated {
		t.Fatalf("truncated = true, want false")
	}
	records := recordsByID(result.Records)
	for _, want := range []string{"external-completeness", "runtime-topology", "finding-unsupported-languages-not-assessed", "finding-unresolved"} {
		if _, ok := records[want]; !ok {
			t.Fatalf("records = %#v, missing %s", records, want)
		}
	}
	if got := records["external-completeness"].Reason; got != "external estate completeness was not assessed" {
		t.Fatalf("coverage reason = %q, want source reason", got)
	}
	if got := records["runtime-topology"].EvidenceState; got != "not_assessed" {
		t.Fatalf("runtime evidence_state = %q, want not_assessed", got)
	}
	finding := records["finding-unsupported-languages-not-assessed"]
	if finding.Artifact != "findings.jsonl" || finding.Reason == "" || !strings.Contains(finding.Reason, "not_assessed") {
		t.Fatalf("weak finding = %#v, want finding artifact and summary reason", finding)
	}
	if finding.Reference != "portolan://bundle/findings/finding-unsupported-languages-not-assessed" {
		t.Fatalf("reference = %q, want stable weak finding reference", finding.Reference)
	}
}

func TestRunEscapesReferenceIDs(t *testing.T) {
	bundle := writeBundle(t, map[string]string{
		"coverage.json": `{"schema_version":"0.1.0","generated_by":"portolan","records":[],"summary":{}}`,
		"findings.jsonl": `{"id":"finding/with space","kind":"relationships","summary":"escaped reference","severity":"low","evidence_state":"source-visible","evidence_source":"graph.json","confidence":0.9,"status":"observed"}
`,
	})

	result, err := Run(Options{
		BundlePath: bundle,
		Family:     FamilyFindings,
		Kind:       "relationships",
		Limit:      1,
	})
	if err != nil {
		t.Fatalf("Run returned error: %v", err)
	}
	if got := result.Records[0].Reference; got != "portolan://bundle/findings/finding%2Fwith%20space" {
		t.Fatalf("reference = %q, want escaped URI path segment", got)
	}
}

func TestRunRejectsUnsafeOrMalformedBundleInput(t *testing.T) {
	t.Run("limit too large", func(t *testing.T) {
		bundle := writeBundle(t, map[string]string{
			"coverage.json":  `{"schema_version":"0.1.0","generated_by":"portolan","records":[],"summary":{}}`,
			"findings.jsonl": "",
		})
		_, err := Run(Options{BundlePath: bundle, Family: FamilyGaps, Limit: MaxLimit + 1})
		if err == nil || !strings.Contains(err.Error(), "--limit") {
			t.Fatalf("err = %v, want limit error", err)
		}
	})

	t.Run("malformed findings", func(t *testing.T) {
		bundle := writeBundle(t, map[string]string{
			"coverage.json":  `{"schema_version":"0.1.0","generated_by":"portolan","records":[],"summary":{}}`,
			"findings.jsonl": "{not-json}\n",
		})
		_, err := Run(Options{BundlePath: bundle, Family: FamilyFindings, Kind: "relationships", Limit: 1})
		if err == nil || !strings.Contains(err.Error(), "parse findings") {
			t.Fatalf("err = %v, want parse findings error", err)
		}
	})

	t.Run("missing finding kind", func(t *testing.T) {
		bundle := writeBundle(t, map[string]string{
			"coverage.json":  `{"schema_version":"0.1.0","generated_by":"portolan","records":[],"summary":{}}`,
			"findings.jsonl": `{"id":"missing-kind","summary":"bad record","evidence_state":"unknown","status":"unknown"}` + "\n",
		})
		_, err := Run(Options{BundlePath: bundle, Family: FamilyGaps, Limit: 1})
		if err == nil || !strings.Contains(err.Error(), "kind is required") {
			t.Fatalf("err = %v, want missing kind error", err)
		}
	})

	t.Run("symlinked artifact", func(t *testing.T) {
		dir := t.TempDir()
		target := filepath.Join(dir, "target-findings.jsonl")
		if err := os.WriteFile(target, []byte(""), 0o644); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(dir, "coverage.json"), []byte(`{"schema_version":"0.1.0","generated_by":"portolan","records":[],"summary":{}}`), 0o644); err != nil {
			t.Fatal(err)
		}
		if err := os.Symlink(target, filepath.Join(dir, "findings.jsonl")); err != nil {
			t.Skipf("symlink unavailable: %v", err)
		}
		_, err := Run(Options{BundlePath: dir, Family: FamilyFindings, Kind: "relationships", Limit: 1})
		if err == nil || !strings.Contains(err.Error(), "symlink") {
			t.Fatalf("err = %v, want symlink error", err)
		}
	})
}

func writeBundle(t *testing.T, files map[string]string) string {
	t.Helper()
	dir := t.TempDir()
	for name, contents := range files {
		path := filepath.Join(dir, name)
		if err := os.WriteFile(path, []byte(contents), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	abs, err := filepath.Abs(dir)
	if err != nil {
		t.Fatal(err)
	}
	return abs
}

func recordsByID(records []Record) map[string]Record {
	byID := map[string]Record{}
	for _, record := range records {
		byID[record.ID] = record
	}
	return byID
}
