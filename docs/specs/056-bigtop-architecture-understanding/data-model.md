# Data Model: Bigtop Architecture Understanding

## Architecture Question

- `id`: stable question id.
- `question`: Bigtop architecture question.
- `required_evidence`: evidence families required for `verified`.
- `disallowed_shortcuts`: evidence that cannot satisfy the question alone.
- `expected_boundaries`: what must remain partial, blocked, or not_assessed.

## Answer Lane

- `lane`: `cursor_only` or `cursor_plus_portolan`.
- `model`: Cursor model id.
- `prompt`: prompt artifact path.
- `output`: output artifact path.
- `status`: completed, failed, blocked, or not_assessed.

## Acceptance Ledger Row

- `question_id`
- `cursor_only_status`
- `cursor_plus_portolan_status`
- `portolan_delta`
- `verified_claim`
- `remaining_gap`
- `reviewer_notes`

## Claim Status

Allowed values:

- `verified`
- `partial`
- `failed`
- `blocked`
- `unknown`
- `cannot_verify`
- `not_assessed`
