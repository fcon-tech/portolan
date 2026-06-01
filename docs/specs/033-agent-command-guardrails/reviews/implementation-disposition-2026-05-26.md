# Implementation Disposition: Agent Command Guardrails

## Scope

Fixed a fresh H10 Cursor Agent acceptance gap where the agent used Portolan
artifacts correctly but invented a non-existent `portolan context --manifest`
command as the next step.

## Decision Gate

- Simpler/Faster: Update generated contracts and agent instructions; do not add
  a generic manifest command.
- Blocking Edge Cases: External completeness cannot be reduced without local
  inventory evidence. Inventing a command is worse than reporting `unknown`.
- Existing Open Source: Not applicable; this is command-contract guidance.

## Review Lanes

- Local reviewer: accepted. Checked command contract, generated docs, focused
  tests, and H10 ledger update.
- `kimi-coding/kimi-for-coding`: `not_assessed`. Lane returned an attempted
  tool-discovery plan instead of concrete findings.
- `minimax/MiniMax-M2.7`: `not_assessed`. Lane failed with `404 page not
  found`.
- `zai/glm-5.1`: `not_assessed`. Lane returned an intent to gather context
  instead of concrete findings.

## Verification

- `verified`: `go test -count=1 ./internal/app`
- `verified`: `go test -count=1 ./...`
- `verified`: `jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json`
- `verified`: `git diff --check`
- `verified`: `go run ./cmd/portolan context prepare --root /home/fall_out_bug/projects/vibe_coding --out /tmp/portolan-h10-context-guarded --profile cursor --force`
- `verified`: generated `answer-contract.md` includes allowed next commands and
  the explicit `portolan context --manifest` warning.
- `verified`: guarded headless Cursor Agent rerun used `evidence-index.jsonl`,
  avoided full `graph.json`, and did not repeat the invented manifest command.

## Remaining Risks

- UI Cursor/Composer remains `not_assessed`.
