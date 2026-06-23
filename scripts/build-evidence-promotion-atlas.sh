#!/usr/bin/env bash
# Build evidence-promotion artifacts for an existing Portolan bundle.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)

if [[ $# -lt 1 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "usage: scripts/build-evidence-promotion-atlas.sh <bundle-dir> [target-root]" >&2
  exit 2
fi

BUNDLE_DIR=$(cd "$1" && pwd)
TARGET_ROOT="${2:-}"

node "$ROOT/viewer/scripts/evidence-promotion-atlas.js" build "$BUNDLE_DIR" "$TARGET_ROOT"
