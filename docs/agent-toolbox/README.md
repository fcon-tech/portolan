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
portable Portolan entrypoint and artifact contract.

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

## Bootstrap Contract

The root-discoverable entrypoint lives at
[`agent/START_HERE.md`](../../agent/START_HERE.md). The detailed portable guide
lives at [`agent/AGENT_GUIDE.md`](../../agent/AGENT_GUIDE.md). Harnesses that
support skill import can use
[`agent/skills/portolan-map/SKILL.md`](../../agent/skills/portolan-map/SKILL.md).
Cursor's project rule lives at
[`.cursor/rules/portolan-map.mdc`](../../.cursor/rules/portolan-map.mdc) and is
only a thin wrapper over the portable entrypoint.

Current reality:

- `portolan --version`
- `portolan map`
- `portolan scan`
- `portolan packet render`
- `portolan import cyclonedx`
- `portolan diff`

Target workflow:

1. Read the Portolan agent entrypoint, guide, skill, or harness-specific
   wrapper.
2. Run `portolan context prepare --root <target-root> --out <context-dir>
   --profile cursor`, or build `.portolan/bin/portolan` with
   `scripts/bootstrap-portolan` from a Portolan source checkout when no binary
   is installed. Use `go run ./cmd/portolan` only as a fallback when bootstrap
   cannot be used.
3. Inspect `<context-dir>/agent-brief.md`,
   `<context-dir>/answer-contract.md`, `<context-dir>/query-plan.md`,
   `<context-dir>/repos.json`, `<context-dir>/tool-registry.json`,
   `<context-dir>/oss-plan.json`, and `<context-dir>/gaps.jsonl`.
4. Run `portolan map` when graph artifacts are needed, then inspect
   `<run-dir>/run.json`, `<run-dir>/summary.json`, `<run-dir>/graph.json`,
   `<run-dir>/findings.jsonl`, and `<run-dir>/map.md`.
5. Report relationships, duplication, configuration surfaces, technical debt,
   unknowns, and cannot-verify inputs from the artifacts.
6. Avoid conclusions that are not backed by local evidence.

The current `portolan map` bundle records basic source inventory, local Go
import relationships, local `go.mod` dependency relationships, exact
source/config duplicate clusters, file-based configuration surfaces, and
rule-light technical-debt candidates, plus explicit `not_assessed` findings for
detector surfaces that are not implemented yet. Near-clone duplication remains
OSS/jscpd-backed evidence, and semantic config/IaC validation remains
OSS/Semgrep-backed evidence.

See [`agent/examples/map-report.md`](../../agent/examples/map-report.md) for the
expected evidence-backed report shape.

Use [`blind-acceptance.md`](blind-acceptance.md) when evaluating whether an
agent can discover and run the generic workflow from only the Portolan path,
target path, output path, and the mapping request. The blind protocol is the
operator acceptance contract; target-specific corpus notes and local fixtures
are preflight or follow-up evidence unless a run ledger records otherwise.

Build, packaging, configuration, release, smoke-test, and integration
repositories are valid targets. Agents must not clone or fetch upstream
component source repositories just because a target references them. Missing
local source evidence remains `unknown`, `cannot_verify`, or `not_assessed`.

## Target Artifact Contract

This is the current first-pass `portolan map` bundle:

```text
.portolan/run/
  run.json          commands, versions, limits, skipped surfaces
  summary.json      compact graph/finding/coverage/file-surface counts
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

See [`docs/relationship-detection.md`](../../docs/relationship-detection.md)
for the currently supported relationship families.
