# Contract: Comparison Ledger

The comparison ledger is a spec-local audit artifact stored under
`specs/034-cursor-comparison-validation/reviews/`.

It may be markdown with fenced JSON snippets or JSONL sidecars, but it must
preserve the fields below.

## Required Sections

1. Target
2. Lane Inputs
3. Prompts And Raw Outputs
4. Per-Question Scores
5. Unsupported Claim Delta
6. Useful Next Action Comparison
7. Final Product Claim Decision
8. Not Assessed / Unknown / Blocked Surfaces

## Lane Record

```json
{
  "lane_id": "cursor-alone",
  "run_state": "completed",
  "prompt_path": "specs/034-cursor-comparison-validation/reviews/cursor-alone-prompt.md",
  "raw_output_path": "specs/034-cursor-comparison-validation/reviews/cursor-alone-output.md",
  "input_artifacts": [],
  "failure_reason": ""
}
```

Rules:

- `lane_id` is `cursor-alone` or `cursor-plus-portolan`.
- `run_state` is `completed`, `blocked`, `failed`, or `not_assessed`.
- `cursor-alone` must not list Portolan-generated artifacts in
  `input_artifacts`.
- `cursor-plus-portolan` must list the context pack, `summary.json`,
  `graph-index.json`, and any targeted graph slices used.

## Score Record

```json
{
  "question_id": "scope-completeness",
  "lane_id": "cursor-plus-portolan",
  "unsupported_claim_count": 0,
  "scope_correct": "yes",
  "evidence_use": "yes",
  "unknown_handling": "yes",
  "next_action_quality": "equal",
  "notes": "Preserved local checkout scope and external completeness as unknown."
}
```

Rules:

- `question_id` is one of `scope-completeness`,
  `duplicate-component-risk`, `implicit-knowledge`,
  `service-relationships`, or `next-actions`.
- `unsupported_claim_count` is a non-negative integer derived from raw output.
- `scope_correct`, `evidence_use`, and `unknown_handling` are `yes`,
  `partial`, or `no`.
- `next_action_quality` is `better`, `equal`, `worse`, or `not_applicable`
  relative to the other lane.

## Decision Record

```json
{
  "unsupported_claim_reduction_percent": 50,
  "next_action_equal_or_better_percent": 80,
  "decision": "accepted",
  "decision_rationale": "Both configured thresholds passed.",
  "limitations": ["UI Cursor/Composer not_assessed"]
}
```

Rules:

- `decision` is `accepted`, `narrowed`, `rejected`, `blocked`, or
  `inconclusive`.
- `accepted` requires both configured thresholds to pass.
- `narrowed` requires exactly one configured threshold to pass.
- `rejected` applies when both lanes ran and neither threshold passed.
- `blocked` applies when either lane cannot run.
- `inconclusive` applies only when lane output exists but cannot be scored
  reliably.
