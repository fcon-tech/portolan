#!/usr/bin/env bash
# Run npm from the same Node install as `node` on PATH (WSL: avoids Windows npm shim).
set -euo pipefail

NODE_BIN=$(command -v node)
NODE_ROOT=$(cd "$(dirname "$NODE_BIN")/.." && pwd)
NPM_CLI="$NODE_ROOT/lib/node_modules/npm/bin/npm-cli.js"

if [[ ! -f "$NPM_CLI" ]]; then
  echo "npm-cli not found beside node ($NODE_BIN); expected $NPM_CLI" >&2
  exit 1
fi

exec node "$NPM_CLI" "$@"
