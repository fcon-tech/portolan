# Slice Review Disposition

Spec: `docs/specs/080-clean-start-artifact-guard/`

Date: 2026-06-02

## Review Lanes

Initial post-implementation lanes:

- `zai/glm-5.1`:
  `docs/specs/080-clean-start-artifact-guard/reviews/pi-glm-080-slice-review-2026-06-02.md`
- `openrouter/xiaomi/mimo-v2.5-pro`:
  `docs/specs/080-clean-start-artifact-guard/reviews/pi-mimo-080-slice-review-2026-06-02.md`

Final post-fix lanes:

- `openrouter/moonshotai/kimi-k2.6`:
  `docs/specs/080-clean-start-artifact-guard/reviews/pi-kimi-080-slice-review-2026-06-02.md`
- `zai/glm-5.1`:
  `docs/specs/080-clean-start-artifact-guard/reviews/pi-glm-080-final-review-2026-06-02.md`
- `openrouter/xiaomi/mimo-v2.5-pro`:
  `docs/specs/080-clean-start-artifact-guard/reviews/pi-mimo-080-final-review-2026-06-02.md`

The final iteration has three assessed non-GPT lanes. All final lanes returned
`pass_with_findings` with no critical, high, or medium blockers.

Cursor Composer 2.5 stress lane:

- `cursor-agent --print --mode ask --model composer-2.5`:
  `docs/specs/080-clean-start-artifact-guard/reviews/cursor-composer-clean-start-stress-2026-06-02.md`

Intermediate post-Cursor diagnostic lanes:

- `openrouter/moonshotai/kimi-k2.6`:
  `docs/specs/080-clean-start-artifact-guard/reviews/pi-kimi-080-post-cursor-review-2026-06-02.md`
- `zai/glm-5.1`:
  `docs/specs/080-clean-start-artifact-guard/reviews/pi-glm-080-post-cursor-review-2026-06-02.md`

Final post-Cursor review lanes:

- `openrouter/moonshotai/kimi-k2.6`:
  `docs/specs/080-clean-start-artifact-guard/reviews/pi-kimi-080-post-cursor-final-review-2026-06-02.md`
- `zai/glm-5.1`:
  `docs/specs/080-clean-start-artifact-guard/reviews/pi-glm-080-post-cursor-final-review-2026-06-02.md`
- `openrouter/xiaomi/mimo-v2.5-pro`:
  `docs/specs/080-clean-start-artifact-guard/reviews/pi-mimo-080-post-cursor-final-review-2026-06-02.md`

The final post-Cursor iteration has three assessed non-GPT lanes. All final
lanes returned pass or `pass_with_findings`; no critical, major, high, or
medium blockers remain.

## Accepted And Fixed

| Finding | Source | Disposition |
| --- | --- | --- |
| Negative stale-path assertions should cover generated artifacts, not only markdown guard text. | GLM initial M2; MiMo initial F-2 | Accepted and fixed. `TestRunWritesFreshArtifactBoundaryGuidance` now checks generated markdown and JSON artifacts for absence of stale absolute paths and `old-run`. |
| Boundary policy text should not drift across generated files. | MiMo initial F-1 | Accepted and fixed. `staleArtifactExclusion`, `baselineArtifactContamination`, and `freshArtifactBoundarySection` centralize the generated boundary text. |
| Run-ledger allowance was underspecified. | MiMo initial F-3; MiMo final L-FIX-1 | Accepted and fixed. `docs/agent/ACCEPTANCE.md` now defines lane ledger before the forbidden-path list and names dated lane ledger or prompt as the allowance surface. |
| Fresh `evidence-index.jsonl` promoted stale sibling stress producer-run outputs as `verified` evidence. | Cursor Composer pre-fix stress | Accepted and fixed. Verified producer-run outputs under sibling `.portolan/stress/*` roots are now downgraded to `not_assessed` in fresh stress contexts, and stale `path`, `output_path`, and `command` fields are scrubbed. |
| `agent-brief.md` producer-run summary used ambiguous `verified` wording after stale producer-run downgrades. | Cursor Composer post-scrub stress | Accepted and fixed. The summary now counts current `verified` and `not_assessed` statuses from generated producer-run evidence records. |
| Stale non-verified producer-run records and stale `target_root` could still leak stale sibling stress paths. | GLM post-Cursor M1/M4 | Accepted and fixed. Stale sibling output records are scrubbed regardless of original status, and `target_root` is scrubbed when it itself points into a sibling stress root. |
| Stale producer-run tests should assert scrubbed fields per JSONL record, not only shared substrings. | GLM post-Cursor final minor #2 | Accepted and fixed. The focused test now parses `evidence-index.jsonl` and asserts both stale records are `not_assessed` and have empty `path`, `output_path`, and `command`. |

## Accepted As Scope Boundary / Follow-Up

| Finding | Source | Disposition |
| --- | --- | --- |
| Boundary is guidance and metadata normalization, not runtime enforcement. | GLM initial M1; GLM final M1; Cursor Composer final unknowns | Accepted as scope boundary. Spec 080 intentionally avoids target mutation, sandboxing, or harness behavior. Cursor Composer 2.5 passed the bounded read-only lane; arbitrary agent obedience outside that contract remains `not_assessed`. |
| No machine-readable lane-ledger schema. | GLM final m3; MiMo final not_assessed | Accepted as follow-up. Current repo pattern uses dated spec-local review records; no schema is needed for this bounded context-normalization slice. |
| Absolute output path in generated markdown can make cross-machine diffs noisy. | GLM final m1 | Accepted as tradeoff. Agents need the current local output path. |
| Constants are private prose strings in Go source. | Kimi M2; MiMo final I-2 | Accepted as maintainability note. No extra template/dependency is justified for this small generated-guidance slice. |
| Symlink or bind-mount behavior is not deeply modeled by the stale stress helper. | MiMo post-Cursor final M-1 | Accepted as scope boundary. `validateStartup` canonicalizes the selected root and the new helper uses cleaned paths under that root; deeper filesystem aliasing is not part of this read-only context slice. |
| `source_artifact` remains visible for the local producer-run ledger. | MiMo post-Cursor final M-2 | Accepted as intentional metadata boundary. Spec 080 scrubs stale output reuse fields (`path`, `output_path`, `command`, and stale `target_root`) while preserving the local source ledger path as provenance metadata. |

## Rejected

| Finding | Source | Reason |
| --- | --- | --- |
| Add function comment/godoc for `renderAnswerContract`. | MiMo initial F-4 | Rejected as style-only for an unexported helper with self-explanatory call site. |
| Add a machine-readable lane ledger format now. | MiMo initial F-3 variant | Rejected for this slice. It would expand Portolan toward harness orchestration and is not needed to close the observed contamination guard. |

## Not Assessed

- OpenCode obedience to the new guard.
- Arbitrary agent obedience outside the bounded Cursor Composer 2.5 stress
  prompt.
- GitHub review approval.
- Merge readiness.
- Future 076 parity execution; it remains blocked by spec 074 runtime-health
  evidence unless explicitly approved as a current-evidence rejection run.
