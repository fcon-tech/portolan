# Documentation Onboarding

Use this page as the first routing layer for Portolan docs. It does not replace
the detailed docs; it tells humans and agents which maintained surface to use
first.

## Start Here By Intent

| Intent | Start with | Then read | Boundary to preserve |
| --- | --- | --- | --- |
| Understand what Portolan is for | [README](../README.md) | [Product Claims](product-claims.md), [Product Boundary](product-boundary.md), [Product Quality Boundary](product-quality-boundary.md) | Portolan is a local atlas generator for agent-assisted landscape navigation, not a coding harness, readiness gate, service catalog, observability platform, or Cursor/OpenCode replacement. |
| Ask an agent to inspect a local target | [Install Prompt](agent/INSTALL-PROMPT.md) | [Agent Quickstart](agent/QUICKSTART.md), [Agent Acceptance](agent/ACCEPTANCE.md) | Install target-local wrappers, run doctor/dry-run, build bundle, query before answering, and preserve gaps. |
| Open the atlas (human) | [AGENTS.md § /portolan:map](../AGENTS.md) | [Navigation spec](../openspec/specs/navigation/) | Run `node portolan-core/scripts/portolan-map.mjs --target <root> [--open]` (or the installed `.portolan/bin/portolan-viewer.sh --bundle <bundle>`); the atlas opens as an inlined `atlas.html` (charter-08 single entry point, no HTTP server). |
| Install or resolve the command | [Agent Install](agent/INSTALL.md) | [Troubleshooting](agent/TROUBLESHOOTING.md), [Release Guide](release.md) | Resolve Portolan from a URL or local path, install target-local wrappers, and use legacy source bootstrap only for explicit compatibility work. |
| Use Cursor | [Agent Install Prompt](agent/INSTALL-PROMPT.md) | [Cursor Rule](../harness/cursor/portolan-harness.mdc), [Agent Acceptance](agent/ACCEPTANCE.md) | Cursor is an operator over a local Portolan bundle. Install the rule with `scripts/portolan-install.sh <target-root> --harness cursor`; current evidence does not prove arbitrary Cursor UI behavior. |
| Use OpenCode | [OpenCode Prompt](../harness/opencode/INSTALL-PROMPT.md) | [Agent Acceptance](agent/ACCEPTANCE.md), [Product Claims](product-claims.md) | OpenCode reads `AGENTS.md`; install the managed block with `scripts/portolan-install.sh <target-root> --harness opencode`. Keep output under the target unless permissions are explicitly broadened. |
| Prepare release notes, an acceptance claim, or a generated report | [Release Guide](release.md) | [Product Claims](product-claims.md), [Product Quality Boundary](product-quality-boundary.md), [Report Quality Contract](report-quality.md) | Do not publish broader claims than the current claim boundary allows; run the report-quality gate before treating generated reports as product-ready. |
| Contribute a bug report, feature, evidence gap, or PR | [Contributing](../CONTRIBUTING.md) | [Support](../SUPPORT.md), [Product Claims](product-claims.md) | Keep issue and PR evidence states explicit; do not treat blocked or not_assessed surfaces as product success. |
| Report a sensitive vulnerability | [Security Policy](../SECURITY.md) | [Security Threat Model](security-threat-model.md), [Product Claims](product-claims.md) | Use GitHub private vulnerability reporting. Do not publish sensitive vulnerability details in public issues or pull requests. |
| Work on the active product | [OpenSpec living specs](../openspec/specs/) | [AGENTS.md](../AGENTS.md), [Product Claims](product-claims.md) | Work from the living specs and `openspec/changes/`; do not revive historical backlog/spec tracks. |

## What Is Already Strong

- Human-facing docs already explain the product boundary, current safe claims,
  evidence model, release checks, OSS composition posture, and Russian overview.
- Agent-facing docs already provide quickstart, install, copyable prompt,
  config, examples, troubleshooting, and acceptance matrix surfaces.
- Initial public GitHub community routes now include contributing, support,
  security, conduct, issue templates, and a pull request template. This does not
  prove broad adoption or public support capacity.
- Installation is intentionally simple: resolve a Portolan URL or local path,
  then run
  `<resolved-portolan-path>/scripts/portolan-install.sh <target-root> --harness all --bundle-dir <target-root>/.portolan/atlas`.
  The legacy Go binary path still uses `scripts/bootstrap-portolan`, with
  network module fetching disabled unless
  `PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1` is explicitly set.
- Cursor has an installable Project Rule template that tells Cursor to build
  and query a Portolan atlas bundle before broad architecture or landscape
  claims.
- OpenCode and Codex share an installable managed `AGENTS.md` block; Claude has
  an installable managed `CLAUDE.md` block. Current recorded runtime lanes prove
  specific Cursor/OpenCode/Codex/Claude runs, not arbitrary models, targets, or
  permission modes.
- Verify the current installable agent harness pack with
  `scripts/portolan-product-acceptance.sh --require-agent-runtime`; the gate
  creates fresh targets, installs the pack, runs real Cursor/OpenCode CLIs,
  validates the generated usable atlas bundle, and runs the local baseline
  checks. Require Codex or Claude explicitly with
  `scripts/harness-agent-runtime-acceptance.sh --harness codex --require codex --prompt-mode captain`
  or
  `scripts/harness-agent-runtime-acceptance.sh --harness claude --require claude --prompt-mode captain`.

## Cursor Operator Notes

Use Cursor as an operator over local Portolan artifacts:

1. Install the project rule into the target:

   ```bash
   scripts/portolan-install.sh <target-root> --harness cursor
   ```

2. Let the installed rule route broad codebase questions through
   `<target-root>/.portolan/bin` wrappers.
3. Build the first usable atlas before answering broad claims:

   ```bash
   <target-root>/.portolan/bin/portolan-scan.sh <target-root> <bundle-dir> --yes --skip-install --no-viewer
   ```

4. Query bounded artifacts with
   `<target-root>/.portolan/bin/portolan-bundle-query.sh` before loading larger
   files.
5. Use `--scan-profile fast` during install only when the captain explicitly
   wants a lightweight reconnaissance pass before the full atlas command.

Current evidence supports headless Cursor Agent CLI / Composer wording. Do not
claim UI Cursor behavior from that evidence.

## OpenCode Operator Notes

Use OpenCode with the installable `AGENTS.md` block or the copyable prompt:

1. Install the managed block into the target:

   ```bash
   scripts/portolan-install.sh <target-root> --harness opencode
   ```

2. Use `BUNDLE_DIR=<target-root>/.portolan/atlas` unless the harness permission
   mode explicitly allows another output root.
3. Use external output directories only when the harness permission mode allows
   them.
4. Keep the answer contract strict: commands run, artifact paths, visible
   scope, evidence-backed findings, `unknown`, `cannot_verify`,
   `not_assessed`, next actions, and unsupported claims avoided.

OpenCode support is currently evidence-specific. Do not generalize recorded
lanes to arbitrary models, targets, or permission modes.

## Legacy Go Binary Route

Use this only when the older Go CLI is explicitly needed:

1. Use an installed `portolan` binary if one is available and `--version`
   works.
2. If the operator explicitly chose the compatibility route and `PORTOLAN_PATH`
   points at a local Portolan checkout, run:

   ```bash
   scripts/bootstrap-portolan
   .portolan/bin/portolan --version
   ```

3. Use `go run ./cmd/portolan ...` only as a development fallback.

The bootstrap writes a repo-local binary and keeps Go module network fetching
off by default. If cached modules are missing, ask for explicit approval before
using:

```bash
PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1 scripts/bootstrap-portolan
```

If installation or output setup fails, use
[Agent Troubleshooting](agent/TROUBLESHOOTING.md) before changing network,
permission, or output-directory assumptions.

## Evidence Labels To Keep

Use these labels rather than smoothing uncertain surfaces into success:

- `verified`
- `failed`
- `blocked`
- `unknown`
- `cannot_verify`
- `not_assessed`

For graph facts, preserve Portolan evidence states:

- `source-visible`
- `metadata-visible`
- `runtime-visible`
- `claim-only`
- `unknown`
- `cannot_verify`
