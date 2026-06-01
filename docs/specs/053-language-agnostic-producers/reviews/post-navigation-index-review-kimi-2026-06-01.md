## PR #31 Post-Map Navigation-Index Review

### Findings

| # | Finding | Severity | Evidence | Recommendation |
|---|---------|----------|----------|----------------|
| 1 | `buildNavigationIndex` uses `graphIndexHighDegreeNodes(g)` twice — once for `HighDegreeHubs`, once internally for SBOM scan — O(n log n) each, no caching | minor | `maprun.go` lines 2134, 2149, 2162; `graphIndexHighDegreeNodes` sorts by degree | Cache single call or document double-call is bounded by small top-K result; not a perf issue at tested scale but brittle if top-K changes |
| 2 | `unknownNodes > len(g.Nodes)/2` integer division: 190,748 nodes, 147,813 unknown = 77.5% → `true`; edge case at exactly 50% rounds down to `false` | minor | `maprun.go` line 2161 | Use `unknownNodes*2 > len(g.Nodes)` for exact majority, or document `>` as intentional strict majority; current behavior is acceptable but worth aligning with "majority" plain English |
| 3 | SBOM fan-out warning scans `highDegree` slice but `break`s after first `tool-output-sbom`; multiple SBOM tools would silently omit secondary warnings | minor | `maprun.go` lines 2167–2170 | Acceptable if single-SBOM assumption holds per run; document or switch to `continue` if multi-SBOM landscape expected |
| 4 | `navigationIndex.Warnings` accumulates conditionally — order-dependent for tests; `app_test.go` only checks substring presence, not order or count | minor | `app_test.go` `TestRunMapWritesAgentScaleSummary` checks `reason` substring only; `TestRunMapNavigationIndexFlagsSBOMFanOut` checks 3 warning substrings | Add warning-count assertion or document order is not contract; current test coverage is sufficient for substring contract |
| 5 | `surface_buckets` in `unknownNavigationBucket` reuses `summarizeFileSurfaces(g)` which counts **all** file surfaces, not only unknown-node surfaces | **major** | `maprun.go` line 2159: `SurfaceBuckets: summarizeFileSurfaces(g)`; stress report shows 147,813 unknown nodes but buckets sum to all 190,748 nodes' surfaces | **Clarify naming** to `file_surface_buckets` or **filter to unknown-node surfaces only**; current naming implies unknown-node breakdown, which is what agents need for triage |
| 6 | `graph-index.json.navigation` duplicates `summary.json.navigation` almost verbatim — 164 MB graph's index (~360 KB) carries redundant block | minor | Stress report: index ~360 KB; `buildNavigationIndex` called identically in both `summarizeRun` and `buildGraphIndex` | Acceptable for agent convenience and resilience if one artifact is missing; document intentional mirroring |
| 7 | `next_drill_down` commands use `<run-dir>` placeholder but `summary.json` has no `run_dir` field; agents must infer from context | minor | `maprun.go` lines 2143–2147 | Add `run_dir` to `summary.json` or use relative placeholder like `.` documented in `map.md` |
| 8 | `do_not_open_first: ["graph.json"]` is absolute path-unaware; if `graph.json` is referenced by basename elsewhere, warning may misfire | minor | Schema design | Not assessed — no evidence of misfire in stress; keep as-is |

### Verdict

**`accept_with_minor_followup`**

The navigation-index slice correctly addresses the PR #31 decision-gate requirements: machine-readable navigation object in existing `summary.json` and `graph-index.json`, no new scanner/UI/dependency, bounded read order before `graph.json`, high-degree hub exposure, unknown-node majority guardrail, and SBOM fan-out topology warning.

**Blocking edge cases addressed:**
- ✅ Huge `graph.json` (~164 MB): `do_not_open_first` + `read_order` guardrail
- ✅ SBOM package fan-out: explicitly flagged as inventory not service topology
- ✅ Majority unknown nodes: `majority: true` + `reason` + warning triad

**Not blocking but should fix before or in follow-up:**
- Finding 5 (`surface_buckets` naming/semantics) — **major** due to potential agent misinterpretation; either rename or filter to unknown-node surfaces.

### `not_assessed`

| Item | Why |
|------|-----|
| Runtime performance of `buildNavigationIndex` on graphs >1M nodes | No evidence in packet; tested at 190K nodes only |
| Whether `graph slice` / `query` CLI commands actually behave as documented in `next_drill_down` | Stress report explicitly states "Cannot verify from artifacts: whether `portolan graph slice` / `portolan query` behave as documented" |
| Agent token-budget impact of duplicated navigation block in both JSON files | Out of scope; navigation block is small vs graph payload |
| Whether `unknown` surface bucket `unknown` (10,056 residual) needs further drill-down schema | Product follow-up, not this slice |
| GitHub review approval for PR #31 | Explicitly `not_assessed` in closeout; local verification only |
