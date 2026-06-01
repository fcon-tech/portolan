# Control Fixture Preflight: Blind Agent Acceptance

Date: 2026-05-21
Evaluator: Codex
Agent harness: Codex local shell
Model: not_applicable
Status: degraded
Stop reason: preflight only; no blind external operator run was attempted

## Target

- Portolan path: `/Users/fall_out_bug/.codex/worktrees/9198/portolan`
- Target root:
  `/Users/fall_out_bug/.codex/worktrees/9198/portolan/internal/testfixtures/map-command/repo`
- Output directory: `/tmp/portolan-015-control-preflight`
- Target type: local fixture
- Is this Apache Bigtop: no
- Is this a control target: yes, preflight only

## Exact Prompt

No blind agent prompt was issued. This was a local command preflight for the
same artifact path required by the blind protocol.

## Forbidden Hint Check

- target-specific file list: not_applicable; no blind prompt issued
- target-specific build or package instructions: not_applicable
- specific internal guide path named by operator: not_applicable
- hidden target architecture context: not_applicable
- network, mutation, or credential permission: not_applicable

## Commands Attempted

| Command | Outcome | Evidence |
| --- | --- | --- |
| `go run ./cmd/portolan map --root internal/testfixtures/map-command/repo --out /tmp/portolan-015-control-preflight --force` | verified | wrote map bundle |
| `jq empty /tmp/portolan-015-control-preflight/run.json /tmp/portolan-015-control-preflight/graph.json` | verified | exit 0 |
| `wc -c /tmp/portolan-015-control-preflight/findings.jsonl /tmp/portolan-015-control-preflight/map.md` | verified | both files non-empty |

## Artifact Inventory

| Artifact | State | Notes |
| --- | --- | --- |
| `run.json` | verified | records `portolan map`, target root, and output artifacts |
| `graph.json` | verified | JSON syntax valid |
| `findings.jsonl` | verified | non-empty; records inventory plus `not_assessed` detector surfaces |
| `map.md` | verified | non-empty readable packet |

## Artifact Review

- `run.json`: command, root, and artifact paths were present.
- `graph.json`: syntax was valid and represented local fixture evidence.
- `findings.jsonl`: contained observed root inventory and `not_assessed`
  relationship, duplication, configuration, and technical-debt surfaces.
- `map.md`: rendered graph and findings from the same run directory.

## Transcript Summary

No blind agent transcript exists for this preflight.

## Report Review

- artifact-backed conclusions: current `portolan map` can produce the required
  artifact bundle for the control fixture.
- transcript-only claims: none.
- unsupported or overclaimed conclusions: none recorded.
- unknowns preserved: none observed in this fixture.
- cannot-verify states preserved: none observed in this fixture.
- not-assessed surfaces preserved: relationship families outside current Go
  support, duplication, configuration, and technical debt.

## Gap Ledger

| Gap ID | Generic gap | Evidence | Suggested backlog action |
| --- | --- | --- | --- |
| GAP-015-001 | Blind external operator run not yet executed. | No agent prompt or transcript exists for this preflight. | Run Cursor + Composer 2.5 or another harness with the blind protocol. |
| GAP-015-002 | Control target should later use a non-Portolan local project. | Current control is a committed fixture, useful only for command preflight. | Select a separate local control target for operator acceptance. |

## Status Decision

- status: degraded
- reason: command artifact path verified, but this was not a blind operator run.
- evidence: local command output and inspected artifacts under
  `/tmp/portolan-015-control-preflight`.
- follow-up: run the same prompt shape through an external agent harness and
  record the transcript.
