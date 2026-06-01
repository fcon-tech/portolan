# Full Blind Agent Acceptance

Date: 2026-06-01
Spec: `051-portolan-quality-boundary`
PR: https://github.com/fcon-tech/portolan/pull/28

## Scope

- Target shape: external single-repo.
- Target: `/home/fall_out_bug/projects/vibe_coding/spec-kit`.
- Prompt contract: `docs/agent/ACCEPTANCE.md` blind acceptance prompt.
- Variables supplied to agents: only `PORTOLAN_PATH`, `TARGET_PATH`, and
  `OUTPUT_PATH`, plus the shared blind acceptance instructions.
- Non-goals: Cursor UI / Composer UI behavior and arbitrary target
  generalization.

## Prompt Variables

```text
PORTOLAN_PATH=/home/fall_out_bug/projects/sdp/portolan-051-portolan-quality-boundary
TARGET_PATH=/home/fall_out_bug/projects/vibe_coding/spec-kit
OUTPUT_PATH=/home/fall_out_bug/projects/sdp/portolan-051-portolan-quality-boundary/.portolan/acceptance/<lane>
```

## OpenCode Lane

- Harness: OpenCode.
- Model: `kimi-for-coding/k2p6`.
- Output: `.portolan/acceptance/051-full-blind-opencode-spec-kit`.
- Raw transcript:
  `full-blind-opencode-spec-kit-2026-06-01.raw.md`.
- State: `verified`.

Commands attempted by the agent:

- inspected `docs/agent/QUICKSTART.md`;
- checked for an installed `portolan` binary;
- ran `scripts/bootstrap-portolan`;
- ran `portolan context prepare`;
- first `context`/`map` attempts hit existing empty output directories and
  failed with the expected `use --force` error;
- retried with `--force`;
- read the required bounded artifacts before answering.

Artifacts created:

- `context/agent-brief.md`
- `context/answer-contract.md`
- `context/evidence-index.jsonl`
- `context/gaps.jsonl`
- `context/oss-plan.json`
- `context/query-plan.md`
- `context/repos.json`
- `context/tool-registry.json`
- `map/coverage.json`
- `map/findings.jsonl`
- `map/graph-index.json`
- `map/graph.json`
- `map/map.md`
- `map/run.json`
- `map/summary.json`

Scoring:

| Criterion | State | Evidence |
| --- | --- | --- |
| Produced Portolan artifacts | verified | context and map files listed above |
| Answered question set | verified | raw transcript includes all four answers |
| Cited Portolan artifacts | verified | answer cites context and map artifact paths |
| Preserved weak states | verified | answer keeps `unknown` and `not_assessed`; no `cannot_verify` records were present |
| Unsupported claims | verified | 0 accepted unsupported claims found in local scoring |
| Useful next actions | verified | 3+ local actions listed |
| Target mutation | verified absent | target git status remained clean |

## Cursor Agent CLI Lane

- Harness: Cursor Agent CLI.
- Model: Composer 2.5 from local Cursor CLI configuration.
- Permission mode: `--yolo`, required for this non-interactive CLI run because
  the local Cursor allowlist otherwise blocks shell commands.
- Output: `.portolan/acceptance/051-full-blind-cursor-spec-kit`.
- Raw transcript:
  `full-blind-cursor-spec-kit-2026-06-01.raw.md`.
- State: `verified`.

Commands attempted by the agent:

- resolved the repo-local Portolan binary through `scripts/bootstrap-portolan`;
- ran `context prepare --profile cursor`;
- ran `map --root`;
- read the required bounded artifacts before answering.

Artifacts created:

- `context/agent-brief.md`
- `context/answer-contract.md`
- `context/evidence-index.jsonl`
- `context/gaps.jsonl`
- `context/oss-plan.json`
- `context/query-plan.md`
- `context/repos.json`
- `context/tool-registry.json`
- `map/coverage.json`
- `map/findings.jsonl`
- `map/graph-index.json`
- `map/graph.json`
- `map/map.md`
- `map/run.json`
- `map/summary.json`

Scoring:

| Criterion | State | Evidence |
| --- | --- | --- |
| Produced Portolan artifacts | verified | context and map files listed above |
| Answered question set | verified | raw transcript includes all four answers |
| Cited Portolan artifacts | verified | answer cites context and map artifact paths |
| Preserved weak states | verified | answer keeps `unknown`, `not_assessed`, and explicitly reports zero `cannot_verify` records in this run |
| Unsupported claims | verified | 0 accepted unsupported claims found in local scoring |
| Useful next actions | verified | 3+ local actions listed |
| Target mutation | verified absent | target git status remained clean |

## Shared Artifact Facts

Both lanes produced the same map summary for the target:

- graph: 272 nodes and 108 edges;
- file surfaces: 15 config, 44 doc, 1 manifest, 13 source, 19 unknown, and 16
  workflow files;
- findings: 16 total;
- finding states: 8 `observed`, 7 `not_assessed`, and 1 `unknown`;
- coverage weak records: external completeness is `unknown`, and 11 direct
  child files remain `not_assessed` as repository candidates.

## Disposition

Accepted. The full blind acceptance requirement for this spec is now satisfied
for OpenCode and Cursor Agent CLI on an external single-repo target.

Remaining boundaries:

- Cursor UI / Composer UI remains `not_assessed`.
- This evidence does not generalize to arbitrary targets or multi-repo
  landscapes.
- OpenCode and Cursor answers were scored locally in this disposition; no
  additional independent model lane was run for the scoring step.
