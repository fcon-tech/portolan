---
name: portolan-map
description: Use Portolan to map a local target repository or directory before making architecture, dependency, relationship, duplication, configuration, or technical-debt claims.
---

# Portolan Map Skill

Use this skill when the user asks you to map, audit, inspect, understand, or
explain a local repository or directory with Portolan.

The canonical root-discoverable entrypoint is `agent/START_HERE.md`. This skill
mirrors that contract for harnesses that support reusable instructions.

## Inputs

Require:

- a Portolan checkout or installed `portolan` binary;
- a local target root;
- an explicit run directory.

If the user did not choose a run directory, use `<target-root>/.portolan/run`
only when writing inside the target is acceptable. Otherwise use a temporary
local output path and report it.

## Command

Prefer an installed binary:

```bash
portolan map --root <target-root> --out <run-dir>
```

If only a source checkout is available, run from the Portolan checkout:

```bash
go run ./cmd/portolan map --root <target-root> --out <run-dir>
```

Use `--force` only when the selected output directory already exists and the
user accepts replacing that Portolan run output.

## Artifact Contract

Read all of these before reporting:

- `run.json`
- `graph.json`
- `findings.jsonl`
- `map.md`

If the command cannot run or required artifacts are absent, stop with a blocker.
Do not replace missing Portolan evidence with unmarked manual analysis.

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

1. Run status and blockers
2. Relationships
3. Duplication
4. Configuration surfaces
5. Technical debt
6. Unknown and `cannot_verify`
7. Gap ledger
8. Not assessed

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
explicit missing capability.
