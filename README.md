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

Get Portolan as a source checkout, then install its Cursor/OpenCode
instructions into a target project:

```bash
git clone https://github.com/fcon-tech/portolan.git
cd portolan
scripts/portolan-install.sh <target-root> --harness all
```

This writes:

- `<target-root>/.cursor/rules/portolan-atlas.mdc` for Cursor Project Rules.
- a managed Portolan block in `<target-root>/AGENTS.md` for OpenCode.
- target-local command wrappers in `<target-root>/.portolan/bin/`.

The installed harness uses a fast first core scan (`config,ctags`, `--core-only`)
so Cursor/OpenCode get a queryable bundle before deeper producers run. Use
`--scan-profile full` when you explicitly want the installed first command to
run the full producer set.

Verify the installable Cursor/OpenCode pack on the current machine:

```bash
scripts/portolan-product-acceptance.sh --require-agent-runtime
```

The product acceptance command creates fresh isolated targets, installs the
Cursor rule, OpenCode `AGENTS.md` block, and `.portolan/bin` wrappers, runs the
real agent CLIs when available, checks the generated bundle through
`portolan-bundle-query`, and runs the local baseline checks. Without
`--require-agent-runtime`, unavailable agent CLIs are reported as
`not_assessed` instead of success.

**Agent command** (installed wrapper → bundle; open viewer separately):

```bash
scripts/portolan-install.sh <target-root> --harness all --bundle-dir <bundle-dir>
<target-root>/.portolan/bin/portolan-scan.sh <target-root> <bundle-dir> --yes --skip-install --no-viewer
```

Omit `--no-viewer` only for a human-run command where blocking in the viewer is
fine. Remove `--skip-install` only after explicit approval to install missing
local OSS tools. See `scripts/portolan-scan.sh --help`.

The viewer shows a ranked hotspot list, folder tree, search, filters (including
`config` and `debt-candidate` kinds), and click-to-source preview (local files only).
See [`docs/agent/QUICKSTART.md`](docs/agent/QUICKSTART.md).

Developer fallback for extending producers: use [`harness/SKILL.md`](harness/SKILL.md)
and [`harness/recipes/`](harness/recipes/) from a Portolan checkout.

Query the harness bundle at answer time (agent-first; no pre-built Q&A pack):

```bash
<target-root>/.portolan/bin/portolan-bundle-query.sh hotspots --bundle <bundle-dir> --kind duplication --limit 20
<target-root>/.portolan/bin/portolan-bundle-query.sh search --bundle <bundle-dir> --q "auth" --limit 30
```

The local viewer exposes the same contract at `/api/hotspots`, `/api/search`, etc.

**MCP (Cursor/Codex):** `PORTOLAN_BUNDLE_DIR=<bundle> scripts/portolan-bundle-query-mcp.sh` — see [`harness/recipes/bundle-query-mcp.md`](harness/recipes/bundle-query-mcp.md).

See [`docs/harness/GO-FREEZE-POLICY.md`](docs/harness/GO-FREEZE-POLICY.md) for
legacy Go CLI status.

## Legacy Go CLI Compatibility

The older Go CLI (`context prepare`, `map`, and `query`) remains available for
existing users and compatibility tests, but it is not the primary install or
agent route. Use it only when an operator explicitly asks for older map/context
artifacts. See [`docs/agent/INSTALL.md`](docs/agent/INSTALL.md) and
[`docs/harness/GO-FREEZE-POLICY.md`](docs/harness/GO-FREEZE-POLICY.md).

Canonical source identity for that compatibility route:

```bash
go install github.com/fcon-tech/portolan/cmd/portolan@v0.1.0
git clone https://github.com/fcon-tech/portolan.git
```

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

- Install: use the [Harness-First Quick Start](#harness-first-quick-start-recommended) above.
- Example run: run the [Harness-First Quick Start](#harness-first-quick-start-recommended) against any local target you can
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
Install Portolan from PORTOLAN_PATH into TARGET_ROOT, then use
TARGET_ROOT/.portolan/bin wrappers to write artifacts to BUNDLE_DIR. Follow
docs/agent/INSTALL-PROMPT.md, preserve unknown / cannot_verify / not_assessed,
and cite local artifact paths for every material claim.
```

For a Russian-language agent run, use
[docs/agent/INSTALL-PROMPT.ru.md](docs/agent/INSTALL-PROMPT.ru.md).

Give the agent absolute local paths for `PORTOLAN_PATH`, `TARGET_ROOT`, and
`BUNDLE_DIR`. Do not add target-specific expected findings to the prompt.

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

- Named acceptance runs are target-specific evidence, not proof for every
  estate shape. The validated Cursor path is headless Cursor Agent CLI on fresh
  local targets, not arbitrary Cursor UI behavior.
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
jq empty harness/contracts/portolan-bundle.schema.json
scripts/harness-portolan-smoke.sh
git diff --check
```
