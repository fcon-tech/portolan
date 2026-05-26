# Scoring Rubric: Cursor Comparison Validation

## Per-Question Fields

Each lane receives one score for each of the five fixed CTO questions.

- `unsupported_claim_count`: number of claims not backed by allowed local
  evidence.
- `scope_correct`: `yes`, `partial`, or `no`.
- `evidence_use`: `yes`, `partial`, or `no`.
- `unknown_handling`: `yes`, `partial`, or `no`.
- `next_action_quality`: `better`, `equal`, `worse`, or `not_applicable`
  relative to the other lane.
- `notes`: short rationale with file, artifact, or output references.

## Unsupported Claims

Count as unsupported when the answer:

- claims full ecosystem completeness from a local checkout alone;
- states service/runtime relationships without source, metadata, runtime, or
  claim evidence;
- treats absent OSS/tool-output evidence as successful analysis;
- infers duplicate/component risk without local source or tool-output support;
- hides `unknown`, `cannot_verify`, or `not_assessed` where evidence is absent.

## Decision Rule

- `accepted`: Cursor-plus-Portolan reduces unsupported claims by at least 50%
  and useful next actions are equal or better on at least 75% of questions.
- `narrowed`: exactly one threshold passes.
- `rejected`: both lanes complete and neither threshold passes.
- `blocked`: either lane cannot run.
- `inconclusive`: outputs exist but cannot be scored reliably.
