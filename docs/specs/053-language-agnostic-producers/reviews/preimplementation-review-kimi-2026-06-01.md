## Pre-Implementation Review: Spec 053 — Language-Agnostic Producers

---

### Findings

| # | Severity | Finding | Evidence | Impact | Recommended Fix |
|---|----------|---------|----------|--------|-----------------|
| 1 | **critical** | **Support overclaiming risk in candidate_tools display** | Contract shape lists `candidate_tools: ["scip", "lsif", "serena", "sourcebot", "zoekt"]` alongside `status: "not_assessed"`; FR-005 states candidates are options not verified support, but the record structure makes tool names prominently visible while the disclaimer is buried in `reason` text | Consumers (UI, reports, LLM context) may surface tool names without the disclaimer, creating false impression of Portolan support; violates product boundary "candidate OSS tools are useful only when installed locally, explicitly approved, saved, normalized" | Add a mandatory `candidate_tools_disclaimer` field or wrap candidates in `{id, verified: false}` objects; require schema validation that `status != "verified"` when `candidate_tools` is populated; add lint rule for answer-contract text |
| 2 | **critical** | **Stacked-branch implementation risk without merge policy** | PR #29 (052) is open, checks pass, but lacks GitHub review approval and merge approval; 053 merge-base with 052 is `27ccbb95...` (052 head); no branch policy recorded for stacked work | If 052 receives review changes, 053 rebasing complexity grows; if 052 stalls, 053 is blocked; risk of dual maintenance or abandoned stacked PRs | Record explicit branch policy in spec: (a) 053 remains draft until 052 merges, or (b) 053 targets 052 branch with clear rebase ownership, or (c) wait for 052 merge before non-draft 053 PR |
| 3 | **major** | **FR-009/FR-010 runtime topology guardrail lacks enforcement mechanism** | FR-009/FR-010 prohibit runtime topology claims from static records, but no schema field or validation rule captures this constraint; product boundary states "runtime service topology remains `not_assessed` without runtime-visible local observations" | Static analysis code paths could accidentally emit synthetic runtime claims; no machine-checkable guardrail | Add `runtime_derived: boolean` field to coverage/recommendation records; schema-reject records with `runtime_derived: true` when `evidence_source != "runtime_observation"`; add test fixture for this violation |
| 4 | **major** | **"Weak state preservation" (FR-004) is under-specified for transitions** | FR-004 requires preserving weak states until local producer output is present and normalized, but no state machine or transition rules define what "present and normalized" means, nor how downgrade/upgrade works | Implementation inconsistency in evidence state lifecycle; risk of flickering claims or premature strength upgrades | Add state transition diagram to spec: `not_assessed → weak_candidate → normalized_present → strong_claim`; define entry/exit conditions per transition; add `normalization_version` field to records |
| 5 | **minor** | **Evaluation record `integration_cost: "unknown"` is inconsistent with other fields** | All other evaluation fields use `"not_assessed"` as the null state; `integration_cost` uses `"unknown"` | Minor schema inconsistency, complicates generic handling | Standardize to `"not_assessed"`; document if `"unknown"` carries semantic distinction |
| 6 | **minor** | **Coverage record `scope: "repository"` may not capture mixed-language subdirectories** | FR-008 requires mixed-language coverage by repository and evidence family, including partial/off-scope coverage; `scope: "repository"` lacks granularity for monorepo subdirectory cases | Partial coverage in large repos may be misrepresented | Add `scope_detail` optional field (path glob or component list); or define `scope` enum: `["repository", "directory", "component", "partial"]` |

---

### Verdict: **pass_with_changes**

The spec direction is sound and aligns with the corrected strategy (evidence families over language adapters). The contract shapes are appropriately conservative. However, two critical findings must be addressed before implementation begins: support overclaiming requires structural/schema-level mitigation, not just textual disclaimer; and the stacked branch situation requires an explicit policy decision.

---

### Recommendation: **wait for PR #29 merge, with preparatory work allowed**

| Activity | Timing |
|----------|--------|
| Disposition findings 1, 2, 4 in spec revision | Now (on 053 branch, spec docs only) |
| Schema/contract fixes (finding 1, 3, 5) | Now (fixture and schema files, no runtime code) |
| State transition specification (finding 4) | Now |
| US1-US3 implementation, tests, baseline checks | After PR #29 merges to `main` and 053 is rebased |
| Final PR open (non-draft) | After rebase on merged 052 |

If PR #29 does not merge within **5 business days**, escalate to: (a) request expedited review, or (b) revise 053 to target `main` directly with 052 changes cherry-picked, documenting the divergence rationale.
