package contextprep

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

func TestRunAddsBuildToolDependencyProducerPlans(t *testing.T) {
	root := t.TempDir()
	mavenRepo := filepath.Join(root, "repos", "maven-service")
	mavenSecondRepo := filepath.Join(root, "repos", "maven-worker")
	gradleRepo := filepath.Join(root, "repos", "gradle-service")
	mustMkdirContextprep(t, filepath.Join(mavenRepo, ".git"))
	mustMkdirContextprep(t, filepath.Join(mavenSecondRepo, ".git"))
	mustMkdirContextprep(t, filepath.Join(gradleRepo, ".git"))
	mustWriteContextprep(t, filepath.Join(mavenRepo, "pom.xml"), `<project><artifactId>maven-service</artifactId></project>`)
	mustWriteContextprep(t, filepath.Join(mavenSecondRepo, "pom.xml"), `<project><artifactId>maven-worker</artifactId></project>`)
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
	if maven.Producer != "cyclonedx-maven-plugin" || len(maven.Commands) != 2 {
		t.Fatalf("maven plan = %#v, want one CycloneDX Maven command per repository", maven)
	}
	seenMavenPOMs := map[string]bool{}
	for _, mavenCommand := range maven.Commands {
		if !mavenCommand.RequiresUserApproval || !mavenCommand.MutatesTarget {
			t.Fatalf("maven command = %#v, want approval-required command with mutation risk", mavenCommand)
		}
		assertPathsUnderRoot(t, mavenCommand.Reads, root)
		assertWritesUnderContextToolOutput(t, mavenCommand.Writes, plan.ToolOutputDir)
		mavenArgs := strings.Join(mavenCommand.Args, " ")
		for _, want := range []string{
			"org.cyclonedx:cyclonedx-maven-plugin:makeAggregateBom",
			"-DoutputFormat=json",
			"-DoutputDirectory=" + filepath.Join(plan.ToolOutputDir, "maven-cyclonedx"),
		} {
			if !strings.Contains(mavenArgs, want) {
				t.Fatalf("maven args = %q, want %q", mavenArgs, want)
			}
		}
		for _, pom := range []string{
			filepath.Join(mavenRepo, "pom.xml"),
			filepath.Join(mavenSecondRepo, "pom.xml"),
		} {
			if strings.Contains(mavenArgs, pom) {
				seenMavenPOMs[pom] = true
			}
		}
		if !strings.Contains(mavenCommand.Network, "possible") {
			t.Fatalf("maven network = %q, want possible dependency/plugin resolution boundary", mavenCommand.Network)
		}
	}
	for _, pom := range []string{
		filepath.Join(mavenRepo, "pom.xml"),
		filepath.Join(mavenSecondRepo, "pom.xml"),
	} {
		if !seenMavenPOMs[pom] {
			t.Fatalf("maven commands did not include pom %q: %#v", pom, maven.Commands)
		}
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

func TestMavenCycloneDXPlanCapsRepositoryCommands(t *testing.T) {
	root := t.TempDir()
	bin := filepath.Join(t.TempDir(), "bin")
	mustMkdirContextprep(t, bin)
	pathMaven := filepath.Join(bin, "mvn")
	mustWriteContextprep(t, pathMaven, "#!/bin/sh\nexit 0\n")
	if err := os.Chmod(pathMaven, 0o755); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", bin)

	var surface buildToolSurface
	for i := 0; i < maxBuildToolCommandsPerPlan+2; i++ {
		repoID := "service-" + strconv.Itoa(i)
		repoPath := filepath.Join(root, "repos", repoID)
		pom := filepath.Join(repoPath, "pom.xml")
		mustWriteContextprep(t, pom, `<project></project>`)
		surface.MavenCount++
		surface.MavenRepos = append(surface.MavenRepos, buildToolRepoSurface{
			RepositoryID: repoID,
			RepoPath:     repoPath,
			Sample:       pom,
			Count:        1,
		})
	}

	toolOutputDir := filepath.Join(root, ".portolan", "context", "tool-outputs")
	plan := mavenCycloneDXPlan(root, filepath.Dir(toolOutputDir), toolOutputDir, false, surface)

	if len(plan.Commands) != maxBuildToolCommandsPerPlan {
		t.Fatalf("command count = %d, want cap %d", len(plan.Commands), maxBuildToolCommandsPerPlan)
	}
	if !strings.Contains(plan.Reason, "capped") {
		t.Fatalf("plan reason = %q, want capped command list disclosure", plan.Reason)
	}
}

func TestRunAddsShardedJSCPDCommandsForMultipleRepositories(t *testing.T) {
	root := t.TempDir()
	apiRepo := filepath.Join(root, "repos", "api")
	workerRepo := filepath.Join(root, "repos", "worker")
	mustMkdirContextprep(t, filepath.Join(apiRepo, ".git"))
	mustMkdirContextprep(t, filepath.Join(workerRepo, ".git"))
	mustWriteContextprep(t, filepath.Join(apiRepo, "main.go"), "package main\n")
	mustWriteContextprep(t, filepath.Join(workerRepo, "main.go"), "package main\n")

	bin := filepath.Join(t.TempDir(), "bin")
	mustMkdirContextprep(t, bin)
	jscpd := filepath.Join(bin, "jscpd")
	mustWriteContextprep(t, jscpd, "#!/bin/sh\nexit 0\n")
	if err := os.Chmod(jscpd, 0o755); err != nil {
		t.Fatal(err)
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
	jscpdPlan := byID["jscpd"]
	if jscpdPlan.Status != "available_not_run" || jscpdPlan.EvidenceState != "not_assessed" {
		t.Fatalf("jscpd plan = %#v, want available_not_run/not_assessed", jscpdPlan)
	}
	if len(jscpdPlan.Commands) != 2 {
		t.Fatalf("jscpd commands = %#v, want one command per repository shard", jscpdPlan.Commands)
	}

	seenReads := map[string]bool{}
	expectedWrites := map[string]string{
		apiRepo:    filepath.Join(plan.ToolOutputDir, "jscpd", "api", "jscpd-report.json"),
		workerRepo: filepath.Join(plan.ToolOutputDir, "jscpd", "worker", "jscpd-report.json"),
	}
	for _, command := range jscpdPlan.Commands {
		if !command.RequiresUserApproval || command.MutatesTarget {
			t.Fatalf("jscpd command = %#v, want approval-required read-only native command", command)
		}
		if len(command.Reads) != 1 {
			t.Fatalf("jscpd command reads = %#v, want one repo shard", command.Reads)
		}
		if command.Reads[0] == root {
			t.Fatalf("jscpd command = %#v, must not scan full root in multi-repo mode", command)
		}
		seenReads[command.Reads[0]] = true
		assertPathsUnderRoot(t, command.Reads, root)
		assertWritesUnderContextToolOutput(t, command.Writes, plan.ToolOutputDir)
		if len(command.Writes) != 1 || command.Writes[0] != expectedWrites[command.Reads[0]] {
			t.Fatalf("jscpd command writes = %#v for reads %#v, want exact shard path %q", command.Writes, command.Reads, expectedWrites[command.Reads[0]])
		}
		limits := strings.Join(command.Limits, " ")
		for _, want := range []string{
			"repository shard only",
			"missing, failed, or unrun shards remain not_assessed/failed",
			"cross-repository clone detection remains not_assessed",
		} {
			if !strings.Contains(limits, want) {
				t.Fatalf("jscpd limits = %q, want %q", limits, want)
			}
		}
		args := strings.Join(command.Args, " ")
		for _, want := range []string{
			"--reporters json",
			"--max-size 100kb",
			"--max-lines 1000",
			"--noSymlinks",
			"--gitignore",
		} {
			if !strings.Contains(args, want) {
				t.Fatalf("jscpd args = %q, want %q", args, want)
			}
		}
		if strings.Contains(args, "--store") || strings.Contains(args, "--exitCode") {
			t.Fatalf("jscpd args = %q, must not force store or native exit-code override", args)
		}
	}
	for _, want := range []string{apiRepo, workerRepo} {
		if !seenReads[want] {
			t.Fatalf("jscpd commands read %#v, want shard for %q", seenReads, want)
		}
	}

	contract := mustReadContextprep(t, filepath.Join(out, "answer-contract.md"))
	for _, want := range []string{
		"Run repository-sharded jscpd commands sequentially",
		"Do not aggregate missing, failed, or unrun jscpd shards into a duplication metric",
	} {
		if !strings.Contains(contract, want) {
			t.Fatalf("answer-contract.md missing %q:\n%s", want, contract)
		}
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

func TestRunKeepsSingleRepositoryJSCPDCommandUnsharded(t *testing.T) {
	root := t.TempDir()
	mustMkdirContextprep(t, filepath.Join(root, ".git"))
	mustWriteContextprep(t, filepath.Join(root, "main.go"), "package main\n")
	bin := filepath.Join(t.TempDir(), "bin")
	mustMkdirContextprep(t, bin)
	jscpd := filepath.Join(bin, "jscpd")
	mustWriteContextprep(t, jscpd, "#!/bin/sh\nexit 0\n")
	if err := os.Chmod(jscpd, 0o755); err != nil {
		t.Fatal(err)
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
	jscpdPlan := byID["jscpd"]
	if strings.Contains(jscpdPlan.Reason, "repository shards") {
		t.Fatalf("jscpd plan reason = %q, must not claim sharded mode for a single repository", jscpdPlan.Reason)
	}
	if len(jscpdPlan.Commands) != 1 {
		t.Fatalf("jscpd commands = %#v, want one single-repository command", jscpdPlan.Commands)
	}
	command := jscpdPlan.Commands[0]
	if len(command.Reads) != 1 || command.Reads[0] != root {
		t.Fatalf("jscpd command reads = %#v, want root repository only", command.Reads)
	}
	if len(command.Writes) != 1 || command.Writes[0] != filepath.Join(plan.ToolOutputDir, "jscpd-report.json") {
		t.Fatalf("jscpd command writes = %#v, want unsharded report path", command.Writes)
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
