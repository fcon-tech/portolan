## Review: Portolan Spec 044 Runtime Security Boundary

### Findings

| ID | Finding | Severity | Evidence | Recommendation |
|---|---|---|---|---|
| F1 | **Runtime observation contract shape mismatch resolved.** Parser now accepts `from`/`to`/`kind`/`coverage` contract fields while preserving backward compatibility for older `service`/`endpoint` observations. | — | `internal/blackbox/blackbox.go`: `isContractRuntimeObservation()`, `contractRuntimeFacts()`, `normalizeRuntimeCoverage()`; contract doc updated | Accept. Implementation now matches spec contract. |
| F2 | **Partial coverage correctly emits `unknown` topology edge.** `partialRuntimeCoverageFacts()` creates explicit `unknown` node+edge so agents cannot overread partial observations as complete topology. | — | `app_test.go` `TestRunScanRuntimeObservationContractProducesRuntimeVisiblePartialEvidence` asserts both `runtime-visible` edge and `unknown` partial-coverage edge exist | Accept. Guardrail is explicit and tested. |
| F3 | **Schema version validation rejects unsupported versions.** Runtime JSON with `schema_version != "0.1.0"` becomes `cannot_verify`. | — | `app_test.go` `TestRunScanRuntimeObservationRejectsUnsupportedSchemaVersion`; `blackbox.go` schema check | Accept. Prevents forward-compatibility confusion. |
| F4 | **Relative runtime paths resolved in `map` command.** `coverage.ResolveSelectionPaths()` now recurses into `black_boxes[].runtime[]`, `metadata[]`, and `claims[]`. | — | `internal/coverage/coverage.go` lines +11; `app_test.go` `TestRunMapSelectionRuntimeObservationContractResolvesRelativeRuntimePath` | Accept. Fixes path-resolution gap for black-box inputs. |
| F5 | **Secret value redaction verified for native config surfaces.** `TestRunMapDoesNotEmitSecretValuesFromConfigurationSurfaces` checks `graph.json`, `findings.jsonl`, `summary.json`, and `map.md` for leaked secret values. | — | `app_test.go` new test; `internal/configuration` existing `TestDetectFindsConfigSurfacesWithoutSecretValues` | Accept. Narrow claim is supported. |
| F6 | **Prompt-like runtime text escaped in packet output.** Backticks, newlines, and HTML-sensitive characters are escaped so runtime labels remain quoted evidence content. | — | `app_test.go` `TestRunPacketEscapesPromptLikeRuntimeObservationText` | Accept. Mitigation is focused and tested. |
| F7 | **Orphan runtime observations (wrong `from`) become `cannot_verify`.** If `observation.From != target.ID`, emitted as `cannot_verify` with reason referencing undeclared source. | — | `blackbox.go` `contractRuntimeFacts()` orphan branch | Accept. Prevents cross-landscape runtime subject injection. |
| F8 | **Runtime subject ID sanitization prevents graph ID injection.** `runtimeSubjectID()` strips non-alphanumeric/hyphen/underscore/dot/colon characters, collapsing sequences to single hyphens. | — | `blackbox.go` `runtimeSubjectID()` | Accept. Mitigates graph-node ID manipulation from untrusted runtime text. |
| F9 | **Product claims narrowed appropriately.** New claim: "documented security boundary for untrusted local artifacts" is `narrowed`, not `accepted`. README and `product-claims.md` explicitly state this is not broad security certification. | — | `docs/product-claims.md`, `README.md` | Accept. Honest product posture. |
| F10 | **Threat model documents 7 risks with explicit states.** Prompt injection, path traversal, secret leakage, runtime producer secrets, future MCP/query, stale evidence, malformed runtime JSON—all named with mitigation, verification, and residual risk. | — | `docs/security-threat-model.md` | Accept. Comprehensive for the slice scope. |
| F11 | **Coverage normalization accepts only `complete`/`partial`/`unknown`/`not_assessed`.** Invalid coverage values become `cannot_verify`. | — | `blackbox.go` `normalizeRuntimeCoverage()` | Accept. |

### Not Assessed / Cannot Verify

| Item | Reason |
|---|---|
| **Runtime producer secret redaction** | Threat model marks this `not_assessed` for arbitrary producer exports. Contract excludes payloads/credentials, but no automated scanner validates producer compliance. |
| **MCP/query exposure** | Threat-modeled as future risk; no runtime MCP surface exists in this slice. |
| **Complete runtime topology** | Explicitly `not_assessed` per product claims and spec. Partial observations do not prove completeness. |
| **Full JSON Schema validation** | Schema check is focused (`schema_version` string equality), not a full schema validator. |
| **All output path boundaries** | Existing tests cover current CLI surfaces; threat model notes future commands must add equivalent tests. |
| **Content-hash/timestamp freshness** | Stale evidence threat is `partially verified`; freshness checks are future work. |

### Verdict

**Conditionally accepted** for the 044 runtime-security-boundary slice.

The implementation:
- Satisfies the spec contract for supported runtime observation JSON
- Preserves backward compatibility with existing fixtures
- Adds focused tests for runtime evidence semantics, partial coverage guardrails, schema rejection, path resolution, secret redaction, and prompt-like text escaping
- Documents a product-specific threat model with honest verification states
- Narrows product claims appropriately

The `not_assessed` items are explicitly preserved and not collapsed into success. No broad security certification is claimed.

exit_code: 0
