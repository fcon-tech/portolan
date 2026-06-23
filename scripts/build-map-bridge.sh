#!/usr/bin/env bash
# Copy bounded map artifacts into bundle map-bridge/ sidecar.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <map-bundle-dir> <portolan-bundle-dir>" >&2
  exit 2
fi

MAP_DIR=$1
BUNDLE_DIR=$2
BRIDGE="$BUNDLE_DIR/map-bridge"

command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }

mkdir -p "$BRIDGE"

copy_if() {
  local src=$1
  local dest=$2
  if [[ -f "$src" ]]; then
    cp "$src" "$dest"
    return 0
  fi
  return 1
}

copied=0
for f in summary.json graph-index.json coverage.json; do
  if copy_if "$MAP_DIR/$f" "$BRIDGE/$f"; then
    copied=$((copied + 1))
  fi
done

if [[ -f "$MAP_DIR/evidence-index.jsonl" ]]; then
  head -n "${PORTOLAN_EVIDENCE_INDEX_BUDGET:-500}" "$MAP_DIR/evidence-index.jsonl" >"$BRIDGE/evidence-index.jsonl"
  copied=$((copied + 1))
elif [[ -f "$MAP_DIR/context/evidence-index.jsonl" ]]; then
  head -n "${PORTOLAN_EVIDENCE_INDEX_BUDGET:-500}" "$MAP_DIR/context/evidence-index.jsonl" >"$BRIDGE/evidence-index.jsonl"
  copied=$((copied + 1))
fi

nav='{"read_order":["summary.json","graph-index.json","map-bridge/evidence-index.jsonl","hotspots.jsonl","gaps.jsonl"],"source":"portolan map"}'
if [[ -f "$BRIDGE/summary.json" ]]; then
  nav=$(jq -n \
    --argjson nav "$(jq '.navigation // empty' "$BRIDGE/summary.json" 2>/dev/null || echo null)" \
    '{read_order: (if $nav.read_order then $nav.read_order else ["summary.json","graph-index.json","map-bridge/evidence-index.jsonl"] end), source: "portolan map"}')
fi
echo "$nav" | jq '.' >"$BRIDGE/navigation.json"

if [[ $copied -eq 0 ]]; then
  echo "map-bridge: no map artifacts found in $MAP_DIR" >&2
  exit 1
fi

echo "map-bridge: wrote $copied artifacts -> $BRIDGE"
