# Agent Quickstart

Use this when a user asks you to map, inspect, audit, or explain a local target
with Portolan.

If the user asks another agent to "install Portolan", use the copyable prompt
in `docs/agent/INSTALL-PROMPT.md` or `docs/agent/INSTALL-PROMPT.ru.md`.

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
cd <portolan-checkout>
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

Use `go run` only as a fallback from the Portolan checkout:

```bash
go run ./cmd/portolan --version
```

## 2. Prepare Agent Context

```bash
portolan context prepare --root <target-root> --out <output-dir>/context --profile cursor
```

If using the repo-local binary:

```bash
.portolan/bin/portolan context prepare --root <target-root> --out <output-dir>/context --profile cursor
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
portolan map --root <target-root> --out <output-dir>/map
```

If the target provides a local `selection.json`, validate it and use it for the
map instead of inventing a new selection:

```bash
portolan selection validate --selection <target-root>/selection.json
portolan map --selection <target-root>/selection.json --out <output-dir>/map
```

If selection validation fails, record the validation command as `failed`, then
fall back to `map --root <target-root>` unless the user asked you to stop on
invalid selections.

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
portolan query findings --bundle <output-dir>/map --kind relationships --limit 20
portolan query gaps --bundle <output-dir>/map --limit 20
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
- OSS producers are valid local dependencies when installed and explicitly
  requested, but producer plans are not evidence until outputs exist.
- `not_assessed` is a valid result.
