#!/usr/bin/env bash
# Build a normalized Portolan system map from existing bundle artifacts.
# This is a read-only adapter: it normalizes atlas-surfaces.json, atlas-facts.json,
# repo-profiles.json, relationships.jsonl, hotspots-full.jsonl, and gaps.jsonl
# into schema/system-map.schema.json without running scanners or fetching networks.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)

if [[ $# -lt 1 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "usage: scripts/build-system-map.sh <bundle-dir> [target-root]" >&2
  exit 2
fi

BUNDLE_DIR=$(cd "$1" && pwd)
TARGET_ROOT="${2:-}"

node "$ROOT/portolan-core/scripts/build-system-map.mjs" build "$BUNDLE_DIR" "$TARGET_ROOT"
