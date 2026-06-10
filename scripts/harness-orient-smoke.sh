#!/usr/bin/env bash
# End-to-end harness orient smoke (spec 087 / 092). No network required.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
# shellcheck source=orient-ignore.sh
. "$ROOT/scripts/orient-ignore.sh"

orient_rel_path_is_ignored "$ROOT" ".codex-subagents/monitor.mjs" || {
  echo "expected .codex-subagents to be gitignored" >&2
  exit 1
}
orient_rel_path_is_ignored "$ROOT" "scripts/orient-wizard.sh" && {
  echo "did not expect scripts/orient-wizard.sh to be ignored" >&2
  exit 1
}

FIXTURE_TARGET="$ROOT/internal/testfixtures/orient-bundle/target"
FIXTURE_ORIENT="$ROOT/internal/testfixtures/orient-bundle/orient-smoke"
VIEWER_PORT="${VIEWER_PORT:-4174}"

# Live config scan (producer script, not only pre-baked jsonl)
SCAN_TMP=$(mktemp)
"$ROOT/scripts/scan-config-surfaces.sh" "$FIXTURE_TARGET" "$SCAN_TMP"
jq -s 'map(select(.surface_kind == "dockerfile" and .path == "Dockerfile")) | length >= 1' "$SCAN_TMP" >/dev/null
jq -s 'map(select(.surface_kind == "docker-compose" and .path == "docker-compose.yml")) | length >= 1' "$SCAN_TMP" >/dev/null
rm -f "$SCAN_TMP"

rm -rf "$FIXTURE_ORIENT"
mkdir -p "$FIXTURE_ORIENT/producers"
cp -a "$ROOT/internal/testfixtures/orient-bundle/producers/." "$FIXTURE_ORIENT/producers/"

"$ROOT/scripts/build-orient-bundle.sh" "$FIXTURE_TARGET" "$FIXTURE_ORIENT"

test "$(wc -l <"$FIXTURE_ORIENT/hotspots.jsonl" | tr -d ' ')" -ge 1
test -f "$FIXTURE_ORIENT/manifest.json"
test -f "$FIXTURE_ORIENT/hotspots-full.jsonl"

jq -e 'select(.kind == "config" and .producer == "config-scan" and (.paths | length) >= 1)' \
  "$FIXTURE_ORIENT/hotspots.jsonl" >/dev/null || {
  echo "expected config-scan hotspot in bundle" >&2
  exit 1
}
jq -e 'select(.kind == "debt-candidate" and (.summary | test("\\([0-9]+ symbols\\)")))' \
  "$FIXTURE_ORIENT/hotspots.jsonl" >/dev/null || {
  echo "expected debt-candidate hotspot with symbol count in bundle" >&2
  exit 1
}

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

# Truncation smoke: budget=2 must truncate when full list is longer
TRUNC_ORIENT=$(mktemp -d)
trap 'rm -rf "$TRUNC_ORIENT"' EXIT
mkdir -p "$TRUNC_ORIENT/producers"
cp -a "$ROOT/internal/testfixtures/orient-bundle/producers/." "$TRUNC_ORIENT/producers/"
ORIENT_HOTSPOT_BUDGET=2 "$ROOT/scripts/build-orient-bundle.sh" "$FIXTURE_TARGET" "$TRUNC_ORIENT"
jq -e '.hotspots_truncated == true or .hotspots_truncated == 1' "$TRUNC_ORIENT/manifest.json" >/dev/null
full_n=$(wc -l <"$TRUNC_ORIENT/hotspots-full.jsonl" | tr -d ' ')
bud_n=$(wc -l <"$TRUNC_ORIENT/hotspots.jsonl" | tr -d ' ')
test "$full_n" -gt "$bud_n" || { echo "truncation: full=$full_n budgeted=$bud_n" >&2; exit 1; }

cd "$ROOT/viewer"
node scripts/build-static.js
node scripts/serve.js --bundle "$FIXTURE_ORIENT" --port "$VIEWER_PORT" &
PID=$!
trap 'kill "${PID:-}" 2>/dev/null || true; rm -rf "$TRUNC_ORIENT"' EXIT
sleep 1

BASE="http://127.0.0.1:$VIEWER_PORT"
HTML=$(curl -sf "$BASE/")
echo "$HTML" | grep -q 'Portolan Orient'
echo "$HTML" | grep -q 'id="search-input"'
echo "$HTML" | grep -q 'id="filter-bar"'
echo "$HTML" | grep -q 'id="heat-tree"'
echo "$HTML" | grep -q 'id="status-banner"'
curl -sf "$BASE/bundle/manifest.json" | jq -e '.hotspot_count >= 1' >/dev/null
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
