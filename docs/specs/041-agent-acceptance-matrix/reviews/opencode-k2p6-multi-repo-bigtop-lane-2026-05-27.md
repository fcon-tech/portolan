# Acceptance Lane Ledger: OpenCode K2P6 Multi Repo Bigtop

Date: 2026-05-27
Lane ID: `opencode-multi-repo`
Harness: OpenCode
Model: `kimi-for-coding/k2p6`
Target shape: multi-repo
State: `verified` with caveats

## Prompt Contract

Variables supplied:

```text
PORTOLAN_PATH=/home/fall_out_bug/projects/sdp/portolan
TARGET_PATH=/home/fall_out_bug/projects/bigtop-landscape
OUTPUT_PATH=/tmp/portolan-opencode-k2p6-bigtop-20260527224005/agent-output
```

Hidden scaffolding: none. The prompt required generic documented workflow,
read-only target handling, no network access, no Bigtop-specific handholding,
artifact citations, and explicit `unknown`, `cannot_verify`, and
`not_assessed` states.

Harness execution caveat: OpenCode was launched with
`--dangerously-skip-permissions`, matching the single-repo lane caveat.

## Commands

```bash
opencode run \
  --model kimi-for-coding/k2p6 \
  --dir /home/fall_out_bug/projects/sdp/portolan \
  --format json \
  --dangerously-skip-permissions \
  "$PROMPT"
```

The lane built the repo-local binary and ran:

```bash
/home/fall_out_bug/projects/sdp/portolan/.portolan/bin/portolan map --root /home/fall_out_bug/projects/bigtop-landscape --out /tmp/portolan-opencode-k2p6-bigtop-20260527224005/agent-output/map-run
/home/fall_out_bug/projects/sdp/portolan/.portolan/bin/portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /tmp/portolan-opencode-k2p6-bigtop-20260527224005/agent-output/context --profile cursor
```

Result: `verified`; both commands exited 0 and wrote artifacts.

## Artifact Checks

Artifacts created:

- `context/agent-brief.md`
- `context/answer-contract.md`
- `context/evidence-index.jsonl`
- `context/gaps.jsonl`
- `context/oss-plan.json`
- `context/query-plan.md`
- `context/repos.json`
- `context/tool-registry.json`
- `map-run/coverage.json`
- `map-run/findings.jsonl`
- `map-run/graph-index.json`
- `map-run/graph.json`
- `map-run/map.md`
- `map-run/run.json`
- `map-run/summary.json`

Map summary:

- repositories: 18 `source-visible`
- graph nodes: 172243
- graph edges: 148714
- findings: 555
- finding statuses: 430 `observed`, 118 `not_assessed`, 6 `cannot_verify`,
  1 `unknown`

## Agent Answer Assessment

The final answer cited the output bundle under:

- `/tmp/portolan-opencode-k2p6-bigtop-20260527224005/agent-output/context/`
- `/tmp/portolan-opencode-k2p6-bigtop-20260527224005/agent-output/map-run/`

Evidence-state preservation:

- `unknown`: present for external completeness and unresolved findings;
- `cannot_verify`: present for oversized or unparseable files;
- `not_assessed`: present for non-Go relationships, runtime inference,
  service topology, lifecycle modeling, near-clone duplication, semantic
  config analysis, and missing OSS tool outputs.

Useful next actions:

- query gaps before broad architecture claims;
- run local OSS producers and re-ingest;
- review configuration findings for operational-debt candidates.

Unsupported claim scoring:

- unsupported claims: 1 caveated wording.
- example: the answer stated "No manifest or curated inventory supplied" from
  the generic root map artifacts. That is true for the command run, but the
  agent had also read a local `selection.json`; therefore this supports only
  "generic root map completeness remains unknown", not "no inventory exists in
  the filesystem."

## Disposition

Claim impact: supports a narrow claim that OpenCode with `kimi-for-coding/k2p6`
can execute the blind multi-repo Bigtop protocol, produce Portolan context and
map artifacts through generic root discovery, cite those artifacts, and
preserve weak evidence states.

Not assessed:

- OpenCode multi-repo behavior without permission bypass;
- OpenCode use of curated `selection.json` as the target;
- complete external ecosystem coverage from generic root discovery;
- runtime/service topology;
- OSS producer effects after running Syft, jscpd, Semgrep, Graphify, SCIP,
  Serena, or Repomix.
