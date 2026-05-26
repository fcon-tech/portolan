# Implementation Disposition: Cursor Comparison Validation

Date: 2026-05-26

## Summary

Spec 034 executed the fixed Bigtop comparison between Cursor-alone and
Cursor-plus-Portolan. Both lanes completed. The comparison accepted a narrow
product claim: on the fixed local Bigtop target, Portolan improved Cursor's
evidence discipline and next-action quality by bounding scope, preserving
unknowns, and grounding duplication/relationship claims in local artifacts.

## Decision Gate

- Simpler/Faster: Used existing local Portolan commands and markdown ledgers
  instead of building an evaluation harness.
- Blocking Edge Cases: Preserved unavailable and unverifiable surfaces as
  `unknown` or `not_assessed`.
- Existing Open Source: No new evaluator dependency was added.

## Evidence

- Preconditions:
  `specs/034-cursor-comparison-validation/reviews/preconditions-2026-05-26.md`
- CLI surface:
  `specs/034-cursor-comparison-validation/reviews/cli-surface-2026-05-26.md`
- Portolan artifacts:
  `specs/034-cursor-comparison-validation/reviews/portolan-artifacts-2026-05-26.md`
- Cursor-alone output:
  `specs/034-cursor-comparison-validation/reviews/cursor-alone-output.md`
- Cursor-plus-Portolan output:
  `specs/034-cursor-comparison-validation/reviews/cursor-plus-portolan-output.md`
- Comparison ledger:
  `specs/034-cursor-comparison-validation/reviews/comparison-ledger-2026-05-26.md`
- Verification:
  `specs/034-cursor-comparison-validation/reviews/verification-2026-05-26.md`

## Result

- Cursor-alone unsupported claims: 12
- Cursor-plus-Portolan unsupported claims: 0
- Unsupported claim reduction: 100%
- Useful next actions equal or better: 5 of 5
- Final decision: `accepted`

Accepted claim:

> On the fixed local Bigtop landscape, Portolan gives Cursor a bounded evidence
> context that materially improves evidence discipline and next-action quality:
> it keeps local checkout scope separate from ecosystem completeness, prevents
> unsupported relationship and duplication claims, and turns missing evidence
> into explicit `unknown` or `not_assessed` follow-up work.

## Verification States

- Baseline checks: `verified`
- Spec 034 tasks: `verified`
- Ledger contract: `verified`
- Backlog alignment: `verified`
- UI Cursor/Composer: `not_assessed`
- Full Apache Bigtop ecosystem completeness: `unknown`
- Runtime topology: `not_assessed`
- Near-clone/SBOM duplication: `not_assessed`
- OSS producer execution: `not_assessed`

## Stop Reason

Implementation complete for local validation and ready-for-review surface.
Merge readiness is `not_assessed`; no PR state, GitHub checks, or external
approval were evaluated in this slice.
