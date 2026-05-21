# Bigtop Fixture Preflight: Blind Agent Acceptance

Date: 2026-05-21
Evaluator: Codex
Agent harness: Codex local shell
Model: not_applicable
Status: degraded
Stop reason: Bigtop fixture preflight only; real local Bigtop checkout was not
assessed

## Target

- Portolan path: `/Users/fall_out_bug/.codex/worktrees/9198/portolan`
- Target root:
  `/Users/fall_out_bug/.codex/worktrees/9198/portolan/testdata/apache-bigtop-smoke/repo`
- Output directory: `/tmp/portolan-015-bigtop-preflight`
- Target type: local fixture
- Is this Apache Bigtop: fixture only
- Is this a control target: no

## Exact Prompt

No blind agent prompt was issued. This was a local command preflight against the
existing Apache Bigtop smoke fixture.

## Forbidden Hint Check

- target-specific file list: not_applicable; no blind prompt issued
- target-specific build or package instructions: not_applicable
- specific internal guide path named by operator: not_applicable
- hidden target architecture context: not_applicable
- network, mutation, or credential permission: not_applicable

## Commands Attempted

| Command | Outcome | Evidence |
| --- | --- | --- |
| `go run ./cmd/portolan map --root testdata/apache-bigtop-smoke/repo --out /tmp/portolan-015-bigtop-preflight --force` | verified | wrote map bundle |
| `jq empty /tmp/portolan-015-bigtop-preflight/run.json /tmp/portolan-015-bigtop-preflight/graph.json` | verified | exit 0 |
| `wc -c /tmp/portolan-015-bigtop-preflight/findings.jsonl /tmp/portolan-015-bigtop-preflight/map.md` | verified | both files non-empty |

## Artifact Inventory

| Artifact | State | Notes |
| --- | --- | --- |
| `run.json` | verified | records `portolan map`, fixture target root, and output artifacts |
| `graph.json` | verified | JSON syntax valid |
| `findings.jsonl` | verified | non-empty; records current detector limits |
| `map.md` | verified | non-empty readable packet |

## Artifact Review

- `run.json`: command, root, and artifact paths were present.
- `graph.json`: syntax was valid for the fixture run.
- `findings.jsonl`: preserved current unimplemented detector surfaces as
  `not_assessed`.
- `map.md`: rendered the fixture packet from the run artifacts.

## Transcript Summary

No blind agent transcript exists for this preflight.

## Report Review

- artifact-backed conclusions: current `portolan map` can produce the required
  artifact bundle for the committed Bigtop smoke fixture.
- transcript-only claims: none.
- unsupported or overclaimed conclusions: this does not prove real Bigtop
  operator acceptance.
- unknowns preserved: not_assessed in this preflight.
- cannot-verify states preserved: not_assessed in this preflight.
- not-assessed surfaces preserved: relationship families outside current
  support, duplication, configuration, and technical debt.

## Gap Ledger

| Gap ID | Generic gap | Evidence | Suggested backlog action |
| --- | --- | --- | --- |
| GAP-015-003 | Real Bigtop operator lane remains unassessed until a local Bigtop checkout is mapped through the blind prompt. | This run used `testdata/apache-bigtop-smoke/repo`, not a real checkout and not an external agent transcript. | Run the blind protocol against a real local Bigtop checkout. |

## Status Decision

- status: degraded
- reason: command artifact path verified, but this was fixture preflight only.
- evidence: local command output and inspected artifacts under
  `/tmp/portolan-015-bigtop-preflight`.
- follow-up: run Cursor + Composer 2.5 or another external harness on a real
  local Bigtop checkout.
