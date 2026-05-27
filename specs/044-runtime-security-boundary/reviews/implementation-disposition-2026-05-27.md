# Implementation Disposition

Date: 2026-05-27
Spec: `specs/044-runtime-security-boundary/`
Branch: `codex/044-runtime-security-boundary-delivery`

## Implementation State

Implemented locally on the dedicated branch. No PR was opened in this slice.

Implemented:

- Runtime observation contract documentation in `docs/runtime-observations.md`.
- Product-specific security threat model in `docs/security-threat-model.md`.
- Contract-shaped black-box runtime observations with `from`, `to`, `kind`,
  `coverage`, `source`, and optional `schema_version`.
- Backward compatibility for existing `service`/`endpoint` runtime fixtures.
- `runtime-visible` graph edges only from supplied local observations.
- `unknown` topology records for non-`complete` runtime observation coverage.
- `cannot_verify` records for unsupported runtime schema, invalid coverage,
  missing `from`/`to`, and undeclared `from` subjects.
- Relative nested black-box metadata/runtime/claim path resolution for scan and
  map selection workflows.
- Focused tests for runtime contract behavior, prompt-like packet escaping,
  secret-value omission from native config outputs, and output path boundaries
  through existing tests.
- Narrow README and product-claim updates.

## Verification

| Check | State | Evidence |
| --- | --- | --- |
| Focused runtime/security tests | verified | `go test ./internal/app -run 'TestRunScanRuntimeObservation\|TestRunMapSelectionRuntimeObservation\|TestRunMapDoesNotEmitSecretValues\|TestRunPacketEscapesPromptLikeRuntimeObservationText' -count=1` passed. |
| Full Go tests | verified | `go test -count=1 ./...` passed. |
| Schema syntax | verified | `jq empty schema/*.json` passed. |
| Diff whitespace | verified | `git diff --check` passed. |
| Runtime selection validation | verified | `go run ./cmd/portolan selection validate --selection internal/app/testdata/runtime-security-boundary/selection.json` passed. |
| Runtime scan smoke | verified | `go run ./cmd/portolan scan --selection internal/app/testdata/runtime-security-boundary/selection.json --out /tmp/portolan-044-runtime-graph.json --force` wrote a graph. |
| Runtime map smoke | verified | `go run ./cmd/portolan map --selection internal/app/testdata/runtime-security-boundary/selection.json --out /tmp/portolan-044-runtime-map --force` wrote a map bundle. |

## Review Evidence

- Pre-implementation review:
  `requirements-product-vision-drift-2026-05-27.md`
- Analyze disposition:
  `analyze-disposition-2026-05-27.md`
- Model review raw outputs:
  `model-review-kimi-2026-05-27.md`,
  `model-review-glm-2026-05-27.md`,
  `model-review-deepseek-2026-05-27.md`
- Focused post-fix re-review:
  `model-rereview-kimi-2026-05-27.md`
- Review disposition:
  `slice-review-disposition-2026-05-27.md`

## Product Claims

Updated `docs/product-claims.md` with a new `narrowed` security-boundary claim.
Runtime topology remains `not_assessed` unless supported local observations are
supplied, and partial observations do not prove complete topology.

## Not Assessed

- Complete runtime topology across an estate.
- Live observability/telemetry integration.
- Runtime producer secret/payload validation for arbitrary exports.
- Future MCP/query runtime security behavior.
- Broad security hardening or secret-scanner certification.
- GitHub PR state and GitHub checks; no PR was opened.
- Human review approval and merge readiness.

## Stop State

Local implementation is verified and reviewed. The branch is suitable for PR
creation, but this disposition does not claim ready-to-merge status.
