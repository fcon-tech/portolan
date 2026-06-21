# Portolan viewer

Local static UI + `serve.js` for Portolan scan bundles.

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
