# Implementation Disposition: Agent Acceptance Matrix

Date: 2026-05-27
Branch: `codex/041-agent-acceptance-matrix-delivery`
Base: `872968d47fa2640c19c7baa4f7aec0c0205760c0`

## Implementation State

Implemented locally.

Delivered artifacts:

- `docs/agent/ACCEPTANCE.md`
- `docs/product-claims.md`
- `docs/product-backlog.md`
- `specs/041-agent-acceptance-matrix/spec.md`
- `specs/041-agent-acceptance-matrix/tasks.md`
- `specs/041-agent-acceptance-matrix/reviews/acceptance-matrix-2026-05-27.md`
- `specs/041-agent-acceptance-matrix/reviews/codex-single-repo-lane-2026-05-27.md`
- `specs/041-agent-acceptance-matrix/reviews/slice-review-disposition-2026-05-27.md`

## Acceptance Evidence

The `codex-single-repo` lane was executed with the blind prompt variables:

- `PORTOLAN_PATH=/tmp/portolan-041-agent-acceptance-matrix`
- `TARGET_PATH=/tmp/portolan-041-agent-acceptance-matrix`
- `OUTPUT_PATH=/tmp/portolan-041-acceptance/codex-single-repo`

Commands verified:

```bash
go run ./cmd/portolan context prepare --root /tmp/portolan-041-agent-acceptance-matrix --out /tmp/portolan-041-acceptance/codex-single-repo/context --profile cursor
go run ./cmd/portolan map --root /tmp/portolan-041-agent-acceptance-matrix --out /tmp/portolan-041-acceptance/codex-single-repo/map
```

The lane is a Codex single-repo self-target lane. It does not validate external
single-repo targets, Cursor UI/Composer, OpenCode, multi-repo targets, or
black-box/metadata-heavy targets.

## Verification

| Check | State | Evidence |
| --- | --- | --- |
| `go test -count=1 ./...` | verified | exited 0 |
| `jq empty schema/*.json` | verified | exited 0 |
| `git diff --check` | verified | exited 0 |
| matrix cell count in `docs/agent/ACCEPTANCE.md` | verified | `rg -c 'codex-|cursor-ui-|opencode-' docs/agent/ACCEPTANCE.md` returned 9 |
| matrix cell count in spec-local matrix | verified | `rg -c 'codex-|cursor-ui-|opencode-' specs/041-agent-acceptance-matrix/reviews/acceptance-matrix-2026-05-27.md` returned 9 |
| `docs/agent/QUICKSTART.md` source-checkout reference | verified | file exists; `rg` found `scripts/bootstrap-portolan`, `go run ./cmd/portolan`, and `context prepare` |

## Review Evidence

Three independent non-GPT review lanes were assessed through `pi`:

- `model-review-kimi-2026-05-27.md`
- `model-review-glm-2026-05-27.md`
- `model-review-deepseek-2026-05-27.md`

Accepted findings were fixed or explicitly preserved as `not_assessed`
limitations. A focused DeepSeek re-review passed after the claim-wording and
self-scoring fixes.

## Not Assessed

- Cursor UI/Composer acceptance
- OpenCode acceptance
- Codex multi-repo acceptance
- Codex black-box/metadata-heavy acceptance
- external non-Portolan single-repo acceptance
- active `cannot_verify` scoring path
- GitHub PR state and GitHub checks

## Outcome

Spec 041 is locally implemented and verified. Remaining gaps are intentionally
preserved as `not_assessed` and reflected in `docs/product-claims.md`.
