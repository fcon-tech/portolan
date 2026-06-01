 ## Review: Portolan Spec 055 Runtime Topology Evidence

### Critical

| # | Finding | File |
|---|---------|------|
| 1 | **`runtimeReadErrorState` dead code**: Both branches return `graph.CannotVerify`, collapsing the distinction. `os.IsNotExist` vs other errors should produce different states per evidence semantics (cannot_verify vs unknown), or the helper should be inlined to avoid misleading abstraction. | `internal/maprun/maprun.go` |
| 2 | **Silent schema version enforcement gap**: `doc.SchemaVersion != "" && doc.SchemaVersion != selection.SchemaVersion` rejects wrong version, but an empty string is silently accepted as valid. Docs say `"schema_version"` is required; empty string bypass should be `cannot_verify`, not pass-through. | `internal/maprun/maprun.go:1219` |

### Major

| # | Finding | File |
|---|---------|------|
| 3 | **`unsafeRuntimeSource` misses `data:` and `javascript:` URIs**: `://` catches `http/https/ftp`, but `data:text/html,...` and `javascript:...` are also exfiltration vectors. Consider `strings.HasPrefix` for `data:` and `javascript:`. | `internal/maprun/maprun.go` |
| 4 | **Observation `Source` field inherits without origin validation**: When `observation.Source != ""`, it overrides `defaultSource` without checking the override is more or equally safe than the file path. A safe path with unsafe per-observation source silently marks only that observation invalid, but the override logic itself allows confused-deputy if selection file is attacker-controlled. | `internal/maprun/maprun.go:1229-1235` |
| 5 | **No test for `not_assessed` coverage propagation**: `normalizeRuntimeInputCoverage` handles `"not_assessed"`, but `TestGraphAndFindingsForSelectionImportsTopLevelRuntimeObservation` uses `"partial"`. Missing coverage cases (`""`, `"not_assessed"`, `"unknown"`) are untested for graph node/edge states. | `internal/maprun/maprun_test.go` |
| 6 | **Partial coverage `unknown` node deduplication is slice-order dependent**: `partialCoverageRecorded` bool prevents duplicate unknown nodes, but if two runtime sources both have partial coverage, each gets its own `unknown` node. This is correct per-source but the `source.ID + ":unknown:runtime-topology"` ID could collide with user nodes if `stableID` produces matching output. Low probability but not impossible. | `internal/maprun/maprun.go:1281` |

### Minor

| # | Finding | File |
|---|---------|------|
| 7 | **Test fixture path inconsistency**: `docs/runtime-observations.md` lists `internal/testfixtures/runtime-topology-evidence/` but `internal/app/testfixtures/runtime-security-boundary/` uses `app/` prefix. Verify the new fixture actually exists at the doc'd path or update docs. | `docs/runtime-observations.md` |
| 8 | **Observation IDs can collide**: `runtimeObservationID` falls back to `"runtime observation"` when both `ID` and `From/To` are empty, causing duplicate node IDs in `nodesByID` map (last wins silently). | `internal/maprun/maprun.go` |
| 9 | **`runtimeSubjectID("unknown")` returns `"runtime-subject"` not `"unknown"`**: The magic value `"unknown"` is hardcoded; if `stableID` returns `"unknown"` for other inputs, they get remapped too. Comment or const would clarify intent. | `internal/maprun/maprun.go` |
| 10 | **Spec branch name stale**: `spec.md` says `codex/054-bigtop-architecture-proof` updated to `codex/055-runtime-topology-evidence` — corrected in patch, no issue. | `docs/specs/055-runtime-topology-evidence/spec.md` |

### Evidence-State Semantics

| Check | Result |
|-------|--------|
| `runtime-visible` only from explicit local observations | ✅ Preserved |
| `metadata-visible` for static dependency/catalog/producers | ✅ Preserved (unchanged paths) |
| `unknown` for partial coverage | ✅ Preserved |
| `cannot_verify` for malformed/unsafe inputs | ✅ Preserved |
| `not_assessed` for missing Bigtop runtime export | ✅ Explicitly blocked |
| `not_assessed` coverage value handled in code | ✅ Parsed, falls through to same path as `unknown` |

### Security/Privacy

- `unsafeRuntimeSource` blocks URL-like and credential-bearing sources: **Adequate** for stated scope.
- No redaction of `observation.From`/`To` values in error reasons: **Acceptable** if these are service names, but if they contain PII they'd leak to graph. Not in scope.
- File read uses `os.ReadFile` without size limits: **Minor concern** for unbounded runtime export files.

### Tests/CI

- `go test -count=1 ./...` passed ✅
- `go vet ./...` passed ✅
- `jq empty schema/*.json` passed ✅
- `git diff --check` passed ✅
- Fixture map smoke passed ✅
- **Gap**: No test for schema version mismatch (`"0.2.0"` or similar), no test for empty `schema_version`, no test for `not_assessed`/`unknown` coverage producing no partial-coverage node vs correct unknown node.

### Maintainability

- `normalizeRuntimeInput` is ~150 lines with nested validation; consider extracting validators (coverage, source safety, observation shape) to reduce cyclomatic complexity.
- Magic strings (`"runtime"`, `"unknown"`, `"observes"`, `"cannot_verify"`) repeat across codebase; evidence-state enum already exists but strings still proliferate in literals.

---

## Verdict

| Aspect | Assessment |
|--------|-----------|
| Code correctness | **Conditionally acceptable** — address critical #1, #2 |
| Requirements fit | **Acceptable** — meets spec 055 scope |
| Evidence-state semantics | **Acceptable** — preserves required states |
| Security/privacy | **Acceptable** — minor improvements suggested |
| Tests/CI | **Acceptable** — coverage gaps in major #5 |
| Maintainability | **Acceptable** — refactor recommended |

**Overall**: **Approved with fixes** — resolve critical #1 (dead abstraction or correct state mapping) and critical #2 (empty schema_version handling) before merge. Major #3-#6 are follow-up candidates.

### `not_assessed` (per scope boundaries)

| Item | Status |
|------|--------|
| Bigtop runtime topology export | `not_assessed` ✅ explicitly maintained |
| Complete architecture understanding | `not_assessed` ✅ deferred to 056 |
| Real producer outputs beyond 052-054 | `not_assessed` ✅ unchanged |
| GitHub review approval | `not_assessed` ✅ unchanged |
