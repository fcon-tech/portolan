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

validate_hotspot_line() {
  jq -e '
    .id and .kind and .severity and .summary and
    (.paths | type == "array" and length >= 1) and
    .evidence_state and .producer and .producer_ref and (.rank | type == "number")
  ' >/dev/null
}

validate_gap_line() {
  jq -e '
    .id and .surface and .summary and
    (.status | IN("unknown", "cannot_verify", "not_assessed"))
  ' >/dev/null
}

while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  echo "$line" | validate_hotspot_line || { echo "invalid hotspot record: $line" >&2; exit 1; }
done <"$FIXTURE_ORIENT/hotspots.jsonl"

if [[ -s "$FIXTURE_ORIENT/gaps.jsonl" ]]; then
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    echo "$line" | validate_gap_line || { echo "invalid gap record: $line" >&2; exit 1; }
  done <"$FIXTURE_ORIENT/gaps.jsonl"
fi

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

SYMLINK_TARGET="$FIXTURE_TARGET/leak-outside"
rm -f "$SYMLINK_TARGET"
ln -sf /etc/passwd "$SYMLINK_TARGET"
SYMLINK_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/source?path=leak-outside&line=1")
rm -f "$SYMLINK_TARGET"
test "$SYMLINK_CODE" = "403"

echo "harness-orient-smoke: ok"
