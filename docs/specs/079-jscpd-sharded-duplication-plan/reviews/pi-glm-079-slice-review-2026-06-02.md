## Review Findings

### Minor 1: `safeID` usage without local visibility

**Severity**: minor  
**Evidence**: `jscpdCommand` calls `safeID(repo.ID)` (line ~1731 in the diff) to build output paths, but `safeID` is not defined in the diff. This is presumably an existing helper. The test passes with `go test ./...`, confirming it exists, but a reviewer relying solely on the diff cannot verify its escaping behavior.  
**Recommendation**: Acceptable since verified tests pass; note for documentation.

### Minor 2: `sortedRepositoriesForPlan` mutates via `sort.Slice` on a copy, but defensive copy is correct

**Severity**: minor (positive observation)  
**Evidence**: `sortedRepositoriesForPlan` does `append([]Repository(nil), repos...)` then `sort.Slice` — this is correct and avoids mutating the caller's slice. No issue.

### Minor 3: Test helper `assertWritesUnderContextToolOutput` and `readOSSPlanContextprep` not in diff

**Severity**: minor  
**Evidence**: Test references `assertWritesUnderContextToolOutput`, `readOSSContextprep`, `mustReadContextprep`, `mustMkdirContextprep`, `mustWriteContextprep` which are not in the diff. Same category as Minor 1 — test passes per verified checks. Acceptable.

---

## Evidence-State Honesty

**Verdict**: ✅ Clean

- `status: "available_not_run"` and `evidence_state: "not_assessed"` are preserved for all paths (multi-repo, single-repo, no-jscpd).
- Plan reason explicitly states "Portolan did not run it."
- Sharded limits include: "missing, failed, or unrun shards remain not_assessed/failed and must not be aggregated into duplication metrics."
- `answer-contract.md` guidance says "Do not aggregate missing, failed, or unrun jscpd shards into a duplication metric."
- No duplication metric is ever computed or claimed.

## Local-First / Read-Only Boundary

**Verdict**: ✅ Clean

- `MutatesTarget: false` and `Network: "not_expected"` preserved on all commands.
- `RequiresUserApproval: true` on all jscpd commands.
- No jscpd execution during context preparation — confirmed by test (no `tool-outputs` written) and Bigtop smoke.
- No `--store`, `--exitCode` flags (test explicitly asserts their absence).
- No network, install, or Node memory flag changes.

## Path/Output Safety

**Verdict**: ✅ Clean

- Multi-repo commands write to `tool-outputs/jscpd/<repo-id>/jscpd-report.json` — each shard isolated under `safeID(repo.ID)`.
- Single-repo target uses `repos[0].Path` instead of `root` — avoids scanning sibling directories.
- Test asserts `assertPathsUnderRoot` for reads and `assertWritesUnderContextToolOutput` for writes.
- Test asserts no multi-repo command reads from `root`.

## Large-Landscape jscpd OOM Discipline

**Verdict**: ✅ Clean

- For `len(repos) > 1`: per-repo shard commands, explicit reason mentioning OOM avoidance.
- Limits include sequential shard execution instruction.
- Failed/missing shards cannot be aggregated into metrics (enforced in text guidance, not runtime — appropriate for a plan-only feature).
- Cross-repo clone detection explicitly remains `not_assessed`.

## Sharded Command Correctness

**Verdict**: ✅ Clean

- `boundedJSCPDArgs` now takes `target` instead of always `root` — correctly scoped per shard or single repo.
- `--output` points to the shard-specific directory; `--` positional arg is `target`.
- All existing safety flags preserved: `--max-size`, `--max-lines`, `--noSymlinks`, `--gitignore`, `--silent`, ignore patterns.
- Single-repo path correctly falls through to `repos[0].Path` as target.
- Zero-repo path uses `root` (existing behavior preserved, though unlikely in practice).

## Tests / Spec Drift

**Verdict**: ✅ Clean (with one observation)

- `TestRunAddsShardedJSCPDCommandsForMultipleRepositories` covers multi-repo sharding: verifies 2 commands, per-repo reads, writes under `tool-outputs/jscpd/`, no full-root read, approval-required, correct CLI flags, absent `--store`/`--exitCode`.
- Answer-contract guidance assertions validate failure-discipline wording.
- Single-repo behavior (T009) relies on existing test coverage passing through the refactored path — not explicitly asserted in new test. This is acceptable since the code path is structurally simple (`len(repos) == 1` branch) and existing tests cover the happy path.
- All verified checks pass: `go test ./...`, `go vet ./...`, `jq empty schema/*.json`.

---

## Not Assessed

- Bigtop smoke actual jscpd shard execution (by design — this slice does not run jscpd).
- Cross-repository clone detection producer (explicitly deferred, `not_assessed`).
- T021/T022 (review lanes, PR creation) — incomplete per task ledger.

## Verdict

**Accept**. The implementation is well-scoped: it produces safer sharded jscpd recipes without executing jscpd, preserves all existing safety bounds, maintains honest evidence states, and has focused test coverage. No critical or major findings. The three minor observations are about diff-local visibility of existing helpers/tests, all confirmed passing.
