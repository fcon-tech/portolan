# Socratic Review Disposition: Spec 109

**Date**: 2026-06-22
**Review lanes**:

- `openrouter/~anthropic/claude-opus-latest` via OpenCode: assessed
- `openrouter/~google/gemini-pro-latest` via OpenCode: assessed

## Disposition

| Finding | Source | Decision | Resolution |
| --- | --- | --- | --- |
| Missing canonical family enum makes `not_integrated` unfalsifiable. | Opus C1 | accepted | Added canonical evidence-family registry, manifest health requirement for every family, FR-015, and validation tasks. |
| Threshold-derived health states lack measurable thresholds. | Opus C2, Gemini 3 | accepted | Added default threshold table and required observed count, denominator, threshold, and calculation rule in health records. |
| BDD scenarios are not test-ready. | Opus M1 | accepted | Rewrote scenarios to name artifact fields, fact kinds, thresholds, and deterministic status outcomes. |
| Stratum, `evidence_layer`, and `evidence_state` are ambiguous. | Opus M2 | accepted | Added explicit definitions and field separation. |
| Heavy OSS producers need read-only/approval classification. | Opus M3 | accepted | Added OSS Producer Safety Classification in `plan.md`. |
| Completion boundary is policy text, not a gate. | Opus M4, Gemini 1 | accepted | Added completion validation: synthetic acceptance fixture must have no canonical `not_integrated` families and must prove non-stub routes. |
| Agent/query acceptance is thinner than viewer acceptance. | Opus m1, Gemini 6 | accepted | Added BDD scenario and tasks for bundle-query/MCP agent-visible strata, health, promotion basis, and bounded raw drill-down. |
| `unknown_role` can become a dumping ground. | Opus m2 | accepted | Added classifier low-confidence/unknown-role health threshold. |
| Strict core expansion mode is under-specified. | Opus m3 | accepted | Added expansion modes and deterministic `not_assessed` versus `cannot_verify` query outcomes. |
| `not_assessed`, `cannot_verify`, `not_integrated`, and `unknown` overlap. | Opus m4 | accepted | Added bundle-context status decision rules. |
| Source classifier risks custom scanner reimplementation. | Gemini 2 | accepted with constraint | Plan now prefers Linguist/go-enry style rules after dependency/license review; minimal local path rules are fallback only and must emit low confidence health. |
| Missing mapping from evidence families to fact kinds. | Gemini 4 | accepted | Added promotion matrix. |
| Missing security/read-only enforcement task. | Gemini 5 | accepted | Added approval-gated producer classification and read-only/security smoke task. |

## Remaining Not Assessed

- Code implementation is `not_assessed`; this slice created specification
  files only.
- Schema validation scripts are `not_assessed` until implementation adds the
  canonical-family and completion validators.
- Bigtop and Node large-bundle regressions are `not_assessed` for this doc-only
  change.
- Viewer and bundle-query behavior is `not_assessed` until implementation.

## Recommendation After Fixes

Proceed to implementation planning for spec 109. Do not treat this as a
single-producer cleanup: every implementation slice must preserve the canonical
family registry and completion gate.

## Post-Disposition Fix Check

`openrouter/~anthropic/claude-opus-latest` was run again after the first fix
set. It found two remaining major issues:

| Finding | Decision | Resolution |
| --- | --- | --- |
| Completion gate could still pass with a synthetic fixture that replaces missing routes with stubs or non-`not_integrated` placeholders. | accepted | Spec, plan, and tasks now require non-stub route proof for every canonical family, tied to representative fixture input and `producer_ref`. |
| `inventory_mismatch` threshold mixed percent and absolute counts ambiguously. | accepted | Replaced prose threshold with a concrete predicate using `mismatch_count` and `threshold_count`. |

Minor residual risks from the fix check are accepted as implementation detail:
promotion matrix now includes `evidence_layer`; approval-gate proof will be
handled in implementation tasks and remains `not_assessed` until code exists.

`openrouter/~google/gemini-pro-latest` was run after these fixes and found no
remaining critical or major issues. Its minor residual risks are approval-gate
UX, classifier dependency/license friction, and streaming-safe artifact size
measurement.
