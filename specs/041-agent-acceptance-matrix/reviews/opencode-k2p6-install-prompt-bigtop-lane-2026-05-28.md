# OpenCode K2P6 Bigtop Install Prompt Lane

Date: 2026-05-28

Status: verified

## Scope

- Harness: OpenCode `1.15.10`
- Model: `kimi-for-coding/k2p6`
- Portolan path: `/home/fall_out_bug/projects/sdp/portolan`
- Target path: `/home/fall_out_bug/projects/bigtop-landscape`
- Output path: `/tmp/portolan-opencode-install-bigtop-r5W09x`
- Prompt source: `docs/agent/INSTALL-PROMPT.md`

This lane verifies the copyable English install prompt on a local multi-repo
Bigtop landscape. It does not verify Cursor UI, arbitrary customer targets, or
OpenCode behavior without the explicit permission bypass used by this run.

## Prompt Contract

The agent received only:

```text
PORTOLAN_PATH=/home/fall_out_bug/projects/sdp/portolan
TARGET_PATH=/home/fall_out_bug/projects/bigtop-landscape
OUTPUT_PATH=/tmp/portolan-opencode-install-bigtop-r5W09x
```

The prompt did not include target-specific repo lists, expected findings, or
private scaffolding.

## Commands

```bash
opencode run --model kimi-for-coding/k2p6 --dangerously-skip-permissions \
  --format json --dir /home/fall_out_bug/projects/sdp/portolan \
  "$(cat /tmp/portolan-opencode-install-bigtop.md)"
```

OpenCode session:

```text
ses_194bf28fbffeij6n37cX57k5VT
```

Session export:

```text
/tmp/portolan-opencode-install-bigtop-r5W09x/session.json
```

## Observed Agent Behavior

- Read `docs/agent/INSTALL.md` and `scripts/bootstrap-portolan`.
- Ran `scripts/bootstrap-portolan`.
- Verified `.portolan/bin/portolan --version`.
- Prepared context with:

```bash
/home/fall_out_bug/projects/sdp/portolan/.portolan/bin/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /tmp/portolan-opencode-install-bigtop-r5W09x/context \
  --profile cursor
```

- Discovered `/home/fall_out_bug/projects/bigtop-landscape/selection.json`.
- Built the map with:

```bash
/home/fall_out_bug/projects/sdp/portolan/.portolan/bin/portolan map \
  --selection /home/fall_out_bug/projects/bigtop-landscape/selection.json \
  --out /tmp/portolan-opencode-install-bigtop-r5W09x/map
```

- Read bounded artifacts before answering.
- Avoided broad completeness claims.
- Preserved `unknown`, `cannot_verify`, and `not_assessed` states.

The prompt version used for this run did not explicitly require using
target-local `selection.json`; the agent discovered it from the local target.
After this lane, the install prompt docs were tightened to make this behavior
explicit.

## Independent Verification

Artifact checks:

```bash
out=/tmp/portolan-opencode-install-bigtop-r5W09x
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
jq empty "$out/context/repos.json" "$out/context/tool-registry.json" \
  "$out/context/oss-plan.json" "$out/map/coverage.json" \
  "$out/map/graph-index.json" "$out/map/graph.json" \
  "$out/map/run.json" "$out/map/summary.json"
```

Observed:

- context files: 8
- map files: 7
- graph nodes: 168575
- graph edges: 145467

Findings by status:

```text
cannot_verify: 6
not_assessed: 103
observed: 406
unknown: 1
```

Findings by evidence state:

```text
cannot_verify: 6
metadata-visible: 6
not_assessed: 78
source-visible: 400
unknown: 26
```

## Assessment

- `verified`: OpenCode + `kimi-for-coding/k2p6` can follow the English
  install prompt against a local Bigtop multi-repo target, install Portolan from
  source, produce context and map artifacts, cite artifact paths, and preserve
  weak evidence states.
- `verified`: The map step used the target-local selection file, producing
  manifest/corpus coverage for the supplied Bigtop landscape selection.
- `not_assessed`: Cursor UI execution from the install prompt.
- `not_assessed`: arbitrary external customer targets.
- `not_assessed`: external single-repo install-prompt execution.
- `not_assessed`: OpenCode default-permission behavior without
  `--dangerously-skip-permissions`.

## Limits

The context bundle was produced from the target root, while the map bundle was
produced from the target-local selection. As a result, context gaps still keep
external completeness limits visible, while the map bundle represents the
supplied Bigtop manifest/selection scope. This is acceptable evidence
discipline and not a complete external ecosystem claim.
