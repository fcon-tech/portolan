# Data Model: OSS Producer Acceptance

## OSS Producer

- `id`: stable producer family identifier such as `jscpd`, `cyclonedx`, or
  `semgrep`.
- `producer`: executable or export source, such as `jscpd`, `syft`, or
  `semgrep`.
- `question_supported`: stakeholder question family the output can improve.
- `status`: `verified`, `blocked`, `failed`, `unsafe`, or `not_assessed`.
- `reason`: short evidence-backed reason for the status.

## Producer Run

- `producer_id`: references an OSS Producer.
- `target`: local target path.
- `command`: exact command or `not_run`.
- `output_path`: explicit output path or `none`.
- `execution_state`: `verified`, `blocked`, `failed`, `unsafe`, or
  `not_assessed`.
- `summary`: bounded summary of output or blocker.

## Safety Decision

- `producer_id`: references an OSS Producer.
- `local_only`: whether the planned command avoids network access.
- `writes_under_output`: whether writes are limited to the selected output dir.
- `target_mutation`: whether the target repository would be changed.
- `decision`: `allow`, `blocked`, `unsafe`, or `not_assessed`.
- `reason`: evidence-backed explanation.

## Evidence Impact

- `producer_id`: references an OSS Producer.
- `before_claim`: conclusion available without real OSS output.
- `after_claim`: conclusion after producer output is generated.
- `impact`: `changed`, `unchanged`, `blocked`, or `not_assessed`.
- `claim_decision`: `accepted`, `narrowed`, `rejected`, `blocked`, or
  `not_assessed`.
