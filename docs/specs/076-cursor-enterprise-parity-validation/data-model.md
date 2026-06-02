# Data Model: Cursor Enterprise Parity Validation

## ParityRun

- `run_id`: timestamped identifier for the validation attempt.
- `target_root`: Bigtop landscape root used by all lanes.
- `portolan_ref`: Portolan commit or branch used to generate artifacts.
- `artifact_root`: fresh `.portolan/stress/<run_id>/` path.
- `execution_mode`: `default_after_074` or `current_evidence_rejection`.
- `status`: `planned`, `blocked`, `executed`, `reviewed`, `closed`.

Validation rules:

- `default_after_074` requires spec 074 runtime-health evidence.
- `current_evidence_rejection` requires explicit user approval and must keep
  broad parity `cannot_verify`.

## StressLane

- `lane_id`: stable lane name, for example `cursor_baseline` or
  `cursor_with_portolan`.
- `agent_model`: Cursor Composer 2.5 or replacement if explicitly approved.
- `portolan_allowed`: boolean.
- `prompt_path`: spec-local prompt file.
- `output_path`: spec-local captured output file.
- `forbidden_paths`: artifact paths the lane must not read.
- `status`: `valid`, `contaminated`, `failed`, `not_assessed`.

Validation rules:

- Baseline lane must have `portolan_allowed=false`.
- With-Portolan lane must name the exact Portolan artifact paths it may use.

## ParityCriterion

- `criterion_id`: C1 through C9.
- `name`: rubric label.
- `required_evidence`: evidence classes needed for verification.
- `current_evidence`: file paths or commands supporting the score.
- `score`: `verified`, `partial`, `failed`, `cannot_verify`, or
  `not_assessed`.
- `claim_decision`: `promoted`, `narrowed`, `rejected`, or `unchanged`.
- `blocker`: optional blocker taxonomy.

Validation rules:

- A `verified` score requires current evidence and independent review.
- A broad parity claim is rejected if any required criterion is not `verified`
  or explicitly excluded with reviewed rationale.

## EvidenceInput

- `source_path`: file path or command trace.
- `source_spec`: owning spec number when applicable.
- `evidence_state`: `source-visible`, `metadata-visible`, `runtime-visible`,
  `claim-only`, `unknown`, `cannot_verify`, or `not_assessed`.
- `freshness`: current, stale, or superseded.
- `usable_for`: one or more C1-C9 criteria.

## ReviewLane

- `lane_id`: reviewer/model identifier.
- `family`: non-GPT family or local reviewer.
- `scope`: claim upgrade, broad rejection, artifact hygiene, or security/privacy.
- `status`: `assessed`, `not_assessed`, `failed`, or `off_topic`.
- `finding_count`: number of actionable findings.
- `disposition_path`: file recording accepted, rejected, fixed, and unresolved
  findings.

## ArtifactHygieneRecord

- `fresh_root`: new output root.
- `legacy_paths`: old artifact paths excluded from the run.
- `residue_check`: `verified`, `failed`, `not_assessed`, or `blocked`.
- `privacy_check`: `verified`, `failed`, `not_assessed`, or `blocked`.
- `notes`: contamination or cleanup observations.
