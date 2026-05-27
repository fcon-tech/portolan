# Data Model: Product Claim Gate

## Product Claim

- `id`: Stable identifier, for example `C001`.
- `claim`: The exact product or client-facing statement being assessed.
- `claim_type`: `user_value`, `comparison`, `readiness`, `scope`,
  `capability`, or `limitation`.
- `source`: File or artifact where the claim appears or is implied.
- `target_scope`: Target class the claim applies to, for example
  `headless Cursor on fixed local Bigtop` or `local repository roots`.
- `status`: `accepted`, `narrowed`, `rejected`, `not_assessed`, `blocked`, or
  `failed`.
- `decision`: The accepted wording, narrowed wording, or rejection reason.
- `evidence_links`: One or more local file paths for accepted/narrowed claims.
- `limitations`: Explicit boundaries that must be carried into client-safe
  language.

Validation rules:

- `accepted` and `narrowed` claims require at least one evidence link.
- `not_assessed`, `blocked`, and `failed` claims must explain why they cannot be
  used as positive client-safe claims.
- Implementation tests alone cannot support `accepted` or `narrowed`
  product-ready status.

## Evidence Link

- `path`: Local repo-relative path.
- `evidence_state`: `verified`, `failed`, `blocked`, `not_assessed`,
  `assumed`, `source-visible`, `metadata-visible`, `runtime-visible`,
  `claim-only`, `unknown`, or `cannot_verify`, as appropriate to the source.
- `summary`: One-sentence description of what the artifact proves or fails to
  prove.
- `target_scope`: Scope of the evidence.

Validation rules:

- Evidence links must point to local committed or generated review artifacts.
- Evidence scope must not be broadened in the product claim.

## Claim Decision

- `claim_id`: Product claim identifier.
- `status`: Decision status.
- `accepted_wording`: Required for `accepted` and `narrowed`; omitted for
  rejected/unassessed/blocked/failed claims.
- `reason`: Why the status was chosen.
- `backlog_action`: `none`, `update_backlog`, `create_followup_spec`, or
  `record_blocker`.

State transitions:

- `not_assessed` -> `accepted` or `narrowed` only after validation evidence is
  added.
- `blocked` -> any final status only after the blocker is resolved.
- `failed` -> `narrowed` only if a smaller validated scope remains true.

## Client-Safe Answer

- `question`: The external question answered.
- `accepted_claims`: Claim IDs used in the answer.
- `limitations`: Claim IDs or explicit limitation bullets carried into the
  answer.
- `answer`: Short client-safe prose.

Validation rules:

- Every positive sentence must map to an accepted or narrowed claim.
- Limitations must include material `not_assessed`, `blocked`, or `failed`
  surfaces that would otherwise make the answer misleading.
