# Agent Acceptance

This page validates the active captain-atlas workflow:

```text
Captain gives an agent Portolan plus a target ecosystem.
Agent installs or prepares Portolan.
Agent builds a local atlas bundle and atlas app.
Agent answers from the generated atlas.
```

The detailed BDD contracts live in `docs/captain-atlas/`.

## State Rules

- `verified`: the lane ran and the relevant BDD scenarios passed.
- `failed`: the lane ran and violated the contract.
- `blocked`: a named external or environmental prerequisite prevented the run.
- `not_assessed`: the lane was not run or lacks enough evidence to score.
- `unknown`: the run completed but could not prove the requested scope.

Do not convert `blocked`, `unknown`, or `not_assessed` into success.

## Current Required Lanes

| Lane | Purpose | Source Spec |
| --- | --- | --- |
| Cursor Composer first run | Prove the primary captain scenario. | `docs/captain-atlas/01-cursor-composer-first-run.md` |
| Atlas app inspection | Prove the generated app is useful to a captain. | `docs/captain-atlas/02-atlas-app-shell.md` |
| Landscape producer check | Prove the bundle has enough facts to explain the estate. | `docs/captain-atlas/03-landscape-intelligence-producers.md` |
| Agent Q&A and drill-down | Prove follow-up questions and selected-code lookup work. | `docs/captain-atlas/04-agent-qna-drilldown.md` |
| Packaging/QoL/safety | Prove install, status, progress, receipt, and local-first behavior. | `docs/captain-atlas/05-packaging-qol-security.md` |
| Harness portability install lanes | Prove generated Cursor, OpenCode/Codex, and Claude instruction files point to target-local wrappers without escaping back to the Portolan runtime checkout. | `scripts/harness-agent-install-smoke.sh` |
| OSS kill gates | Prove we should build, wrap, or kill each capability. | `docs/captain-atlas/06-oss-kill-gates.md` |

## First-Run Prompt Shape

Give the agent only:

```text
PORTOLAN=<Portolan link or local checkout path>
TARGET_ROOT=<absolute local path to the target ecosystem>
```

Then ask:

```text
Use Portolan to build my atlas for TARGET_ROOT. Follow the Portolan captain-atlas
instructions. Ask at most two necessary clarifying questions, install or prepare
Portolan safely, build the atlas bundle and local app, then tell me what to open
and what the first useful landscape findings are. Do not mutate target source
files or use network/credentials without explicit approval.
```

## Scoring

Each lane records:

- harness and model;
- target ecosystem;
- commands or UI steps;
- manual interventions;
- generated bundle and app paths;
- first useful captain insight;
- failures and gaps;
- BDD scenarios passed or failed;
- kill / pack / build recommendation where relevant.

## Runtime Gate

Use the product acceptance script for repository-level smoke checks:

```bash
scripts/portolan-product-acceptance.sh
```

This script is not a substitute for the Cursor Composer first-run BDD. It checks
repository health, static install lanes for Cursor/OpenCode/Codex/Claude,
schemas, viewer syntax/build, harness smoke, and whitespace. Live runtime
acceptance defaults to Cursor/OpenCode. Codex and Claude have concrete runtime
lanes that can be required explicitly when their CLIs are available in the
operator environment.

The live runtime gate has three prompt modes:

```bash
scripts/harness-agent-runtime-acceptance.sh --prompt-mode captain
scripts/harness-agent-runtime-acceptance.sh --prompt-mode guided
scripts/harness-agent-runtime-acceptance.sh --prompt-mode exact
scripts/harness-agent-runtime-acceptance.sh --harness codex --require codex --prompt-mode captain
scripts/harness-agent-runtime-acceptance.sh --harness claude --require claude --prompt-mode captain
scripts/harness-agent-runtime-acceptance.sh --prompt-mode captain --fixture polyglot-service-landscape
```

- `captain` generates the public first-run prompt with
  `scripts/portolan-captain-prompt.sh` and gives that prompt to the live agent.
  This is the product-facing proof for the captain-atlas story: `PORTOLAN` plus
  `TARGET_ROOT`, target-local install, bounded queries, selected-code
  drill-down, and viewer handoff.
- `guided` gives the headless agent `PORTOLAN`, `TARGET_ROOT`, and a short
  embedded first-run guide. The automated lane does not require reading
  `docs/agent/INSTALL-PROMPT.md`, because some harnesses block external
  source-tree reads from a target workspace. The agent must install target-local
  instructions and read the installed harness guide before scanning
  (`AGENTS.md` for OpenCode/Codex-compatible lanes, `.cursor/rules/portolan-atlas.mdc`
  for Cursor). Use it as a diagnostic isolation lane when captain prompt
  behavior fails.
- `exact` injects the deterministic command block. Keep it for regression
  checks, but do not treat it as proof that an agent discovered the workflow.

`scripts/portolan-product-acceptance.sh --northstar` defaults live runtime lanes
to `captain` and runs them on the `polyglot-service-landscape` fixture. That
fixture has two repos, a Node/Go stack split, and relationship handoff evidence;
the northstar lane therefore fails if live agents only prove a one-repo atlas.
It can also validate named real-corpus artifacts with `--bigtop-bundle`,
`--second-oss-bundle`, and `--second-oss-target`: the bundle arguments validate
existing corpus artifacts, while the target argument performs a fresh
install/scan/query/handoff run on a copied external OSS corpus. These corpora
are stress inputs, not the product entrypoint. Pass `--agent-prompt-mode
guided` or `--agent-prompt-mode exact` only when intentionally running a
narrower diagnostic lane.

In `captain` mode, the product acceptance gate runs the OpenCode headless lane
with `--opencode-dangerously-skip-permissions` because OpenCode cannot pause a
noninteractive run for the local Portolan checkout read. The acceptance target is
disposable, and the lane still fails on network fetch attempts, target source
mutation, raw bundle-file loading, or post-install scan/query execution from the
Portolan runtime checkout instead of the target-local wrappers.

For the Agent Q&A and drill-down lane, generate the bounded Q&A artifact after a
bundle exists:

```bash
scripts/run-query-eval.sh --run <bundle-dir>
```

The artifact is `<bundle-dir>/captain-qna-eval.json`. It must contain five
captain questions and two selected-code questions, the bounded query commands
used, citations/routes, and `raw_large_outputs_read: false`.

After Q&A eval, build the portable captain handoff:

```bash
scripts/build-captain-handoff.sh <bundle-dir>
```

The artifacts are `<bundle-dir>/captain-handoff.md` for the human summary and
`<bundle-dir>/captain-handoff.json` for machine-readable run status. They must
cite receipt, scorecard, Q&A eval, viewer handoff, and bounded query commands.

`captain-handoff.json.verdict` is intentionally stricter than "the file was
generated":

- `verified` requires a completed scan, verified scorecard, verified Q&A eval,
  verified drill-down, verified selected-code drill-down, and verified
  relationship drill-down.
- Relationship drill-down requires at least one bounded relationship query record
  with direct endpoints (`from_repo`/`to_repo`) or cohort endpoints
  (`repos` with at least two members) plus an atlas/API route. Row presence alone
  is not relationship proof.
- A single-repo or no-edge corpus may still be a valid install/Q&A portability
  lane, but its handoff verdict must remain `not_assessed` when
  `relationship_drill_down` is `not_assessed`.
- Northstar and real-corpus relationship lanes must use relationship-bearing
  bundles and must not count a no-edge handoff as relationship proof.
