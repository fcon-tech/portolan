#!/usr/bin/env bash
# Reproducible atlas smoke for an arbitrary local target.
#
# This is the small acceptance check for the "not Bigtop-specific" product path:
# an agent can run the same harness route on another repo/landscape and get a
# usable atlas bundle plus query surface.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)

usage() {
  cat <<'EOF'
usage: scripts/harness-reproducible-atlas-smoke.sh <target-root> <bundle-dir>

Runs a bounded, no-install Portolan scan on a local target, then verifies the
atlas bundle and bundle-query surface. The target is read-only; outputs are
written under <bundle-dir>.

Environment:
  PORTOLAN_REPRO_PRODUCERS       Producer list (default: config,ctags)
  PORTOLAN_REPRO_HOTSPOT_BUDGET Budget for hotspot bundle (default: 120)
  PORTOLAN_REPRO_SHARD_TIMEOUT  Per-producer shard timeout seconds (default: 180)
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 2 ]]; then
  usage >&2
  exit 2
fi

TARGET_ROOT=$(cd "$1" && pwd)
BUNDLE_DIR=$2
PRODUCERS="${PORTOLAN_REPRO_PRODUCERS:-config,ctags}"
HOTSPOT_BUDGET="${PORTOLAN_REPRO_HOTSPOT_BUDGET:-120}"
SHARD_TIMEOUT="${PORTOLAN_REPRO_SHARD_TIMEOUT:-180}"

rm -rf "$BUNDLE_DIR"
mkdir -p "$BUNDLE_DIR"

"$ROOT/scripts/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" \
  --no-viewer \
  --yes \
  --skip-install \
  --producers "$PRODUCERS" \
  --hotspot-budget "$HOTSPOT_BUDGET" \
  --shard-timeout "$SHARD_TIMEOUT"

jq -e '.repo_count >= 1 and .target_root != ""' "$BUNDLE_DIR/manifest.json" >/dev/null
jq -e '.coverage.repo_count >= 1 and .coverage.component_count >= 1' "$BUNDLE_DIR/atlas-facts.json" >/dev/null
jq -e '.coverage.route_count >= 1' "$BUNDLE_DIR/atlas-surface-content.json" >/dev/null
jq -e 'length >= 1' "$BUNDLE_DIR/repos.json" >/dev/null
jq empty "$BUNDLE_DIR/landscape-report.json"
jq empty "$BUNDLE_DIR/landscape-card.json"

"$ROOT/scripts/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 5 |
  jq -e '.records | length >= 1' >/dev/null
"$ROOT/scripts/portolan-bundle-query.sh" landscape --bundle "$BUNDLE_DIR" --limit 5 |
  jq -e '.records | length >= 1' >/dev/null
"$ROOT/scripts/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 5 |
  jq -e '.records | type == "array"' >/dev/null
"$ROOT/scripts/portolan-bundle-query.sh" atlas --bundle "$BUNDLE_DIR" --section components --limit 5 |
  jq -e '.records | length >= 1' >/dev/null
"$ROOT/scripts/portolan-bundle-query.sh" atlas --bundle "$BUNDLE_DIR" --section edges --limit 5 |
  jq -e '.records | type == "array"' >/dev/null

FIRST_REPO=$(jq -r '.[0].id // empty' "$BUNDLE_DIR/repos.json")
if [[ -n "$FIRST_REPO" ]]; then
  "$ROOT/scripts/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --repo "$FIRST_REPO" --limit 5 |
    jq -e '.records | type == "array"' >/dev/null
fi

if [[ -s "$BUNDLE_DIR/hotspots.jsonl" ]]; then
  "$ROOT/scripts/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --limit 5 |
    jq -e '.records | type == "array"' >/dev/null
  if [[ -n "$FIRST_REPO" ]]; then
    "$ROOT/scripts/portolan-bundle-query.sh" hotspots --bundle "$BUNDLE_DIR" --repo "$FIRST_REPO" --limit 5 |
      jq -e '.records | type == "array"' >/dev/null
  fi
fi

if [[ -s "$BUNDLE_DIR/search-index.jsonl" ]]; then
  SEARCH_ROW=$(jq -rc 'select((.repo_id // "") != "" and (.path // "") != "")' "$BUNDLE_DIR/search-index.jsonl" | head -n 1 || true)
  if [[ -n "$SEARCH_ROW" ]]; then
    SEARCH_REPO=$(jq -r '.repo_id' <<<"$SEARCH_ROW")
    SEARCH_PATH=$(jq -r '.path' <<<"$SEARCH_ROW")
    SEARCH_LINE=$(jq -r '.line // 1' <<<"$SEARCH_ROW")
    "$ROOT/scripts/portolan-bundle-query.sh" source --bundle "$BUNDLE_DIR" --repo "$SEARCH_REPO" --path "$SEARCH_PATH" --line "$SEARCH_LINE" |
      jq -e '.records | length == 1' >/dev/null
  fi
fi

if [[ -s "$BUNDLE_DIR/symbol-index.jsonl" ]]; then
  SYMBOL_ROW=$(jq -rc 'select((.repo_id // "") != "" and (.name // "") != "")' "$BUNDLE_DIR/symbol-index.jsonl" | head -n 1 || true)
  if [[ -n "$SYMBOL_ROW" ]]; then
    SYMBOL_REPO=$(jq -r '.repo_id' <<<"$SYMBOL_ROW")
    SYMBOL_NAME=$(jq -r '.name' <<<"$SYMBOL_ROW")
    "$ROOT/scripts/portolan-bundle-query.sh" symbol --bundle "$BUNDLE_DIR" --repo "$SYMBOL_REPO" --name "$SYMBOL_NAME" --limit 5 |
      jq -e '.records | length >= 1 and all(.[]; .repo_id == "'"$SYMBOL_REPO"'")' >/dev/null
  fi
fi

echo "harness-reproducible-atlas-smoke: ok target=$TARGET_ROOT bundle=$BUNDLE_DIR"
