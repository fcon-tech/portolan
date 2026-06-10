# Portolan

[Русская версия](docs/ru/README.md)

Portolan is a local, read-only codebase navigation kit for AI agents and
engineering leaders.

It runs on your machine, reads local files, and writes bounded evidence
artifacts before an agent answers questions: what repositories were visible,
what relationships and duplicate/configuration surfaces were found, what looks
like technical debt, and what is still unknown.

Portolan is an agent harness for landscape navigation: it gives the agent a
bounded route through local evidence, explicit gaps, and imported OSS outputs.
It is not a coding harness, readiness gate, service catalog, observability
platform, modernization engine, or replacement for Cursor, Claude, Sourcegraph,
Backstage, or enterprise code-intelligence tools.

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

## Harness-First Quick Start (recommended)

Portolan is primarily a **harness supplement**: portable skill, OSS recipes,
guardrails, and a local hotspot viewer — not a Go module you must install first.

**One command** (tool check → recipes → bundle → viewer):

```bash
scripts/portolan-scan.sh <target-root> <bundle-dir> --yes
```

Add `--no-viewer` to build only. See `scripts/portolan-scan.sh --help`. Legacy `orient-wizard.sh` remains as a deprecation wrapper.

The viewer shows a ranked hotspot list, folder tree, search, filters (including
`config` and `debt-candidate` kinds), and click-to-source preview (local files only).
See [`docs/demo-runbook.md`](docs/demo-runbook.md).

Manual fallback: read [`harness/SKILL.md`](harness/SKILL.md), run recipes from
[`harness/recipes/`](harness/recipes/), then `scripts/build-portolan-bundle.sh`.

See [`docs/harness/GO-FREEZE-POLICY.md`](docs/harness/GO-FREEZE-POLICY.md) for
legacy Go CLI status.

## What You Get (legacy Go path)

The Go CLI workflow creates a context pack for an agent:

```bash
portolan context prepare --root <target-root> --out <output-dir>/context --profile agent
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

After the `v0.1.0` tag is published, install the first public source-first
release with Go:

```bash
# Requires the published v0.1.0 tag. If this fails, use the source-checkout
# route below until the tag is available.
go install github.com/fcon-tech/portolan/cmd/portolan@v0.1.0
portolan --version
```

This command fetches the public module source and builds the CLI locally. It
does not install a prebuilt Portolan binary.

Until that tag exists, or if you cannot or should not fetch modules through
`go install`, clone the source checkout and build the repo-local binary:

```bash
git clone https://github.com/fcon-tech/portolan.git
cd portolan
scripts/bootstrap-portolan
.portolan/bin/portolan --version
.portolan/bin/portolan --help
.portolan/bin/portolan context prepare --root <target-root> --out <output-dir>/context --profile agent
.portolan/bin/portolan map --root <target-root> --out <output-dir>/map
```

Portolan does not publish downloadable prebuilt binaries yet. You need the Go
version declared in `go.mod` for the source bootstrap.
If bootstrap fails because Go or cached modules are missing, see
[Troubleshooting](docs/agent/TROUBLESHOOTING.md). Allow network dependency
download only when you mean to:

```bash
PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1 scripts/bootstrap-portolan
```

If you are developing Portolan itself, you can also use:

```bash
go run ./cmd/portolan context prepare --root <target-root> --out <output-dir>/context --profile agent
go run ./cmd/portolan map --root <target-root> --out <output-dir>/map
go run ./cmd/portolan query gaps --bundle <output-dir>/map --limit 20
```

Use `--force` only when you intentionally want to replace an existing Portolan
output directory.

## Documentation Route

If you are not sure which document to open first, start with the
[Documentation Onboarding](docs/onboarding.md) route. It points humans,
agents, Cursor operators, OpenCode operators, and release reviewers to the
maintained surface for each workflow.

For a larger named stress example, see
[Apache Bigtop Stress Example](docs/demo.md). It is evidence for one local
target shape, not the main product path.

## Public Routes

These routes are current and boundary-limited. Some public surfaces are initial
community infrastructure rather than proof of broad adoption or support.

- Install: use the [Quick Start](#quick-start) above.
- Demo: run the [Quick Start](#quick-start) against any local target you can
  inspect. For a larger named example, see
  [Apache Bigtop Stress Example](docs/demo.md).
- Product claims: read [Product Claims](docs/product-claims.md) before reusing
  public wording.
- Product quality: read
  [Product Quality Boundary](docs/product-quality-boundary.md) and
  [Product Maturity Matrix](docs/product-maturity.md) before treating a report
  or surface as product-ready.
- Contribute: read [Contributing](CONTRIBUTING.md) before opening issues or
  pull requests.
- Security: report sensitive vulnerabilities through [Security](SECURITY.md),
  not public issues.
- Support: see [Support](SUPPORT.md) for public support boundaries.

## For Agents

If you are asking an AI agent to use Portolan, point it at the user-agent docs:

- [Documentation Onboarding](docs/onboarding.md)
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
The `v0.1.0` release surface is ready for public testing when local checks pass;
it does not imply GitHub popularity, external adoption, merge approval, or broad
ecosystem validation.

Important limits:

- Named acceptance examples are target-specific evidence, not the main product
  story. The validated Cursor comparison is headless Cursor on one fixed local
  target, not UI Cursor/Composer generally.
- Local repository count does not prove complete inherited-estate coverage.
- Runtime service topology is not assessed unless supported local runtime
  observations are supplied, and partial observations do not prove complete
  topology.
- Portolan has a documented untrusted-artifact boundary and focused tests for
  selected local CLI risks; this is not a broad security certification.
- Duplication findings require selected local tool output, such as
  jscpd/CPD-style JSON. Without that output, duplication remains
  `not_assessed`.
- OSS validation is evidence-specific. Syft/CycloneDX, Semgrep, Repomix,
  Graphify, jscpd-style JSON, and symbol-index JSON surfaces are bounded local
  inputs produced through their native CLI, skill, or MCP surfaces when
  installed and requested; Portolan imports and normalizes the outputs instead
  of wrapping or replacing the scanners.

## More Documentation

English:

- [Documentation Onboarding](docs/onboarding.md)
- [Product Claims](docs/product-claims.md)
- [Release Guide](docs/release.md)
- [Product Boundary](docs/product-boundary.md)
- [Evidence Model](docs/evidence-model.md)
- [Relationship Detection](docs/relationship-detection.md)
- [Runtime Observations](docs/runtime-observations.md)
- [Security Threat Model](docs/security-threat-model.md)
- [OSS Composition](docs/oss-composition.md)
- [Apache Bigtop Stress Example](docs/demo.md)
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Support](SUPPORT.md)
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
jq empty harness/contracts/orient-bundle.schema.json
scripts/harness-portolan-smoke.sh
git diff --check
```
