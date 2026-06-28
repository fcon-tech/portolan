# Portolan

[Русская версия](docs/ru/README.md)

Portolan is a local-first atlas generator for AI agents and engineering
leaders responsible for large software estates.

The captain gives an agent a Portolan URL or local path plus a target
ecosystem. The agent resolves Portolan into a local runtime with explicit
approval for URL fetches, installs target-local wrappers, runs bounded local
discovery, opens a
generated atlas app, and uses the bundle to explain visible repositories,
components, relationships, risks, gaps, and drill-down routes.

Portolan is an agent harness for landscape navigation, not another coding
harness. It complements Cursor, OpenCode, Codex, Claude, Sourcegraph,
Backstage, Understand Anything, and enterprise code-intelligence tools by
wrapping local outputs into an atlas the agent and human can navigate.

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

## Architecture (engine + reading layer)

Portolan has two distinct layers, not two products:

- **Engine (producer): `internal/` (Go) + `scripts/*.sh` (bash).** The only thing
  that scans a target — runs ripgrep/ctags/jscpd/syft/semgrep, parses output,
  emits the evidence bundle (`*.jsonl`) + `system-map.json`. This is what the
  Harness-First Quick Start below drives.
- **Reading layer (consumer): `portolan-core/` (the charter-08 direction)
  renders the atlas from the engine's output. The single entry point is
  `/portolan:map` (`node portolan-core/scripts/portolan-map.mjs --target <root>`).
  The older `viewer/` app is the superseded 0.1.0 contract surface, removed by
  the 0.2.0 big-bang migration; see `AGENTS.md`.

## Harness-First Quick Start (recommended)

Portolan is primarily a **harness supplement**: portable skill, OSS recipes,
guardrails, queryable bundle, and local atlas viewer. It is not a Go module you
must install first.

Generate the prompt from the two inputs the captain actually knows. `PORTOLAN`
may be a local checkout path or a git URL; the receiving agent must ask before
fetching a URL and clone it into a local cache before running the installer.

```bash
scripts/portolan-captain-prompt.sh \
  --portolan <Portolan git URL or local checkout path> \
  --target-root <target-root>
```

This writes:

- `<target-root>/.cursor/rules/portolan-atlas.mdc` for Cursor Project Rules.
- a managed Portolan block in `<target-root>/AGENTS.md` for OpenCode and Codex.
- a managed Portolan block in `<target-root>/CLAUDE.md` for Claude.
- target-local command wrappers in `<target-root>/.portolan/bin/`.
- a runnable Portolan runtime copy in `<target-root>/.portolan/runtime/portolan/`.

The installed harness defaults to a full first atlas command so supported agent
instruction files get the relationships, findings, query artifacts, and handoff
expected by the captain workflow. Use `--scan-profile fast` only when you
explicitly want a lightweight reconnaissance pass before the full atlas command.

Verify the installable agent harness pack on the current machine:

```bash
scripts/portolan-product-acceptance.sh --require-agent-runtime
```

The product acceptance command creates fresh isolated targets, installs the
Cursor rule, OpenCode/Codex `AGENTS.md` block, Claude `CLAUDE.md` block, and
`.portolan/bin` wrappers, runs the real Cursor/OpenCode CLIs when available,
checks the generated bundle through `portolan-bundle-query`, and runs the local
baseline checks. Without `--require-agent-runtime`, unavailable agent CLIs are
reported as `not_assessed` instead of success.

**Agent command** (doctor -> plan -> bundle; open viewer separately):

```bash
scripts/portolan-install.sh <target-root> --harness all --bundle-dir <bundle-dir>
<target-root>/.portolan/bin/portolan-scan.sh --doctor <target-root> <bundle-dir> --skip-install --no-viewer
<target-root>/.portolan/bin/portolan-scan.sh --dry-run <target-root> <bundle-dir> --skip-install --no-viewer
<target-root>/.portolan/bin/portolan-scan.sh <target-root> <bundle-dir> --yes --skip-install --no-viewer
```

Omit `--no-viewer` only for a human-run command where blocking in the viewer is
fine. Remove `--skip-install` only after explicit approval to install missing
local OSS tools. See `scripts/portolan-scan.sh --help`.

The viewer opens as a map-first atlas: landscape overview, component graph,
relationship drill-down, ranked risks, gaps, search, filters, agent handoff
commands, and click-to-source preview for local files.
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
agent route. Use it only when an operator explicitly asks for the legacy
compatibility route. See [`docs/agent/INSTALL.md`](docs/agent/INSTALL.md) and
[`docs/harness/GO-FREEZE-POLICY.md`](docs/harness/GO-FREEZE-POLICY.md).

Canonical source identity for that compatibility route:

```bash
git clone https://github.com/fcon-tech/portolan.git
cd portolan
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

## Documentation Route

If you are not sure which document to open first, start with the
[Documentation Onboarding](docs/onboarding.md) route. It points humans,
agents, Cursor operators, OpenCode operators, and release reviewers to the
maintained surface for each workflow.

For a walkthrough that starts from the captain prompt and any local target, see
[Demo Runbook](docs/demo-runbook.md). Named stress corpora are optional
validation fixtures, not the main product path.

## Public Routes

These routes are current and boundary-limited. Some public surfaces are initial
community infrastructure rather than proof of broad adoption or support.

- Install: use the [Harness-First Quick Start](#harness-first-quick-start-recommended) above.
- Example run: use the [Demo Runbook](docs/demo-runbook.md) or run the
  [Harness-First Quick Start](#harness-first-quick-start-recommended) against
  any local target you can inspect.
- Captain Atlas specs: read
  [Captain Atlas BDD Work Packages](docs/captain-atlas/README.md) before
  changing product direction or assigning parallel agents.
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

The safest reusable instruction is generated from the two captain inputs:
`PORTOLAN` and `TARGET_ROOT`.

```bash
scripts/portolan-captain-prompt.sh \
  --portolan <Portolan git URL or local checkout path> \
  --target-root <target-root>
```

Send the printed block to the agent. It defaults the bundle to
`$TARGET_ROOT/.portolan/atlas`, asks before fetching a URL, installs
target-local wrappers, builds the atlas, and produces the captain handoff.

For a shorter run, send this to the agent:

```text
Use Portolan to build my atlas.

PORTOLAN=<Portolan git URL or local checkout path>
TARGET_ROOT=<target-root>

Default the bundle to TARGET_ROOT/.portolan/atlas, ask before fetching a URL or
installing missing tools, use target-local .portolan/bin wrappers after install,
preserve unknown / cannot_verify / not_assessed, and cite local artifact paths
for every material claim.
```

For a Russian-language agent run, use
[docs/agent/INSTALL-PROMPT.ru.md](docs/agent/INSTALL-PROMPT.ru.md).

Give the agent `PORTOLAN` and `TARGET_ROOT`; let it default `BUNDLE_DIR` to
`$TARGET_ROOT/.portolan/atlas` unless you need an explicit override. Do not add
target-specific expected findings to the prompt.

## Atlas Trust Guardrails

Portolan leads with the atlas: what exists, how it connects, what looks risky,
and where to drill down. The evidence labels below are guardrails for navigation;
they are not the product value proposition. Portolan does not turn missing
evidence into confidence. Results preserve evidence states:

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
The installable atlas route is ready for review when the product acceptance gate
passes; that does not imply GitHub popularity, external adoption, merge
approval, or broad ecosystem validation.

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
- [Captain Atlas BDD Work Packages](docs/captain-atlas/README.md)
- [Product Claims](docs/product-claims.md)
- [Release Guide](docs/release.md)
- [Product Boundary](docs/product-boundary.md)
- [Evidence Model](docs/evidence-model.md)
- [Relationship Detection](docs/relationship-detection.md)
- [Runtime Observations](docs/runtime-observations.md)
- [Security Threat Model](docs/security-threat-model.md)
- [OSS Composition](docs/oss-composition.md)
- [Demo Runbook](docs/demo-runbook.md)
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Support](SUPPORT.md)

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
