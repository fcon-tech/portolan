# Acceptance Lane Ledger: OpenCode K2P6 Black Box

Date: 2026-05-27
Lane ID: `opencode-black-box`
Harness: OpenCode
Model: `kimi-for-coding/k2p6`
Target shape: black-box/metadata-heavy
State: `verified` with caveats

## Prompt Contract

Variables supplied for the valid run:

```text
PORTOLAN_PATH=/home/fall_out_bug/projects/sdp/portolan
TARGET_PATH=/home/fall_out_bug/projects/sdp/portolan/internal/app/testdata/black-box-profile/selection.json
OUTPUT_PATH=/tmp/portolan-opencode-k2p6-blackbox-valid-20260527225010/agent-output
```

Hidden scaffolding: none. The prompt stated that `TARGET_PATH` could be a
selection file and required the documented selection workflow.

Harness execution caveat: OpenCode was launched with
`--dangerously-skip-permissions`, matching the other OpenCode lanes.

## Commands

```bash
opencode run \
  --model kimi-for-coding/k2p6 \
  --dir /home/fall_out_bug/projects/sdp/portolan \
  --format json \
  --dangerously-skip-permissions \
  "$PROMPT"
```

The lane inspected the selection and evidence files, built Portolan, and ran:

```bash
cd /home/fall_out_bug/projects/sdp/portolan/internal/app/testdata/black-box-profile
/tmp/portolan map --selection selection.json --out /tmp/portolan-opencode-k2p6-blackbox-valid-20260527225010/agent-output/run
```

Result: `verified`; the command exited 0 and wrote a map bundle.

## Artifact Checks

Artifacts created:

- `run/coverage.json`
- `run/findings.jsonl`
- `run/graph-index.json`
- `run/graph.json`
- `run/map.md`
- `run/run.json`
- `run/summary.json`
- query outputs saved by the lane:
  - `findings-relationships.json`
  - `gaps.json`

Map summary:

- graph nodes: 7
- graph edges: 4
- evidence states: 6 `metadata-visible`, 3 `runtime-visible`, 2 `claim-only`
- findings: 10
- finding statuses: 7 `not_assessed`, 3 `unknown`
- coverage: one `black-box-service` record, `unknown` because direct source is
  absent

Visible evidence:

- `metadata-visible`: `payments-api`, `ledger-api`, `payments-team`, an
  `owns` edge, a catalog-backed `depends-on` edge, and the catalog artifact.
- `runtime-visible`: `payments-runtime`, a health endpoint node, and an
  `observes` edge.
- `claim-only`: `payments-claims` and an interview-backed `depends-on` edge.

## Agent Answer Assessment

The final answer cited:

- `/tmp/portolan-opencode-k2p6-blackbox-valid-20260527225010/agent-output/run/`
- `graph.json`
- `coverage.json`
- `findings.jsonl`
- `summary.json`
- `map.md`

Evidence-state preservation:

- `unknown`: present for black-box coverage without direct source access;
- `cannot_verify`: no valid-run `cannot_verify` records were produced;
- `not_assessed`: present for configuration, duplication, lifecycle modeling,
  non-Go source relationships, runtime inference, service-topology inference,
  and unsupported-language relationship detectors.

Runtime topology answer:

- The agent correctly refused to claim runtime topology. It cited only a
  single `runtime-visible` endpoint observation and kept service-topology and
  runtime inference as `not_assessed`.

Unsupported claim scoring:

- unsupported claims: 0 material product claims found in the final answer.

## Invalid Fixture Attempt

A prior attempt used:

```text
TARGET_PATH=/home/fall_out_bug/projects/sdp/portolan/testdata/black-box-profile/selection.json
OUTPUT_PATH=/tmp/portolan-opencode-k2p6-blackbox-20260527224442/agent-output
```

That fixture contains path values rooted as `testdata/black-box-profile/...`.
With selection-relative resolution, Portolan reported metadata, runtime, and
claims paths as `cannot_verify`. The agent correctly identified the path
resolution mismatch and refused runtime-topology claims. That run is retained
as degraded diagnostic evidence, not as the verified black-box acceptance lane.

## Disposition

Claim impact: supports a narrow claim that OpenCode with `kimi-for-coding/k2p6`
can run Portolan against a local black-box/metadata-heavy selection, cite
metadata/runtime/claim artifacts, and preserve the distinction between
`metadata-visible`, `runtime-visible`, `claim-only`, `unknown`, and
`not_assessed`.

Not assessed:

- OpenCode black-box behavior without permission bypass;
- arbitrary customer metadata/runtime formats;
- complete runtime service topology;
- semantic interpretation of configuration or lifecycle beyond selected local
  evidence.
