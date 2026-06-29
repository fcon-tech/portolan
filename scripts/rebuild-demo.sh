#!/usr/bin/env bash
# Rebuild the Portolan demo atlas from a real scan of the Bigtop landscape.
# This is the single command that produces the published demo.
#
# Usage: scripts/rebuild-demo.sh --target <bigtop-landscape> --out docs/site/atlas/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORE="$ROOT/portolan-core"
TARGET=""
OUT_DIR="$ROOT/docs/site/atlas"
SI_FIXTURE="$CORE/test/fixtures/semantic-investigation/semantic-investigation.bigtop.json"
SI_SOURCES="$CORE/test/fixtures/semantic-investigation"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --out) OUT_DIR="$2"; shift 2 ;;
    -h|--help) echo "usage: $0 --target <dir> [--out <dir>]"; exit 0 ;;
    *) echo "unknown: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  echo "error: --target is required" >&2
  exit 2
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "=== Portolan Demo Rebuild ==="
echo "Target: $TARGET"
echo "Output: $OUT_DIR"
echo ""

# 1. Run the Go core scan
echo "--- 1/4: Scanning landscape (portolan map) ---"
go run "$ROOT/cmd/portolan" map --root "$TARGET" --out "$WORK/bundle" --force
echo "  graph.json + findings.jsonl produced"

# 2. Build system-map from the scan
echo "--- 2/4: Building system-map ---"
node "$CORE/scripts/build-system-map.mjs" \
  --bundle "$WORK/bundle" \
  --out "$WORK/system-map.json" 2>/dev/null || \
  bash "$ROOT/scripts/build-system-map.sh" "$WORK/bundle" "$WORK/system-map.json"
echo "  system-map.json produced"

# 3. Build SI sidecar (from fixture — semantically rich)
echo "--- 3/4: Building semantic investigation sidecar ---"
node "$CORE/scripts/build-semantic-investigation.mjs" \
  --fixture "$SI_FIXTURE" \
  --out "$WORK" \
  --sources-dir "$SI_SOURCES" 2>&1 | tail -1

# 4. Export the atlas
echo "--- 4/4: Exporting atlas.html ---"
node "$CORE/scripts/export-shell.mjs" \
  --system-map "$WORK/system-map.json" \
  --semantic-investigation "$WORK/semantic-investigation.json" \
  --title "Portolan Atlas — Apache Bigtop" \
  --out "$OUT_DIR/index.html" 2>&1 | tail -1

echo ""
echo "=== Demo rebuilt → $OUT_DIR/index.html ==="
