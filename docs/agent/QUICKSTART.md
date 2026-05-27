# Agent Quickstart

Use this when a user asks you to map, inspect, audit, or explain a local target
with Portolan.

## Inputs You Need

- Portolan checkout or installed `portolan` binary.
- Local target root to inspect.
- Output directory for Portolan artifacts.

Do not use network, credentials, cloning, or target mutation unless the user
explicitly approves it.

## 1. Resolve The Portolan Command

Prefer an installed binary:

```bash
portolan --version
```

From a Portolan source checkout, build the repo-local binary:

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

Use `go run` only as a fallback from the Portolan checkout:

```bash
go run ./cmd/portolan --version
```

## 2. Prepare Agent Context

```bash
portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

If using the repo-local binary:

```bash
.portolan/bin/portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

Read these files before answering broad questions:

- `agent-brief.md`
- `answer-contract.md`
- `query-plan.md`
- `evidence-index.jsonl`
- `repos.json`
- `tool-registry.json`
- `oss-plan.json`
- `gaps.jsonl`

## 3. Create A Map When Needed

```bash
portolan map --root <target-root> --out <run-dir>
```

Read these files before reporting map-backed claims:

- `run.json`
- `coverage.json`
- `summary.json`
- `graph-index.json`
- `findings.jsonl`
- `map.md`

Before opening `graph.json`, ask bounded read-only questions against the map
bundle:

```bash
portolan query findings --bundle <run-dir> --kind relationships --limit 20
portolan query gaps --bundle <run-dir> --limit 20
```

Use `query findings` when you need matching records by kind, for example
`relationships`, `duplication`, `configuration`, or `technical-debt`. Use
`query gaps` when you need to explain `unknown`, `cannot_verify`, or
`not_assessed` evidence before answering. `claim-only` records remain available
through `query findings` by kind. Query output includes stable `portolan://`
references for citation.

Open `graph.json` only when the bounded files, query output, and graph slices
are insufficient.

## 4. Answer From Evidence

Your report should include:

1. Run status and blockers
2. Visible repositories or scope
3. Relationships
4. Duplication
5. Configuration surfaces
6. Technical-debt candidates
7. Unknown and `cannot_verify`
8. Not assessed

Do not invent facts that are not in the Portolan artifacts.

## 5. Preserve Boundaries

- Source/config duplicate clusters are evidence, not a refactoring order.
- Local visible scope is not complete estate coverage.
- Runtime topology needs runtime observations.
- OSS producer plans are not evidence until outputs exist.
- `not_assessed` is a valid result.
