# Portolan Spec 080 — Independent Review: Clean-Start Artifact Guard

## Findings

### Critical

None.

### Major

**M1 — No runtime enforcement of the artifact boundary; guidance is prose-only.**

The implementation adds boundary text to three generated markdown files (`agent-brief.md`, `answer-contract.md`, `query-plan.md`). There is no code path that *prevents* or *detects* a consumer reading stale artifacts. The acceptance rules in `ACCEPTANCE.md` rely entirely on agents reading and obeying prose instructions.

- Evidence: `renderAgentBrief` and `renderAnswerContract` emit strings via `fmt.Fprintf`; no guard struct, path predicate, or runtime check exists in `contextprep.go`.
- This is arguably the intended scope of 080 (documentation/guidance), but the spec says *"must make the current artifact boundary explicit"* and *"must not read"* — the "must not" is unenforceable at this layer. The gap should be acknowledged as `cannot_verify` for actual runtime enforcement, or a follow-up issue should be filed.

**M2 — No negative test verifying that stale paths are *excluded* from the generated context pack.**

`TestRunWritesFreshArtifactBoundaryGuidance` creates stale siblings (`.portolan/stress/old-run/context/answer-contract.md` and `run/map.md`) but only asserts the *presence* of boundary text. It never asserts that the fresh pack does not contain references to `old-run` or `run/`. If a future change leaked stale paths into the pack, no test would catch it.

- Evidence: The test body at lines 122–166 of `contextprep_test.go` checks string inclusion only; no exclusion assertion.

### Minor

**m1 — Query-plan step numbering changed but no migration note.**

The "Before Answering" steps are renumbered (old 1–7 → new 1–8 with a new step 1). Downstream agents that reference steps by number (unlikely but possible) would silently misalign. No test asserts the step count or full rendered output structure.

- Evidence: `renderQueryPlan()` diff, old lines 2132–2138 replaced with 8 steps.

**m2 — Hardcoded prose duplicates across three files.**

The boundary rule language ("sibling `.portolan/stress/*`", "root-level `run/`", "contaminated and non-counting") is repeated with slight variation in `agent-brief.md`, `answer-contract.md`, and `query-plan.md`. If policy wording changes, all three must be updated consistently. Consider extracting to a shared template constant.

- Evidence: Three separate `fmt.Fprintf` blocks in `renderAgentBrief`, `renderAnswerContract`, and `renderQueryPlan`.

**m3 — `ACCEPTANCE.md` rules are not referenced from generated packs.**

The acceptance doc adds substantive contamination rules, but the generated markdown files don't point agents to `ACCEPTANCE.md` for the authoritative definition. An agent reading only the context pack may apply an incomplete interpretation.

**m4 — No test for `renderAnswerContract` receiving the new `out` parameter when `out` is empty string.**

`renderAnswerContract(root, out)` is now called with the `out` path. If `out` is empty (edge case), the boundary line would read ``Current context output: `` — not tested.

## Accepted Positives (context only)

- The feature pointer, `AGENTS.md` plan path, and `product-backlog.md` entry are consistently updated for 080.
- No target deletion, network calls, daemon starts, new dependencies, or runtime/producer execution introduced. `go vet`, `go test`, schema validation, and `git diff --check` all pass.
- The Bigtop context smoke confirmed 18 repos, 5 OSS plan entries, no `run/` or `context/tool-outputs` leakage — consistent with clean-start intent.

## Not Assessed

| Item | Reason |
|---|---|
| Whether any existing or future agent actually *obeys* the boundary prose | Cannot verify without agent-level behavioral testing |
| Runtime enforcement mechanism (path predicate, sandbox) | Not in scope of this diff; should be tracked |
| GitHub review approval status | Explicitly `not_assessed` per backlog convention |
| End-to-end stress lane contamination detection | No stress lanes in this packet |

## Verdict

**pass_with_findings**

The diff correctly implements the stated spec intent at the documentation/guidance layer. The two major findings (M1: no runtime enforcement, M2: no negative exclusion test) are real gaps but appear to be scope-boundary or follow-up items rather than merge blockers for a clean-start *guidance* spec. If the spec's "must not read" is intended as enforceable at this layer, M1 should be promoted to blocking and the verdict would be `fail`. Under the interpretation that 080's deliverable is *explicit boundary documentation*, the implementation is sufficient with the noted gaps acknowledged.
