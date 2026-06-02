## Review: Portolan Spec 078 Build-Tool Dependency Producer Slice

### Critical
**None**

### Major
**None**

### Minor

| # | Finding | Evidence | Recommendation |
|---|---------|----------|----------------|
| M1 | `buildToolSurface` fields use `RepoPath` naming but store repository root paths, not repo-relative paths | `MavenRepoPath: repo.Path`, `GradleRepoPath: repo.Path` — naming is slightly misleading vs `RepositoryPath` used elsewhere | Rename to `MavenRepositoryPath`/`GradleRepositoryPath` or add comment clarifying these are discovered repo roots, not relative paths within repos |
| M2 | `resolveBuildToolExecutable` wrapper check uses `info.Mode().Perm()&0o111 != 0` which is Unix-only; no Windows executable semantics | Windows wrapper scripts (`mvnw.cmd`, `gradlew.bat`) won't be detected | Document Windows limitation in function comment or extend with `.cmd`/`.bat` suffix check; at minimum, acknowledge in spec limits |
| M3 | `gradle-cyclonedx` plan sets `Status: "not_assessed"` but other non-runnable plans in codebase typically use `"not_available"` or `"available_not_run"` | Inconsistent state machine usage: Maven gets `"available_not_run"` when executable found but not run; Gradle gets `"not_assessed"` even when executable found | Consider `"available_not_run"` for Gradle when executable exists but command is intentionally withheld, reserving `"not_assessed"` for truly un-evaluated states; or document intentional asymmetry |
| M4 | `mavenCycloneDXPlan` hardcodes `-Dcyclonedx.skipAttach=true` but not `-DskipTests` or other build-mutation limits | Maven `makeAggregateBom` in multi-module projects may still trigger lifecycle phases, compile hooks, or plugin executions via `pom.xml` profiles | Add explicit limit note that `pom.xml` may declare additional plugin executions; consider `-DskipTests` in args or limits documentation |
| M5 | Test `TestRunAddsBuildToolDependencyProducerPlans` doesn't verify `Reads` paths are within expected boundaries | `mavenCommand.Reads` contains `surface.MavenRepoPath` and `surface.MavenSample` but test only checks `Writes` | Add `assertReadsUnderRoot` or verify `Reads` paths don't escape context root |

### Evidence-State Honesty ✓
- `maven-cyclonedx`: `evidence_state: "not_assessed"`, `status: "available_not_run"` — honest, output not produced
- `gradle-cyclonedx`: `evidence_state: "not_assessed"`, `status: "not_assessed"` — honest, no command synthesized
- Answer contract explicitly states "Java/Scala/Maven dependency relationships remain `not_assessed` until local producer output exists"
- Query plan repeats `not_assessed` boundary

### Local-First/Read-Only Boundary ✓
- No Maven/Gradle execution in `context prepare`
- `tool-outputs` directory absent after smoke
- Commands carry `RequiresUserApproval: true`, `MutatesTarget: true`
- Smoke confirms: "no Maven, Gradle, Syft, jscpd, Docker, or other native producer output was created"

### Path/Output Safety ✓
- Maven command writes to `-DoutputDirectory=toolOutputDir` with `Writes` declaration
- Test `assertWritesUnderContextToolOutput` verifies path containment
- Gradle intentionally omits command due to output-path safety uncertainty

### Gradle No Unsafe Command ✓
- `gradle-cyclonedx` plan: `len(Commands) == 0`
- Reason explicitly cites "safe output-path-bounded CycloneDX execution requires project-local plugin or init-script configuration"
- No synthesized `gradle cyclonedxBom` or init-script injection

### Maven Approval/Network/Mutation Boundaries ✓
- `RequiresUserApproval: true`
- `MutatesTarget: true`
- `Network: "possible_for_plugin_and_dependency_resolution"`
- Limits include: "may resolve Maven plugins/dependencies and write Maven caches or target directories"

### Tests/Spec Drift ✓
- Test covers: plan presence, status/state, producer ID, command count, approval flag, mutation flag, write containment, arg contents, network boundary, contract text, query plan text
- No test for `resolveBuildToolExecutable` wrapper resolution directly, but covered via integration
- No test for `buildToolManifestKind` directly — minor gap

### Verdict
**ACCEPT** with minor notes. The slice correctly maintains Portolan's local-first, read-only, approval-gated boundaries while providing concrete next-action guidance for JVM dependency evidence gaps. Evidence-state honesty is consistent throughout. No unsafe automatic execution. Gradle conservatively avoids command synthesis where output bounding is uncertain.

### Not Assessed
- Actual Maven/Gradle CycloneDX plugin execution behavior (intentionally out of scope)
- Windows wrapper script detection (platform limitation acknowledged implicitly)
- Multi-module Maven project lifecycle side effects beyond plugin resolution
