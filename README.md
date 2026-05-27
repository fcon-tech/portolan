# Portolan

Portolan helps AI agents inspect a local codebase before they answer questions
about it.

It runs on your machine, reads local files, and writes an evidence pack: what
repositories were visible, what relationships and duplicate/configuration
surfaces were found, what looks like technical debt, and what is still unknown.

Portolan is not a replacement for Cursor, Claude, Sourcegraph, Backstage,
observability, modernization, or service-catalog tools. It is a local evidence
layer an agent can use before making claims.

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
portolan context prepare --root <target-root> --out <context-dir> --profile cursor
```

Typical output:

```text
<context-dir>/
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
portolan map --root <target-root> --out <run-dir>
```

Typical output:

```text
<run-dir>/
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
portolan query findings --bundle <run-dir> --kind relationships --limit 20
portolan query gaps --bundle <run-dir> --limit 20
```

Use these query commands before loading `graph.json` when you need finding
records, weak evidence states, or stable `portolan://` references.

## Quick Start

From a Portolan source checkout:

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan --version
.portolan/bin/portolan context prepare --root <target-root> --out <context-dir> --profile cursor
.portolan/bin/portolan map --root <target-root> --out <run-dir>
```

If you are developing Portolan itself, you can also use:

```bash
go run ./cmd/portolan context prepare --root <target-root> --out <context-dir> --profile cursor
go run ./cmd/portolan map --root <target-root> --out <run-dir>
go run ./cmd/portolan query gaps --bundle <run-dir> --limit 20
```

Use `--force` only when you intentionally want to replace an existing Portolan
output directory.

## For Agents

If you are asking an AI agent to use Portolan, point it at the user-agent docs:

- [Agent Quickstart](docs/agent/QUICKSTART.md)
- [Install](docs/agent/INSTALL.md)
- [Config](docs/agent/CONFIG.md)
- [Examples](docs/agent/EXAMPLES.md)
- [Troubleshooting](docs/agent/TROUBLESHOOTING.md)

Developer agents working on this repository should follow [AGENTS.md](AGENTS.md).

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
  Bigtop target; Semgrep and broad OSS producer value remain unassessed.

## More Documentation

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

## Developer Checks

For repository development:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
```
