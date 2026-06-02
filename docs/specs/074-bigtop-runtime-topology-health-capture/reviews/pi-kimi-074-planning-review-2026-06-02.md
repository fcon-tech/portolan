# Portolan Review: `codex/074-bigtop-runtime-topology-health-capture`

## Branch Purpose
Adds spec **074** (health-oriented runtime topology capture), with backlog specs **075** (producer coverage closure) and **076** (Cursor enterprise parity validation). No code changes — planning-only branch.

---

## 1. Requirements Fit and Goal Fidelity

| Finding | Severity | Evidence | Recommendation |
|---------|----------|----------|----------------|
| **074 scope is a slice, not the full objective** | Major | Spec 074 targets "health-oriented runtime topology capture" — a subset of the full runtime topology, symbol graph, call graph, and enterprise parity goals | Rename or re-scope to explicitly state this is **Phase 1 of N**; link 075/076 as dependent sequels in spec header |
| **075 and 076 are backlog-only (no content)** | Minor | They appear as placeholders with no acceptance criteria or test vectors | Either populate with minimal AC now or remove from branch to avoid phantom-scope confusion |
| **Full objective preservation: cannot_verify** | — | No evidence that post-074+075+076 sequence achieves Cursor+Portolan parity | Add a roadmap doc or epic trace showing how 074→075→076→[future] closes the gap |

---

## 2. Evidence-State Semantics

| Finding | Severity | Evidence | Recommendation |
|---------|----------|----------|----------------|
| **Blocked / not_assessed / cannot_verify are used correctly** | — | Approval-state file marks runtime execution as `blocked/not_assessed` and bounded topology as `cannot_verify` pending run evidence | Correct per Portolan state machine: absence of evidence ≠ evidence of absence |
| **Missing: pre-074 state baseline** | Minor | PR #51/sp left NameNode, RM, HistoryServer, ProxyServer as failed; Datanode skipped. 074 should inherit this baseline explicitly | Add a "Preconditions" section to 074 referencing #51/sp outcomes, so health capture knows what *should* be running vs. what was *observed* failing |

---

## 3. Runtime Safety — Approval Gate

| Finding | Severity | Evidence | Recommendation |
|---------|----------|----------|----------------|
| **Approval gate is present but underspecified** | Major | "Cursor scope stress says slicing is aligned and spec 074 cannot run … without fresh explicit approval" — but no documented *who* approves, *what* they validate, or *rollback* procedure | Add to spec: approver role (maintainer? security?), pre-run checklist (image provenance, resource limits, network isolation), and abort/destroy trigger conditions |
| **No timeout or resource bound specified** | Major | Docker create/exec/smoke/destroy sequence can hang or leak | Define max lifetime (e.g., 10 min), CPU/memory caps, and automatic `docker rm -f` on timeout |
| **Smoke test definition absent** | Critical | "smoke" is mentioned but not defined — what commands? what healthy output? | Block runtime execution until smoke test commands and expected assertions are in the spec |

---

## 4. SpecKit Readiness

| Finding | Severity | Evidence | Recommendation |
|---------|----------|----------|----------------|
| **Spec 074 lacks acceptance criteria** | Critical | No "Given/When/Then" or observable pass/fail conditions for "health-oriented runtime topology capture" | Add AC: e.g., "Given Bigtop containers running, When health probe executes, Then JSON output contains {containers: [...], health_status: {name: ok\|degraded\|failed}, timestamp: ...}" |
| **Output schema undefined** | Major | "runtime topology" needs a schema to be comparable across runs and against Syft/CycloneDX | Define minimal schema or reference existing Portolan catalog schema; include version |
| **No producer registration for 074 output** | Major | User objective includes "real symbol/API/catalog/model/runtime producer outputs beyond Syft/CycloneDX" | If 074 emits a new artifact type, it needs a producer ID, MIME type, and registry entry — even if backlogged to 075 |
| **Diff against 073 not visible** | Minor | Branch adds 074 but doesn't show what 073 left behind | Add a changelog or delta section for reviewer context |

---

## Verdict

| Criterion | Assessment |
|-----------|------------|
| **Merge readiness** | **Not ready** — Critical gaps in AC, smoke test definition, and output schema |
| **Runtime execution readiness** | **Blocked** — Approval gate exists but lacks safety bounds; smoke test undefined |
| **Goal fidelity** | **Partial** — 074 is a valid slice, but the path to full objective is not_assessed |
| **State semantics** | **Correct** — blocked/cannot_verify/not_assessed are properly applied |

---

## Not Assessed

- Actual Docker compose or Bigtop configuration files (none in branch)
- Portolan producer SDK integration details (deferred to 075)
- Cursor enterprise feature matrix (deferred to 076)
- Performance or scalability bounds for topology capture
- Security scan of container images used in runtime sequence
