## Review: P6-079 jscpd Sharded Duplication Plan

### Findings

| ID | Severity | Finding | Evidence | Recommendation |
|---|---|---|---|---|
| F01 | **minor** | `jscpdCommand` parameter `out` is unused | `func jscpdCommand(exe, root, out, target, outputDir, outputFile, label string, sharded bool)` — `out` passed but never referenced in body | Remove unused `out` parameter to reduce signature noise; `rerunContextCommand(root, out)` uses `out` but that's in the caller, not the helper |
| F02 | **minor** | `safeID` not shown in diff but relied upon for path safety | `filepath.Join(toolOutputDir, "jscpd", safeID(repo.ID))` — no visibility into `safeID` implementation in this packet | Verify `safeID` prevents path traversal (e.g., `../` or `/` in repo IDs); if not already covered by existing tests, add a unit test |
| F03 | **minor** | `sortedRepositoriesForPlan` creates defensive copy but `Repository` contains slices/maps | `sorted := append([]Repository(nil), repos...)` — shallow copy of struct with unknown fields; sort stability relies on `ID` string only | Acceptable since sort only reads `ID`, but document invariant that `Repository.ID` must be stable and non-empty for deterministic output |
| F04 | **minor** | Test `TestRunAddsShardedJSCPDCommandsForMultipleRepositories` does not assert shard limits content | Test checks `RequiresUserApproval`, `MutatesTarget`, `Reads`, `Writes`, `Args` but does not verify `Limits` contains sharded-specific guidance | Add assertion that `command.Limits` contains `"repository shard only"` or `"cross-repository clone detection remains not_assessed"` when `sharded=true` |

### Evidence-State Honesty
- **Verdict**: ✓ Satisfied. `Status: "available_not_run"`, `EvidenceState: "not_assessed"` preserved. Sharded limits explicitly state "missing, failed, or unrun shards remain not_assessed/failed". Answer-contract and query-plan both warn against aggregating absent shards.

### Local-First / Read-Only Boundary
- **Verdict**: ✓ Satisfied. `MutatesTarget: false`, `RequiresUserApproval: true`, `Network: "not_expected"`. No jscpd execution in `Run()`. Bigtop smoke confirms `tool-outputs` directory absent after run.

### Path / Output Safety
- **Verdict**: ✓ Satisfied. `assertPathsUnderRoot` and `assertWritesUnderContextToolOutput` used in tests. Each shard writes under `tool-outputs/jscpd/<safeID>/`. No full-root `Reads` in multi-repo mode.

### Large-Landscape jscpd OOM Discipline
- **Verdict**: ✓ Satisfied. 18-repo Bigtop landscape produces 18 shard commands, no full-root command. Limits explicitly mention "repository shard only" and sequential execution. Reason string documents OOM avoidance intent.

### Sharded Command Correctness
- **Verdict**: ✓ Satisfied. `boundedJSCPDArgs` preserved with all safety bounds (`--max-size 100kb`, `--max-lines 1000`, `--noSymlinks`, `--gitignore`, `--silent`, no `--store`, no `--exitCode`). Single-repo fallback uses `repos[0].Path`. Zero-repo case falls through to `target = root` (existing behavior).

### Tests / Spec Drift
- **Verdict**: ✓ Satisfied. Test covers US1 AC1 (multi-repo → shards, no full-root). Test does not explicitly cover US1 AC2 (single-repo preserves existing behavior) or AC3 (not_assessed until output exists), but these are structurally enforced by code paths. FR-001 through FR-006 all trace to implemented behavior.

| Category | Verdict |
|---|---|
| evidence-state honesty | ✓ |
| local-first/read-only boundary | ✓ |
| path/output safety | ✓ |
| large-landscape jscpd OOM discipline | ✓ |
| sharded command correctness | ✓ |
| tests/spec drift | ✓ |

### not_assessed
- GitHub review approval (per project convention, explicitly `not_assessed`)
- Actual jscpd execution on any shard (correctly out of scope)
- Cross-repository clone detection (correctly deferred)
- `safeID` path-traversal resistance implementation details (not visible in packet)
