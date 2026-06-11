#!/usr/bin/env bash
# End-to-end Portolan harness smoke (spec 087 / 092 / 093). No network required.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
# shellcheck source=portolan-ignore.sh
. "$ROOT/scripts/portolan-ignore.sh"

portolan_rel_path_is_ignored "$ROOT" ".codex-subagents/monitor.mjs" || {
  echo "expected .codex-subagents to be gitignored" >&2
  exit 1
}
portolan_rel_path_is_ignored "$ROOT" "scripts/portolan-scan.sh" && {
  echo "did not expect scripts/portolan-scan.sh to be ignored" >&2
  exit 1
}

FIXTURE_TARGET="$ROOT/internal/testfixtures/portolan-bundle/target"
FIXTURE_BUNDLE="$ROOT/internal/testfixtures/portolan-bundle/portolan-smoke"
VIEWER_PORT="${VIEWER_PORT:-4174}"

# Live config scan (producer script, not only pre-baked jsonl)
SCAN_TMP=$(mktemp)
"$ROOT/scripts/scan-config-surfaces.sh" "$FIXTURE_TARGET" "$SCAN_TMP"
jq -s 'map(select(.surface_kind == "dockerfile" and .path == "Dockerfile")) | length >= 1' "$SCAN_TMP" >/dev/null
jq -s 'map(select(.surface_kind == "docker-compose" and .path == "docker-compose.yml")) | length >= 1' "$SCAN_TMP" >/dev/null
rm -f "$SCAN_TMP"

rm -rf "$FIXTURE_BUNDLE"
mkdir -p "$FIXTURE_BUNDLE/producers"
cp -a "$ROOT/internal/testfixtures/portolan-bundle/producers/." "$FIXTURE_BUNDLE/producers/"

"$ROOT/scripts/build-portolan-bundle.sh" "$FIXTURE_TARGET" "$FIXTURE_BUNDLE"

test "$(wc -l <"$FIXTURE_BUNDLE/hotspots.jsonl" | tr -d ' ')" -ge 1
test -f "$FIXTURE_BUNDLE/manifest.json"
test -f "$FIXTURE_BUNDLE/hotspots-full.jsonl"
test -f "$FIXTURE_BUNDLE/landscape-card.json"
test -f "$FIXTURE_BUNDLE/landscape-report.json"
jq empty "$FIXTURE_BUNDLE/landscape-card.json"
jq empty "$FIXTURE_BUNDLE/landscape-report.json"

jq -e 'select(.kind == "config" and .producer == "config-scan" and (.paths | length) >= 1)' \
  "$FIXTURE_BUNDLE/hotspots.jsonl" >/dev/null || {
  echo "expected config-scan hotspot in bundle" >&2
  exit 1
}
jq -e 'select(.kind == "debt-candidate" and (.summary | test("\\([0-9]+ symbols\\)")))' \
  "$FIXTURE_BUNDLE/hotspots.jsonl" >/dev/null || {
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
done <"$FIXTURE_BUNDLE/hotspots.jsonl"

if [[ -s "$FIXTURE_BUNDLE/gaps.jsonl" ]]; then
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    echo "$line" | validate_gap_line || { echo "invalid gap record: $line" >&2; exit 1; }
  done <"$FIXTURE_BUNDLE/gaps.jsonl"
fi

# Truncation smoke: budget=2 must truncate when full list is longer
TRUNC_BUNDLE=$(mktemp -d)
trap 'rm -rf "$TRUNC_BUNDLE"' EXIT
mkdir -p "$TRUNC_BUNDLE/producers"
cp -a "$ROOT/internal/testfixtures/portolan-bundle/producers/." "$TRUNC_BUNDLE/producers/"
PORTOLAN_HOTSPOT_BUDGET=2 "$ROOT/scripts/build-portolan-bundle.sh" "$FIXTURE_TARGET" "$TRUNC_BUNDLE"
jq -e '.hotspots_truncated == true or .hotspots_truncated == 1' "$TRUNC_BUNDLE/manifest.json" >/dev/null
full_n=$(wc -l <"$TRUNC_BUNDLE/hotspots-full.jsonl" | tr -d ' ')
bud_n=$(wc -l <"$TRUNC_BUNDLE/hotspots.jsonl" | tr -d ' ')
test "$full_n" -gt "$bud_n" || { echo "truncation: full=$full_n budgeted=$bud_n" >&2; exit 1; }

cd "$ROOT/viewer"
node scripts/build-static.js
node scripts/serve.js --bundle "$FIXTURE_BUNDLE" --port "$VIEWER_PORT" &
PID=$!
trap 'kill "${PID:-}" 2>/dev/null || true; rm -rf "$TRUNC_BUNDLE"' EXIT
sleep 1

BASE="http://127.0.0.1:$VIEWER_PORT"
HTML=$(curl -sf "$BASE/")
echo "$HTML" | grep -q '<h1>Portolan</h1>'
echo "$HTML" | grep -q 'id="tab-bar"'
echo "$HTML" | grep -q 'id="report-overview"'
echo "$HTML" | grep -q 'id="tab-findings"'
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

curl -sf "$BASE/bundle/landscape-card.json" | jq -e '.identity.name' >/dev/null
curl -sf "$BASE/bundle/landscape-report.json" | jq -e '.sections | length >= 1' >/dev/null
curl -sf "$BASE/api/hotspots?limit=3" | jq -e '.schema_version and (.records | length) >= 1' >/dev/null

"$ROOT/scripts/harness-bundle-query-smoke.sh"

echo "harness-portolan-smoke: ok"
