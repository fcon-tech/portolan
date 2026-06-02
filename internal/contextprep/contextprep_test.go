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

func TestSanitizeToolOutputName(t *testing.T) {
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
