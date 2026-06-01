# PR Readiness Closeout: 009 Map Command Artifacts

Date: 2026-05-20

## PR State

| Surface | Status | Evidence |
| --- | --- | --- |
| PR | verified | GitHub PR #9: `https://github.com/fall-out-bug/portolan/pull/9`. |
| Reviewed code-fix head | verified | Ancestor-output blocker fixed at `8bf0d88d39ab733211b185698e379faa1f428853`; later artifact-only commits refresh this closeout. |
| Current PR head | verified | `codex/009-map-command-artifacts` includes this closeout refresh commit; re-check GitHub before merge. |
| Base | verified | `main`. |
| Draft state | verified | PR #9 is ready-for-review, not draft. |
| Merge state | not_assessed | GitHub reported `UNKNOWN` after the latest artifact-only push. |
| GitHub checks | not_assessed | `gh pr checks 9` reported no checks on the branch. |

## Local Verification

| Check | Status |
| --- | --- |
| `go test ./...` | verified |
| `jq empty schema/*.json testdata/corpus-manifests/apache-bigtop/manifest.json` | verified |
| `go run ./cmd/portolan map --root testdata/map-command/repo --out /tmp/portolan-map-run --force` | verified |
| `jq empty /tmp/portolan-map-run/run.json /tmp/portolan-map-run/graph.json` | verified |
| JSONL parse check over `/tmp/portolan-map-run/findings.jsonl` | verified |
| `git diff --check` | verified |

## PR Review Evidence

| Lane | Status | Notes |
| --- | --- | --- |
| `openrouter/deepseek/deepseek-v4-pro` | verified | Minor fixture duplication and graph schema concern; fixture duplication fixed, schema concern rejected with local evidence. |
| `openrouter/qwen/qwen3.6-plus` | verified | Minor broad output path, missing flag tests, rollback-error concerns, and stale 007 runbook. Accepted fixes applied where actionable. |
| `openrouter/~google/gemini-pro-latest` | verified | Minor fixture duplication only; fixed. |
| Local review | verified | Output safety, evidence-state honesty, JSONL/run metadata, and CLI behavior reviewed in `implementation-review-disposition-2026-05-20.md`. |
| User review | verified | Ancestor-output destructive blocker was reproduced by review, accepted, fixed in `8bf0d88`, and covered by `TestRunMapRejectsOutputAncestorOfRoot`. |

## Status Matrix

| Surface | Status |
| --- | --- |
| Implementation | verified |
| Local verification | verified |
| Review evidence | verified with accepted fixes applied, including ancestor-output blocker |
| PR state | ready-for-review |
| GitHub checks | not_assessed |
| Merge state | not_assessed after latest artifact-only push |
| Merge readiness | not_assessed; no human approval and no GitHub checks |
| Stop reason | Ready-for-review PR is the correct stop point; merge is not authorized. |

## Residual Risks

- GitHub checks are absent, not green.
- Merge approval is absent.
- Relationship, duplication, configuration, and technical-debt detectors remain
  `not_assessed` placeholder findings by design for this slice.
