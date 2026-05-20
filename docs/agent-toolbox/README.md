# Portolan Agent Toolbox

Portolan is the local discovery substrate an agent runs before it claims to
understand a codebase.

The agent may be Cursor, Claude, Codex, OpenCode, pi, or another harness. The
product contract is the same: run local Portolan commands, read Portolan
artifacts, and answer from evidence instead of unsupported inference.

## First Acceptance Client

Cursor + Composer 2.5 is the first cheap acceptance client because it gives us:

- a popular agentic IDE;
- terminal command execution;
- readable Markdown reports inside the workspace;
- graph and JSON artifact inspection;
- project rules for a thin Cursor-specific wrapper.

Cursor is not the product boundary. Any Cursor rule must delegate to the
portable Portolan guide and artifact contract.

## Immediate Bigtop Smoke

After the skill pack exists, the next test is not more internal feature work.
The next test is Cursor + Composer 2.5 running the guide against the Apache
Bigtop corpus profile.

The first Bigtop smoke uses prepared local fixtures and current Portolan
commands. Its job is to record concrete gaps:

- what the agent could not run;
- what Portolan could not map;
- where relationships, duplication, configuration, or technical debt were
  missing;
- where packet output was not useful;
- where the agent tried to infer outside evidence.

## Target Agent Workflow

The eventual workflow after `portolan map` exists:

1. Read the Portolan agent guide or harness-specific wrapper.
2. Run `portolan doctor`.
3. Run `portolan map --root . --out .portolan/run`.
4. Inspect `.portolan/run/run.json`, `.portolan/run/graph.json`,
   `.portolan/run/findings.jsonl`, and `.portolan/run/map.md`.
5. Report relationships, duplication, configuration surfaces, technical debt,
   unknowns, and cannot-verify inputs from the artifacts.
6. Avoid conclusions that are not backed by local evidence.

Until `portolan map` exists, the Bigtop smoke should use current Portolan
commands and record "missing one-command map" as a product gap if that blocks
the agent.

## Artifact Contract

```text
.portolan/run/
  run.json          commands, versions, limits, skipped surfaces
  graph.json        machine-readable evidence graph
  findings.jsonl    evidence-backed relationship/config/debt findings
  map.md            readable packet derived from graph and findings
  evidence/         optional raw local tool outputs
```

## Evidence Rule

Agent conclusions are claims until backed by local Portolan inputs. Portolan
findings must preserve one of:

- `source-visible`
- `metadata-visible`
- `runtime-visible`
- `claim-only`
- `unknown`
- `cannot_verify`
