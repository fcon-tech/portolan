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

The lane is a Codex single-repo self-target control lane. Later 2026-05-27 and
2026-05-28 ledgers add Cursor Agent CLI / Composer 2.5 Bigtop evidence and
OpenCode + `kimi-for-coding/k2p6` single-repo, multi-repo, black-box,
install-prompt, and default-permission evidence.

## Verification

| Check | State | Evidence |
| --- | --- | --- |
| `go test -count=1 ./...` | verified | exited 0 |
| `jq empty schema/*.json` | verified | exited 0 |
| `git diff --check` | verified | exited 0 |
| required matrix cells in `docs/agent/ACCEPTANCE.md` | verified | current matrix includes Codex control, Cursor Agent CLI / Composer 2.5 Bigtop, OpenCode `kimi-for-coding/k2p6` single-repo/multi-repo/black-box, install-prompt, and default-permission lanes |
| required matrix cells in spec-local matrix | verified | `acceptance-matrix-2026-05-27.md` was reconciled by later 2026-05-28 lane ledgers |
| `docs/agent/QUICKSTART.md` source-checkout reference | verified | file exists; `rg` found `scripts/bootstrap-portolan`, `go run ./cmd/portolan`, and `context prepare` |

## Review Evidence

Three independent non-GPT review lanes were assessed through `pi`:

- `model-review-kimi-2026-05-27.md`
- `model-review-glm-2026-05-27.md`
- `model-review-deepseek-2026-05-27.md`

Accepted findings were fixed or explicitly preserved as `not_assessed`
limitations. A focused DeepSeek re-review passed after the claim-wording and
self-scoring fixes.

## Remaining Limits After Reconciliation

- Cursor UI is outside the current required acceptance scope.
- Codex remains a single-repo control lane, not a required multi-repo or
  black-box acceptance harness.
- Arbitrary external targets beyond the recorded external single-repo and
  Bigtop runs remain unproven.
- active `cannot_verify` scoring path
- GitHub PR state and GitHub checks

## Outcome

Spec 041 is locally implemented and reconciled with later acceptance evidence.
Remaining gaps are intentionally preserved as product limits and reflected in
`docs/product-claims.md`.
