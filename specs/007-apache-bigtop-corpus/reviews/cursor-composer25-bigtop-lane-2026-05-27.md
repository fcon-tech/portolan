# Cursor Composer 2.5 Bigtop Operator Lane

Date: 2026-05-27
Spec: `specs/007-apache-bigtop-corpus/`
Lane: Cursor Agent CLI / Composer 2.5
Target: `/home/fall_out_bug/projects/bigtop-landscape`
Output: `/tmp/portolan-cursor-composer25-bigtop-20260527222530/agent-output`
State: `verified` with caveats

## Decision Gate

- Simpler/Faster: reuse the documented blind acceptance contract and generic
  `context prepare` plus `map` workflow rather than adding Bigtop-specific
  prompts or generated selection handoff.
- Blocking Edge Cases: the local Bigtop landscape is large, generic root
  discovery cannot prove complete external ecosystem coverage, and Cursor
  Agent CLI evidence is not the same as Cursor UI evidence.
- Existing Open Source: this lane does not add scanners. It verifies whether
  an existing agent harness can consume Portolan artifacts and preserve weak
  evidence states.

## Prompt Contract

Variables supplied:

```text
PORTOLAN_PATH=/home/fall_out_bug/projects/sdp/portolan
TARGET_PATH=/home/fall_out_bug/projects/bigtop-landscape
OUTPUT_PATH=/tmp/portolan-cursor-composer25-bigtop-20260527222530/agent-output
```

Hidden scaffolding: none. The prompt required read-only handling of
`TARGET_PATH`, no network access or prior repo-specific knowledge, generic
Portolan workflow, artifact citations, and explicit `unknown`,
`cannot_verify`, and `not_assessed` states.

Harness command:

```bash
cursor-agent --print --trust --force --model composer-2.5 --output-format text --workspace /home/fall_out_bug/projects/sdp/portolan "$PROMPT"
```

Pre-flight auth probe:

```bash
cursor-agent about
cursor-agent --print --trust --mode ask --model composer-2.5 --output-format text "Reply with exactly: cursor-agent-probe-ok"
```

Probe result: `verified`; Cursor CLI reported Composer 2.5 and returned the
expected probe text.

## Artifact Checks

The lane built Portolan from `PORTOLAN_PATH` and ran:

```bash
portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /tmp/portolan-cursor-composer25-bigtop-20260527222530/agent-output/context --profile cursor
portolan map --root /home/fall_out_bug/projects/bigtop-landscape --out /tmp/portolan-cursor-composer25-bigtop-20260527222530/agent-output/map
```

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

Map summary:

- repositories: 18 `source-visible`
- graph nodes: 172243
- graph edges: 148714
- findings: 555
- coverage records: 21
- finding statuses: 430 `observed`, 118 `not_assessed`, 6 `cannot_verify`,
  1 `unknown`

## Agent Answer Assessment

The Cursor answer cited local artifact paths under:

- `/tmp/portolan-cursor-composer25-bigtop-20260527222530/agent-output/context/`
- `/tmp/portolan-cursor-composer25-bigtop-20260527222530/agent-output/map/`

Evidence-state preservation:

- `unknown`: preserved for ecosystem completeness, non-git landscape-like
  child directories, and graph interpretability limits.
- `not_assessed`: preserved for OSS/tool outputs, non-Go relationships,
  runtime inference, service topology, lifecycle modeling, near-clone
  duplication, semantic config analysis, and direct root-file assessment.
- `cannot_verify`: preserved for oversized/unparseable files and product or
  service semantics not supported by local artifacts.

Useful next actions:

- rerun with an authoritative local selection if `selection.json` is intended
  as the bounded inventory;
- use `portolan query findings` and `portolan query gaps` rather than loading
  the full graph first;
- run approved local OSS producers from `oss-plan.json`, especially jscpd and
  Syft, then refresh the context pack.

Unsupported claim scoring:

- unsupported claims: 0 material product claims found in the final answer.
- caveat: the answer inferred that the root `selection.json` was "ignored" by
  generic `--root`; this is consistent with the generic command used, but it is
  not evidence that the selection file is authoritative.

## Disposition

Claim impact: supports a narrow claim that Cursor Agent CLI with Composer 2.5
can run the blind Bigtop operator protocol, produce Portolan context and map
artifacts through the generic workflow, cite those artifacts, and preserve weak
evidence states.

Not assessed:

- Cursor UI behavior;
- whether Cursor can run the same lane without `--force`;
- whether the generated `selection.json` is the authoritative Bigtop boundary;
- complete external ecosystem coverage;
- runtime/service topology;
- OSS producer effects after running Syft, jscpd, Semgrep, or other tools.
