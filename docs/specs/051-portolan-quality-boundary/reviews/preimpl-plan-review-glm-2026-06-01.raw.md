# SpecKit Review: Portolan Quality Boundary (051)

## Verdict: **CHANGES_REQUESTED**

The packet is strong in intent and structure. Three issues need resolution before implementation.

---

## Findings

### 1. Major — Claim Verdict states diverge from spec-mandated evidence states

**Evidence**: `spec.md` FR-008 and FR-012 mandate states `unknown`, `cannot_verify`, `not_assessed`. `data-model.md` Claim Verdict defines `classification` as `accepted | narrowed | rejected | blocked | not_assessed`. The set `{unknown, cannot_verify}` appears in FR-008 but has no representation in the Claim Verdict model.

**Recommendation**: Add `unknown` and `cannot_verify` as valid Claim Verdict classifications, or explicitly map which evidence states map to which verdict classifications. A downstream reviewer must be able to classify a claim whose evidence is `unknown` without ambiguity.

### 2. Major — Task T010 is an unresolved escape hatch with no failure condition

**Evidence**: `tasks.md` T010 reads: *"Implement the smallest validation path that satisfies the contract, or record why this slice remains docs/fixtures only."* This is two tasks with opposite outcomes and no criterion for choosing between them.

**Recommendation**: Split T010 into T010a (implement minimal validation path) and T010b (document why docs/fixtures-only is acceptable for this slice). Add a decision gate: if `contracts/quality-boundary.md` Report Quality Minimum is machine-checkable via `jq`/JSON Schema alone, T010a closes; otherwise T010b must record the gap and a follow-up issue.

### 3. Minor — Backlog row and cross-spec dependency are incomplete

**Evidence**: `checklists/requirements.md` ends mid-sentence: *"Every P0/P1/P2 item must map to exactly one SpecKit feature directory before"*. T014 says "Add explicit dependency from UX/report spec 052 to this quality boundary" but spec 052 is referenced nowhere else in the packet with a concrete path or expectation.

**Recommendation**: Complete the truncated sentence. For T014, add a note or file path showing where the 051→052 dependency will be recorded (e.g., `specs/052-…/spec.md` Assumptions section will cite `specs/051-…/contracts/quality-boundary.md`).

---

## Not Assessed

The following were outside the review packet and are not verified:

- **Current Portolan codebase state** — whether existing surfaces, adapters, README, or agent docs already contradict the proposed boundary.
- **SDP Lab distillation accuracy** — `research.md` references `/home/fall_out_bug/projects/sdp/sdp_lab`; the portable/rejected patterns are taken on faith.
- **Implementation feasibility of the report-quality command** — `quickstart.md` sketches `portolan report quality`; no code or schema exists to validate the CLI contract.
- **Alignment with existing Portolan evidence-state definitions** — the packet defines `source-visible`, `metadata-visible`, `runtime-visible`, `claim-only`, `unknown`, `cannot_verify` but these may already exist in Portolan's codebase with different semantics.
- **Schema files** — `plan.md` mentions `schema/*.json` and `jq empty` validation but no schema files are in the packet.
