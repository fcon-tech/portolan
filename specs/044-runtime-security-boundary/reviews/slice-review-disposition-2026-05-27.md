# Slice Review Disposition

Date: 2026-05-27
Spec: `specs/044-runtime-security-boundary/`
Branch: `codex/044-runtime-security-boundary-delivery`

## Review Lanes

| Lane | State | Evidence | Disposition |
| --- | --- | --- | --- |
| Local repo-grounded review | assessed | Final diff, full test bundle, runtime fixture CLI smoke. | Pass; no unresolved local findings after fixes. |
| `kimi-coding/kimi-for-coding` | assessed | `model-review-kimi-2026-05-27.md`, `exit_code: 0`. | Pass; no blocking findings. |
| `zai/glm-5.1` | assessed | `model-review-glm-2026-05-27.md`, `exit_code: 0`. | Pass with minor/security-scope findings; accepted fixes applied. |
| `openrouter/deepseek/deepseek-v4-pro` | assessed | `model-review-deepseek-2026-05-27.md`, `exit_code: 0`. | Pass with edge-test gaps and one prompt-packet `cannot_verify`; accepted fixes applied or locally dispositioned. |
| Focused re-review `kimi-coding/kimi-for-coding` | assessed | `model-rereview-kimi-2026-05-27.md`, `exit_code: 0`. | Pass; accepted fixes verified with no new regressions reported. |

## Findings And Disposition

| Finding | Source | Severity | Decision | Resolution |
| --- | --- | --- | --- | --- |
| Runtime contract/parser drift: docs used `from`/`to`/`coverage`, implementation used legacy `service`/`endpoint`. | pre-implementation review, Kimi, GLM, DeepSeek | major | accepted | `internal/blackbox/blackbox.go` now supports contract-shaped observations while preserving legacy compatibility. |
| Partial runtime observations could be overread as complete topology. | pre-implementation review, Kimi, GLM, DeepSeek | major | accepted | Non-`complete` contract coverage emits an `unknown` runtime-topology edge; tested for scan and map. |
| `scan` and `map --selection` path behavior was inconsistent for nested black-box runtime paths. | local review, Kimi, DeepSeek | major | accepted | `scan` now resolves selection paths; `coverage.ResolveSelectionPaths` resolves nested black-box metadata/runtime/claim paths; map test covers relative runtime path. |
| Runtime schema/field edge cases lacked tests. | DeepSeek | minor | accepted | Added invalid coverage, missing `from`, missing `to`, and source-mismatch `cannot_verify` cases. |
| Packet-level secret leakage was not explicitly tested. | DeepSeek | minor | accepted | `TestRunMapDoesNotEmitSecretValuesFromConfigurationSurfaces` now renders a packet from the map graph and checks it for the secret value. |
| Runtime subject IDs had no length cap. | GLM | minor | accepted | `runtimeSubjectID` now limits generated IDs to 128 runes after sanitization. |
| `not_assessed` runtime coverage semantics and unsupported producer content needed clearer docs. | GLM | minor | accepted | `docs/runtime-observations.md` and `docs/security-threat-model.md` now clarify contract-vs-enforcement and non-complete coverage behavior. |
| Runtime producer secrets/payload leakage remains unverified for arbitrary exports. | GLM | major | accepted as boundary | Kept as `not_assessed` in the threat model; product claims remain narrow. |
| `blackbox.Normalize` could not be verified from the DeepSeek packet. | DeepSeek | minor | rejected with local evidence | The function existed before this slice and is directly used by both scan and map; focused tests and full local tests passed. |
| Exhaustive prompt-injection fuzzing is absent. | GLM, DeepSeek | minor | accepted as out of scope | Threat model states the prompt-like test is representative and narrow; broad prevention is not claimed. |

## Not Assessed

- Complete runtime topology across an inherited estate.
- Live telemetry integrations or credentials.
- Runtime producer secret/payload validation for arbitrary exports.
- MCP/query runtime security behavior; only threat-modeled as future exposure.
- Generic secret scanner or broad security certification.
- Content-hash freshness checks for stale evidence.

## Verdict

Assessed review evidence supports the implementation as a coherent local slice.
Accepted findings were fixed, narrowed, or explicitly left `not_assessed` with
product claims kept narrow.
