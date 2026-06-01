# PR #31 Post-Map Navigation-Index Review

## Summary

PR #31 adds a `navigation` object to `summary.json` and `graph-index.json`, providing agents with bounded post-map read order, high-degree hub identification, unknown-node surface bucketing, and SBOM fan-out warnings. The approach is sound: machine-readable guidance embedded in existing artifacts, no new dependencies or scanners. However, several findings require attention before merge.

---

## Findings

### 1. **CRITICAL** — `summarizeFileSurfaces` filters only `Kind == "unknown"`, inflating surface bucket semantics

**Evidence:** `internal/maprun/maprun.go` calls `summarizeFileSurfaces(g)` which iterates `g.Nodes` and skips any node where `node.Kind != "unknown"`.

**Problem:** The `navigation.unknown_nodes.surface_buckets` field reports file-surface classification counts *only* for nodes already classified as `Kind == "unknown"`. However, the bucket names (`manifest`, `source`, `workflow`, `container`, `config`, `doc`, `test`) imply they describe *all* files in the graph by surface type. This is misleading: a `Kind == "repository"` node with a `.go` file path is excluded entirely, while a `Kind == "unknown"` node with the same path is counted under `source`. Agents reading `surface_buckets` may assume the buckets are exhaustive inventory; they are actually the intersection of "unclassified by kind" and "classified by file extension."

**Recommendation:** Either:
- (a) Document in `navigation.unknown_nodes` that buckets cover only `Kind == "unknown"` nodes, not all graph nodes; or
- (b) Compute surface buckets for *all* nodes and report them as a separate top-level `navigation.file_surface_buckets`, keeping `unknown_nodes.surface_buckets` as the unknown-only subset.

**Severity rationale:** Misleading inventory completeness is a requirements-mismatch risk for agents that treat `surface_buckets` as authoritative file triage.

---

### 2. **MAJOR** — `navigation.high_degree_hubs` duplicates `high_degree_nodes` without clear differentiation

**Evidence:** `buildNavigationIndex` calls `graphIndexHighDegreeNodes(g)` and copies the result into `navigation.high_degree_hubs`. The same function already populates `GraphIndex.HighDegree`.

**Problem:** Two identical arrays exist in `graph-index.json`: `high_degree_nodes` (top-level) and `navigation.high_degree_hubs` (inside `navigation`). This is redundant data with no documented distinction. Agents may wonder which to consult or whether they differ.

**Recommendation:** Either:
- (a) Remove `high_degree_hubs` from `navigation` and reference `high_degree_nodes` in the `navigation.read_order` or `next_drill_down` guidance; or
- (b) Add a distinguishing comment/field (e.g., `navigation.high_degree_hubs` includes only hubs relevant to SBOM fan-out warnings, while `high_degree_nodes` is the raw top-N).

**Severity rationale:** Maintainability and clarity; not a correctness bug, but creates confusion for agents consuming the JSON.

---

### 3. **MAJOR** — `navigation.unknown_nodes.total` counts all `Kind == "unknown"` nodes but `surface_buckets` classifies them by file path; mismatch when path is empty or non-file

**Evidence:** `buildNavigationIndex` sets `unknownNodes` via `graphNodeKindCount(g, "unknown")`, while `surface_buckets` calls `summarizeFileSurfaces(g)` which uses `node.Label` or `node.ID` and runs `classifyFileSurface` on it.

**Problem:** If an `unknown` node has no `Label` and its `ID` is not a file path (e.g., a package name like `pkg:pypi/requests`), `classifyFileSurface` falls through to `"unknown"` bucket. The `total` count (147,813 in stress) will not equal the sum of `surface_buckets` values, because some unknown nodes land in the `"unknown"` bucket within buckets. The stress report confirms: 147,813 total unknown nodes, but bucket `"unknown"` within `surface_buckets` contains 10,056 — the remainder are file-path-classified. This is internally consistent but the relationship between `total` and the sum of buckets is undocumented.

**Recommendation:** Add a `surface_buckets_sum` field or a comment that `total` includes nodes whose paths could not be classified (bucket `"unknown"`). Alternatively, ensure the test asserts `sum(buckets) == total`.

**Severity rationale:** Evidence-state honesty; agents may incorrectly reconcile the numbers.

---

### 4. **MAJOR** — No schema file for `summary.json` or `graph-index.json`; navigation object shape is asserted only by app-level tests

**Evidence:** The `schema/` directory contains `evidence-graph.schema.json`, `coverage.schema.json`, etc., but no `summary.schema.json` or `graph-index.schema.json`. The PR adds test assertions for `navigation` fields but no formal JSON Schema.

**Problem:** The navigation object's structure is defined implicitly by Go struct tags and test expectations. If a future change modifies the struct (e.g., renames `high_degree_hubs`), there is no machine-readable contract to catch drift. The existing `graph-index.json` rules text ("Read summary.json and graph-index.json before loading graph.json") becomes a soft contract.

**Recommendation:** Add `summary.schema.json` and `graph-index.schema.json` to `schema/` with the `navigation` object formally defined. This aligns with the existing schema pattern for other artifacts.

**Severity rationale:** Maintainability and contract enforcement; the PR explicitly aims to make these artifacts agent-consumable, so a schema is the natural contract form.

---

### 5. **MAJOR** — `navigation.warnings` are hard-coded strings with no structured severity or category

**Evidence:** `buildNavigationIndex` appends string warnings like `"Use bounded navigation artifacts before graph.json; graph.json is canonical but not a first-read agent artifact."` and conditionally adds SBOM/unknown-majority warnings.

**Problem:** All warnings are flat strings with no severity level, category, or machine-parseable key. Agents must substring-match to understand the warning type. The existing `query.go` warning (PR #31 guidance fix) uses a similar pattern but is a single known warning. At navigation-index scale with multiple conditional warnings, agents benefit from structured fields.

**Recommendation:** Define a `navigationWarning` struct with `severity` (e.g., `"advisory"`, `"boundary"`), `category` (e.g., `"graph_json_guard"`, `"sbom_fanout"`, `"unknown_majority"`), and `message`. This keeps the JSON machine-parseable without changing the existing flat `warnings` in other artifacts.

**Severity rationale:** Maintainability and agent consumption quality; not blocking, but a missed opportunity given the PR's explicit agent-first design.

---

### 6. **MINOR** — Test `TestRunMapNavigationIndexFlagsSBOMFanOut` uses `t.TempDir()` for `root` but writes `.git` and `pom.xml` without cleanup guarantee

**Evidence:** The test creates `root := t.TempDir()`, writes `.git` and `pom.xml`, then creates a selection file and output directory in separate `t.TempDir()` calls.

**Problem:** This is actually fine — `t.TempDir()` cleans up automatically. However, the test does not verify that `navigation.warnings` contains *exactly* the expected SBOM warning (it substring-checks for 3 phrases). If future changes add more warnings, the test still passes silently.

**Recommendation:** Assert `len(navigation["warnings"].([]any))` or check that no unexpected warning types are present. Minor because the current 3-phrase check is sufficient for this slice.

---

### 7. **MINOR** — `pr31-readiness-closeout-2026-06-01.md` claims "explicit user merge approval was received in this thread on 2026-06-01" but the packet provides no thread evidence

**Evidence:** The closeout document states merge readiness includes "explicit user merge approval was received in this thread on 2026-06-01." The packet contains no chat log, email, or approval artifact.

**Recommendation:** Either include the approval evidence in the packet or mark this claim as `cannot_verify` in the readiness matrix. The current wording is an assertion without supporting evidence in this review packet.

**Severity rationale:** Evidence-state honesty; the reviewer cannot verify the claim from packet contents.

---

### 8. **MINOR** — `buildNavigationIndex` does not handle the case where `graphIndexHighDegreeNodes` returns an empty slice for small graphs

**Evidence:** If the graph has fewer than the threshold nodes, `highDegree` is empty. `navigation.high_degree_hubs` is then `nil` (or empty), and the SBOM fan-out warning loop (`for _, node := range highDegree`) never triggers.

**Problem:** For small graphs with SBOM tool-outputs but few nodes, the SBOM fan-out warning is silently absent even if a tool-output node has high out-degree relative to graph size. The `navigation.high_degree_hubs` field is `omitempty`, so it disappears from JSON entirely.

**Recommendation:** Consider using a relative-degree threshold (e.g., top 5% of nodes by out-degree) in addition to the absolute threshold, or document that `high_degree_hubs` is empty for small graphs.

**Severity rationale:** Correctness edge case; unlikely for real targets but worth documenting.

---

## Evidence and Not Assessed

| Item | Status | Reason |
|------|--------|--------|
| Whether `graphIndexHighDegreeNodes` threshold is appropriate for all graph sizes | `not_assessed` | Stress run used a 190k-node graph; small-graph behavior not tested |
| Whether `navigation` JSON renders correctly in actual Cursor/Composer UI | `not_assessed` | Stress run used headless Cursor Agent; no live UI verification |
| Whether `portolan graph slice` and `portolan query` CLI match `navigation.read_order` guidance | `cannot_verify` | No CLI execution evidence in packet; commands are referenced but not run |
| Performance impact of `buildNavigationIndex` on map run time | `not_assessed` | No timing data in packet; function iterates all nodes twice (count + surfaces) |
| Whether `graph-index.json` size (~360 KB) is acceptable for agent context windows | `not_assessed` | Stress report notes it; no agent token-budget analysis provided |
| Whether `summary.schema.json` / `graph-index.schema.json` are needed for other consumers | `not_assessed` | No evidence of external consumers beyond Cursor/Composer agents |

---

## Verdict

**Accept with major follow-up.**

The navigation-index approach is architecturally correct: bounded read order, hub identification, and unknown-node bucketing in existing artifacts without new dependencies. The SBOM fan-out and unknown-majority warnings are well-designed guardrails.

**Blocking before merge:**
- Finding 1 (surface bucket semantics): add documentation or split the field to avoid misleading inventory completeness.

**Required follow-up before next release:**
- Finding 2 (hub duplication): deduplicate or differentiate `high_degree_nodes` vs `high_degree_hubs`.
- Finding 3 (total vs bucket sum): document or assert the relationship.
- Finding 4 (missing schema): add formal JSON Schema for `summary.json` and `graph-index.json`.

**Recommended:**
- Finding 5 (structured warnings): improve agent-parseability.
- Finding 7 (merge approval evidence): verify or mark `cannot_verify`.

---

## Recommendation

**Block merge on Finding 1.** The surface-bucket semantics issue is a requirements-mismatch risk that could cause agents to treat `surface_buckets` as exhaustive file inventory when it only covers `Kind == "unknown"` nodes. A one-line documentation fix in the `unknown_nodes` object (e.g., `"reason": "Unknown nodes are unclassified inventory... Buckets classify only Kind=='unknown' nodes by file extension, not all graph nodes."`) is sufficient to unblock.

After that fix, the PR is ready for merge with the major findings tracked as follow-up items in the product backlog.
