# Start Here: Map A Target With Portolan

Use this entrypoint when a user gives you a Portolan checkout or binary and a
separate local target repository or directory to map.

Portolan is a local-first, read-only mapping toolbox. It gives agents local
artifacts to inspect before making codebase, architecture, dependency, or
technical-debt claims.

## Minimum Inputs

- Portolan checkout or installed `portolan` binary.
- Target root: a local folder or repository to prepare for agent inspection.
- Run directory: an explicit output directory for generated artifacts.

If the user did not choose a run directory, use `<target-root>/.portolan/run`
only when writing inside the target is acceptable. Otherwise use a temporary
local output path and report it.

## Resolve The Command

Use the installed binary when available:

```bash
portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

If only a Portolan source checkout is available, first build the repo-local
binary from that checkout:

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

Use `go run` only as a fallback when the bootstrap script cannot be used:

```bash
go run ./cmd/portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

Use `map` after context preparation when you need the evidence graph and map
bundle:

```bash
portolan map --root <target-root> --out <run-dir>
```

Use `--force` only when the selected output directory already exists and the
user accepts replacing that Portolan run output.

`map` can surface exact duplicate source/config clusters. Treat them as local
evidence, not a refactoring order or full near-clone assessment. For richer
copy/paste similarity, use jscpd-style evidence from `tool-registry.json` when
present or preserve the gap as `not_assessed`.

`map` can also surface file-based configuration inventory: env var names,
ports, container/workflow/manifests, feature flags, and secret references.
Secret values are intentionally not recorded. Semantic IaC/config validation
requires local OSS evidence such as Semgrep output or remains `not_assessed`.

Technical-debt findings are candidate follow-ups derived from local evidence.
Do not present them as modernization, rewrite, release, or readiness verdicts.

## Required Artifacts

Read these context files before reporting broad claims:

- `agent-brief.md`
- `answer-contract.md`
- `query-plan.md`
- `repos.json`
- `tool-registry.json`
- `oss-plan.json`
- `gaps.jsonl`

Use `answer-contract.md` before broad CTO-level answers. If
`tool-registry.json` lacks the OSS evidence needed for the user's question,
inspect `oss-plan.json` before concluding the evidence is unavailable. Do not
run producer commands from the plan without approval.

When you also run `portolan map`, read these files before reporting:

- `run.json`
- `coverage.json`
- `summary.json`
- `graph.json`
- `findings.jsonl`
- `map.md`

Read `summary.json` before loading the full `graph.json`; on large landscapes
the graph can be too large for a prompt-sized first pass.

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
