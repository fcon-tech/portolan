# Post-Syft-Exclusion Review Disposition

Date: 2026-06-01

Spec: `docs/specs/052-dependency-symbol-evidence-import/`

Status: assessed; no blockers

## Assessed Lanes

| Lane | Raw Output | Verdict | Disposition |
| --- | --- | --- | --- |
| Kimi | `post-syft-exclusion-review-kimi-2026-06-01.md` | approved | No blockers; recorded Syft version/glob drift as follow-up. |
| GLM | `post-syft-exclusion-review-glm-2026-06-01.md` | clean/no blocker | Accepted exact arg-pairing test and Syft-relative comment. |
| MiMo | `post-syft-exclusion-review-mimo-2026-06-01.md` | approved | No blockers; confirmed local-first/read-only boundary. |

## Accepted And Fixed

- Added a code comment explaining that Syft exclude patterns must be
  source-relative because absolute patterns were rejected by the CLI.
- Strengthened OSS-plan test coverage to assert the exact Syft argument order:
  `root --exclude ./.portolan/** --exclude ./run/** -o cyclonedx-json=<out>`.

## Follow-Up Only

- Syft version/glob drift detection.
- Post-Syft validation that generated SBOM paths exclude `.portolan` and root
  `run`.
- Additional cache directories such as `.m2` or `.gradle` if future producer
  runs show contamination.

## Verification After Fixes

- `go test -count=1 ./internal/app -run TestRunContextPrepareWritesOSSExecutionPlan`:
  verified
- `go vet ./...`: verified
