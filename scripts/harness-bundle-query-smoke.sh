#!/usr/bin/env bash
# Smoke test for portolan-bundle-query (spec 095).
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
FIXTURE_TARGET="$ROOT/internal/testfixtures/portolan-bundle/target"
FIXTURE_BUNDLE=$(mktemp -d)
trap 'rm -rf "$FIXTURE_BUNDLE"' EXIT

mkdir -p "$FIXTURE_BUNDLE/producers"
cp -a "$ROOT/internal/testfixtures/portolan-bundle/producers/." "$FIXTURE_BUNDLE/producers/"
"$ROOT/scripts/build-portolan-bundle.sh" "$FIXTURE_TARGET" "$FIXTURE_BUNDLE"

Q="$ROOT/scripts/portolan-bundle-query.sh"

"$Q" hotspots --bundle "$FIXTURE_BUNDLE" --kind duplication --limit 5 \
  | jq -e '.schema_version and (.records | length) >= 1' >/dev/null

"$Q" gaps --bundle "$FIXTURE_BUNDLE" --limit 5 \
  | jq -e '.schema_version and (.records | type == "array")' >/dev/null

"$Q" landscape --bundle "$FIXTURE_BUNDLE" \
  | jq -e '.records | length >= 1' >/dev/null

"$Q" source --bundle "$FIXTURE_BUNDLE" --path sample.go --line 4 \
  | jq -e '.records[0].payload.lines | length >= 1' >/dev/null

test -f "$FIXTURE_BUNDLE/search-index.jsonl"
"$Q" search --bundle "$FIXTURE_BUNDLE" --q "func" --limit 5 \
  | jq -e '.records | length >= 1' >/dev/null

test -f "$FIXTURE_BUNDLE/symbol-index.jsonl"
"$Q" symbol --bundle "$FIXTURE_BUNDLE" --name Run --limit 5 \
  | jq -e '.records | length >= 1' >/dev/null

jq empty "$ROOT/harness/contracts/bundle-query-result.schema.json"

# HTTP parity via serve.js
cd "$ROOT/viewer"
node scripts/build-static.js
PORT=4179
node scripts/serve.js --bundle "$FIXTURE_BUNDLE" --port "$PORT" &
PID=$!
trap 'kill "${PID:-}" 2>/dev/null || true; rm -rf "$FIXTURE_BUNDLE"' EXIT
sleep 1

BASE="http://127.0.0.1:$PORT"
curl -sf "$BASE/api/hotspots?kind=duplication&limit=3" | jq -e '.records | length >= 1' >/dev/null
curl -sf "$BASE/api/search?q=package&limit=3" | jq -e '.records | type == "array"' >/dev/null

# map-bridge sidecar (094)
mkdir -p "$FIXTURE_BUNDLE/map-bridge"
echo '{"id":"ev-1","family":"relationships","summary":"fixture edge","evidence_state":"metadata-visible"}' \
  >"$FIXTURE_BUNDLE/map-bridge/evidence-index.jsonl"
"$Q" evidence-index --bundle "$FIXTURE_BUNDLE" --limit 5 \
  | jq -e '.records | length >= 1' >/dev/null

# repos / relationships families (107)
"$Q" repos --bundle "$FIXTURE_BUNDLE" --limit 5 \
  | jq -e '.records | length >= 1' >/dev/null
# single-repo fixture: empty edge list is a valid clean result (file present, no edges)
"$Q" relationships --bundle "$FIXTURE_BUNDLE" --limit 5 \
  | jq -e '.records | type == "array"' >/dev/null
curl -sf "$BASE/api/repos?limit=3" | jq -e '.records | length >= 1' >/dev/null
curl -sf "$BASE/api/relationships?limit=3" | jq -e '.records | type == "array"' >/dev/null

# source full read (107): whole file with line cap
"$Q" source --bundle "$FIXTURE_BUNDLE" --path sample.go --line 1 --full \
  | jq -e '.records[0].payload | (.startLine == 1) and (.totalLines >= (.lines | length))' >/dev/null

# ast-index import (097)
AST_FIX=$(mktemp)
echo '[{"name":"ImportedSym","path":"sample.go","kind":"function","line":4}]' >"$AST_FIX"
"$ROOT/scripts/import-ast-index.sh" "$AST_FIX" "$FIXTURE_BUNDLE"
"$Q" symbol --bundle "$FIXTURE_BUNDLE" --name ImportedSym --limit 3 \
  | jq -e '.records | length >= 1' >/dev/null
rm -f "$AST_FIX"

echo "harness-bundle-query-smoke: ok"
