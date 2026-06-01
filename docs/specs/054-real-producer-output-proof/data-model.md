# Data Model: Real Producer Output Proof

## ProducerRunRecord

- `id`: stable record id.
- `producer_family`: dependency, duplication, static-finding, symbol-index,
  api-catalog, deployment-model, runtime-observation, or other allow-listed
  family.
- `producer_tool`: local tool or format name, for example `docker-compose`,
  `helm`, `protoc`, `semgrep`, or `jscpd`.
- `command`: command summary or source description.
- `target_root`: local root read by the producer.
- `output_path`: selected local output path.
- `output_format`: json, jsonl, yaml, sarif, protobuf, text, or unknown.
- `scope`: repository, directory, language, service, or landscape segment
  covered by the output.
- `freshness`: generated timestamp or explicit stale/unknown marker.
- `status`: verified, failed, blocked, cannot_verify, or not_assessed.
- `evidence_state`: source-visible, metadata-visible, runtime-visible,
  claim-only, unknown, cannot_verify, or not_assessed.
- `limitations`: bounded list of claims the output cannot support.
- `privacy_review`: verified, not_assessed, or blocked.

Validation rules:

- `runtime-visible` is allowed only when `producer_family` is
  `runtime-observation`.
- `verified` requires an existing output path and a non-empty scope.
- Failed or blocked records must include a reason.
- Output paths must be local paths under an approved output directory or an
  explicitly selected target artifact path.

## ProducerCoverageRecord

- `producer_run_id`: reference to a ProducerRunRecord.
- `repository_id`: covered repository or `landscape` when scoped globally.
- `family`: evidence family covered.
- `coverage_state`: verified, partial, failed, blocked, cannot_verify,
  unknown, or not_assessed.
- `covered_units`: bounded list of services, files, packages, protos, charts,
  or directories.
- `not_covered`: bounded list or summary of excluded areas.
- `blocked_claims`: architecture/runtime/symbol/API claims that remain weak.

Validation rules:

- Partial coverage must name the bounded covered units.
- A coverage record cannot upgrade claims outside its scope.
- Runtime coverage cannot be derived from static deployment or API outputs.

## CursorStressRecord

- `run_id`: stress run directory id.
- `prompt_path`: prompt used for Cursor.
- `output_path`: Cursor output path.
- `input_artifacts`: Portolan artifacts supplied.
- `comparison_baseline`: prior stress run or Cursor-only lane.
- `verdict`: pass, partial, failed, blocked, or not_assessed.
- `accepted_claims`: scoped claims with local evidence citations.
- `rejected_or_overclaimed`: claims Cursor made without evidence.
- `remaining_gaps`: producer/runtime/architecture gaps after stress.

Validation rules:

- A Cursor verdict cannot verify a claim without local evidence citation.
- Overclaims must be recorded before the stress run can count as passed.
