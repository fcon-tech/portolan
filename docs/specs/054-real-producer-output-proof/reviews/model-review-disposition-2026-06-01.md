# Model Review Disposition: Spec 054

Date: 2026-06-01
Branch: `codex/054-bigtop-architecture-proof`

## Review Lanes

| Lane | Model | Raw output | Status |
| --- | --- | --- | --- |
| Kimi | `openrouter/moonshotai/kimi-k2.6` | `model-review-kimi-k2-2026-06-01.raw.md` | assessed |
| GLM | `zai/glm-5.1` | `model-review-glm-5-1-2026-06-01.raw.md` | assessed |
| MiMo | `openrouter/xiaomi/mimo-v2.5-pro` | `model-review-mimo-2026-06-01.raw.md` | assessed with packet-limit false positives |

Review mode: bounded no-tools packet. The raw outputs are reviewer evidence;
this disposition is the accepted project decision.

## Accepted And Fixed

| Finding | Source | Disposition | Fix |
| --- | --- | --- | --- |
| Command safety check is heuristic-only and should not be treated as a sandbox. | Kimi, GLM | accepted | Added code comment to `commandLooksUnsafe` stating it is metadata hygiene only and producer tools are not executed by Portolan. |
| Verified producer-run records are machine-scoped because validation requires the referenced output file to exist. | GLM | accepted | Added `ValidateProducerRun` comment documenting the local file-existence requirement. |
| Strict producer-run JSON should be documented as intentional. | GLM | accepted | Added `decodeProducerRunStrict` comment explaining strict contract updates. |
| Template fixture could drift without a direct test. | GLM | accepted | Added `TestValidateProducerRunTemplateFixture`. |
| Path traversal should have a direct negative test. | MiMo | accepted | Added `TestValidateProducerRunRejectsOutputPathTraversal`. |
| `privacy_review: local_safe` positive case was untested. | GLM | accepted | Added `TestValidateProducerRunAcceptsLocalSafePrivacyReview`. |

Focused verification after fixes:

```bash
go test -count=1 ./internal/producerfamily ./internal/app
```

Result: `verified`.

## Rejected Or Not Blocking

| Finding | Source | Disposition | Reason |
| --- | --- | --- | --- |
| `ValidateJSONLFile` missing / compilation blocker. | MiMo | rejected | Packet omitted `producerfamily.go`; full baseline and focused tests compile. Existing `ValidateJSONLFile` is for producer-family records, while producer-run records use `ValidateProducerRunJSONLFile`. |
| `allowedEvidenceStates` undefined / compilation blocker. | MiMo, Kimi | rejected as blocker | Defined in `producerfamily.go`; full baseline and focused tests compile. |
| Add JSON Schema for producer-run records before merge. | Kimi | not blocking | T006 allowed schema-adjacent Go validation; producer-run contract is still internal and strict Go tests cover this slice. Add schema only when external consumers need it. |
| Replace `CoveredUnits []string` with typed taxonomy now. | Kimi | not blocking | Current scope is bounded metadata surfacing. A typed coverage taxonomy belongs in a follow-up once more producer families are real. |
| Add query subcommands for producer-run filtering. | Kimi | not blocking | US2 intentionally uses existing context artifacts; no CLI expansion approved for this slice. |
| Rename fixture file. | Kimi | not blocking | Current fixture names are understandable with README and test coverage. |

## Remaining Risks

- `commandLooksUnsafe` remains a heuristic and must not be described as a
  security boundary.
- `privacy_review` records review state but does not redact output paths by
  itself; committed/public excerpts must still be reviewed manually.
- The broad claim "Portolan understands Bigtop like a human/enterprise code
  intelligence" remains `not_assessed`; this slice only verifies a narrowed
  producer-run proof.

## Decision

Proceed to PR readiness after full baseline rerun and PR closeout. No accepted
review finding remains open for spec 054 implementation.
