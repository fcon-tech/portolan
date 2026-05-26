## PR #14 Independent Review: `034-cursor-comparison-validation`

**Branch**: `034-cursor-comparison-validation` vs `origin/main`  
**Scope**: Read-only review of requirements mismatch, evidence-state honesty, SpecKit lifecycle coherence, PR scope risk, auto-commit/process side effects, and product-claim overreach.

---

### Finding 1 — Major: PR Scope Includes Adjacent SpecKit Infrastructure Work

**Files**: `.specify/extensions/git/git-config.yml`, `.specify/extensions/git/config-template.yml`, `docs/speckit-workflow.md`  
**Evidence**: PR review disposition records L1 (accepted/fixed): these files had `auto_commit.default: true` and were changed to `false` during PR review. Local PR review L2 explicitly states: *"PR scope remains broad because it includes both spec 034 validation and repo-local SpecKit delivery skill/extension work requested in the same conversation."*

`AGENTS.md` delivery rules require: *"verify branch provenance and diff scope with `git diff --name-status <base>...HEAD`"* and *"remove unrelated backlog/spec files before PR review."* Whether the bad config state was pre-existing on `main` or introduced by this branch, mixing SpecKit infrastructure fixes with a P4 validation spec expands review surface and obscures the actual product-validation diff.

**Recommended fix**:  
- If these changes fix a pre-existing `main` defect, move them to a standalone SpecKit maintenance PR.  
- If they are self-inflicted side effects from running SpecKit during spec 034 implementation, document them as process artifacts in `reviews/` and revert the non-spec-034 file changes from this branch.

---

### Finding 2 — Minor: Verification Artifact Mislabels Generic Checklist as Requirements Traceability

**File**: `specs/034-cursor-comparison-validation/reviews/verification-2026-05-26.md`  
**Line**: 17  
**Evidence**: The verification table cites `requirements.md`: *"16 total, 16 complete, 0 incomplete."* The actual artifact at `specs/034-cursor-comparison-validation/checklists/requirements.md` is a generic SpecKit **spec-quality checklist** (Content Quality, Requirement Completeness, Feature Readiness) with ~12 checklist items. It is **not** a requirements traceability matrix mapping FR-001 through FR-010 to implementation evidence.

This misrepresents the depth of requirements verification. A reader seeing "16/16 complete" assumes every functional requirement has been traced to an artifact; the checklist does not do this.

**Recommended fix**: Rename the reference to `spec-quality-checklist.md` and update the count, or create a true requirements traceability matrix that maps each `spec.md` FR to the output/artifact that satisfies it.

---

### Finding 3 — Minor: Product Backlog Omits PR Review Lane Degradation

**File**: `docs/product-backlog.md`, P4-034 row  
**Evidence**: The backlog row accurately lists product-surface `not_assessed` items (UI Cursor/Composer, ecosystem completeness, runtime topology, near-clone/SBOM duplication, OSS producer execution). However, it **omits** that two of four PR review lanes were degraded:
- `deepseek/deepseek-v4-pro`: empty/hung output → `not_assessed`
- `openrouter/~google/gemini-pro-latest`: absent from `~/.pi/agent/settings.json` → `not_assessed`

For a P4 validation spec where independent review is a quality gate, the backlog should not read as fully settled when half the review lanes produced no evidence.

**Recommended fix**: Append to the P4-034 backlog row: *"PR independent review lanes: DeepSeek `not_assessed` (empty output), Gemini Pro Latest `not_assessed` (model ID absent)."*

---

### Finding 4 — Minor: Scoring Rubric Lacks "Coverage Completeness" Dimension

**File**: `specs/034-cursor-comparison-validation/reviews/scoring-rubric-2026-05-26.md`  
**Evidence**: The rubric scores `unsupported_claim_count`, `scope_correct`, `evidence_use`, `unknown_handling`, and `next_action_quality`. The B1 lane achieves `unsupported_claim_count: 0` on all five questions by correctly abstaining beyond bounded artifacts (e.g., "only Go imports are safe, everything else is `not_assessed`"). While the comparison ledger *does* now contain a coverage interpretation section (added as fix for local review L2 / Qwen R3), the **rubric itself** still conflates "zero unsupported claims" with "fully answered the question."

This means the 100% unsupported-claim reduction (12 → 0) and the 100% next-action pass rate can be re-read in future reviews as purely positive deltas, without the necessary context that B1 achieved them partly by narrowing answer scope.

**Recommended fix**: Add an explicit `coverage_completeness` or `answer_breadth` dimension to the scoring rubric, with values like `full` / `partial-bounded` / `abstained`, so future comparisons do not conflate evidence discipline with factual coverage.

---

## No Critical Findings

No blocking correctness defects, evidence-state dishonesty, or product-claim overreach were found. The accepted claim is appropriately narrow:

> *"On the fixed local Bigtop landscape, Portolan gives Cursor a bounded evidence context that materially improves evidence discipline and next-action quality..."*

The ledger limitations section and coverage interpretation correctly prevent overclaiming.

---

## Residual `not_assessed` Risks

1. **UI Cursor/Composer lane**: Only headless Cursor Agent was evaluated; UI lane remains `not_assessed`.
2. **Full Apache Bigtop ecosystem completeness**: Local checkout of 18 repos ≠ full corpus; external completeness `unknown`.
3. **Independent PR review evidence**: DeepSeek and Gemini lanes returned no usable output; only local and Qwen lanes contributed findings.
4. **GitHub CI checks**: No checks reported on the branch at closeout time.
5. **Merge approval**: No human/GitHub approval verified at closeout time.
6. **Lane determinism**: Single run per lane cannot separate agent nondeterminism from systematic improvement.
7. **Bounded-artifact granularity**: While FR-009 appears satisfied, independent verification that *all* granular counts and samples cited in `cursor-plus-portolan-output.md` are derivable solely from `summary.json` + `graph-index.json` + context pack would require inspecting the actual `/tmp` artifacts; this was accepted based on disposition trust rather than direct artifact inspection.
