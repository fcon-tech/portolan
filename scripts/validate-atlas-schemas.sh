#!/usr/bin/env bash
# Validate generated atlas JSON artifacts against the committed contracts.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)

if [[ $# -lt 1 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "usage: scripts/validate-atlas-schemas.sh <bundle-dir>" >&2
  exit 2
fi

BUNDLE_DIR=$(cd "$1" && pwd)
for file in atlas-surfaces.json atlas-facts.json atlas-surface-content.json promotion-health.jsonl promoted-facts.jsonl classified-sources.jsonl raw-artifacts.jsonl; do
  [[ -f "$BUNDLE_DIR/$file" ]] || {
    echo "validate-atlas-schemas: missing $BUNDLE_DIR/$file" >&2
    exit 1
  }
done

if ! (cd "$ROOT/viewer" && node -e "require('ajv')" >/dev/null 2>&1); then
  "$ROOT/scripts/npm-wsl.sh" ci --prefix "$ROOT/viewer"
fi

node "$ROOT/viewer/scripts/validate-atlas-schemas.js" "$BUNDLE_DIR"
"$ROOT/scripts/validate-evidence-promotion-atlas.sh" "$BUNDLE_DIR"
