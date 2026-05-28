# OpenCode K2P6 Russian Install Prompt Lane

Date: 2026-05-27

Cell: `opencode-ru-install-prompt-self`

Harness: OpenCode `1.15.10`

Model: `kimi-for-coding/k2p6`

State: `verified`

## Contract

The lane used the copyable Russian prompt from
`docs/agent/INSTALL-PROMPT.ru.md` with only the three path variables filled in:

```text
PORTOLAN_PATH=/home/fall_out_bug/projects/sdp/portolan
TARGET_PATH=/home/fall_out_bug/projects/sdp/portolan
OUTPUT_PATH=/tmp/portolan-opencode-ru-install-prompt-wodiud
```

No target-specific expected findings, file lists, or hidden Portolan commands
were added to the prompt. The OpenCode command used
`--dangerously-skip-permissions` because OpenCode requires explicit permission
bypass for this external `/tmp` output-path workflow; this is a harness
constraint, not a Portolan product dependency.

## Commands

```bash
opencode run --model kimi-for-coding/k2p6 --dangerously-skip-permissions \
  --format json --dir /home/fall_out_bug/projects/sdp/portolan \
  "$(cat /tmp/portolan-opencode-ru-install-prompt.md)"
```

Session: `ses_194c3f714ffePF2hL5TipuGMAU`

Exported session copy:
`/tmp/portolan-opencode-ru-install-prompt-wodiud/session.json`

## Agent Behavior

OpenCode:

- read `docs/agent/INSTALL.ru.md`;
- read `scripts/bootstrap-portolan`;
- ran `./scripts/bootstrap-portolan`;
- ran `.portolan/bin/portolan --version`;
- ran `.portolan/bin/portolan --help`;
- ran `.portolan/bin/portolan context prepare --root /home/fall_out_bug/projects/sdp/portolan --out /tmp/portolan-opencode-ru-install-prompt-wodiud/context --profile cursor`;
- ran `.portolan/bin/portolan map --root /home/fall_out_bug/projects/sdp/portolan --out /tmp/portolan-opencode-ru-install-prompt-wodiud/map`;
- read bounded context and map artifacts before answering;
- listed output artifacts;
- answered in Russian with command statuses, artifact paths, visible scope,
  completeness limits, evidence-backed findings, explicit weak states, next
  actions, and unsupported claims avoided.

## Independent Artifact Verification

Verified after the agent run:

```bash
out=/tmp/portolan-opencode-ru-install-prompt-wodiud
for f in \
  context/agent-brief.md \
  context/answer-contract.md \
  context/evidence-index.jsonl \
  context/gaps.jsonl \
  context/oss-plan.json \
  context/query-plan.md \
  context/repos.json \
  context/tool-registry.json \
  map/coverage.json \
  map/findings.jsonl \
  map/graph-index.json \
  map/graph.json \
  map/map.md \
  map/run.json \
  map/summary.json
do
  test -s "$out/$f"
done
jq empty \
  "$out/context/repos.json" \
  "$out/context/tool-registry.json" \
  "$out/context/oss-plan.json" \
  "$out/map/coverage.json" \
  "$out/map/graph-index.json" \
  "$out/map/graph.json" \
  "$out/map/run.json" \
  "$out/map/summary.json"
```

Observed:

- context files: 8;
- map files: 7;
- required JSON artifacts parsed successfully;
- `map/map.md` preserved `unknown`, `not_assessed`, `source-visible`, and
  `metadata-visible` states;
- no `cannot_verify` state appeared for this self-target run, which is an
  artifact result rather than a lane failure.

## Scoring

| Criterion | Result | Evidence |
| --- | --- | --- |
| Russian prompt followed without hidden target scaffolding | `verified` | Prompt was generated from `docs/agent/INSTALL-PROMPT.ru.md` with only path substitution. |
| Portolan installed from source checkout | `verified` | OpenCode ran `./scripts/bootstrap-portolan`; output wrote `.portolan/bin/portolan`. |
| Version checked | `verified` | OpenCode ran `.portolan/bin/portolan --version`; output `portolan dev`. |
| Context produced | `verified` | `/tmp/portolan-opencode-ru-install-prompt-wodiud/context` contains 8 non-empty files. |
| Map produced | `verified` | `/tmp/portolan-opencode-ru-install-prompt-wodiud/map` contains 7 non-empty files. |
| Bounded artifacts read before answer | `verified` | OpenCode read `agent-brief.md`, `answer-contract.md`, `summary.json`, `graph-index.json`, `findings.jsonl`, and `map.md`. |
| Artifact paths cited | `verified` | Final answer cited context and map artifact paths. |
| Weak states preserved | `verified` | Final answer preserved `unknown`, `not_assessed`, and explicit absence of `cannot_verify`; artifact verification found weak states in `map/map.md`. |
| Unsupported broad claims avoided | `verified` | Final answer avoided complete ecosystem coverage, runtime topology, service relationships beyond local evidence, OSS scanner value, ownership, lifecycle, production behavior, near-clone duplication, and semantic config correctness. |

## Boundaries

- This verifies OpenCode + `kimi-for-coding/k2p6` on the Portolan self-target
  using the Russian install prompt.
- It does not verify Cursor UI, Cursor Agent, Codex, external customer
  repositories, public remote clone, or OpenCode default permission behavior.
- It does not prove complete estate coverage, runtime topology, OSS scanner
  value, Graphify/SCIP/Serena broad behavior, or package-manager installation.
