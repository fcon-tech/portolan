# Portolan Agent Toolbox

Portolan is the local discovery substrate an agent runs before it claims to
understand a codebase.

The agent may be Cursor, Claude, Codex, OpenCode, pi, or another harness. The
product contract is the same: separate current capabilities from target
contracts, run local Portolan commands that actually exist, read local evidence,
and answer from evidence instead of unsupported inference.

## First Acceptance Client

Cursor + Composer 2.5 is the first cheap acceptance client because it gives us:

- a popular agentic IDE;
- terminal command execution;
- readable Markdown reports inside the workspace;
- graph and JSON artifact inspection;
- project rules for a thin Cursor-specific wrapper.

Cursor is not the product boundary. Any Cursor rule must delegate to the
portable Portolan guide and artifact contract.

## Acceptance Smoke Output

After the skill pack exists, the next test is not more internal feature work.
The next acceptance smoke should run the guide with current local Portolan
commands and record concrete gaps:

- what the agent could not run;
- what Portolan could not map;
- where relationships, duplication, configuration, or technical debt were
  missing;
- where packet output was not useful;
- where the agent tried to infer outside evidence.

The generic guide does not prescribe corpus-specific choreography. Concrete
smoke steps belong in acceptance notes or test logs.

## Target Agent Workflow

The portable guide lives at [`agent/AGENT_GUIDE.md`](../../agent/AGENT_GUIDE.md).
Cursor's project rule lives at
[`.cursor/rules/portolan-map.mdc`](../../.cursor/rules/portolan-map.mdc) and is
only a thin wrapper over that guide.

Current reality:

- `portolan --version`
- `portolan map`
- `portolan scan`
- `portolan packet render`
- `portolan import cyclonedx`
- `portolan diff`

Target workflow:

1. Read the Portolan agent guide or harness-specific wrapper.
2. Run `portolan map --root . --out .portolan/run`.
3. Inspect `.portolan/run/run.json`, `.portolan/run/graph.json`,
   `.portolan/run/findings.jsonl`, and `.portolan/run/map.md`.
4. Report relationships, duplication, configuration surfaces, technical debt,
   unknowns, and cannot-verify inputs from the artifacts.
5. Avoid conclusions that are not backed by local evidence.

The first `portolan map` bundle records basic source inventory and explicit
`not_assessed` findings for detector surfaces that are not implemented yet.

See [`agent/examples/map-report.md`](../../agent/examples/map-report.md) for the
expected evidence-backed report shape.

## Target Artifact Contract

This is the current first-pass `portolan map` bundle:

```text
.portolan/run/
  run.json          commands, versions, limits, skipped surfaces
  graph.json        machine-readable evidence graph
  findings.jsonl    evidence-backed relationship/config/debt findings
  map.md            readable packet derived from graph and findings
  evidence/         optional future raw local tool outputs
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
