# OpenCode K2P6 Install Prompt Lane

Date: 2026-05-27

Cell: `opencode-install-prompt-self`

Harness: OpenCode `1.15.10`

Model: `kimi-for-coding/k2p6`

State: `verified`

## Contract

The lane used the copyable prompt from `docs/agent/INSTALL-PROMPT.md` with only
the three path variables filled in:

```text
PORTOLAN_PATH=/home/fall_out_bug/projects/sdp/portolan
TARGET_PATH=/home/fall_out_bug/projects/sdp/portolan
OUTPUT_PATH=/tmp/portolan-opencode-install-prompt-Rqdw9g
```

No target-specific expected findings, file lists, or hidden Portolan commands
were added to the prompt. The OpenCode command used
`--dangerously-skip-permissions` because prior OpenCode runs require explicit
permission bypass for external `/tmp` output paths; this remains a harness
constraint, not a Portolan product dependency.

## Commands

Initial failed invocation:

```bash
opencode run --model kimi-for-coding/k2p6 --dangerously-skip-permissions \
  --format json --dir /home/fall_out_bug/projects/sdp/portolan \
  --file /tmp/portolan-opencode-install-prompt.md
```

Result: `failed`; OpenCode returned `You must provide a message or a command`.
This did not reach the model and is not counted as lane evidence.

Assessed invocation:

```bash
opencode run --model kimi-for-coding/k2p6 --dangerously-skip-permissions \
  --format json --dir /home/fall_out_bug/projects/sdp/portolan \
  "$(cat /tmp/portolan-opencode-install-prompt.md)"
```

Session: `ses_194c81541ffeXfKekbHp2FAAbg`

Exported session copy:
`/tmp/portolan-opencode-install-prompt-Rqdw9g/session.json`

## Agent Behavior

OpenCode:

- read `docs/agent/INSTALL.md`;
- read `scripts/bootstrap-portolan`;
- ran `./scripts/bootstrap-portolan`;
- ran `.portolan/bin/portolan --version`;
- ran `.portolan/bin/portolan --help`;
- ran `.portolan/bin/portolan scan --help`;
- ran `.portolan/bin/portolan context prepare --root /home/fall_out_bug/projects/sdp/portolan --out /tmp/portolan-opencode-install-prompt-Rqdw9g/context --profile cursor`;
- ran `.portolan/bin/portolan map --root /home/fall_out_bug/projects/sdp/portolan --out /tmp/portolan-opencode-install-prompt-Rqdw9g/map`;
- read bounded context and map artifacts before answering;
- listed output artifacts;
- answered with command statuses, artifact paths, visible scope, completeness
  limits, evidence-backed findings, explicit weak states, next actions, and
  unsupported claims avoided.

## Independent Artifact Verification

Verified after the agent run:

```bash
out=/tmp/portolan-opencode-install-prompt-Rqdw9g
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
| Prompt followed without hidden target scaffolding | `verified` | Prompt was generated from `docs/agent/INSTALL-PROMPT.md` with only path substitution. |
| Portolan installed from source checkout | `verified` | OpenCode ran `./scripts/bootstrap-portolan`; output wrote `.portolan/bin/portolan`. |
| Version checked | `verified` | OpenCode ran `.portolan/bin/portolan --version`; output `portolan dev`. |
| Context produced | `verified` | `/tmp/portolan-opencode-install-prompt-Rqdw9g/context` contains 8 non-empty files. |
| Map produced | `verified` | `/tmp/portolan-opencode-install-prompt-Rqdw9g/map` contains 7 non-empty files. |
| Bounded artifacts read before answer | `verified` | OpenCode read `agent-brief.md`, `answer-contract.md`, `evidence-index.jsonl`, `summary.json`, `graph-index.json`, `findings.jsonl`, and `map.md`. |
| Artifact paths cited | `verified` | Final answer cited context and map artifact paths. |
| Weak states preserved | `verified` | Final answer preserved `unknown` and `not_assessed`; artifact verification found those states in `map/map.md`. |
| Unsupported broad claims avoided | `verified` | Final answer explicitly avoided runtime behavior, complete estate coverage, OSS scanner value, semantic duplication, and unsupported architecture claims. |

## Boundaries

- This verifies OpenCode + `kimi-for-coding/k2p6` on the Portolan self-target
  using the English install prompt.
- It does not verify Cursor UI, Cursor Agent, Codex, Russian prompt execution,
  external customer repositories, public remote clone, or OpenCode default
  permission behavior.
- It does not prove complete estate coverage, runtime topology, OSS scanner
  value, Graphify/SCIP/Serena broad behavior, or package-manager installation.
