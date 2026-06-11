#!/usr/bin/env bash
# Launch stdio MCP server for Portolan bundle queries (spec 098).
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
exec node "$ROOT/viewer/scripts/bundle-query-mcp.js" "$@"
