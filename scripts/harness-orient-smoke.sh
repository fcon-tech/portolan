#!/usr/bin/env bash
# End-to-end harness orient smoke (spec 087 / phase 5). No network required.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
FIXTURE_TARGET="$ROOT/internal/testfixtures/orient-bundle/target"
FIXTURE_ORIENT="$ROOT/internal/testfixtures/orient-bundle/orient-smoke"
VIEWER_PORT="${VIEWER_PORT:-4174}"

rm -rf "$FIXTURE_ORIENT"
mkdir -p "$FIXTURE_ORIENT/producers"
cp -a "$ROOT/internal/testfixtures/orient-bundle/producers/." "$FIXTURE_ORIENT/producers/"

"$ROOT/scripts/build-orient-bundle.sh" "$FIXTURE_TARGET" "$FIXTURE_ORIENT"

test "$(wc -l <"$FIXTURE_ORIENT/hotspots.jsonl" | tr -d ' ')" -ge 1
test -f "$FIXTURE_ORIENT/manifest.json"

cd "$ROOT/viewer"
node scripts/build-static.js
node scripts/serve.js --bundle "$FIXTURE_ORIENT" --port "$VIEWER_PORT" &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT
sleep 1

BASE="http://127.0.0.1:$VIEWER_PORT"
curl -sf "$BASE/" | grep -q 'Portolan Orient'
curl -sf "$BASE/" | grep -q 'id="search-input"'
curl -sf "$BASE/bundle/hotspots.jsonl" | grep -q duplication
curl -sf "$BASE/source?path=sample.go&line=1" | grep -q 'Run'

FORBIDDEN_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/source?path=../../../etc/passwd&line=1")
test "$FORBIDDEN_CODE" = "403"

echo "harness-orient-smoke: ok"
