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

## Accepted And Fixed

| Finding | Source | Disposition |
| --- | --- | --- |
| Negative stale-path assertions should cover generated artifacts, not only markdown guard text. | GLM initial M2; MiMo initial F-2 | Accepted and fixed. `TestRunWritesFreshArtifactBoundaryGuidance` now checks generated markdown and JSON artifacts for absence of stale absolute paths and `old-run`. |
| Boundary policy text should not drift across generated files. | MiMo initial F-1 | Accepted and fixed. `staleArtifactExclusion`, `baselineArtifactContamination`, and `freshArtifactBoundarySection` centralize the generated boundary text. |
| Run-ledger allowance was underspecified. | MiMo initial F-3; MiMo final L-FIX-1 | Accepted and fixed. `docs/agent/ACCEPTANCE.md` now defines lane ledger before the forbidden-path list and names dated lane ledger or prompt as the allowance surface. |

## Accepted As Scope Boundary / Follow-Up

| Finding | Source | Disposition |
| --- | --- | --- |
| Boundary is guidance, not runtime enforcement. | GLM initial M1; GLM final M1 | Accepted as scope boundary. Spec 080 intentionally avoids target mutation, sandboxing, or harness behavior. End-to-end agent obedience remains `not_assessed` until a future stress lane runs. |
| No machine-readable lane-ledger schema. | GLM final m3; MiMo final not_assessed | Accepted as follow-up. Current repo pattern uses dated spec-local review records; no schema is needed for this guidance-only slice. |
| Absolute output path in generated markdown can make cross-machine diffs noisy. | GLM final m1 | Accepted as tradeoff. Agents need the current local output path. |
| Constants are private prose strings in Go source. | Kimi M2; MiMo final I-2 | Accepted as maintainability note. No extra template/dependency is justified for this small generated-guidance slice. |

## Rejected

| Finding | Source | Reason |
| --- | --- | --- |
| Add function comment/godoc for `renderAnswerContract`. | MiMo initial F-4 | Rejected as style-only for an unexported helper with self-explanatory call site. |
| Add a machine-readable lane ledger format now. | MiMo initial F-3 variant | Rejected for this slice. It would expand Portolan toward harness orchestration and is not needed to close the observed contamination guard. |

## Not Assessed

- Real Cursor Composer 2.5 or OpenCode obedience to the new guard.
- GitHub review approval.
- Merge readiness.
- Future 076 parity execution; it remains blocked by spec 074 runtime-health
  evidence unless explicitly approved as a current-evidence rejection run.
