#!/usr/bin/env bash
# Validate a generated Portolan system map against schema/system-map.schema.json
# plus semantic invariants that JSON Schema cannot express.
#
# usage: scripts/validate-system-map-schema.sh <system-map.json>
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)

if [[ $# -lt 1 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "usage: scripts/validate-system-map-schema.sh <system-map.json>" >&2
  exit 2
fi

MAP_FILE=$1
[[ -f "$MAP_FILE" ]] || {
  echo "validate-system-map-schema: missing system map: $MAP_FILE" >&2
  exit 1
}

if ! (cd "$ROOT/viewer" && node -e "require('ajv')" >/dev/null 2>&1); then
  "$ROOT/scripts/npm-wsl.sh" ci --prefix "$ROOT/viewer"
fi

node "$ROOT/viewer/scripts/validate-system-map.js" "$MAP_FILE"
