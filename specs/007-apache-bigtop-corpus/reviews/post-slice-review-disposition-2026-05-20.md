# Post-Slice Review Disposition: 007 Phase 5 Local Fallback Smoke

Date: 2026-05-20

## Review Lanes

| Lane | Status | Notes |
| --- | --- | --- |
| `kimi-coding/kimi-for-coding` | verified | Returned overclaim findings. |
| `minimax/MiniMax-M2.7` | verified | Returned gate/status contradiction findings. |
| `zai/glm-5.1` | verified | Returned gate/status contradiction findings. |

## Findings And Disposition

| Finding | Source | Disposition |
| --- | --- | --- |
| P2-009 was over-promoted from local fallback smoke to ready-for-implementation. | minimax, glm | Accepted and fixed. P2-009 now says local fallback confirms the `map` gap but the Cursor + Composer operator gate remains pending. |
| Local fallback smoke wording overclaimed `findings.jsonl`, detector output, and lifecycle semantics as proven gaps. | kimi, glm | Accepted and fixed. Documentation now limits proof to the absent target `portolan map` workflow and leaves other gaps as backlog pressure. |
| Local fallback `map --root .` targeted the Portolan repo rather than the fixture root. | glm | Accepted and fixed. The runbook now uses `testdata/apache-bigtop-smoke/repo`. |
| T016 `not_assessed` was too easy to miss. | minimax | Accepted and fixed. The task ledger now includes an explicit `Status: not_assessed` line. |
| Gap ledger artifact was missing from review input. | kimi | Rejected with local evidence. The artifact exists at `specs/007-apache-bigtop-corpus/reviews/acceptance-smoke-ledger-2026-05-20.md`; it was not visible to that lane because the prompt used `git diff` and omitted untracked files. |

## Follow-Up Test Result

The Cursor + Composer 2.5 operator lane was run later with `cursor agent
--print --model composer-2.5`. It produced a smoke report and followed the
guide at the prompt/report level, but shell command execution was blocked
inside Cursor. Treat the lane as degraded evidence: operator usability is partly
assessed, but Cursor-side artifact generation remains `not_assessed`.
