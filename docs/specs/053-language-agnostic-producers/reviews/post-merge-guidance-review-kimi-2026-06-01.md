I'll review this diff as an independent no-tools reviewer, focusing on the four lenses specified.

## Findings

### 1. **CRITICAL** — `renderAgentBrief` parameter list expansion without corresponding signature update in callers (inferred: `internal/contextprep/contextprep.go` ~line 278)

The diff shows `renderAgentBrief` gaining three new parameters (`producerRecommendations`, `producerCoverage`, `producerEvaluations`) at the call site, but **no diff hunk shows the function signature change itself**. The hunk at line 1711+ shows the new signature, but verify no other callers exist. If `renderAgentBrief` is called elsewhere in the codebase (not shown in this diff), those callers are now broken.

**Recommendation:** Confirm all call sites are updated; the diff only shows one call site at line 278.

---

### 2. **MAJOR** — `app_test.go` string assertions are overly brittle and may flake on minor wording tweaks (`internal/app/app_test.go`, lines 1953–1968)

The test asserts exact substring presence for 12+ phrases in `agent-brief.md`. This creates tight coupling between prose and tests. The new additions ("Observed CycloneDX/Syft components", "context-preparation producer gaps", etc.) continue this pattern.

**Recommendation:** Consider structurally parsing the markdown sections or using golden files with normalized whitespace to reduce maintenance burden. Not a blocker, but technical debt.

---

### 3. **MAJOR** — Evidence-state honesty risk: "Local producer evaluation records" count may mislead if empty slice ≠ truly absent (`internal/contextprep/contextprep.go`, ~line 1774)

```go
fmt.Fprintf(&b, "- Local producer evaluation records: %d\n", len(producerEvaluations))
```

If `producerEvaluations` is an empty slice (initialized but unpopulated), this prints `0`. An agent reading "Local producer evaluation records: 0" may infer the *concept* was assessed and found absent, versus `not_assessed` (never checked). The `answer-contract.md` correctly states "if no `producer-evaluation` record is present, candidate evaluation remains `not_assessed`" — but the brief's count format doesn't distinguish "0 assessed and none found" from "not assessed."

**Recommendation:** Add explicit `not_assessed` language when count is 0, or separate "assessed: yes/no" from "count."

---

### 4. **MAJOR** — Overclaim risk partially mitigated but "Observed CycloneDX/Syft components" phrasing still implies Syft specifically (`internal/contextprep/contextprep.go`, ~line 1768)

The brief says "Observed CycloneDX/Syft components" but the code only checks `tool.Family == "cyclonedx"`. Syft *produces* CycloneDX; other tools may too. The phrasing conflates format family with producer.

**Recommendation:** Change to "Observed CycloneDX components" or, if Syft-specific detection exists elsewhere, clarify the provenance chain. Current phrasing risks implying Syft was observed when only CycloneDX-format output was.

---

### 5. **MINOR** — `renderAgentBrief` builder pattern: SBOM metrics use `>` not `>=`, silently preferring later tools with equal counts (`internal/contextprep/contextprep.go`, ~lines 1729–1735)

```go
if tool.Metrics["components"] > sbomComponents {
    sbomComponents = tool.Metrics["components"]
}
```

If two tools have equal `components`, the first is kept. This is deterministic but arbitrary. No bug, but worth documenting or using `>=` if last-wins is intended.

**Recommendation:** Document tie-breaking or switch to `>=` for clarity.

---

### 6. **MINOR** — `query.go` warning string is long (240+ chars); may wrap poorly in narrow terminals (`internal/query/query.go`, line 143)

The warning string spans ~240 characters with embedded backticks. Fine for logs, but if surfaced in TUI or narrow formats, readability suffers.

**Recommendation:** Break into two sentences or use structured fields if consumed programmatically.

---

### 7. **MINOR** — Test coverage: `query_test.go` only verifies warning contains "does not supersede context/gaps.jsonl", not the full boundary clause (`internal/query/query_test.go`, ~line 116)

The test checks `result.Warnings[0]` contains the substring, but doesn't verify the full warning text or that `result.Warnings` has exactly one element. If additional warnings are prepended later, this silently passes.

**Recommendation:** Assert `len(result.Warnings) == 1` or verify full string equality.

---

### 8. **MINOR** — `answer-contract.md` prose: "Native map relationship extraction is currently limited to Go imports and go.mod manifests" — "currently" implies roadmap intent (`internal/contextprep/contextprep.go`, ~line 1829)

The word "currently" may signal to agents that expansion is planned or expected, which could be read as a soft commitment.

**Recommendation:** Consider "is limited to" without "currently" to avoid implying future capability.

---

## Verdict

**`accept_with_minor_followup`**

The diff correctly advances the goal: it hardens boundaries between context gaps and map gaps, explicitly rejects synthetic producer evaluations, and limits relationship extraction claims to Go-only. The `answer-contract.md` and `query.go` warning improvements directly address the PR #30 stress scenario.

However, **follow-up required before next release:**
- Verify no stale `renderAgentBrief` callers exist (Finding 1).
- Resolve the `0` vs `not_assessed` ambiguity for producer evaluation counts (Finding 3), or document the intentional design.
- Clarify CycloneDX vs Syft attribution (Finding 4).

---

## `not_assessed`

| Item | Why |
|------|-----|
| Whether `producerRecommendations`, `producerCoverage`, `producerEvaluations` slices are actually populated with meaningful data elsewhere in `contextprep.go` | Diff only shows them passed to `renderAgentBrief`; cannot verify upstream data flow without full file context |
| Whether `tool.Metrics["components"]` and `tool.Metrics["dependency_records"]` keys are guaranteed present for CycloneDX tools | No validation shown; assumes contract with tool registry |
| Whether the new `agent-brief.md` prose renders correctly in actual Cursor/Composer consumption | No integration test shown; only Go substring assertions |
| Performance impact of longer brief/contract text on token budgets | Out of scope for this diff review |
| Whether `renderAgentBrief` signature change breaks any external consumers (e.g., SDK, CLI plugins) | Not visible in diff; assume internal-only but cannot verify |
