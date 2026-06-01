# OpenCode K2P6 Default-Permission Internal Output Lane

Date: 2026-05-28

Status: verified

## Scope

- Harness: OpenCode `1.15.10`
- Model: `kimi-for-coding/k2p6`
- Portolan path: `/home/fall_out_bug/projects/sdp/portolan`
- Target path: `/home/fall_out_bug/projects/vibe_coding/spec-kit`
- Output path:
  `/home/fall_out_bug/projects/sdp/portolan/.portolan/acceptance/opencode-default-permission-internal-output-1779917367`
- Prompt source: copyable prompt block from `docs/agent/INSTALL-PROMPT.md`
- Permission mode: default OpenCode run, without
  `--dangerously-skip-permissions`

This lane assesses whether the documented install prompt works with OpenCode's
default permissions when the requested output directory stays inside the
Portolan checkout.

## Command

```bash
opencode run --model kimi-for-coding/k2p6 --format json \
  --dir /home/fall_out_bug/projects/sdp/portolan \
  "$(cat /tmp/portolan-opencode-default-permission-internal.md)" \
  > /home/fall_out_bug/projects/sdp/portolan/.portolan/acceptance/opencode-default-permission-internal-output-1779917367.session.json \
  2> /home/fall_out_bug/projects/sdp/portolan/.portolan/acceptance/opencode-default-permission-internal-output-1779917367.stderr.txt
```

OpenCode session:

```text
ses_194a852d0ffenrMcj0txAjVQP5
```

## Observed Behavior

- OpenCode read `docs/agent/INSTALL.md`.
- OpenCode confirmed no `selection.json` was present on the target.
- OpenCode ran:

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

- OpenCode ran context preparation and map generation with output under
  `.portolan/acceptance/...`.
- OpenCode read bounded artifacts and produced the required answer shape.
- No stderr output was produced.

## Independent Verification

Artifact checks:

```bash
base=/home/fall_out_bug/projects/sdp/portolan/.portolan/acceptance/opencode-default-permission-internal-output-1779917367
test -s "$base/context/agent-brief.md"
test -s "$base/context/answer-contract.md"
test -s "$base/context/evidence-index.jsonl"
test -s "$base/context/gaps.jsonl"
test -s "$base/context/repos.json"
test -s "$base/context/tool-registry.json"
test -s "$base/context/oss-plan.json"
test -s "$base/map/summary.json"
test -s "$base/map/graph-index.json"
test -s "$base/map/findings.jsonl"
test -s "$base/map/map.md"
jq empty "$base/context/repos.json" "$base/context/tool-registry.json" \
  "$base/context/oss-plan.json" "$base/map/coverage.json" \
  "$base/map/graph-index.json" "$base/map/graph.json" \
  "$base/map/run.json" "$base/map/summary.json"
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

- `verified`: OpenCode default-permission execution works for the install
  prompt when `OUTPUT_PATH` stays inside the Portolan checkout.
- `verified`: The lane produced context and map artifacts, cited artifact paths,
  preserved `unknown` and `not_assessed`, and avoided unsupported architecture
  claims.
- `failed`: External `/tmp` output remains failed without permission bypass, as
  recorded in
  `opencode-k2p6-default-permission-external-output-lane-2026-05-28.md`.
- Cursor UI behavior is outside the current required acceptance scope.

## Claim Impact

Agent install docs may recommend repo-local output paths such as
`.portolan/runs/<name>` for harnesses that restrict external writes. Product
claims must distinguish this from external output paths, which require explicit
permission bypass in the verified OpenCode lanes.
