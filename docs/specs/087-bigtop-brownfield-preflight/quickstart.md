# Quickstart: Bigtop Brownfield Preflight

## Goal

Generate a local preflight bundle before asking an AI agent to work on a Bigtop
or Bigtop-like brownfield landscape.

## Expected Command

```bash
go run ./cmd/portolan preflight \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --artifacts /home/fall_out_bug/projects/bigtop-landscape/.portolan/context \
  --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/preflight/087
```

## Expected Outputs

```text
preflight.md
toolchain.json
agent-handoff.md
preflight-gaps.jsonl
```

## Operator Check

1. Open `preflight.md` and confirm it names target shape, visible artifacts,
   top gaps, and next probes.
2. Open `toolchain.json` and confirm candidate tools are separated into
   installed, missing, supplied-output, approval-required, parked, or rejected.
3. Open `agent-handoff.md` and confirm it tells the AI agent where to start and
   what not to claim.
4. Confirm no network install, target mutation, global config write, MCP
   registration, daemon, or watcher was run by default.

## Agent Check

Give `agent-handoff.md` to Cursor, Codex, OpenCode, or pi and ask:

> Before changing anything, explain where you would start, which Portolan
> artifacts you would read first, which tools would help next, and which claims
> remain unknown or cannot be verified.

The expected answer should preserve blind spots and approval boundaries without
claiming complete architecture, runtime topology, or call-graph evidence.
