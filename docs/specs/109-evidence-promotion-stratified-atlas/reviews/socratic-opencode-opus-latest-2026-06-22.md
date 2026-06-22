# Socratic Review: Opus Latest via OpenCode

**Date**: 2026-06-22
**Model**: `openrouter/~anthropic/claude-opus-latest`
**Command**: `opencode run ... --model openrouter/~anthropic/claude-opus-latest`
**Scope**: `spec.md`, `plan.md`, `tasks.md`
**Review status**: assessed

## Findings

### Critical

**C1 - `not_integrated` has no exhaustive family list, so "all families
covered" is unfalsifiable.**

`spec.md` Scope Integrity and FR-011 require unsupported families to appear as
`not_integrated` when the product contract names them, but the contract did not
pin a closed, machine-checkable family list. A ctags-only implementation could
omit families entirely. Fix before implementation: define canonical family enum
and validation rule that every member resolves to a producer or explicit
`not_integrated` record.

**C2 - No measurable thresholds for pollution, dominance, oversize health
states.**

The health vocabulary includes threshold-derived states, but no threshold
contract records the numeric threshold, measurement, or configuration. Fix:
specify threshold definitions or a default config contract and require health
records to include crossed threshold values.

### Major

**M1 - BDD scenarios are mostly not test-ready.**

Several scenarios use broad prohibitions instead of fields and expected values.
Fix: rewrite outcomes to name artifact fields and enum values.

**M2 - Strata, `evidence_state`, and health boundaries are ambiguous.**

The spec uses `evidence_layer` and `stratum` without defining their relationship
or schema mapping. Fix: explicitly distinguish `stratum`, `evidence_layer`, and
`evidence_state`.

**M3 - Plan names heavy semantic scanners without classifying read-only risk.**

SCIP/LSIF, CodeQL, and Joern are not trivially read-only. Fix: classify each
named OSS producer as read-only-safe or approval-gated before implementation.

**M4 - Completion boundary is policy text, not a checkable gate.**

The spec repeats that a single-family PR is not completion, but no automated
gate enforces it. Fix: add a validation script that fails if a canonical family
lacks producer output or explicit `not_integrated`.

### Minor

**m1 - Agent/query acceptance is thinner than human/viewer acceptance.**

Add a BDD scenario for bundle-query/MCP returning `stratum`,
`promotion_basis`, and `health` before large raw rows.

**m2 - `unknown_role` can become a silent dumping ground.**

Require unknown-role or low-confidence classifier coverage to surface in health.

**m3 - Strict core expansion mode is under-specified.**

Define expansion modes and deterministic `not_assessed` versus `cannot_verify`.

**m4 - `not_assessed`, `cannot_verify`, and `not_integrated` overlap.**

State the bundle-context decision rule for each.

## Recommendation

`proceed after fixes`

Implementation-state claims remain `not_assessed`; this review covered only the
specification files.
