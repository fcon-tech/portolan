# Review: Portolan Spec 078 — Build-Tool Dependency Producers

## Findings

### F1 — Minor: Maven wrapper path not validated against repo boundary
**Evidence:** `resolveBuildToolExecutable` joins `repoPath` with `wrapper` via `filepath.Join` and then `os.Stat`s it. A malicious or malformed `repoPath` could point outside the scan root. The existing `discoverRepositories` should constrain `repo.Path`, but there is no explicit boundary check in the new function itself.
**Recommendation:** Acceptable risk for now since `discoverRepositories` is the sole caller and produces paths under root. Document the assumption or add a defensive `strings.HasPrefix(repoPath, root)` check in a follow-up.

### F2 — Minor: Gradle plan omits `AvailableNotRun` status constant inconsistency
**Evidence:** Maven plan sets `plan.Status = "available_not_run"` when an executable is found and no input is present. Gradle plan sets `plan.Status = "not_assessed"` in the same situation. Both have an executable resolved. The Gradle reasoning (no safe output-path-bounded command) is sound, but the status asymmetry is not explained in code or spec.
**Recommendation:** Add a comment in `gradleCycloneDXPlan` or a spec note explaining why Gradle gets `not_assessed` instead of `available_not_run` (no synthesized command → no "available" recipe). This prevents future readers from thinking it's a bug.

### F3 — Minor: `buildToolSurface` exported-type naming
**Evidence:** `buildToolSurface` is unexported but `buildToolManifestKind` is also unexported. Consistent. However, the struct name `buildToolSurface` could collide with a future exported type. No actual issue.
**Recommendation:** No action required. Noting for awareness only.

### F4 — No severity (informational): Maven command `-B` batch mode
**Evidence:** The Maven command includes `-B` (batch/non-interactive), `-f` pointing to sample pom, explicit output directory under `tool-outputs`, and `-Dcyclonedx.skipAttach=true`. These are correct, safe choices.
**Recommendation:** None. Good hygiene.

### F5 — No severity (positive): Gradle deliberately emits no command
**Evidence:** `gradleCycloneDXPlan` returns `Commands: nil` (no `Commands` field set) and explains in `Reason` that safe output-path-bounded CycloneDX execution requires project-local configuration. This is honest and avoids unsafe Gradle invocation.
**Recommendation:** None. This is the correct conservative choice.

### F6 — Minor: Test helper functions in new test file have generic suffix names
**Evidence:** The test file defines `mustMkdirContextprep`, `mustWriteContextprep`, `mustReadContextprep`, `readOSSPlanContextprep`, `assertWritesUnderContextToolOutput`. These all carry a `Contextprep` suffix to avoid collisions with existing test helpers in the package.
**Recommendation:** Acceptable workaround. If test helper proliferation becomes a pattern, consider a `testhelpers` sub-package. Not blocking.

### F7 — Minor: No test for `resolveBuildToolExecutable` wrapper-precedence logic
**Evidence:** The `resolveBuildToolExecutable` function checks repo-local wrapper (e.g., `mvnw`) before falling back to `PATH`. Tests exercise the `PATH` path but do not test the wrapper-precedence branch (creating `mvnw`/`gradlew` inside the repo with execute permission and verifying it's selected over the `PATH` version).
**Recommendation:** Add a targeted test for wrapper precedence. Not blocking since the Bigtop smoke covers it implicitly, but a unit test would prevent regression.

### F8 — Major: Maven command `Reads` field only lists repo path and sample pom, not Maven local repository/cache
**Evidence:** `Reads: []string{surface.MavenRepoPath, surface.MavenSample}` — but Maven reads `~/.m2/repository`, settings.xml, and potentially other locations. The `Limits` field mentions "may resolve Maven plugins/dependencies and write Maven caches or target directories" but `Reads`/`Writes` are incomplete. A consumer relying on `Reads`/`Writes` for sandboxing would miss Maven's actual filesystem footprint.
**Recommendation:** Either expand `Reads`/`Writes` to include `~/.m2` and a `target/` directory warning, or add a `Limits` note that `Reads`/`Writes` are declared intent only and do not capture the full Maven side-effect surface. This is a documentation/honesty gap in the producer metadata.

### F9 — Minor: `detectBuildToolSurfaces` reuses `shouldSkipRelationshipCandidateDir` and `relationshipCandidateScanLimitPerRepo`
**Evidence:** The function calls `shouldSkipRelationshipCandidateDir` and `relationshipCandidateScanLimitPerRepo`. These names are relationship-candidate-specific. The behavior is correct (skip `.git`, `node_modules`, etc.; cap scan count), but the name reuse is semantically misleading.
**Recommendation:** Rename to `shouldSkipDir` and `scanLimitPerRepo` (or similar shared names) in a follow-up refactor. Not blocking.

### F10 — No severity (positive): Evidence-state honesty
**Evidence:** Both Maven and Gradle plans default to `evidence_state: "not_assessed"`. The answer contract explicitly states "Java/Scala/Maven dependency relationships remain `not_assessed` until local producer output exists and is inspected." The Bigtop smoke confirms no producer was run. No inflated claims.
**Recommendation:** None. This is exactly the right posture.

### F11 — No severity (positive): Query plan and answer contract guidance updated
**Evidence:** `renderQueryPlan()` and `renderAnswerContract()` both received new paragraphs directing agents to `oss-plan.json` for build-tool plans, keeping dependency relationships `not_assessed`, and not requesting Portolan-owned JVM adapters.
**Recommendation:** None. Well-aligned with spec intent.

## Evidence-State Honesty Assessment

- Maven: `not_assessed` — honest, no execution.
- Gradle: `not_assessed` — honest, no execution, no command synthesized.
- No runtime, topology, or JVM semantic claims are made anywhere in the diff.
- Answer contract and query plan are explicit about what this slice does NOT provide.

## Local-First / Read-Only Boundary

- `detectBuildToolSurfaces` is purely read-only: `filepath.WalkDir` + `os.Stat`.
- No Maven/Gradle commands are executed by default.
- Maven command is gated behind `RequiresUserApproval: true` and `MutatesTarget: true`.
- Gradle has no command at all, only a status note.
- `resolveBuildToolExecutable` only stats for existence + execute bit; does not run the binary.

## Path/Output Safety

- Maven output is declared under `toolOutputDir` (context `tool-outputs/`).
- Test includes `assertWritesUnderContextToolOutput` verifying write paths.
- Maven `-DoutputDirectory` points to `toolOutputDir`.
- Gradle has no writes declared (no command).
- **Gap (F8):** Maven `Reads`/`Writes` do not capture Maven's real side-effect footprint (`~/.m2`, `target/`).

## Gradle No Unsafe Command

- ✅ No Gradle command is synthesized.
- ✅ Reason explicitly states safe output-path-bounded constraint.
- ✅ `Commands` is empty/nil.
- ✅ Test asserts `len(gradle.Commands) == 0`.

## Maven Approval/Network/Mutation Boundaries

- ✅ `RequiresUserApproval: true`
- ✅ `MutatesTarget: true`
- ✅ `Network: "possible_for_plugin_and_dependency_resolution"`
- ✅ `Limits` declares the mutation/cache risk
- ⚠️ `Reads`/`Writes` are incomplete for real Maven side effects (F8)

## Tests / Spec Drift

- Test covers: Maven plan status, evidence state, producer, command count, approval/mutation flags, write path safety, command args, network boundary.
- Test covers: Gradle plan status, evidence state, no commands, executable found, reason text.
- Test covers: answer-contract and query-plan text updates.
- **Missing (F7):** No test for wrapper-precedence in `resolveBuildToolExecutable`.
- Spec decisions align with implementation: plans-only, no execution, CycloneDX-first, bounded commands.

## Verdict

**ACCEPT** — The slice is well-scoped, conservative, and honest. It adds build-tool dependency producer guidance without executing any native tools. Evidence states are correctly `not_assessed`. The Gradle no-command choice is the right safety posture. The only actionable item is **F8** (Maven Reads/Writes incompleteness), which is a metadata honesty gap rather than a safety violation since `RequiresUserApproval`, `MutatesTarget`, and `Limits` all flag the risk.

## not_assessed

- Actual Maven/Gradle execution behavior (no Maven/Gradle was run in this slice)
- `oss-plan.json` JSON Schema validation (only `jq empty` structural check confirmed)
- Wrapper-precedence correctness in `resolveBuildToolExecutable` (F7 — no unit test)
- Bigtop landscape correctness beyond the smoke scope described
