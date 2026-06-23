#!/usr/bin/env bash
# Validate evidence-promotion artifacts.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)

if [[ $# -lt 1 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "usage: scripts/validate-evidence-promotion-atlas.sh <bundle-dir> [--completion]" >&2
  exit 2
fi

BUNDLE_DIR=$(cd "$1" && pwd)
shift

node "$ROOT/viewer/scripts/evidence-promotion-atlas.js" validate "$BUNDLE_DIR" "$@"
