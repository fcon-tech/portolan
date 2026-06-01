# Data Model: Portolan Quality Boundary

## Surface

- `name`: CLI command, report section, artifact, adapter, or doc route.
- `kind`: `cli`, `artifact`, `adapter`, `doc`, `producer`, `future`.
- `maturity`: `stable-first-run`, `tooling`, `local-only`, `experimental`, or
  `future`.
- `product_boundary`: One-line supported use.
- `not_supported`: Explicit non-goals.
- `verification`: Current verification state and evidence path.

## Quality Boundary

- `guarantees`: Supported claims and required evidence.
- `non_guarantees`: Claims Portolan must not make without extra evidence.
- `customer_controls`: Inputs or choices the user must supply.
- `evidence_states`: Meaning of `source-visible`, `metadata-visible`,
  `runtime-visible`, `claim-only`, `unknown`, and `cannot_verify`.
- `claim_wording`: Canonical wording for docs and reports.

## Report Quality Contract

- `required_sections`: Sections a report must include.
- `positive_claims`: Claims with evidence references.
- `weak_states`: Unknown, cannot-verify, and not-assessed records that must be
  visible.
- `unsupported_claims`: Claims with no local evidence reference.
- `verdict`: `pass`, `fail`, `blocked`, or `not_assessed`.

## Claim Verdict

- `claim`: The statement being checked.
- `classification`: `accepted`, `narrowed`, `rejected`, `blocked`, or
  `not_assessed`.
- `evidence_ref`: Local artifact or doc reference.
- `reason`: Why the classification was assigned.

Claim verdicts classify product statements. They do not replace evidence
states. When a claim depends only on `unknown` or `cannot_verify` evidence, the
claim verdict is normally `blocked` or `not_assessed` unless a narrower
supported claim is available.

## Maturity Matrix

- `surfaces`: Surface records.
- `generated_at`: Date/time.
- `source_of_truth`: Maintained file path.
- `runtime_readiness_notes`: Separate notes for harness runtime verification.
