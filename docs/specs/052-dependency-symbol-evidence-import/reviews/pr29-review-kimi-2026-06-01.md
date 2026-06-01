I'll conduct a thorough review of this PR based on the provided packet. Let me examine the key code areas systematically.

## Review Analysis

### 1. Evidence-State Honesty Assessment

**Symbol-index handling (correct):**
- Documents/symbols become `metadata-visible` unknown nodes — honest about visibility level
- `owns` edges only with explicit "not a complete call graph" reason — prevents overclaim
- Preserves `not_assessed` when no producer output exists — correct gap handling

**Dependency/SBOM handling (correct):**
- Components become `metadata-visible` package nodes via producer edges
- Missing dependency refs become `cannot_verify` placeholders — not `unknown` or fabricated
- `not_assessed` preserved when no local producer available

**Context prep candidates (correct):**
- `source-visible` for build/deploy manifests with `semantic parsing remains not_assessed` — honest about limitation

### 2. Native Semantics / Runtime Topology Claims

**Guidance updates verified:**
- Answer/query guidance explicitly avoids "native PHP/JVM/Scala or runtime topology claims"
- Stress run confirms: "Cursor + Composer 2.5... did not overclaim native language semantics or runtime topology"

**Symbol-index edge semantics:**
- `owns` only — no `calls`, `invokes`, `types`, or other semantic relationship claims
- Reason string explicitly disclaims call graph completeness

### 3. Local-First / Read-Only / Output-Safety Boundaries

**Positive indicators:**
- Syft OSS-plan recipe excludes `./.portolan/**` and `./run/**` — prevents recursive ingestion of own artifacts
- `maxSelectedToolOutputBytes = 64MB` — bounded memory
- `maxSelectedSymbolDocuments = 5000`, `maxSelectedSymbols = 50000` — bounded graph expansion
- No network calls, daemon starts, or credential usage in described behavior

**Potential concern:** No explicit output directory restrictions shown in excerpts beyond the Syft excludes. The `maxSelected*` bounds provide some protection but I'd need to see `maprun.go` implementation to confirm no unbounded file writes.

### 4. Tests and Docs Sufficiency

**Tests present:**
- `internal/app/app_test.go` — modified (existing coverage)
- `internal/maprun/maprun_test.go` — modified (existing coverage)
- `internal/selection/selection_test.go` — **new** (good: new selection logic needs tests)
- `go test -count=1 ./...` passed

**Gaps identified:**
- No explicit mention of `contextprep/contextprep_test.go` — new relationship-candidate logic may lack dedicated tests
- Schema validation (`jq empty`) passed but no explicit test for schema round-trip with new `symbol-index` kind

**Docs present:**
- Spec 052 tasks added
- Feature.json updated
- Product backlog updated

### 5. Blockers for Ready-for-Review

---

## Findings

### `minor` — Context prep test coverage gap
`internal/contextprep/contextprep.go` is modified to add relationship-candidate records, but no `contextprep_test.go` is listed in changed files. The constitution requires "CLI behavior, schema contracts, import normalization, graph derivation, and packet rendering need local tests." Verify existing `app_test.go` or `maprun_test.go` covers this path, or add targeted tests.

**Mitigation:** Check if `app_test.go` integration tests cover the `context prepare` path; if yes, downgrade to informational. If no, add before ready-for-review.

### `minor` — Schema version/compatibility not explicitly verified
New `symbol-index` kind added to `selection.schema.json`. The `jq empty` validation confirms JSON validity but not that the new enum value is consumed correctly by all downstream consumers. Verify `maprun.go` has a `default` case or explicit handling for unrecognized kinds to prevent silent skips.

**Mitigation:** Confirm `maprun.go` has exhaustive `switch` or `default` with error/fallback for new kinds.

### `minor` — `cannot_verify` vs `not_assessed` distinction for oversized symbol output
If symbol-index output exceeds `maxSelectedSymbolDocuments` or `maxSelectedSymbols`, the excerpt doesn't specify whether it's truncated with warning, rejected entirely, or marked `cannot_verify`. The spec says "oversized... producer output" should be `cannot_verify`. Verify implementation matches.

**Mitigation:** Check `selection.go` or `maprun.go` for oversized handling logic.

---

## Verdict

| Category | Assessment |
|----------|-----------|
| Evidence-state honesty | ✅ Preserved correctly |
| Native semantics claims | ✅ Avoided explicitly |
| Local-first/read-only | ✅ Preserved (with bounded limits) |
| Tests | ⚠️ `minor` gap in contextprep coverage |
| Docs | ✅ Sufficient for slice |

**verdict:** `pass_with_changes`

**not_assessed:**
- Runtime performance at full `maxSelectedSymbols` scale (stress run was under bounds)
- Cross-PR interaction with spec 051 boundary changes (both modified, but no conflict indicated)

---

## Readiness Recommendation

**Ready-for-review PR** — after addressing the `minor` findings:

1. **Confirm or add:** `contextprep` relationship-candidate generation has test coverage (either in `app_test.go` or dedicated file)
2. **Confirm:** `maprun.go` handles `symbol-index` kind explicitly and has safe `default` for future kinds
3. **Confirm:** oversized symbol-index output paths return `cannot_verify` not silent truncation

All findings are `minor`; no `critical` or `major` blockers. The PR demonstrates good evidence-state discipline, honest semantic bounds, and appropriate safety limits. The stress run validation is credible and well-documented.
