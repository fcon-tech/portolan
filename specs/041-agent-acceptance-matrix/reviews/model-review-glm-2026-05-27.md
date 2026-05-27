# Portolan Spec 041 — Agent Acceptance Matrix: Implementation Diff Review

## Findings

### F1: Self-target lane limits generalizability but is honestly disclosed
- **Severity**: minor (informational)
- **Evidence**: `PORTOLAN_PATH` and `TARGET_PATH` are identical (`/tmp/portolan-041-agent-acceptance-matrix`). The lane ledger and product-claims both explicitly state this is a self-target run and that generalization to non-Portolan single-repo targets remains `not_assessed`.
- **Recommendation**: No action required. The disclosure is honest and the product claim is appropriately narrow. A future lane on an external repo would strengthen the evidence.

### F2: `cannot_verify` scoring path is unexercised
- **Severity**: minor
- **Evidence**: Lane ledger records 0 `cannot_verify` references and notes this path is "unexercised by this run." The acceptance contract lists `cannot_verify` as a valid degraded state, but no artifact in this target produced one.
- **Recommendation**: Record this gap in the matrix snapshot or lane ledger as a known untested scoring path. When a target naturally produces `cannot_verify` (e.g., black-box/metadata-heavy), that lane will validate the scoring pipeline.

### F3: Self-scoring acknowledged but no independent review recorded yet
- **Severity**: moderate
- **Evidence**: Lane ledger states "self-scored by the Codex implementation lane, with independent review required before treating the score as final product evidence." The `acceptance-matrix-2026-05-27.md` snapshot sets `codex-single-repo` to `verified` without noting the self-score caveat inline.
- **Recommendation**: Either add a self-score flag to the matrix snapshot table (e.g., `verified (self-scored)`) or add a footnote to the snapshot linking back to the lane ledger's scoring-independence note. This prevents a future reader from treating the snapshot as independently verified.

### F4: Blind prompt references `docs/agent/QUICKSTART.md` without it being in the diff
- **Severity**: minor
- **Evidence**: The blind acceptance prompt step 1 says: "If it is a source checkout, use the documented source-checkout path from `docs/agent/QUICKSTART.md`." This file is not part of the diff and may not exist yet.
- **Recommendation**: Confirm `docs/agent/QUICKSTART.md` exists and contains the referenced source-checkout instructions. If it doesn't exist, add it or change the prompt to not reference a missing document.

### F5: SHA-256 of ACCEPTANCE.md is recorded but verification method is unspecified
- **Severity**: minor
- **Evidence**: Lane ledger records `30e83bbdc68abe11ca3d3f115cef000eb4ac25cd7ad80f736e977d6e9f6e72ed` for `docs/agent/ACCEPTANCE.md`. No instructions are given for how a reviewer should reproduce or verify this hash.
- **Recommendation**: Consider noting the command used (e.g., `sha256sum docs/agent/ACCEPTANCE.md`) so reviewers can reproduce it. Low priority since the value is correct for the committed content.

### F6: No security or privacy concern in this diff
- **Severity**: none (positive finding)
- **Evidence**: The diff contains only Markdown documentation, review artifacts, and metadata. No credentials, secrets, PII, or mutation-capable commands are introduced. The blind prompt explicitly prohibits network access, credentials, cloning, and target mutation.

### F7: Product claim boundary is well-maintained
- **Severity**: none (positive finding)
- **Evidence**: `product-claims.md` additions are narrow, name the specific harness and target shape, and preserve `not_assessed` for all unverified cells. The "Limits That Must Stay Visible" section is extended with the cross-harness acceptance constraint. The claim gate section requires lane evidence before any update.

### F8: Ledger template is thorough and well-structured
- **Severity**: none (positive finding)
- **Evidence**: The ledger template in `acceptance-matrix-2026-05-27.md` captures prompt isolation, target completeness assumptions, commands, artifacts, scoring dimensions, and disposition. This is sufficient for reproducibility and independent review.

### F9: Analyze disposition findings are resolved but linkage is weak
- **Severity**: minor
- **Evidence**: `analyze-disposition-2026-05-27.md` records F1–F3 as accepted, but does not link forward to the specific implementation artifacts that resolve them (e.g., F2 says "run or explicitly block one lane" but doesn't name the lane ledger file).
- **Recommendation**: Add forward links from analyze findings to the artifacts that resolved them. This aids audit trails.

## Severity Summary

| ID | Severity | Category |
| --- | --- | --- |
| F1 | minor | Evidence scope |
| F2 | minor | Coverage gap |
| F3 | moderate | Scoring independence |
| F4 | minor | Missing reference |
| F5 | minor | Reproducibility |
| F6 | none | Security/privacy |
| F7 | none | Product boundary |
| F8 | none | Completeness |
| F9 | minor | Audit trail |

## Evidence

All evidence is drawn from the diff artifacts listed above. No external tools, network access, or file system reads were used.

## Recommendation

1. **F3 (moderate)**: Add a self-score qualifier to the matrix snapshot or a footnote. This is the only moderately actionable issue.
2. **F4**: Verify `docs/agent/QUICKSTART.md` exists; if not, create it or amend the prompt.
3. F2, F5, F9 are low-priority improvements to completeness and traceability.

## Verdict

The implementation is **honest, narrow, and well-bounded**. The only moderately actionable issue is the self-scored `verified` state appearing in the matrix snapshot without an inline caveat (F3). All `not_assessed` cells remain correctly uncollapsed. Product claims do not overreach. No security or privacy issues are present.

## Not Assessed

- Whether `docs/agent/QUICKSTART.md` exists and is correct (F4).
- Whether the Portolan commands (`go run ./cmd/portolan context prepare`, `go run ./cmd/portolan map`) actually produce the claimed artifacts on this target — the diff contains the lane ledger's claim but the reviewer cannot re-execute.
- Whether the SHA-256 hash `30e83bb…` is reproducible from the committed `docs/agent/ACCEPTANCE.md`.
- Whether the spec artifacts (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, `tasks.md`) referenced in the review documents are internally consistent — they are not in the diff.
- Runtime behavior of the acceptance prompt on any harness other than the Codex self-target lane described.
