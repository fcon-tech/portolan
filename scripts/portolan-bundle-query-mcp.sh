#!/usr/bin/env bash
# Launch stdio MCP server for Portolan bundle queries.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)

if ! (cd "$ROOT/viewer" && node -e "require.resolve('@modelcontextprotocol/sdk/server/index.js')" >/dev/null 2>&1); then
  cat >&2 <<EOF
missing Portolan MCP dependency: @modelcontextprotocol/sdk
Run this from the Portolan checkout before starting the MCP adapter:

  scripts/npm-wsl.sh ci --prefix viewer

The shell query path does not require this dependency:

  scripts/portolan-bundle-query.sh <family> --bundle <bundle-dir>
EOF
  exit 2
fi

exec node "$ROOT/viewer/scripts/bundle-query-mcp.js" "$@"
