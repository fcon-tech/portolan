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
		"Build-system and SBOM producer output can be the right first evidence path",
		"Java, Scala, Maven, Gradle, PHP, Composer, and other ecosystem relationships remain `not_assessed`",
		"not requests for Portolan-owned language or build-system adapters",
	} {
		if !strings.Contains(contract, want) {
			t.Fatalf("answer-contract.md missing %q:\n%s", want, contract)
		}
	}
	queryPlan := mustReadContextprep(t, filepath.Join(out, "query-plan.md"))
	if !strings.Contains(queryPlan, "Dependency producer evidence") {
		t.Fatalf("query-plan.md missing dependency producer guidance:\n%s", queryPlan)
	}
}

func TestRunWritesStackAgnosticToolAcquisitionGuidance(t *testing.T) {
	root := t.TempDir()
	mavenRepo := filepath.Join(root, "repos", "maven-service")
	gradleRepo := filepath.Join(root, "repos", "gradle-service")
	mustMkdirContextprep(t, filepath.Join(mavenRepo, ".git"))
	mustMkdirContextprep(t, filepath.Join(gradleRepo, ".git"))
	mustWriteContextprep(t, filepath.Join(mavenRepo, "pom.xml"), `<project><artifactId>maven-service</artifactId></project>`)
	mustWriteContextprep(t, filepath.Join(gradleRepo, "build.gradle.kts"), `plugins { java }`)

	bin := filepath.Join(t.TempDir(), "bin")
	mustMkdirContextprep(t, bin)
	for _, name := range []string{"mvn", "gradle", "syft", "jscpd"} {
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
	if len(plan.Tools) == 0 {
		t.Fatal("oss-plan has no tool candidates")
	}
	for _, tool := range plan.Tools {
		if tool.Acquisition.Kind == "" {
			t.Fatalf("tool %s missing acquisition guidance: %#v", tool.ID, tool)
		}
		if tool.Acquisition.EvidenceUntilOutput != "not_assessed" {
			t.Fatalf("tool %s acquisition evidence = %q, want not_assessed", tool.ID, tool.Acquisition.EvidenceUntilOutput)
		}
		if len(tool.Acquisition.Risks) == 0 {
			t.Fatalf("tool %s missing acquisition risks: %#v", tool.ID, tool.Acquisition)
		}
	}

	maven := toolPlanByIDContextprep(plan, "maven-cyclonedx")
	if maven.Acquisition.Kind != "native-producer-tool" {
		t.Fatalf("maven acquisition = %#v, want native producer tool", maven.Acquisition)
	}
	if !strings.Contains(maven.Acquisition.NextAction, "approval") {
		t.Fatalf("maven next action = %q, want approval boundary", maven.Acquisition.NextAction)
	}
	gradle := toolPlanByIDContextprep(plan, "gradle-cyclonedx")
	if gradle.Acquisition.Kind != "native-producer-tool" {
		t.Fatalf("gradle acquisition = %#v, want native producer tool", gradle.Acquisition)
	}
	if !strings.Contains(gradle.Acquisition.NextAction, "evaluate") {
		t.Fatalf("gradle next action = %q, want local evaluation boundary", gradle.Acquisition.NextAction)
	}

	contract := mustReadContextprep(t, filepath.Join(out, "answer-contract.md"))
	for _, want := range []string{
		"Tool acquisition guidance is stack-agnostic",
		"Candidate tools are local producer options, not Portolan-owned language adapters",
		"Do not propose a Portolan-owned PHP/JVM/Scala/Gradle adapter",
	} {
		if !strings.Contains(contract, want) {
			t.Fatalf("answer-contract.md missing %q:\n%s", want, contract)
		}
	}
	queryPlan := mustReadContextprep(t, filepath.Join(out, "query-plan.md"))
	if !strings.Contains(queryPlan, "Tool acquisition") {
		t.Fatalf("query-plan.md missing tool acquisition guidance:\n%s", queryPlan)
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

func toolPlanByIDContextprep(plan ossPlanFile, id string) OSSToolPlan {
	for _, tool := range plan.Tools {
		if tool.ID == id {
			return tool
		}
	}
	return OSSToolPlan{}
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
