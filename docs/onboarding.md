# Documentation Onboarding

Use this page as the first routing layer for Portolan docs. It does not replace
the detailed docs; it tells humans and agents which maintained surface to use
first.

## Start Here By Intent

| Intent | Start with | Then read | Boundary to preserve |
| --- | --- | --- | --- |
| Understand what Portolan is for | [README](../README.md) | [Product Claims](product-claims.md), [Product Boundary](product-boundary.md) | Portolan is a local evidence layer, not a coding harness, readiness gate, service catalog, observability platform, or Cursor/OpenCode replacement. |
| Ask an agent to inspect a local target | [Agent Quickstart](agent/QUICKSTART.md) | [Install Prompt](agent/INSTALL-PROMPT.md), [Agent Acceptance](agent/ACCEPTANCE.md) | Agent answers must cite local artifacts and preserve `unknown`, `cannot_verify`, and `not_assessed`. |
| Install or resolve the command | [Agent Install](agent/INSTALL.md) | [Troubleshooting](agent/TROUBLESHOOTING.md), [Release Guide](release.md) | Source bootstrap is local and does not fetch Go modules unless explicitly approved. |
| Use Cursor | [.cursor rule](../.cursor/rules/portolan-map.mdc) | [Agent Acceptance](agent/ACCEPTANCE.md), [Product Claims](product-claims.md) | Current verified Cursor evidence is headless Cursor Agent CLI / Composer. Cursor UI behavior is outside the current required acceptance scope. |
| Use OpenCode | [Install Prompt](agent/INSTALL-PROMPT.md) | [Agent Acceptance](agent/ACCEPTANCE.md), [Product Claims](product-claims.md) | OpenCode default-permission runs are verified with repo-local output under the Portolan checkout. The recorded external-output default-permission lane failed. |
| Prepare release notes or a demo claim | [Release Guide](release.md) | [Product Claims](product-claims.md) | Do not publish broader claims than the current claim boundary allows. |
| Contribute a bug report, feature, evidence gap, or PR | [Contributing](../CONTRIBUTING.md) | [Support](../SUPPORT.md), [Product Claims](product-claims.md) | Keep issue and PR evidence states explicit; do not treat blocked or not_assessed surfaces as product success. |
| Report a sensitive vulnerability | [Security Policy](../SECURITY.md) | [Security Threat Model](security-threat-model.md), [Product Claims](product-claims.md) | Use GitHub private vulnerability reporting. Do not publish sensitive vulnerability details in public issues or pull requests. |
| Work on a SpecKit slice | [SpecKit Workflow](speckit-workflow.md) | [Product Backlog](product-backlog.md), [AGENTS.md](../AGENTS.md) | Keep backlog, spec, tasks, reviews, PR state, and evidence labels aligned. |

## What Is Already Strong

- Human-facing docs already explain the product boundary, current safe claims,
  evidence model, release checks, OSS composition posture, and Russian overview.
- Agent-facing docs already provide quickstart, install, copyable prompt,
  config, examples, troubleshooting, and acceptance matrix surfaces.
- Initial public GitHub community routes now include contributing, support,
  security, conduct, issue templates, and a pull request template. This does not
  prove broad adoption or public support capacity.
- Installation is intentionally simple: source checkout plus
  `scripts/bootstrap-portolan`, with network module fetching disabled unless
  `PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1` is explicitly set.
- Cursor has a repo-local rule that tells Cursor to use Portolan before broad
  architecture or map claims.
- OpenCode has recorded acceptance lanes for the current `kimi-for-coding/k2p6`
  runs, including the important default-permission output distinction.

## Cursor Operator Notes

Use Cursor as an operator over local Portolan artifacts:

1. Let the Cursor rule route broad codebase questions through
   `docs/agent/QUICKSTART.md`.
2. Prepare context before answering broad claims:

   ```bash
   portolan context prepare --root <target-root> --out <output-dir>/context --profile cursor
   ```

3. Build a map only when needed:

   ```bash
   portolan map --root <target-root> --out <output-dir>/map
   ```

4. Read bounded artifacts before full `graph.json`: `agent-brief.md`,
   `answer-contract.md`, `evidence-index.jsonl`, `gaps.jsonl`, `summary.json`,
   `graph-index.json`, `findings.jsonl`, and `map.md`.

Current evidence supports headless Cursor Agent CLI / Composer wording. Do not
claim UI Cursor behavior from that evidence.

## OpenCode Operator Notes

Use OpenCode with the same copyable install prompt as other agents:

1. Fill the variables in [Agent Install Prompt](agent/INSTALL-PROMPT.md).
2. Under default OpenCode permissions, prefer an output path inside the
   Portolan checkout, for example:

   ```text
   OUTPUT_PATH=<portolan-checkout>/.portolan/runs/<target-name>
   ```

3. Use external output directories only when the harness permission mode allows
   them. The recorded default-permission external-output lane failed when
   OpenCode rejected writing outside the allowed workspace.
4. Keep the answer contract strict: commands run, artifact paths, visible
   scope, evidence-backed findings, `unknown`, `cannot_verify`,
   `not_assessed`, next actions, and unsupported claims avoided.

OpenCode support is currently evidence-specific. Do not generalize the recorded
lanes to arbitrary models, arbitrary targets, or arbitrary permission modes.

## Install And Build Route

Preferred order:

1. Use an installed `portolan` binary if one is available and `--version`
   works.
2. From a source checkout, run:

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
