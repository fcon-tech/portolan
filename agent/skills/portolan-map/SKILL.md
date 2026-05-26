---
name: portolan-map
description: Use Portolan to prepare agent context and map a local target repository or directory before making architecture, dependency, relationship, duplication, configuration, or technical-debt claims.
---

# Portolan Context And Map Skill

Use this skill when the user asks you to map, audit, inspect, understand, or
explain a local repository or directory with Portolan.

The canonical root-discoverable entrypoint is `agent/START_HERE.md`. This skill
mirrors that contract for harnesses that support reusable instructions. Cursor
rules are only a wrapper over this portable workflow.

## Inputs

Require:

- a Portolan checkout or installed `portolan` binary;
- a local target root;
- an explicit context output directory.

If the user did not choose a context directory, use
`<target-root>/.portolan/context`
only when writing inside the target is acceptable. Otherwise use a temporary
local output path and report it.

## Primary Command

Prefer an installed binary:

```bash
portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

If only a source checkout is available, first build the repo-local binary from
the Portolan checkout:

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

Use `go run` only as a fallback when the bootstrap script cannot be used:

```bash
go run ./cmd/portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

Use `--force` only when the selected output directory already exists and the
user accepts replacing that Portolan context output.

## Context Artifact Contract

Read all of these before reporting broad claims:

- `agent-brief.md`
- `answer-contract.md`
- `query-plan.md`
- `evidence-index.jsonl`
- `repos.json`
- `tool-registry.json`
- `oss-plan.json`
- `gaps.jsonl`

Use `answer-contract.md` as the required answer shape for CTO-level questions.
Treat `evidence-index.jsonl` and `tool-registry.json` summaries as local
evidence candidates, not final architecture verdicts. jscpd, CycloneDX/Syft,
Backstage, OpenAPI, AsyncAPI, and Structurizr entries can guide the answer, but
missing OSS families in `gaps.jsonl` remain `not_assessed`.

When a needed OSS family is missing, inspect `oss-plan.json` for local producer
availability and safe output paths. Do not run producer commands without user
approval, and do not install or fetch tools unless explicitly approved.
Validate new OSS/tool-output adapter contracts with
`portolan adapter validate --in <adapter.json>` before adding them to the
workflow.

Suggest only Portolan commands that exist in the current guide or in
`oss-plan.json`. Do not invent generic manifest flags or commands such as
`portolan context --manifest`. If external ecosystem completeness is unknown,
ask for a local selection or corpus manifest; use `portolan selection validate
--selection <selection.json>` and `portolan map --selection <selection.json>
--out <run-dir>` only when that selection file exists.

If the command cannot run or required artifacts are absent, stop with a blocker.
Do not replace missing Portolan evidence with unmarked manual analysis.

## Optional Map Command

Run the map command after context preparation when the answer needs a Portolan
evidence graph or readable map bundle. Use the root form for normal blind or
first-run mapping:

```bash
portolan map --root <target-root> --out <run-dir>
```

`map --root` discovers the target root itself, direct child Git repositories,
and `repos/*` Git repositories. It does not prove external ecosystem
completeness; read `coverage.json` before making completeness claims.

Use exact duplicate source/config findings as local evidence only. Near-clone
or copy/paste similarity is assessed only when a jscpd-style local output is
present in `tool-registry.json`; otherwise preserve duplication gaps as
`not_assessed`.

Use configuration findings as local surface inventory only. Portolan records
env var names, ports, container/workflow/manifests, feature flags, and secret
references, but not secret values. Semantic IaC/config correctness requires
local OSS output such as Semgrep or remains `not_assessed`.

Use technical-debt findings as candidate follow-ups derived from local evidence.
Do not turn them into modernization, rewrite, release, or readiness verdicts.

Prefer an explicit curated selection only when one exists locally:

```bash
portolan map --selection <selection.json> --out <run-dir>
```

## Map Artifact Contract

Read all of these before reporting:

- `run.json`
- `coverage.json`
- `summary.json`
- `graph-index.json`
- `graph.json`
- `findings.jsonl`
- `map.md`

Read `summary.json` and `graph-index.json` before loading full `graph.json`.
`summary.json` gives counts; `graph-index.json` gives bounded graph entrypoints
for large map runs.

Use `portolan graph slice --bundle <run-dir> --repo <id> --out <slice.json>`
for the next bounded drill-down. Use the `--edge-kind` and `--finding-kind`
variants when the graph index points at an edge or finding family.

## Boundaries

- No network unless explicitly approved.
- No target mutation except the selected Portolan output directory.
- No credential collection.
- No daemon or background service.
- No implicit source-repository cloning.

Build, packaging, configuration, release, smoke-test, and integration
repositories are valid targets. Treat observed local files as the evidence
boundary. If referenced component source repositories are not present locally,
mark them as `unknown`, `cannot_verify`, or `not_assessed`.

## Report Shape

Cover:

1. Context status and blockers
2. Local repository scope
3. OSS/tool-output candidates
4. Relationships
5. Duplication
6. Configuration surfaces
7. Technical debt
8. Unknown and `cannot_verify`
9. Gap ledger
10. Not assessed

Preserve evidence states:

- `source-visible`: observed in local source files.
- `metadata-visible`: observed in local metadata files.
- `runtime-visible`: observed in local runtime exports.
- `claim-only`: asserted by a local claim input without stronger evidence.
- `unknown`: evidence may exist, but Portolan does not have it locally.
- `cannot_verify`: Portolan has a claim or reference but cannot verify it from
  local evidence.

Use `not_assessed` for surfaces not checked or detector coverage Portolan has
not implemented.

Every finding should cite a generated artifact, local file, command output, or
explicit missing capability. Do not present the context pack as a CTO report;
use it as a query plan and evidence boundary for the agent's answer.
