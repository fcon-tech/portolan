# Start Here: Map A Target With Portolan

Use this entrypoint when a user gives you a Portolan checkout or binary and a
separate local target repository or directory to map.

Portolan is a local-first, read-only mapping toolbox. It gives agents local
artifacts to inspect before making codebase, architecture, dependency, or
technical-debt claims.

## Minimum Inputs

- Portolan checkout or installed `portolan` binary.
- Landscape selection: a local `selection.json` naming repositories, metadata,
  runtime exports, claims, black boxes, and tool outputs. If no selection exists,
  use a target root as a single-repository shortcut.
- Run directory: an explicit output directory for generated artifacts.

If the user did not choose a run directory, use `<target-root>/.portolan/run`
only when writing inside the target is acceptable. Otherwise use a temporary
local output path and report it.

## Resolve The Command

Use the installed binary when available:

```bash
portolan map --selection <selection.json> --out <run-dir>
```

If only a Portolan source checkout is available, run from that checkout:

```bash
go run ./cmd/portolan map --selection <selection.json> --out <run-dir>
```

Use `map --root` only as the single-repository shortcut when no landscape
selection is available:

```bash
portolan map --root <target-root> --out <run-dir>
```

Use `--force` only when the selected output directory already exists and the
user accepts replacing that Portolan run output.

## Required Artifacts

Read these files before reporting:

- `run.json`
- `coverage.json`
- `graph.json`
- `findings.jsonl`
- `map.md`

Do not replace missing Portolan evidence with unmarked manual analysis. If the
command cannot run or the artifacts are missing, stop and report the blocker.

## Boundaries

- No network access unless explicitly approved.
- No target repository mutation except writes to the selected run directory.
- No credentials collection.
- No daemon or background service.
- No implicit cloning or fetching of referenced source repositories.

Non-source targets are valid targets. Build, packaging, configuration, release,
smoke-test, and integration repositories are evidence surfaces in their own
right. If a component source repository is referenced but not present locally,
mark that source evidence as `unknown`, `cannot_verify`, or `not_assessed`
instead of fetching it or inventing source-backed facts.

## Report Contract

Report from generated artifacts and local evidence. Include:

1. Run status and blockers
2. Relationships
3. Duplication
4. Configuration surfaces
5. Technical debt
6. Unknown and `cannot_verify`
7. Gap ledger
8. Not assessed

Preserve evidence states:

- `source-visible`
- `metadata-visible`
- `runtime-visible`
- `claim-only`
- `unknown`
- `cannot_verify`

Use `not_assessed` for surfaces not checked or detectors that Portolan has not
implemented yet.

## Portable Guide And Skill

The detailed portable guide is [`AGENT_GUIDE.md`](AGENT_GUIDE.md). Harnesses
that support skill import can use
[`skills/portolan-map/SKILL.md`](skills/portolan-map/SKILL.md).
