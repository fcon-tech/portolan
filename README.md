# Portolan

[Русская версия](docs/ru/README.md)

Portolan is a local, read-only codebase navigation kit for AI agents and
engineering leaders.

It runs on your machine, reads local files, and writes bounded evidence
artifacts before an agent answers questions: what repositories were visible,
what relationships and duplicate/configuration surfaces were found, what looks
like technical debt, and what is still unknown.

Portolan is not a coding harness, readiness gate, service catalog,
observability platform, modernization engine, or replacement for Cursor,
Claude, Sourcegraph, Backstage, or enterprise code-intelligence tools. It is a
local evidence layer an agent can use before making claims.

## When To Use It

Use Portolan when you want an agent to answer questions like:

- What is in this repo or local software landscape?
- What dependencies and relationships are visible from local evidence?
- Where are duplicate source/config files?
- What env vars, ports, manifests, workflows, feature flags, or secret
  references are visible?
- What technical-debt candidates can be backed by local evidence?
- What is unknown, missing, or not assessed?

Portolan is especially useful when the target is messy, multi-repo, legacy, or
partly black-box.

## What You Get

The main workflow creates a context pack for an agent:

```bash
portolan context prepare --root <target-root> --out <output-dir>/context --profile cursor
```

Typical output:

```text
<output-dir>/context/
  agent-brief.md
  answer-contract.md
  query-plan.md
  evidence-index.jsonl
  repos.json
  tool-registry.json
  oss-plan.json
  gaps.jsonl
```

When you need a fuller map, run:

```bash
portolan map --root <target-root> --out <output-dir>/map
```

Typical output:

```text
<output-dir>/map/
  run.json
  coverage.json
  summary.json
  graph-index.json
  graph.json
  findings.jsonl
  map.md
```

Start with `summary.json`, `graph-index.json`, `findings.jsonl`, and `map.md`.
Open the full `graph.json` only when you need detail.

For bounded agent questions against an existing map bundle, use:

```bash
portolan query findings --bundle <output-dir>/map --kind relationships --limit 20
portolan query gaps --bundle <output-dir>/map --limit 20
```

Use these query commands before loading `graph.json` when you need finding
records, weak evidence states, or stable `portolan://` references.

## Quick Start

Portolan does not publish prebuilt binaries yet. Clone the source checkout and
build the repo-local binary:

```bash
git clone https://github.com/fall-out-bug/portolan.git
cd portolan
scripts/bootstrap-portolan
.portolan/bin/portolan --version
.portolan/bin/portolan --help
.portolan/bin/portolan context prepare --root <target-root> --out <output-dir>/context --profile cursor
.portolan/bin/portolan map --root <target-root> --out <output-dir>/map
```

You need the Go version declared in `go.mod` for the source bootstrap.
If bootstrap fails because Go or cached modules are missing, see
[Troubleshooting](docs/agent/TROUBLESHOOTING.md). Allow network dependency
download only when you mean to:

```bash
PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1 scripts/bootstrap-portolan
```

If you are developing Portolan itself, you can also use:

```bash
go run ./cmd/portolan context prepare --root <target-root> --out <output-dir>/context --profile cursor
go run ./cmd/portolan map --root <target-root> --out <output-dir>/map
go run ./cmd/portolan query gaps --bundle <output-dir>/map --limit 20
```

Use `--force` only when you intentionally want to replace an existing Portolan
output directory.

## For Agents

If you are asking an AI agent to use Portolan, point it at the user-agent docs:

- [Agent Quickstart](docs/agent/QUICKSTART.md)
- [Agent Quickstart, Russian](docs/agent/QUICKSTART.ru.md)
- [Install](docs/agent/INSTALL.md)
- [Install, Russian](docs/agent/INSTALL.ru.md)
- [Install Prompt](docs/agent/INSTALL-PROMPT.md)
- [Install Prompt, Russian](docs/agent/INSTALL-PROMPT.ru.md)
- [Config](docs/agent/CONFIG.md)
- [Examples](docs/agent/EXAMPLES.md)
- [Troubleshooting](docs/agent/TROUBLESHOOTING.md)

Developer agents working on this repository should follow [AGENTS.md](AGENTS.md).

The safest reusable instruction is the copyable prompt block in
[docs/agent/INSTALL-PROMPT.md](docs/agent/INSTALL-PROMPT.md). Fill in the three
absolute paths and send that block to the agent.

For a shorter run, send this to the agent:

```text
Install and use Portolan from PORTOLAN_PATH on TARGET_PATH. Write artifacts to
OUTPUT_PATH. Follow docs/agent/INSTALL-PROMPT.md, preserve unknown /
cannot_verify / not_assessed, and cite local artifact paths for every material
claim.
```

For a Russian-language agent run, use
[docs/agent/INSTALL-PROMPT.ru.md](docs/agent/INSTALL-PROMPT.ru.md).

Give the agent absolute local paths for `PORTOLAN_PATH`, `TARGET_PATH`, and
`OUTPUT_PATH`. Do not add target-specific expected findings to the prompt.

## Evidence Rules

Portolan does not turn missing evidence into confidence. Results preserve
evidence states:

- `source-visible`: visible in source files.
- `metadata-visible`: visible in local metadata, manifests, or exported tool
  output.
- `runtime-visible`: visible in supplied local runtime observations.
- `claim-only`: stated by a human or tool, but not verified locally.
- `unknown`: no usable evidence was available.
- `cannot_verify`: evidence was present, but Portolan could not validate it.

Reports may also use `not_assessed` when a surface was not checked or the
detector is not implemented.

## Current Boundaries

Current safe product wording lives in [Product Claims](docs/product-claims.md).

Important limits:

- The validated Cursor comparison is headless Cursor on one fixed local Bigtop
  target, not UI Cursor/Composer generally.
- Local repository count does not prove complete inherited-estate coverage.
- Runtime service topology is not assessed unless supported local runtime
  observations are supplied, and partial observations do not prove complete
  topology.
- Portolan has a documented untrusted-artifact boundary and focused tests for
  selected local CLI risks; this is not a broad security certification.
- Exact duplicate source/config clusters are supported; near-clone detection
  needs local jscpd-style evidence.
- Syft/CycloneDX component identity evidence has been validated for the fixed
  Bigtop target; Semgrep is a first-class local producer path with a local
  config and explicit output; Repomix is a first-class local producer path;
  Graphify is a first-class local producer path through a read-only staging
  copy; Graphify node-link import with source-backed `EXTRACTED` verification,
  SCIP/Serena-style JSON symbol-index import, and Repomix file-inventory import
  are validated. These OSS tools are accepted local dependencies in the
  workflow when installed and explicitly requested; broad OSS producer value
  remains evidence-specific.

## More Documentation

English:

- [Product Claims](docs/product-claims.md)
- [Release Guide](docs/release.md)
- [Product Boundary](docs/product-boundary.md)
- [Evidence Model](docs/evidence-model.md)
- [Relationship Detection](docs/relationship-detection.md)
- [Runtime Observations](docs/runtime-observations.md)
- [Security Threat Model](docs/security-threat-model.md)
- [OSS Composition](docs/oss-composition.md)
- [Product Backlog](docs/product-backlog.md)
- [SpecKit Workflow](docs/speckit-workflow.md)

Russian:

- [Russian Overview](docs/ru/README.md)
- [Russian Product Boundary](docs/ru/product-boundary.md)

## Developer Checks

For repository development:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
```
