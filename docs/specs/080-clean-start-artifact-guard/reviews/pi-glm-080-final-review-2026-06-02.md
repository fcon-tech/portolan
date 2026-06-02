# Independent Review — Portolan Spec 080 (Post-Fix)

**Spec:** 080-clean-start-artifact-guard  
**Date:** 2026-06-02  
**Reviewer:** Independent  
**State:** Post review-driven fixes, verification green  

---

## Findings by Severity

### Critical

None.

### Major

**M1 — `staleArtifactExclusion` text is advisory, not enforced at write time.**  
The exclusion boundary is rendered as prose into generated markdown. There is no mechanism preventing `contextprep.Run` from emitting a stale path into any artifact if a future code change passes one in. The test catches absence of known stale fixtures in the current run, but a regression introducing a path string from an old run via a different code path would not be caught unless new stale fixtures coincidentally appear. The prose-only boundary is architecturally appropriate for spec 080's stated scope (guidance, not enforcement), but the gap should be tracked.

**Severity justification:** The boundary is explicitly a generated-text instruction to downstream agents, not an enforcement layer. This is correct for the stated intent. The risk is drift, not current failure.

### Minor

**m1 — `freshArtifactBoundarySection` receives `out` (output path) which embeds an absolute filesystem path in markdown.**  
The brief and contract will contain e.g. `Current context output: /tmp/…/current-run/context`. This is correct behavior (agents need the path), but if outputs are ever compared across machines the diff will be noisy. Low priority; noting for awareness.

**m2 — `baselineArtifactContamination` text is duplicated across three sites (two constants + one `freshArtifactBoundarySection` render).**  
The query plan uses the two constants directly in step 1, while `freshArtifactBoundarySection` also concatenates them. Any wording edit must touch multiple locations. Not a defect, a maintainability note.

**m3 — ACCEPTANCE.md "Clean-Start Artifact Rules" section does not define a machine-readable lane ledger schema.**  
The rules reference "dated lane ledger" and "lane ledger" as the authority, but no schema, filename, or format is specified. This is acceptable at spec 080 scope (procedural rule) but means compliance is a manual judgment. Track if lane-ledger automation is planned.

### Info

**i1 — `renderAgentBrief` uses `ossPlan.OutputPath` via closure but the new call passes it as `ossPlan.OutputPath`.**  
Verified: `freshArtifactBoundarySection(ossPlan.OutputPath)` in `renderAgentBrief` and `freshArtifactBoundarySection(out)` in `renderAnswerContract` both resolve to the same output path (`out` from `Run`). Consistent.

**i2 — Product backlog entry P6-080 is "In implementation".**  
This is a state-tracking note, not a finding. Expected for a spec under review.

---

## Not Assessed

| Area | Reason |
|---|---|
| Runtime/producer execution safety | No runtime or producer execution in diff; constants and text rendering only. Spec 080 does not introduce runtime paths. |
| Network, daemon, or new dependency introduction | Diff contains no `go.mod`, `go.sum`, `Dockerfile`, or network calls. Confirmed clean by inspection. |
| Target deletion | No removal of existing artifacts from target root. `os.WriteFile` writes to `temp` output dir only. |
| GitHub review approval lane | Stated `not_assessed` in backlog; out of scope for this review. |
| Bigtop full rerun reproducibility | Verification report states green but was not independently reproduced here. |
| `.portolan/stress/*` cleanup of pre-existing stale roots | Spec does not require deletion of stale roots; only guidance to ignore. Correct per scope. |
| JSON schema validation of `evidence-index.jsonl`, `repos.json`, etc. | Test checks absence of stale paths but does not validate schema. Not in scope for 080. |

---

## Cannot Verify

| Area | Reason |
|---|---|
| Agent behavior compliance downstream | Whether Cursor/Copilot/etc. actually obey the rendered boundary prose is a runtime agent property, not a code property. Spec 080 provides guidance; enforcement is out of scope. |
| Dated lane ledger existence and correctness in actual stress runs | The spec requires lane-ledger discipline but does not ship a ledger template or validator. Compliance is procedural. |

---

## Lens Summary

| Lens | Assessment |
|---|---|
| **Requirements fit** | Constants and helpers render boundary text into brief, contract, and query plan. ACCEPTANCE.md codifies clean-start rules. Fits stated intent. |
| **Clean-start artifact boundary** | Explicit output path rendered into artifacts. Stale-path exclusion and contamination rules present in all three generated files. No stale paths leak in test. |
| **Stale-path leakage** | Test creates stale fixtures and asserts they do not appear in any generated artifact. Seven artifact types checked. Adequate for current scope. |
| **Evidence-state honesty** | `contaminated` lane classification defined. `unknown`/`not_assessed`/`cannot_verify` preserved in backlog and acceptance rules. No state promotion. |
| **Local-first / read-only safety** | Diff is write-to-temp + render-text only. No target root mutation, no network, no daemon, no new deps. |
| **Test coverage** | One focused test (`TestRunWritesFreshArtifactBoundaryGuidance`) covering presence/absence across 7 artifacts. Helper `assertTextDoesNotContainContextprep` is reusable. Coverage is adequate for the rendered-text scope of 080. No negative test for a lane that *does* read stale artifacts (that would require agent simulation, out of scope). |
| **Maintainability** | Constants centralize boundary text. Minor duplication noted (m2). `freshArtifactBoundarySection` is a single-point render function. Clean. |

---

## Verdict

**pass_with_findings**

Rationale: The diff correctly implements spec 080's stated intent — generated artifacts make the current artifact boundary explicit, stale-path exclusion prose is rendered in all three agent-facing files, acceptance rules codify clean-start discipline, and the focused test verifies both presence of guard strings and absence of stale references. No safety, dependency, network, deletion, or runtime issues. The findings (M1 enforcement-is-prose, m2 duplication, m3 no-ledger-schema) are real but acceptable at spec 080 scope and should be tracked for future hardening.
