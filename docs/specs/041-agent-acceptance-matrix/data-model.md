# Data Model: Agent Acceptance Matrix

## Acceptance Lane

- `id`: stable lane ID
- `harness`: Codex, Cursor UI/Composer, OpenCode, Claude, Cline, or other
- `target_shape`: single-repo, multi-repo, black-box/metadata-heavy
- `prompt_path`: prompt used by the lane
- `state`: `verified`, `failed`, `blocked`, or `not_assessed`
- `reason`: required for non-verified states

## Question Set

- `id`: question set ID
- `questions`: CTO-level questions
- `expected_evidence`: artifacts or states expected in answers

## Acceptance Ledger

- `lane_id`: associated acceptance lane
- `commands`: commands run or blocked
- `artifact_paths`: context/map/output paths
- `unsupported_claims`: count and examples
- `useful_next_actions`: count and examples
- `state`: final lane state

Validation:

- Empty or off-topic output is `not_assessed`.
- Unsupported claims are counted even when the answer is fluent.
