# Data Model: Cursor Comparison Validation

## Comparison Target

- `path`: absolute local path, fixed to
  `/home/fall_out_bug/projects/bigtop-landscape`.
- `scope_statement`: text distinguishing local checkout scope from complete
  Apache Bigtop ecosystem coverage.
- `preconditions`: target exists, is readable locally, and can be scanned
  without network access or mutation.
- `state`: `available`, `blocked`, or `not_assessed`.

## Evaluation Lane

- `id`: `cursor-alone` or `cursor-plus-portolan`.
- `prompt_path`: path to the exact prompt used.
- `raw_output_path`: path to the captured raw answer.
- `constraints`: no network, no mutation, bounded reading expectations.
- `input_artifacts`: artifact paths or checksums available before answering.
- `run_state`: `completed`, `blocked`, `failed`, or `not_assessed`.
- `failure_reason`: required when `run_state` is not `completed`.

Relationships:

- Each lane answers the same five `Question` records.
- `cursor-plus-portolan` must reference the context pack, `summary.json`,
  `graph-index.json`, and any targeted slices used.
- `cursor-alone` must not receive Portolan-generated context or map artifacts.

## Question Set

The fixed question set has five records:

1. Local scope and completeness.
2. Duplicate or component risk.
3. Implicit knowledge.
4. Service relationships.
5. Useful next actions.

Validation rules:

- Both lanes must receive the same question text.
- Every completed lane must produce one answer per question.
- Missing answers are scored as lane failures or per-question failures, not
  inferred from surrounding text.

## Question Score

- `question_id`: one of the five fixed questions.
- `lane_id`: `cursor-alone` or `cursor-plus-portolan`.
- `unsupported_claim_count`: integer count of claims not backed by allowed
  local evidence.
- `scope_correct`: `yes`, `partial`, or `no`.
- `evidence_use`: `yes`, `partial`, or `no`.
- `unknown_handling`: `yes`, `partial`, or `no`.
- `next_action_quality`: `better`, `equal`, `worse`, or `not_applicable`
  relative to the other lane.
- `notes`: short scoring rationale with evidence references.

Validation rules:

- Unsupported claims must be counted from raw output, not estimated from final
  impression.
- `unknown`, `cannot_verify`, and `not_assessed` statements are valid when they
  reflect missing local evidence.

## Comparison Ledger

- `target`: comparison target metadata.
- `lanes`: two evaluation lane records.
- `scores`: ten question-score records, one per lane per question.
- `unsupported_claim_delta`: percent reduction from Cursor-alone to
  Cursor-plus-Portolan.
- `next_action_pass_rate`: percent of questions where Cursor-plus-Portolan is
  equal or better.
- `decision`: `accepted`, `narrowed`, `rejected`, `blocked`, or
  `inconclusive`.
- `decision_rationale`: concise reason tied to thresholds and evidence.

State transitions:

- If either lane cannot run, decision becomes `blocked`.
- If both lanes run and both thresholds pass, decision becomes `accepted`.
- If both lanes run and exactly one threshold passes, decision becomes
  `narrowed`.
- If both lanes run and neither threshold passes, decision becomes `rejected`.
- `inconclusive` is reserved for completed runs whose evidence is malformed or
  insufficient to score despite lane completion.

## Product Claim Update

- `claim`: answer to "Why Portolan if I have Cursor?"
- `status`: copied from the comparison ledger decision or narrowed to the
  proven scope.
- `evidence_link`: spec-local review or ledger path.
- `limitations`: UI Cursor/Composer, ecosystem completeness, runtime topology,
  OSS producer execution, or other surfaces not assessed.
