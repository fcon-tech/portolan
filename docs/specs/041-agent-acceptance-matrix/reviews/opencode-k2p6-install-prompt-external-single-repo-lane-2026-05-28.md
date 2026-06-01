# OpenCode K2P6 External Single-Repo Install Prompt Lane

Date: 2026-05-28

Status: verified after prompt-doc tightening

## Scope

- Harness: OpenCode `1.15.10`
- Model: `kimi-for-coding/k2p6`
- Portolan path: `/home/fall_out_bug/projects/sdp/portolan`
- Target path: `/home/fall_out_bug/projects/vibe_coding/spec-kit`
- Verified output path:
  `/tmp/portolan-opencode-install-singlerepo-rerun-8RI92u`
- Prompt source: copyable prompt block from `docs/agent/INSTALL-PROMPT.md`

This lane verifies an external single-repo target outside Portolan and Bigtop.
It does not verify Cursor UI, arbitrary external targets, or OpenCode behavior
without the explicit permission bypass used by this run.

## Failed First Attempt

An earlier attempt sent the whole prompt document instead of only the copyable
prompt block.

- Output path:
  `/tmp/portolan-opencode-install-singlerepo-7KXnCO`
- OpenCode session:
  `ses_194b41b79ffetsoqOJimaoAAtA`

Observed:

- OpenCode created context and map artifacts.
- OpenCode ended with an off-contract "what would you like me to do" response.

Assessment: `failed` for answer contract, not product evidence. After this
attempt, `docs/agent/INSTALL-PROMPT.md` and
`docs/agent/INSTALL-PROMPT.ru.md` were tightened so a receiving agent executes
the prompt block rather than asks whether to proceed.

## Verified Prompt Contract

The verified rerun used only the copyable prompt block with these variables:

```text
PORTOLAN_PATH=/home/fall_out_bug/projects/sdp/portolan
TARGET_PATH=/home/fall_out_bug/projects/vibe_coding/spec-kit
OUTPUT_PATH=/tmp/portolan-opencode-install-singlerepo-rerun-8RI92u
```

The prompt did not include target-specific expected findings or private
scaffolding.

## Commands

```bash
opencode run --model kimi-for-coding/k2p6 --dangerously-skip-permissions \
  --format json --dir /home/fall_out_bug/projects/sdp/portolan \
  "$(cat /tmp/portolan-opencode-install-singlerepo-rerun.md)"
```

OpenCode session:

```text
ses_194b2c3caffeBPOt1mlSSxfNDP
```

Session export:

```text
/tmp/portolan-opencode-install-singlerepo-rerun-8RI92u/session.json
```

## Observed Agent Behavior

- Checked `PORTOLAN_PATH` and `TARGET_PATH`.
- Read `docs/agent/INSTALL.md`.
- Verified the existing repo-local binary:

```bash
/home/fall_out_bug/projects/sdp/portolan/.portolan/bin/portolan --version
```

- Confirmed `TARGET_PATH/selection.json` was absent.
- Prepared context with:

```bash
/home/fall_out_bug/projects/sdp/portolan/.portolan/bin/portolan context prepare \
  --root /home/fall_out_bug/projects/vibe_coding/spec-kit \
  --out /tmp/portolan-opencode-install-singlerepo-rerun-8RI92u/context \
  --profile cursor
```

- Built the map with:

```bash
/home/fall_out_bug/projects/sdp/portolan/.portolan/bin/portolan map \
  --root /home/fall_out_bug/projects/vibe_coding/spec-kit \
  --out /tmp/portolan-opencode-install-singlerepo-rerun-8RI92u/map
```

- Read bounded artifacts before answering.
- Produced the required answer shape: commands, artifact paths, local scope,
  evidence-backed findings, explicit `unknown` / `not_assessed`, three next
  local actions, and unsupported claims avoided.

## Independent Verification

Artifact checks:

```bash
out=/tmp/portolan-opencode-install-singlerepo-rerun-8RI92u
test -s "$out/context/agent-brief.md"
test -s "$out/context/answer-contract.md"
test -s "$out/context/evidence-index.jsonl"
test -s "$out/context/gaps.jsonl"
test -s "$out/context/repos.json"
test -s "$out/context/tool-registry.json"
test -s "$out/context/oss-plan.json"
test -s "$out/map/summary.json"
test -s "$out/map/graph-index.json"
test -s "$out/map/findings.jsonl"
test -s "$out/map/map.md"
test -s "$out/session.json"
jq empty "$out/context/repos.json" "$out/context/tool-registry.json" \
  "$out/context/oss-plan.json" "$out/map/coverage.json" \
  "$out/map/graph-index.json" "$out/map/graph.json" \
  "$out/map/run.json" "$out/map/summary.json"
```

Observed graph index:

```text
nodes: 272
edges: 108
```

Findings by status:

```text
not_assessed: 7
observed: 8
unknown: 1
```

Findings by evidence state:

```text
metadata-visible: 1
not_assessed: 7
source-visible: 7
unknown: 1
```

## Assessment

- `verified`: OpenCode + `kimi-for-coding/k2p6` can follow the copyable English
  install prompt block against one external single-repo target, use Portolan
  locally, produce context and map artifacts, cite artifact paths, and preserve
  weak evidence states.
- `verified`: The lane kept external completeness `unknown`, duplication and
  unsupported relationship detection `not_assessed`, and avoided runtime
  topology and complete-estate claims.
- `failed`: The earlier whole-file prompt attempt produced artifacts but ended
  off-contract; it is recorded as a failed attempt and was not used as product
  evidence.
- `not_assessed`: Cursor UI execution from the install prompt.
- `not_assessed`: arbitrary external single-repo targets beyond this selected
  local `spec-kit` target.
- `not_assessed`: OpenCode default-permission behavior without
  `--dangerously-skip-permissions`.
