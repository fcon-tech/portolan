# Independent PR #31 Review: Post-Map Navigation-Index Update

## Findings

### F1. `summarizeFileSurfaces` only classifies `Kind == "unknown"` nodes — `surface_buckets` scope is correctly narrow ✅
**Severity:** — (confirmed correct)
**Evidence:** The provided helper code shows `summarizeFileSurfaces` filters `node.Kind != "unknown"` before calling `classifyFileSurface`. `buildNavigationIndex` calls `summarizeFileSurfaces(g)` for `UnknownNodes.SurfaceBuckets`. The field name and surrounding warnings ("unclassified inventory, not semantic architecture coverage") are consistent with this scope.
**Recommendation:** No action. Scope is honest.

---

### F2. Unknown-node majority `> len(g.Nodes)/2` is correct but edge case at 0 total nodes
**Severity:** minor
**Evidence:** `Majority: unknownNodes > len(g.Nodes)/2` — when `g.Nodes` is empty (0 nodes), `0 > 0` → `false`, which is safe. When all nodes are unknown (e.g., 1 unknown, 1 total), `1 > 0.5` → `true`, which is correct. No bug, but integer truncation with Go's `int` division means for 2 nodes both unknown, `2 > 1` is `true`, which is fine. No finding of incorrectness, but no test covers the empty-graph edge.
**Recommendation:** Consider a one-line guard or test for empty graph. Not blocking.

---

### F3. `buildNavigationIndex` is called twice — once for `summary.json`, once for `graph-index.json` — recomputing high-degree nodes and surface buckets
**Severity:** minor (performance / DRY)
**Evidence:** `summarizeRun` calls `buildNavigationIndex(g)` at line ~2108, and `buildGraphIndex` calls it again at line ~2137. Both iterate the full node list. For 190k nodes, this is two redundant passes. The `HighDegreeHubs` field also copies `graphIndexHighDegreeNodes(g)` which sorts the full node list.
**Recommendation:** Build once, pass into both structs. Not a correctness issue; minor efficiency concern at SBOM scale.

---

### F4. SBOM fan-out warning only fires for the *first* `tool-output-sbom` hub
**Severity:** minor
**Evidence:** The loop `for _, node := range highDegree { if node.Kind == "tool-output-sbom" { ... break } }` emits at most one SBOM warning. If multiple SBOM tool-output nodes exist (e.g., two repos each with their own Syft output), only the first gets warned. The warning text uses the specific node ID, so it is accurate for the one it names.
**Recommendation:** Either warn per SBOM hub or generalize the warning. Not blocking since the warning's intent (alert agents that SBOM fan-out is inventory, not topology) is served by the first instance.

---

### F5. `read_order` omits `coverage.json` and `map.md`
**Severity:** minor
**Evidence:** The Cursor stress report explicitly notes this as "Low" severity. `read_order` lists `summary.json → graph-index.json → portolan query findings → portolan query gaps → portolan graph slice`. The `map.md` template (in the diff) now says "Inspect `summary.json.navigation` and `graph-index.json.navigation`" but `map.md` itself is not in `read_order`. `coverage.json` is also omitted.
**Recommendation:** Consider adding `coverage.json` to `read_order` if stress shows agents miss it. Already noted as optional hardening in the stress report.

---

### F6. `surface_buckets` residual: nodes classified as "unknown" *within* the unknown bucket
**Severity:** minor
**Evidence:** The Cursor stress report notes 10,056 nodes in bucket `unknown` within unknown nodes. `classifyFileSurface` has a `default: return "unknown"` branch. These are files whose extension/base name matches no classification rule. The `reason` field warns this is "unclassified inventory," which is honest.
**Recommendation:** Consider adding a catch-all count or logging unclassified extensions for future classification improvement. Not blocking.

---

### F7. Test `TestRunMapNavigationIndexFlagsSBOMFanOut` asserts `out_edges == 3` for a 3-component SBOM
**Severity:** — (correct, observation)
**Evidence:** The test creates a CycloneDX SBOM with 3 components and checks `hub["out_edges"].(float64) == 3`. This is a count of components, not dependency edges (only 1 dependency edge exists in the test data). This tests that the fan-out count uses component count, which matches the SBOM-as-inventory semantics. Consistent with the "package inventory fan-out, not service topology" warning.

---

### F8. No schema file changes for `summary.json` or `graph-index.json` to include `navigation` field
**Severity:** major
**Evidence:** The diff adds `Navigation navigationIndex` to both `Summary` and `GraphIndex` structs, but there is no corresponding JSON schema update. The packet shows `jq empty schema/*.json` passed — meaning existing schemas remain valid — but they would not validate the new `navigation` field. If the schemas are permissive (e.g., `additionalProperties: true`), this is benign. If they are strict, the new field is undocumented.
**Recommendation:** Verify whether schemas enforce `additionalProperties: false`. If so, update them. If schemas are permissive, document this as intentional tech debt. The local verification passing suggests schemas are permissive, but **cannot verify from packet alone**.

---

### F9. `graphIndexHighDegreeNodes` is called three times total per map run
**Severity:** minor
**Evidence:** Once in `buildNavigationIndex` (for `HighDegreeHubs`), once in `buildGraphIndex` (for the existing `HighDegree` field), and the navigation index call inside `buildGraphIndex` calls it again. This sorts all nodes by degree each time.
**Recommendation:** Compute once, share. Same category as F3.

---

### F10. Merge-approval claim in closeout references "received in this thread" but no thread context is in the packet
**Severity:** minor (evidence provenance)
**Evidence:** The closeout says "explicit user merge approval was received in this thread on 2026-06-01" but the packet does not contain the thread/message evidence. This is a documentation provenance gap, not a code defect.
**Recommendation:** Ensure the actual approval message is archived or linked in the review record before treating PR as merge-approved.

---

### F11. Blocking edge case guard: `huge graph.json` — navigation correctly routes around it
**Severity:** — (confirmed addressed)
**Evidence:** `do_not_open_first: ["graph.json"]`, `artifact_sizes` in `graph-index.json` shows ~164 MB, read order directs to summary/index/query/slice first. Cursor stress report confirms `graph.json` was not loaded.
**Recommendation:** No action. Requirement met.

---

### F12. Blocking edge case guard: "SBOM package fan-out must not become service topology"
**Severity:** — (confirmed addressed)
**Evidence:** `buildNavigationIndex` emits warning: `"SBOM tool-output node %q has %d outgoing package edges; treat this as package inventory fan-out, not service topology or runtime coupling."`. The Cursor stress report confirms this was surfaced and correctly interpreted.
**Recommendation:** No action. Requirement met.

---

### F13. Blocking edge case guard: "majority unknown nodes must not imply architecture coverage"
**Severity:** — (confirmed addressed)
**Evidence:** `Majority: true` is set when `unknownNodes > len(g.Nodes)/2`. Warnings include "do not treat graph size as architecture coverage." The `reason` field states "unclassified inventory, not semantic architecture coverage." Cursor stress report confirms 147,813/190,748 unknown nodes with majority warning.
**Recommendation:** No action. Requirement met.

---

### F14. `classifyFileSurface` case sensitivity and path-separator handling
**Severity:** — (confirmed correct)
**Evidence:** `lower := strings.ToLower(filepath.ToSlash(path))` normalizes before matching. All comparison strings use lowercase. Cross-platform safe.

---

## Summary Table

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| F1 | surface_buckets scope is correct | — | confirmed |
| F2 | Empty-graph edge case for majority | minor | not blocking |
| F3 | buildNavigationIndex called twice (DRY) | minor | not blocking |
| F4 | SBOM warning only first hub | minor | not blocking |
| F5 | read_order omits coverage.json/map.md | minor | noted, optional |
| F6 | Residual "unknown" bucket within unknown | minor | noted |
| F7 | Test out_edges == 3 for 3 components | — | correct |
| F8 | No schema update for navigation field | **major** | needs verification |
| F9 | graphIndexHighDegreeNodes called 3× | minor | same as F3 |
| F10 | Merge-approval thread evidence missing from packet | minor | needs archival |
| F11 | huge graph.json guard | — | addressed |
| F12 | SBOM fan-out ≠ topology guard | — | addressed |
| F13 | Majority unknown ≠ architecture guard | — | addressed |
| F14 | Path normalization correctness | — | confirmed |

---

## Verdict

**`accept_with_minor_followup`**

The navigation-index slice meets its stated requirements: bounded read path, SBOM fan-out guardrail, majority-unknown guardrail, no new OSS dependencies, machine-readable object in existing `summary.json` and `graph-index.json`. All three blocking edge cases are correctly handled. Evidence-state honesty is preserved throughout.

**Required before merge:**
- **F8** — confirm schema permissiveness or update schemas for the `navigation` field. This is the only **major** finding and it may resolve to nothing if schemas already allow additional properties.
- **F10** — ensure merge-approval evidence is archived, not just referenced.

**Optional follow-up (not blocking):**
- DRY refactor for F3/F9 (build navigation once).
- Generalize F4 (multi-SBOM warning) if multi-repo SBOM targets appear in future stress.
- Add `coverage.json` to `read_order` if agent stress reveals the gap.

---

## `not_assessed`

| Item | Why |
|------|-----|
| Whether `schema/*.json` files enforce `additionalProperties: false` (F8 resolution) | Packet shows `jq empty` passed but does not include schema file contents |
| Whether `graphIndexHighDegreeNodes` has a stable sort order for equal-degree nodes | Not visible in packet; tie-breaking is deterministic but unspecified |
| Whether `tool.Metrics["components"]` / `tool.Metrics["dependency_records"]` keys exist for all CycloneDX tool entries | The maprun code path produces the SBOM fan-out warning from graph structure, not from tool.Metrics; contextprep path uses tool.Metrics — both paths work independently |
| Whether the Cursor stress report's "conditionally adequate" verdict was produced without contamination | The report's own contamination declaration is the only evidence; cannot independently verify from packet |
| GitHub CI check status on the final PR head | Closeout document says refresh required; current state unknown |
| Whether external SDK consumers depend on `summary.json` / `graph-index.json` shapes | Not visible in diff scope |
| Runtime performance of double/triple high-degree computation on graphs larger than 190k nodes | Cannot profile from packet |
