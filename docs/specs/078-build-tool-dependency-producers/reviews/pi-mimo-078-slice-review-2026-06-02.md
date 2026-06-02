I'll review this slice for Portolan spec 078 (build-tool dependency producer).

## Review: Portolan 078 Build-Tool Dependency Producers

### Overall Assessment
**Verdict: ACCEPT with minor findings**

The slice correctly implements approval-gated Maven/Gradle CycloneDX producer recipes while maintaining the local-first, read-only boundary. The evidence-state honesty is strong, and the boundary decisions align with the spec's safety constraints.

---

### Findings

#### Critical
**None identified.**

#### Major
**None identified.**

#### Minor

**M1: `buildToolSurface` struct fields could be documented**

- **Severity**: Minor
- **Evidence**: `type buildToolSurface struct` at line ~141 has no documentation
- **Recommendation**: Add a brief comment explaining this is a discovery-time aggregation of visible build manifests, not evidence
- **Impact**: Code clarity only; no functional risk

**M2: `detectBuildToolSurfaces` shares scan limit with relationship candidates**

- **Severity**: Minor
- **Evidence**: `scanned > relationshipCandidateScanLimitPerRepo` at line ~816
- **Recommendation**: Consider a named constant or comment explaining this is intentional reuse of the existing scan budget
- **Impact**: No functional issue; the limit is already proven safe for file walking

**M3: Maven command includes `-DoutputName` which may conflict with expected output path**

- **Severity**: Minor
- **Evidence**: `-DoutputName=maven-cyclonedx` and `-DoutputDirectory=` in Maven args
- **Recommendation**: Verify that `cyclonedx-maven-plugin` respects both flags together (the plugin docs suggest `outputName` appends `.json` when `outputFormat=json`). The test at line ~36 only checks `assertWritesUnderContextToolOutput`, not the exact filename
- **Impact**: If the plugin writes to a different filename than declared in `Writes`, the evidence contract would be misleading. Low risk since the output directory is still bounded

**M4: `resolveBuildToolExecutable` wrapper detection does not verify wrapper is a script**

- **Severity**: Minor
- **Evidence**: `info.Mode().IsRegular() && info.Mode().Perm()&0o111 != 0` at line ~1935
- **Recommendation**: Consider adding a minimal shebang check or documenting that this is intentionally permissive (any executable regular file is accepted as a wrapper)
- **Impact**: Low risk; wrappers in `.git`-discovered repos are expected to be real scripts, and the command still requires user approval

**M5: Test does not verify Gradle plan `Executable` points to `gradlew` or `gradle`**

- **Severity**: Minor
- **Evidence**: `if gradle.Producer != "cyclonedx-gradle-plugin" || gradle.Executable == ""` at line ~75 only checks non-empty
- **Recommendation**: Assert `gradle.Executable` equals the expected `gradle` binary path from the test `PATH`
- **Impact**: Test coverage gap; production logic is still correct

---

### Evidence-State Honesty

✅ **Strong**. Both Maven and Gradle plans explicitly declare `not_assessed` for dependency evidence. The answer contract and query plan reinforce that visible manifests ≠ parsed topology. The `MutatesTarget`, `Network`, and `RequiresUserApproval` flags are correctly set on the Maven command.

### Local-First / Read-Only Boundary

✅ **Strong**. Context preparation itself performs no Maven/Gradle execution. The `tool-outputs` directory was absent after the Bigtop smoke, confirming no side effects. The Maven command is explicitly approval-gated with mutation and network warnings.

### Path / Output Safety

✅ **Strong**. The test `assertWritesUnderContextToolOutput` validates that declared writes are under the context output directory. The Maven command writes to `toolOutputDir` which is `filepath.Join(out, "tool-outputs")`.

### Gradle No Unsafe Command

✅ **Correct**. Gradle intentionally emits zero commands because "safe output-path-bounded CycloneDX execution requires project-local plugin or init-script configuration." This is the correct conservative choice.

### Maven Approval / Network / Mutation Boundaries

✅ **Correct**. The Maven command declares:
- `RequiresUserApproval: true`
- `MutatesTarget: true`
- `Network: "possible_for_plugin_and_dependency_resolution"`

The limits array correctly warns about plugin/dependency resolution and target directory writes.

### Tests / Spec Drift

✅ **Aligned**. The test covers:
- Maven plan status, evidence state, producer, and command structure
- Gradle plan status, evidence state, producer, and absence of synthesized commands
- Output path safety for Maven writes
- Answer contract and query plan content
- Network boundary declaration

No drift detected between spec intent and implementation.

### Not Assessed

- **Maven dependency-plugin JSON output**: Correctly deferred; requires a separate parser contract spec
- **Portolan-owned JVM adapters**: Correctly excluded; the answer contract explicitly forbids this
- **Runtime topology**: Correctly remains `not_assessed`; no runtime producer was executed

---

### Summary

The slice is well-scoped and disciplined. It adds Maven/Gradle awareness to context packs without crossing the execution boundary. The evidence-state declarations are honest, the approval gates are correct, and the Gradle conservatism is appropriate. The minor findings are code hygiene and test coverage improvements with no functional risk.

**Recommendation**: Accept. Address M3 (output filename verification) if convenient, but not blocking.
