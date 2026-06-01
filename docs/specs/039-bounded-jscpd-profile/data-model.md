# Data Model: Bounded jscpd Profile

## Bounded Producer Profile

- `producer`: fixed to `jscpd` for this feature.
- `target`: local path or fixture identifier.
- `output_dir`: selected directory for all producer artifacts.
- `include_patterns`: source paths included in the bounded run.
- `exclude_patterns`: generated, build, dependency, or output paths excluded.
- `timeout`: maximum runtime for the attempt.
- `size_limit`: maximum accepted output or scanned-scope budget when available.

Validation rules:
- Output must stay under `output_dir`.
- Profile limits must be visible in review or run metadata.
- Network-backed setup and target mutation are invalid.

## Producer Attempt

- `profile`: bounded producer profile used.
- `state`: `verified`, `failed`, `blocked`, or `not_assessed`.
- `command_shape`: command and flags, with local paths safe to disclose.
- `evidence_path`: local output or review artifact path when available.
- `reason`: explanation for failed, blocked, or not_assessed states.

State transitions:
- `not_assessed` -> `verified` only after usable bounded JSON output exists.
- `not_assessed` -> `failed` when the bounded run executes and fails.
- `not_assessed` -> `blocked` when prerequisites prevent execution.
- `failed` -> `verified` only after a later bounded run produces usable output.

## Near-Clone Claim

- `claim_id`: product claim reference, normally C005 or C006 from spec 038.
- `status`: `narrowed`, `failed`, `blocked`, or `not_assessed` for near-clone
  scope.
- `scope`: target/profile for any positive claim.
- `evidence_links`: producer attempt and validation records.

Validation rules:
- No accepted or narrowed near-clone claim may cite partial, malformed,
  interrupted, or out-of-bounds output as verified evidence.
