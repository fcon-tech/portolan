package contextprep

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestRunAddsBuildToolDependencyProducerPlans(t *testing.T) {
	root := t.TempDir()
	mavenRepo := filepath.Join(root, "repos", "maven-service")
	gradleRepo := filepath.Join(root, "repos", "gradle-service")
	mustMkdirContextprep(t, filepath.Join(mavenRepo, ".git"))
	mustMkdirContextprep(t, filepath.Join(gradleRepo, ".git"))
	mustWriteContextprep(t, filepath.Join(mavenRepo, "pom.xml"), `<project><artifactId>maven-service</artifactId></project>`)
	mustWriteContextprep(t, filepath.Join(gradleRepo, "build.gradle.kts"), `plugins { java }`)

	bin := filepath.Join(t.TempDir(), "bin")
	mustMkdirContextprep(t, bin)
	for _, name := range []string{"mvn", "gradle"} {
		path := filepath.Join(bin, name)
		mustWriteContextprep(t, path, "#!/bin/sh\nexit 0\n")
		if err := os.Chmod(path, 0o755); err != nil {
			t.Fatal(err)
		}
	}
	t.Setenv("PATH", bin)

	out := filepath.Join(root, ".portolan", "context")
	if _, err := Run(Options{RootPath: root, OutputPath: out, Profile: "agent"}); err != nil {
		t.Fatalf("Run returned error: %v", err)
	}

	plan := readOSSPlanContextprep(t, filepath.Join(out, "oss-plan.json"))
	byID := map[string]OSSToolPlan{}
	for _, tool := range plan.Tools {
		byID[tool.ID] = tool
	}

	maven := byID["maven-cyclonedx"]
	if maven.Status != "available_not_run" || maven.EvidenceState != "not_assessed" {
		t.Fatalf("maven plan = %#v, want available_not_run/not_assessed", maven)
	}
	if maven.Producer != "cyclonedx-maven-plugin" || len(maven.Commands) != 1 {
		t.Fatalf("maven plan = %#v, want one CycloneDX Maven command", maven)
	}
	mavenCommand := maven.Commands[0]
	if !mavenCommand.RequiresUserApproval || !mavenCommand.MutatesTarget {
		t.Fatalf("maven command = %#v, want approval-required command with mutation risk", mavenCommand)
	}
	assertPathsUnderRoot(t, mavenCommand.Reads, root)
	assertWritesUnderContextToolOutput(t, mavenCommand.Writes, plan.ToolOutputDir)
	mavenArgs := strings.Join(mavenCommand.Args, " ")
	for _, want := range []string{
		"org.cyclonedx:cyclonedx-maven-plugin:makeAggregateBom",
		"-DoutputFormat=json",
		"-DoutputDirectory=" + plan.ToolOutputDir,
		filepath.Join(mavenRepo, "pom.xml"),
	} {
		if !strings.Contains(mavenArgs, want) {
			t.Fatalf("maven args = %q, want %q", mavenArgs, want)
		}
	}
	if !strings.Contains(mavenCommand.Network, "possible") {
		t.Fatalf("maven network = %q, want possible dependency/plugin resolution boundary", mavenCommand.Network)
	}

	gradle := byID["gradle-cyclonedx"]
	if gradle.Status != "not_assessed" || gradle.EvidenceState != "not_assessed" {
		t.Fatalf("gradle plan = %#v, want not_assessed", gradle)
	}
	if gradle.Producer != "cyclonedx-gradle-plugin" || gradle.Executable == "" {
		t.Fatalf("gradle plan = %#v, want local executable and CycloneDX Gradle producer", gradle)
	}
	if len(gradle.Commands) != 0 {
		t.Fatalf("gradle commands = %#v, want no synthesized unsafe command without output-path-bounded Gradle config", gradle.Commands)
	}
	if !strings.Contains(gradle.Reason, "safe output-path-bounded") {
		t.Fatalf("gradle reason = %q, want explicit safe output-path boundary", gradle.Reason)
	}

	contract := mustReadContextprep(t, filepath.Join(out, "answer-contract.md"))
	for _, want := range []string{
		"Native Maven/Gradle build-tool producer output",
		"Java/Scala/Maven dependency relationships remain `not_assessed`",
		"Do not turn a visible `pom.xml` or `build.gradle` into a Portolan-owned JVM adapter request",
	} {
		if !strings.Contains(contract, want) {
			t.Fatalf("answer-contract.md missing %q:\n%s", want, contract)
		}
	}
	queryPlan := mustReadContextprep(t, filepath.Join(out, "query-plan.md"))
	if !strings.Contains(queryPlan, "Maven/Gradle dependency evidence") {
		t.Fatalf("query-plan.md missing Maven/Gradle dependency guidance:\n%s", queryPlan)
	}
}

func TestResolveBuildToolExecutablePrefersExecutableWrapper(t *testing.T) {
	repo := t.TempDir()
	bin := filepath.Join(t.TempDir(), "bin")
	mustMkdirContextprep(t, bin)
	pathMaven := filepath.Join(bin, "mvn")
	mustWriteContextprep(t, pathMaven, "#!/bin/sh\nexit 0\n")
	if err := os.Chmod(pathMaven, 0o755); err != nil {
		t.Fatal(err)
	}
	wrapper := filepath.Join(repo, "mvnw")
	mustWriteContextprep(t, wrapper, "#!/bin/sh\nexit 0\n")
	if err := os.Chmod(wrapper, 0o755); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", bin)

	exe, ok := resolveBuildToolExecutable(repo, "mvn", "mvnw")

	if !ok || exe != wrapper {
		t.Fatalf("resolveBuildToolExecutable = (%q, %v), want executable wrapper %q", exe, ok, wrapper)
	}
}

func TestRunWritesFreshArtifactBoundaryGuidance(t *testing.T) {
	root := t.TempDir()
	mustMkdirContextprep(t, filepath.Join(root, "repos", "service-a", ".git"))
	staleContext := filepath.Join(root, ".portolan", "stress", "old-run", "context", "answer-contract.md")
	staleProducerOutput := filepath.Join(root, ".portolan", "stress", "old-run", "tool-outputs", "compose.json")
	staleRun := filepath.Join(root, "run", "map.md")
	mustWriteContextprep(t, staleContext, "stale")
	mustWriteContextprep(t, staleProducerOutput, `{"services":{"stale":{}}}`)
	mustWriteContextprep(t, staleRun, "stale")
	mustWriteContextprep(t, filepath.Join(root, ".portolan", "producer-runs.jsonl"), strings.ReplaceAll(`{"record_type":"producer-run","id":"producer-run-stale-compose","producer_family":"deployment-model","producer_tool":"docker-compose","command":"docker compose -f .portolan/stress/old-run/compose.yml config --format json","target_root":"$ROOT","output_path":".portolan/stress/old-run/tool-outputs/compose.json","output_format":"json","scope":{"repository":"service-a","directory":"deploy","covered_units":["service:stale"]},"freshness":"2026-06-01T20:25:23Z","status":"verified","evidence_state":"metadata-visible","limitations":["static deployment model only"],"privacy_review":"not_assessed"}
{"record_type":"producer-run","id":"producer-run-stale-failed","producer_family":"deployment-model","producer_tool":"docker-compose","command":"docker compose -f .portolan/stress/old-run/failed.yml config --format json","target_root":"$ROOT","output_path":".portolan/stress/old-run/tool-outputs/compose.json","output_format":"json","scope":{"repository":"service-a","directory":"deploy","covered_units":["service:failed"]},"freshness":"2026-06-01T20:26:23Z","status":"failed","evidence_state":"cannot_verify","limitations":["previous producer run failed"],"privacy_review":"not_assessed"}`, "$ROOT", root))
	out := filepath.Join(root, ".portolan", "stress", "current-run", "context")

	if _, err := Run(Options{RootPath: root, OutputPath: out, Profile: "agent"}); err != nil {
		t.Fatalf("Run returned error: %v", err)
	}

	brief := mustReadContextprep(t, filepath.Join(out, "agent-brief.md"))
	for _, want := range []string{
		"## Fresh Artifact Boundary",
		"Current context output: `" + out + "`",
		"Sibling `.portolan/stress/*` roots",
		"root-level `run/`",
		"Local producer run records: 2 (0 verified current records; 2 not_assessed; Portolan did not execute them)",
	} {
		if !strings.Contains(brief, want) {
			t.Fatalf("agent-brief.md missing %q:\n%s", want, brief)
		}
	}
	assertTextDoesNotContainContextprep(t, brief, []string{staleContext, staleRun, "old-run"})
	if strings.Contains(brief, "`verified` records describe externally generated outputs") {
		t.Fatalf("agent-brief.md contains ambiguous producer-run status summary:\n%s", brief)
	}

	contract := mustReadContextprep(t, filepath.Join(out, "answer-contract.md"))
	for _, want := range []string{
		"Current context output: `" + out + "`",
		"no-Portolan or baseline lane",
		"contaminated and non-counting evidence",
	} {
		if !strings.Contains(contract, want) {
			t.Fatalf("answer-contract.md missing %q:\n%s", want, contract)
		}
	}
	assertTextDoesNotContainContextprep(t, contract, []string{staleContext, staleRun, "old-run"})

	queryPlan := mustReadContextprep(t, filepath.Join(out, "query-plan.md"))
	for _, want := range []string{
		"Confirm the current context boundary",
		"Sibling `.portolan/stress/*` roots",
	} {
		if !strings.Contains(queryPlan, want) {
			t.Fatalf("query-plan.md missing %q:\n%s", want, queryPlan)
		}
	}
	assertTextDoesNotContainContextprep(t, queryPlan, []string{staleContext, staleRun, "old-run"})

	for _, name := range []string{"evidence-index.jsonl", "repos.json", "tool-registry.json", "oss-plan.json", "gaps.jsonl"} {
		content := mustReadContextprep(t, filepath.Join(out, name))
		assertTextDoesNotContainContextprep(t, content, []string{staleContext, staleProducerOutput, staleRun, "old-run"})
	}

	evidenceIndex := mustReadContextprep(t, filepath.Join(out, "evidence-index.jsonl"))
	for _, want := range []string{
		`"id":"producer-run-stale-compose"`,
		`"id":"producer-run-stale-failed"`,
		`"kind":"producer-run"`,
		`"status":"not_assessed"`,
		`"evidence_state":"not_assessed"`,
		"source record was validated",
		"sibling .portolan/stress run",
	} {
		if !strings.Contains(evidenceIndex, want) {
			t.Fatalf("evidence-index.jsonl missing %q:\n%s", want, evidenceIndex)
		}
	}
	records := readEvidenceIndexContextprep(t, filepath.Join(out, "evidence-index.jsonl"))
	for _, id := range []string{"producer-run-stale-compose", "producer-run-stale-failed"} {
		record, ok := records[id]
		if !ok {
			t.Fatalf("missing evidence record %q in %#v", id, records)
		}
		if record.Status != "not_assessed" || record.EvidenceState != "not_assessed" {
			t.Fatalf("record %q = %#v, want not_assessed/not_assessed", id, record)
		}
		if record.Path != "" || record.OutputPath != "" || record.Command != "" {
			t.Fatalf("record %q leaked stale path or command: %#v", id, record)
		}
	}
}

func assertTextDoesNotContainContextprep(t *testing.T, text string, forbidden []string) {
	t.Helper()
	for _, value := range forbidden {
		if strings.Contains(text, value) {
			t.Fatalf("text contains stale artifact reference %q:\n%s", value, text)
		}
	}
}

func assertPathsUnderRoot(t *testing.T, paths []string, root string) {
	t.Helper()
	if len(paths) == 0 {
		t.Fatal("paths is empty")
	}
	prefix := root + string(filepath.Separator)
	for _, path := range paths {
		if path != root && !strings.HasPrefix(path, prefix) {
			t.Fatalf("path %q is outside root %q", path, root)
		}
	}
}

func assertWritesUnderContextToolOutput(t *testing.T, writes []string, toolOutputDir string) {
	t.Helper()
	if len(writes) == 0 {
		t.Fatal("writes is empty, want declared context output path")
	}
	prefix := toolOutputDir + string(filepath.Separator)
	for _, write := range writes {
		if !strings.HasPrefix(write, prefix) {
			t.Fatalf("write path %q is outside context tool output dir %q", write, toolOutputDir)
		}
	}
}

func readOSSPlanContextprep(t *testing.T, path string) ossPlanFile {
	t.Helper()
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var plan ossPlanFile
	if err := json.Unmarshal(raw, &plan); err != nil {
		t.Fatal(err)
	}
	return plan
}

func readEvidenceIndexContextprep(t *testing.T, path string) map[string]EvidenceRecord {
	t.Helper()
	records := map[string]EvidenceRecord{}
	for _, line := range strings.Split(mustReadContextprep(t, path), "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		var record EvidenceRecord
		if err := json.Unmarshal([]byte(line), &record); err != nil {
			t.Fatalf("unmarshal evidence record: %v\n%s", err, line)
		}
		records[record.ID] = record
	}
	return records
}

func mustMkdirContextprep(t *testing.T, path string) {
	t.Helper()
	if err := os.MkdirAll(path, 0o755); err != nil {
		t.Fatal(err)
	}
}

func mustWriteContextprep(t *testing.T, path, content string) {
	t.Helper()
	mustMkdirContextprep(t, filepath.Dir(path))
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

func mustReadContextprep(t *testing.T, path string) string {
	t.Helper()
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return string(raw)
}
