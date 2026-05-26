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

If only a source checkout is available, run from the Portolan checkout:

```bash
go run ./cmd/portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

Use `--force` only when the selected output directory already exists and the
user accepts replacing that Portolan context output.

## Context Artifact Contract

Read all of these before reporting broad claims:

- `agent-brief.md`
- `query-plan.md`
- `repos.json`
- `tool-registry.json`
- `gaps.jsonl`

Treat `tool-registry.json` summaries and metrics as local evidence candidates,
not final architecture verdicts. Missing OSS families in `gaps.jsonl` remain
`not_assessed`.

If the command cannot run or required artifacts are absent, stop with a blocker.
Do not replace missing Portolan evidence with unmarked manual analysis.

## Optional Map Command

Run the map command after context preparation when the answer needs a Portolan
evidence graph or readable map bundle. Prefer an explicit curated selection
only when one exists locally:

```bash
portolan map --selection <selection.json> --out <run-dir>
```

Use the root map form when no curated selection exists:

```bash
portolan map --root <target-root> --out <run-dir>
```

## Map Artifact Contract

Read all of these before reporting:

- `run.json`
- `coverage.json`
- `graph.json`
- `findings.jsonl`
- `map.md`

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
