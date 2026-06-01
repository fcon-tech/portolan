# Pre-Implementation Review: Spec 053 — Language-Agnostic Producers

**Date:** 2026-06-01
**Reviewer:** MiMo (automated review pass)
**Verdict:** `pass_with_changes`

---

## Findings

### CRITICAL — None

No blocking contradictions or spec-level impossibilities were identified.

---

### MAJOR

#### M-1: Stacked-branch risk is unmanaged

**Evidence:** PR #29 (spec 052) is open, non-draft, checks pass, but has no GitHub review approval and no merge approval. The 053 branch head (`c8b0514`) is stacked directly on PR #29's head (`27ccbb9`). The merge-base with `origin/main` is `eb2602f`, meaning 053 carries the entire unmerged 052 diff.

**Impact:** If 052 is revised during review, the 053 branch must be rebased, which risks merge conflicts, lost work, or silent contract drift. Reviewers on 053 cannot evaluate the branch in isolation — they must also review 052's full diff. This is the single highest implementation risk in the packet.

**Recommended fix:** Do not begin implementation on 053 until PR #29 is either merged or has explicit approval with a merge timeline. Record this as a branch policy gate in the spec or in a `BRANCHING.md` file. If time pressure exists, implement 053's foundational contract and fixtures on a temporary branch that touches only 053-owned files, then rebase after 052 merges.

---

#### M-2: Candidate tool names risk overclaiming verified support

**Evidence:** The recommendation record's `candidate_tools` field lists real tool names (`scip`, `lsif`, `serena`, `sourcebot`, `zoekt`). The spec says "candidates are options, not verified support," but the JSON shape alone does not enforce this — a consumer reading the JSON without the `reason` field could interpret `candidate_tools` as a supported-integration list.

**Impact:** This is the spec's own identified biggest risk, and the contract shape does not structurally mitigate it. The `reason` field is the only guardrail, and it is free text.

**Recommended fix:** Add a required boolean field `"verified": false` (defaulting to `false`) to the recommendation record schema. Only a completed evaluation record with `decision: "approved"` should set it to `true`. This makes the "not verified" state machine-readable rather than relying on prose interpretation.

---

### MINOR

#### m-1: Evaluation record `decision` vocabulary is underspecified

**Evidence:** The evaluation record shows `"decision": "not_assessed"` but does not enumerate the allowed terminal values. The spec mentions "risky producer defaults are rejected, blocked, or narrowed" (FR-007), implying at least `approved`, `rejected`, `blocked`, `narrowed` as possible values.

**Impact:** Without a controlled vocabulary, implementers will invent their own values, leading to inconsistent downstream consumption.

**Recommended fix:** Enumerate the allowed `decision` values in the spec or in a JSON Schema definition: `not_assessed`, `approved`, `rejected`, `blocked`, `narrowed`.

---

#### m-2: Coverage record `status` and `evidence_state` overlap

**Evidence:** The coverage record has both `status` and `evidence_state`, both set to `"not_assessed"` in the example. The recommendation record has the same pair. The spec does not define the distinction between these two fields.

**Impact:** Implementers may conflate them or use them inconsistently, and consumers will not know which field to query for "is this actually covered?"

**Recommended fix:** Define the distinction explicitly. Suggested convention: `status` reflects the operational state of the producer family for a repository (e.g., `not_assessed`, `active`, `partial`, `blocked`); `evidence_state` reflects the quality/trust level of the underlying evidence (e.g., `not_assessed`, `weak`, `strong`, `verified`). Document this in the spec.

---

#### m-3: FR-004 weak-state preservation is testable but not fixture-scoped

**Evidence:** FR-004 says "recommendations preserve current weak states until local producer output is present and normalized." The proposed tasks mention "fixtures" but do not specify that a fixture must exist showing a weak state surviving a recommendation cycle.

**Impact:** Without a concrete fixture, the requirement is easy to implement incorrectly (e.g., upgrading a weak state to `not_assessed` when a recommendation is generated).

**Recommended fix:** Include at least one fixture in the US1 task that demonstrates a weak evidence state persisting through recommendation generation.

---

#### m-4: No explicit schema file or JSON Schema proposed

**Evidence:** The contract shape is shown as inline JSON examples in the spec. The tasks mention "schema/contract expectations" but do not specify producing a machine-readable schema (e.g., JSON Schema or TypeScript type).

**Impact:** Without a machine-readable schema, contract validation depends on ad-hoc test assertions, which are brittle and harder to evolve.

**Recommended fix:** Add a task to produce a JSON Schema (or equivalent) for each record kind (`producer-recommendation`, `producer-evaluation`, `producer-coverage`). Store it alongside the spec or in a shared schema directory.

---

#### m-5: Mixed-language coverage (FR-008) has no example fixture

**Evidence:** FR-008 requires reporting coverage "by repository and evidence family, including partial/off-scope coverage" for mixed-language repos. No example is given in the contract shape section, and the tasks do not call out a specific fixture for this.

**Impact:** Implementers may not test the partial/off-scope case, which is the hardest part of FR-008.

**Recommended fix:** Add a fixture representing a mixed-language repository (e.g., a repo with both PHP and TypeScript) where one family has coverage and another does not, producing a partial coverage record.

---

## Verdict

**`pass_with_changes`**

The spec direction is sound, the product-boundary constraints are clear, and the evidence-state discipline is correctly identified as the central concern. However, the stacked-branch risk (M-1) and the candidate-tool overclaiming risk (M-2) must be addressed before implementation begins.

---

## Recommendation

**Wait for PR #29 merge (or explicit merge approval) before beginning 053 implementation.** In the interim:

1. Resolve M-2 by adding a `verified` boolean field to the recommendation record schema.
2. Resolve m-1 by enumerating `decision` values.
3. Resolve m-2 by defining the `status` vs. `evidence_state` distinction.
4. Resolve m-4 by scheduling a JSON Schema deliverable.
5. Resolve m-3 and m-5 by adding the specified fixtures to the task list.

Once PR #29 merges and the major/minor fixes are incorporated into the spec, implementation can proceed cleanly on a rebased 053 branch.
