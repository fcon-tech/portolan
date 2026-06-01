# Post-Correction Review Disposition

Date: 2026-06-01

Spec: `docs/specs/052-dependency-symbol-evidence-import/`

Status: assessed after retry; accepted minor finding fixed

## Initial Lane Degradation

The first post-correction no-tools lanes returned tool-call or context-fetch
requests instead of review verdicts:

- `post-correction-review-kimi-2026-06-01.md`: `not_assessed`
- `post-correction-review-glm-2026-06-01.md`: `not_assessed`
- `post-correction-review-mimo-2026-06-01.md`: `not_assessed`

Reason: the packet described files but did not include enough self-contained
code/context for strict no-tools review. These outputs do not count as assessed
review evidence.

## Assessed Retry Lanes

Retries used a self-contained no-tools prompt with code excerpts, contract
excerpt, test excerpt, verification results, and stress metrics.

| Lane | Raw Output | Verdict | Disposition |
| --- | --- | --- | --- |
| Kimi | `post-correction-review-kimi-retry-2026-06-01.md` | `pass` | No blockers. RPM heuristic and skip-list concerns recorded as follow-up. |
| GLM | `post-correction-review-glm-retry-2026-06-01.md` | `pass_with_changes` | Accepted test/count clarity finding; fixed by adding `count` to evidence records and asserting status/evidence_state/count/reason in tests. |
| MiMo | `post-correction-review-mimo-retry-2026-06-01.md` | `pass` | Major-labeled allocation concern rejected as non-blocking/unsupported by full code; minor evidence-state assertion recommendation accepted and fixed. |

## Accepted And Fixed

- Add machine-readable `count` to `relationship-candidate` JSONL records.
- Strengthen context-pack test to assert:
  - `status: observed`
  - `evidence_state: source-visible`
  - `source_artifact: source-tree`
  - `count`
  - reason includes `semantic parsing remains not_assessed`
- Update clean stress protocol after final Syft run showed root scans can
  include stale `.portolan/stress` artifacts without explicit excludes.
- Update generated Syft OSS-plan command and tests to exclude:
  - `./.portolan/**`
  - `./run/**`

## Rejected Or Follow-Up

- RPM spec heuristic expansion: follow-up only. Current `SPECS`/`src/rpm`
  heuristic covers Bigtop acceptance without pretending to parse all RPM
  layouts.
- Skip-list changes for `.m2`, `out`, `build`, or `dist`: follow-up only. The
  current skip list is conservative for agent context and bounded by the scan
  limit.
- Windows path behavior: not assessed; Portolan CI and stress evidence here
  are Linux-local.

## Verification After Fixes

- `go test -count=1 ./internal/app -run TestRunContextPrepareWritesCursorPack`:
  verified
- `go test -count=1 ./internal/app -run TestRunContextPrepareWritesOSSExecutionPlan`:
  verified
- `go vet ./...`: verified
- Full verification bundle rerun after final changes: see implementation
  disposition.
