# Plan: Agent Command Guardrails

## Decision Gate

- Simpler/Faster: Update generated contracts and portable instructions. Do not
  implement a generic `context --manifest` command merely because the agent
  invented one.
- Blocking Edge Cases: External completeness cannot be proven from local folder
  discovery alone; selection or corpus manifests are separate local evidence.
- Existing Open Source: No external tool applies. This is an agent-instruction
  and CLI-contract guardrail.

## Implementation

1. Add an allowed-next-commands section to generated `answer-contract.md`.
2. Update generated `query-plan.md` and portable/Cursor instructions to forbid
   invented commands.
3. Record the H10 acceptance finding and fix.
4. Add focused tests for the new generated contract text.

## Verification

- `go test -count=1 ./internal/app`
- `go test -count=1 ./...`
- `jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json`
- `git diff --check`
- `go run ./cmd/portolan context prepare --root /home/fall_out_bug/projects/vibe_coding --out /tmp/portolan-h10-context --profile cursor --force`
