# Agent Runtime Smoke - Diagnostic Only

Date: 2026-06-01
Spec: `051-portolan-quality-boundary`
PR: https://github.com/fcon-tech/portolan/pull/28

## Acceptance Status

State: `not_accepted`.

This smoke is diagnostic evidence only. It proves that OpenCode and Cursor
Agent CLI can execute a minimal documented workflow in this local worktree, but
it does not prove the Portolan agent acceptance goal. It is insufficient because
the harnesses were prompted directly with explicit paths and a reduced task,
and the run did not use the full blind acceptance protocol from
`docs/agent/ACCEPTANCE.md`.

Required replacement evidence before acceptance:

- a full blind acceptance run using only `PORTOLAN_PATH`, `TARGET_PATH`, and
  `OUTPUT_PATH`;
- at least Cursor Agent CLI and OpenCode lanes;
- a non-self target or explicitly justified target shape;
- recorded prompts, commands, artifacts, agent answers, unsupported-claim
  scoring, useful-next-action scoring, weak-state preservation, and final lane
  state;
- independent disposition under the spec review directory.

## Decision Gate

- Simpler/Faster: a full blind acceptance matrix rerun is not needed for this
  quality-boundary slice; a bounded harness smoke is enough to verify that the
  updated agent-facing docs and maturity wording still support real agent use.
- Blocking Edge Cases: static docs can pass while Cursor/OpenCode runtime use
  fails due permissions, trust prompts, or weak-state collapse in the agent
  answer.
- Existing Open Source: use the installed agent harnesses directly instead of
  adding a wrapper or new dependency.

## OpenCode Smoke

- Harness: OpenCode with `kimi-for-coding/k2p6`.
- Target: `/home/fall_out_bug/projects/sdp/portolan-051-portolan-quality-boundary`.
- Output: `.portolan/acceptance/051-opencode-smoke/`.
- State: `diagnostic_pass`; acceptance remains `not_accepted`.

Observed behavior:

- The agent read `docs/agent/QUICKSTART.md`.
- The agent built `.portolan/bin/portolan` via `scripts/bootstrap-portolan`.
- The agent ran `context prepare` into
  `.portolan/acceptance/051-opencode-smoke/context`.
- The agent ran `map` into `.portolan/acceptance/051-opencode-smoke/map`.
- The agent read bounded artifacts before answering:
  `context/agent-brief.md`, `context/answer-contract.md`,
  `context/evidence-index.jsonl`, `context/gaps.jsonl`,
  `map/summary.json`, `map/graph-index.json`, `map/findings.jsonl`, and
  `map/map.md`.
- The answer preserved `unknown` and `not_assessed` instead of converting weak
  states to success.

Evidence from `map/summary.json`:

- one `source-visible` repository;
- graph: 1185 nodes and 1173 edges;
- findings: 40 total, including 34 `observed`, 5 `not_assessed`, and 1
  `unknown`;
- coverage weak records include external completeness as `unknown` and
  non-repository children as `not_assessed`.

## Cursor Agent CLI Smoke

- Harness: Cursor Agent CLI, Composer 2.5.
- Target: `/home/fall_out_bug/projects/sdp/portolan-051-portolan-quality-boundary`.
- Output: `.portolan/acceptance/051-cursor-yolo-smoke/`.
- State: `diagnostic_pass` with explicit permission mode; acceptance remains
  `not_accepted`.

First attempt:

- `cursor agent` without trust stopped on the workspace trust prompt.
- `cursor agent --trust` produced no visible output for about 90 seconds and
  created no artifacts. Local Cursor configuration was in allowlist mode with
  only `Shell(ls)` allowed, so the run was treated as `blocked/no-output`, not
  evidence.

Successful retry:

- `cursor agent --yolo` ran the minimal Portolan smoke.
- The agent built or reused `.portolan/bin/portolan`.
- The agent ran `context prepare` into
  `.portolan/acceptance/051-cursor-yolo-smoke/context`.
- The agent ran `map` into `.portolan/acceptance/051-cursor-yolo-smoke/map`.
- The agent returned a Russian answer citing the generated paths and explicitly
  preserving weak evidence states.

Evidence from the Cursor answer and generated artifacts:

- `map/summary.json`: 1185 graph nodes, 1173 edges, 40 findings, 5
  `not_assessed` findings, and 1 `unknown` finding.
- `context/gaps.jsonl`: gap ledger retained `not_assessed` and `unknown`
  entries.
- `map/findings.jsonl`: relationship placeholders remained `not_assessed`.
- `map/coverage.json`: weak coverage states remained visible.
- No tracked source files were changed; generated artifacts stayed under the
  ignored `.portolan/` directory.

## Remaining Boundaries

- Cursor UI / Composer UI remains `not_assessed`; this smoke covers Cursor
  Agent CLI only.
- OpenCode and Cursor were both run against the Portolan worktree as a local
  single-repo target. This does not prove arbitrary targets or external output
  paths.
- These smokes verify that agents can follow the documented workflow and
  preserve weak evidence states. They do not replace the broader acceptance
  matrix from `docs/agent/ACCEPTANCE.md`.
