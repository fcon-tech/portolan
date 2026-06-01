# PR 29 Review Disposition

Date: 2026-06-01

PR: https://github.com/fcon-tech/portolan/pull/29

Head reviewed: `f6418e195a1347c1ce83a3c501223e568d948719`

Review packet: `pr29-review-packet-2026-06-01.md`

## Review Lanes

| Lane | Model | Result | Counted |
| --- | --- | --- | --- |
| Local repo-grounded | Codex local inspection | no critical or major issues | yes |
| Kimi | `kimi-coding/kimi-for-coding` | `pass_with_changes`; minor coverage confirmations | yes |
| GLM | `zai/glm-5.1` | `pass_with_changes`; major test-coverage concerns | yes |
| MiMo | `openrouter/xiaomi/mimo-v2.5-pro` | `pass_with_changes`; conditional boundary-test blocker | yes |

All model lanes produced usable no-tools review output. No empty, hung,
malformed, stale, or off-topic lane was counted.

## Accepted And Fixed

| Finding | Source lanes | Disposition |
| --- | --- | --- |
| Confirm or add `context prepare` relationship-candidate coverage. | Kimi | Existing `TestRunContextPrepareWritesCursorPack` verifies `relationship-candidate` records with `source-visible`, `source_artifact: source-tree`, machine `count`, and the `semantic parsing remains not_assessed` reason. No code change required. |
| Add/confirm symbol-index valid-path normalization tests. | GLM, MiMo | Existing `TestNormalizeSymbolIndexToolOutputCreatesBoundedRelationshipEvidence` verifies mixed PHP/Scala symbol-index nodes, `owns` edges only, metadata-visible evidence, repository scope, and summary wording. |
| Assert symbol-index non-call-graph reason strings. | MiMo | Fixed by asserting exact document and symbol ownership edge reason strings in `TestNormalizeSymbolIndexToolOutputCreatesBoundedRelationshipEvidence`. |
| Add/confirm malformed symbol-index coverage. | GLM, MiMo | Fixed by adding malformed symbol-index JSON coverage to `TestNormalizeSymbolIndexToolOutputCannotVerifyEmptyOrTooManySymbols`. |
| Add/confirm oversized symbol-index document and symbol limits. | Kimi, GLM, MiMo | Existing test covered symbol limit. Fixed by adding document-count limit coverage with lowered `maxSelectedSymbolDocuments`. |
| Add/confirm dependency missing-ref degradation. | MiMo | Fixed by adding `TestNormalizeDependencyToolOutputMarksMissingRefsCannotVerify`, asserting missing dependency refs create `cannot_verify` node and edge evidence. |
| Confirm selected-output byte limit behavior. | GLM, MiMo | Existing `TestNormalizeDependencyToolOutputCannotVerifyMalformedOrOversized` lowers `maxSelectedToolOutputBytes` and verifies oversized output becomes `cannot_verify`. |
| Explain mutable selected-output limits. | GLM | Fixed with a code comment explaining the package variables are intentionally mutable for focused tests without large fixtures. |
| Clarify fixed relationship-candidate reason. | GLM | Fixed with a code comment stating this slice records source-visible candidates only until a parser-backed slice replaces the fixed reason. |

Focused verification after fixes:

- `go test -count=1 ./internal/maprun ./internal/selection ./internal/app`: passed

## Rejected Or Not Applicable

| Finding | Source lanes | Disposition |
| --- | --- | --- |
| Unsupported `tool_outputs[].kind` should become `cannot_verify`. | GLM | Rejected as stated. Unsupported selected tool-output kinds are rejected by `selection.Validate()` before map normalization; they are not valid producer evidence. Fixed narrower by adding `TestValidateRejectsUnsupportedToolOutputKind`. |
| Make `maxSelectedToolOutputBytes` a `const`. | GLM | Rejected. It remains a package variable so tests can lower the limit without allocating large files. A code comment now documents this. |
| Syft exclude paths may be CWD-relative. | GLM, MiMo | Already addressed before PR review: `syftPlan` has a comment that Syft excludes are source-relative and absolute patterns were rejected by the CLI. `TestRunContextPrepareWritesOSSExecutionPlan` asserts the exact args. |
| Mention 051 task change in PR description. | GLM | Accepted for PR description/readiness closeout rather than code. The 051 task change records that UX/report work depends on 052 evidence import. |

## Remaining Not Assessed

- Real SCIP, LSIF, Serena, Sourcebot, or Zoekt output compatibility.
- Runtime-visible topology.
- API/catalog/model/runtime producer outputs beyond existing context surfaces.
- GitHub review approval.
- Merge approval.

## Verdict

Accepted findings are fixed or dispositioned. PR #29 can proceed to full
verification and ready-for-review closeout if the refreshed local bundle and
GitHub checks pass on the final pushed head.
