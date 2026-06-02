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

func TestRunAddsShardedSyftCommandsForMultipleRepositories(t *testing.T) {
	root := t.TempDir()
	apiRepo := filepath.Join(root, "repos", "api")
	workerRepo := filepath.Join(root, "repos", "worker")
	mustMkdirContextprep(t, filepath.Join(apiRepo, ".git"))
	mustMkdirContextprep(t, filepath.Join(workerRepo, ".git"))
	mustWriteContextprep(t, filepath.Join(apiRepo, "go.mod"), "module example.com/api\n")
	mustWriteContextprep(t, filepath.Join(workerRepo, "package.json"), `{"name":"worker"}`)

	bin := filepath.Join(t.TempDir(), "bin")
	mustMkdirContextprep(t, bin)
	syft := filepath.Join(bin, "syft")
	mustWriteContextprep(t, syft, "#!/bin/sh\nexit 0\n")
	if err := os.Chmod(syft, 0o755); err != nil {
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
	syftPlan := byID["cyclonedx"]
	if syftPlan.Status != "available_not_run" || syftPlan.EvidenceState != "not_assessed" {
		t.Fatalf("syft plan = %#v, want available_not_run/not_assessed", syftPlan)
	}
	if len(syftPlan.Commands) != 2 {
		t.Fatalf("syft commands = %#v, want one command per repository shard", syftPlan.Commands)
	}

	seenReads := map[string]bool{}
	expectedWrites := map[string]string{
		apiRepo:    filepath.Join(plan.ToolOutputDir, "syft", "api.cyclonedx.json"),
		workerRepo: filepath.Join(plan.ToolOutputDir, "syft", "worker.cyclonedx.json"),
	}
	for _, command := range syftPlan.Commands {
		if !command.RequiresUserApproval || command.MutatesTarget {
			t.Fatalf("syft command = %#v, want approval-required read-only native command", command)
		}
		if command.AfterRun == "" {
			t.Fatalf("syft command = %#v, want after_run context refresh command", command)
		}
		if len(command.Reads) != 1 || command.Reads[0] == root {
			t.Fatalf("syft command reads = %#v, want one repository shard and not full root", command.Reads)
		}
		seenReads[command.Reads[0]] = true
		assertPathsUnderRoot(t, command.Reads, root)
		assertWritesUnderContextToolOutput(t, command.Writes, plan.ToolOutputDir)
		if len(command.Writes) != 1 || command.Writes[0] != expectedWrites[command.Reads[0]] {
			t.Fatalf("syft command writes = %#v for reads %#v, want exact shard path %q", command.Writes, command.Reads, expectedWrites[command.Reads[0]])
		}
		args := strings.Join(command.Args, " ")
		for _, want := range []string{
			"--exclude ./.portolan/**",
			"--exclude ./run/**",
			"cyclonedx-json=" + command.Writes[0],
		} {
			if !strings.Contains(args, want) {
				t.Fatalf("syft args = %q, want %q", args, want)
			}
		}
		if !strings.Contains(strings.Join(command.Limits, " "), "repository shard only") {
			t.Fatalf("syft limits = %#v, want shard-only boundary", command.Limits)
		}
	}
	for _, want := range []string{apiRepo, workerRepo} {
		if !seenReads[want] {
			t.Fatalf("syft commands read %#v, want shard for %q", seenReads, want)
		}
	}
}

func TestRunKeepsSingleRepositorySyftCommandUnsharded(t *testing.T) {
	root := t.TempDir()
	mustMkdirContextprep(t, filepath.Join(root, ".git"))
	mustWriteContextprep(t, filepath.Join(root, "go.mod"), "module example.com/root\n")

	bin := filepath.Join(t.TempDir(), "bin")
	mustMkdirContextprep(t, bin)
	syft := filepath.Join(bin, "syft")
	mustWriteContextprep(t, syft, "#!/bin/sh\nexit 0\n")
	if err := os.Chmod(syft, 0o755); err != nil {
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
	syftPlan := byID["cyclonedx"]
	if len(syftPlan.Commands) != 1 {
		t.Fatalf("syft commands = %#v, want one single-repository command", syftPlan.Commands)
	}
	command := syftPlan.Commands[0]
	if len(command.Reads) != 1 || command.Reads[0] != root {
		t.Fatalf("syft command reads = %#v, want root repository only", command.Reads)
	}
	if len(command.Writes) != 1 || command.Writes[0] != filepath.Join(plan.ToolOutputDir, "syft.cyclonedx.json") {
		t.Fatalf("syft command writes = %#v, want unsharded report path", command.Writes)
	}
}

func TestToolOutputNameSanitizingAndUniqueness(t *testing.T) {
	tests := map[string]string{
		"Apache Spark":    "apache-spark",
		"../Repo/Name":    "repo-name",
		"service_01.prod": "service-01-prod",
		"***":             "repository",
	}
	for input, want := range tests {
		if got := sanitizeToolOutputName(input); got != want {
			t.Fatalf("sanitizeToolOutputName(%q) = %q, want %q", input, got, want)
		}
	}
	used := map[string]int{}
	first := uniqueToolOutputName(sanitizeToolOutputName("my-repo"), used)
	second := uniqueToolOutputName(sanitizeToolOutputName("my_repo"), used)
	if first != "my-repo" || second != "my-repo-2" {
		t.Fatalf("unique output names = (%q, %q), want (my-repo, my-repo-2)", first, second)
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
