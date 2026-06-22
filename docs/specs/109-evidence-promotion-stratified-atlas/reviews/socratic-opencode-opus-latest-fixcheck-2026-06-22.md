# Socratic Fix Check: Opus Latest via OpenCode

**Date**: 2026-06-22
**Model**: `openrouter/~anthropic/claude-opus-latest`
**Command**: `opencode run ... --model openrouter/~anthropic/claude-opus-latest`
**Scope**: Updated `spec.md`, `plan.md`, `tasks.md`, and review disposition
**Review status**: assessed

## Remaining Major Issues Found

**1. False completion via stubs remained possible**

The first fix made completion depend on the synthetic fixture containing no
`not_integrated` families. The reviewer found this still allowed stub/no-op
routes to emit `not_assessed` or `partial` without proving real production
routes.

**Disposition**: accepted. The spec, plan, and tasks now require non-stub route
proof tied to representative fixture input, `producer_ref`, and expected
stratum output or deterministic terminal state.

**2. `inventory_mismatch` threshold was ambiguous**

The threshold mixed percent and absolute count with unclear "or whichever is
smaller" wording.

**Disposition**: accepted. The threshold is now a concrete predicate:
`mismatch_count = abs(discovered_file_count - classified_file_count)` and
`threshold_count = max(1, min(ceil(discovered_file_count * 0.01), 100))`;
trigger when `mismatch_count > threshold_count`.

## Minor Residual Risks

- Stale and inventory mismatch scenario can be split further during
  implementation tests.
- Approval-gate proof remains implementation-owned.
- Oversize measurement needs streaming-safe implementation.

## Verdict

Fix before implementation; both major issues were accepted and patched.
