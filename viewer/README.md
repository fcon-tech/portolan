# Portolan Atlas Viewer (0.1.0 contract — superseded)

> **Status (2026-06-28): SUPERSEDED.** The charter-08 reading layer is
> `portolan-core/` (the `/portolan:map` entry point). This viewer is the
> historical meaning-first UI and the frozen `system-map` schema authority,
> retained until the 0.2.0 big-bang migration removes it. Do not add features
> here; treat it as reference-only. See `AGENTS.md` § "Architecture:
> Deterministic Core + Reading Layer".

Local map-first atlas app for Portolan scan bundles.

The viewer was the human-facing half of the captain-atlas flow: it loads a local
bundle, shows target identity, repo/component shape, relationship edges, risks,
gaps, and drill-down routes back to local bundle records and source snippets.
It does not call remote services or mutate the target.

## Dependencies (MCP server only)

```bash
# From repo root — use nvm node npm, not Windows npm on WSL PATH:
scripts/npm-wsl.sh ci --prefix viewer
# Or: cd viewer && ../scripts/npm-wsl.sh ci
```

`@modelcontextprotocol/sdk` is required for `scripts/portolan-bundle-query-mcp.sh`.

## WSL PATH note

If `npm` fails with `Could not determine Node.js install directory`, your shell
likely resolves `npm` to `/mnt/c/Program Files/nodejs/npm`. Prefer:

- `scripts/npm-wsl.sh` (uses npm next to `node` on PATH), or
- `node "$(dirname "$(dirname "$(command -v node)")")/lib/node_modules/npm/bin/npm-cli.js" …`

## Commands

```bash
node scripts/build-static.js
node scripts/serve.js --bundle /path/to/bundle --port 4173
```

Open the printed localhost URL. The first screen should orient a cold reader
without requiring raw JSON: map first, selection detail second, report/source
drill-down next.
