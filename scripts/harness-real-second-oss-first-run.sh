#!/usr/bin/env bash
# Fresh first-run proof for a real non-Bigtop OSS multi-repo target.
#
# The source target is copied into an isolated temp root before installing
# Portolan. This keeps the real corpus read-only while still exercising the
# captain route: install target-local wrappers, scan, query, Q&A, handoff, and
# optional viewer smoke.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
SOURCE_TARGET_ROOT=""
BUNDLE_DIR=""
OUT_DIR=""
PRODUCERS="${PORTOLAN_REAL_SECOND_OSS_PRODUCERS:-config,ctags,syft}"
HOTSPOT_BUDGET="${PORTOLAN_REAL_SECOND_OSS_HOTSPOT_BUDGET:-160}"
SHARD_TIMEOUT="${PORTOLAN_REAL_SECOND_OSS_SHARD_TIMEOUT:-240}"
VIEWER_SMOKE=0
KEEP_TMP=0

usage() {
  cat <<'EOF'
usage: scripts/harness-real-second-oss-first-run.sh --target-root DIR --bundle-dir DIR [options]

Runs the installable Portolan captain route on a copied non-Bigtop OSS
multi-repo target and verifies the resulting atlas bundle. The original target
is never written.

Options:
  --target-root DIR      Real non-Bigtop OSS target to copy and scan.
  --bundle-dir DIR       Empty output directory for the fresh bundle.
  --out-dir DIR          Directory for logs and viewer screenshots.
  --producers LIST       Producer list (default: config,ctags,syft).
  --hotspot-budget N     Max hotspots in bundle (default: 160).
  --shard-timeout SEC    Per-shard timeout seconds (default: 240).
  --viewer-smoke         Open the resulting bundle in the viewer smoke harness.
  --keep-tmp             Keep isolated copied target root.
  -h, --help             Show this help.

The harness intentionally excludes heavyweight generated folders while copying
the target: top-level .git, .portolan, node_modules, dist, build, target,
coverage, cache directories, and virtualenv folders. Nested repo .git folders
are preserved because they define multi-repo inventory boundaries. This is a
repeatability proof for source/config/documentation landscape behavior, not a
raw artifact inventory.
EOF
}

fail() {
  echo "harness-real-second-oss-first-run: FAIL: $*" >&2
  exit 1
}

log() {
  echo "harness-real-second-oss-first-run: $*" >&2
}

require_opt_value() {
  local flag=$1 val=${2:-}
  if [[ -z "$val" || "$val" == -* ]]; then
    echo "option $flag requires a value" >&2
    usage >&2
    exit 2
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target-root) require_opt_value --target-root "${2:-}"; SOURCE_TARGET_ROOT="$2"; shift 2 ;;
    --bundle-dir) require_opt_value --bundle-dir "${2:-}"; BUNDLE_DIR="$2"; shift 2 ;;
    --out-dir) require_opt_value --out-dir "${2:-}"; OUT_DIR="$2"; shift 2 ;;
    --producers) require_opt_value --producers "${2:-}"; PRODUCERS="$2"; shift 2 ;;
    --hotspot-budget) require_opt_value --hotspot-budget "${2:-}"; HOTSPOT_BUDGET="$2"; shift 2 ;;
    --shard-timeout) require_opt_value --shard-timeout "${2:-}"; SHARD_TIMEOUT="$2"; shift 2 ;;
    --viewer-smoke) VIEWER_SMOKE=1; shift ;;
    --keep-tmp) KEEP_TMP=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

[[ -n "$SOURCE_TARGET_ROOT" ]] || { usage >&2; exit 2; }
[[ -n "$BUNDLE_DIR" ]] || { usage >&2; exit 2; }

if [[ "$SOURCE_TARGET_ROOT" != /* ]]; then
  SOURCE_TARGET_ROOT="$PWD/$SOURCE_TARGET_ROOT"
fi
SOURCE_TARGET_ROOT=$(cd "$SOURCE_TARGET_ROOT" && pwd)
[[ -d "$SOURCE_TARGET_ROOT" ]] || fail "target root does not exist: $SOURCE_TARGET_ROOT"
case "$SOURCE_TARGET_ROOT" in
  "$ROOT"|"$ROOT"/*) fail "source target must be external to the Portolan checkout: $SOURCE_TARGET_ROOT" ;;
esac
if printf '%s\n' "$SOURCE_TARGET_ROOT" | grep -Eiq 'bigtop'; then
  fail "source target appears to be Bigtop, use harness-bigtop-acceptance instead: $SOURCE_TARGET_ROOT"
fi

if ! [[ "$HOTSPOT_BUDGET" =~ ^[0-9]+$ ]] || [[ "$HOTSPOT_BUDGET" -lt 1 ]]; then
  fail "invalid --hotspot-budget: $HOTSPOT_BUDGET"
fi
if ! [[ "$SHARD_TIMEOUT" =~ ^[0-9]+$ ]] || [[ "$SHARD_TIMEOUT" -lt 1 ]]; then
  fail "invalid --shard-timeout: $SHARD_TIMEOUT"
fi

for cmd in jq tar sha256sum; do
  command -v "$cmd" >/dev/null 2>&1 || fail "$cmd is required"
done

if [[ "$BUNDLE_DIR" != /* ]]; then
  BUNDLE_DIR="$PWD/$BUNDLE_DIR"
fi
if [[ -e "$BUNDLE_DIR" && ! -d "$BUNDLE_DIR" ]]; then
  fail "bundle dir exists and is not a directory: $BUNDLE_DIR"
fi
mkdir -p "$BUNDLE_DIR"
BUNDLE_DIR=$(cd "$BUNDLE_DIR" && pwd)
if [[ "$BUNDLE_DIR" == "/" || "$BUNDLE_DIR" == "$ROOT" || "$BUNDLE_DIR" == "$ROOT"/* || "$BUNDLE_DIR" == "$SOURCE_TARGET_ROOT" || "$BUNDLE_DIR" == "$SOURCE_TARGET_ROOT"/* ]]; then
  fail "refusing unsafe bundle dir: $BUNDLE_DIR"
fi
if [[ -n "$(find "$BUNDLE_DIR" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
  fail "bundle dir must be empty; refusing to delete existing contents: $BUNDLE_DIR"
fi

if [[ -z "$OUT_DIR" ]]; then
  OUT_DIR=$(mktemp -d)
elif [[ "$OUT_DIR" != /* ]]; then
  OUT_DIR="$PWD/$OUT_DIR"
fi
mkdir -p "$OUT_DIR"
OUT_DIR=$(cd "$OUT_DIR" && pwd)

TMP_PARENT=$(mktemp -d)
if [[ "$KEEP_TMP" -eq 0 ]]; then
  trap 'rm -rf "$TMP_PARENT"' EXIT
else
  log "keeping temp root $TMP_PARENT"
fi
COPIED_TARGET_ROOT="$TMP_PARENT/target"
mkdir -p "$COPIED_TARGET_ROOT"

source_snapshot() {
  local root=$1
  (
    cd "$root"
    find . \
      \( -path './.git' \
      -o -path './.portolan' -o -path './*/.portolan' \
      -o -path './node_modules' -o -path './*/node_modules' \
      -o -path './dist' -o -path './*/dist' \
      -o -path './build' -o -path './*/build' \
      -o -path './target' -o -path './*/target' \
      -o -path './coverage' -o -path './*/coverage' \
      -o -path './.cache' -o -path './*/.cache' \
      -o -path './__pycache__' -o -path './*/__pycache__' \
      -o -path './.venv' -o -path './*/.venv' \
      -o -path './venv' -o -path './*/venv' \
      \) -prune -o -type f -print0 |
      sort -z |
      xargs -0 sha256sum 2>/dev/null |
      sha256sum | cut -d' ' -f1
  )
}

SOURCE_BEFORE=$(source_snapshot "$SOURCE_TARGET_ROOT")

log "copying source target to isolated root"
tar \
  --exclude='./.git' \
  --exclude='./.portolan' --exclude='./*/.portolan' \
  --exclude='./.cursor' --exclude='./*/.cursor' \
  --exclude='./node_modules' --exclude='./*/node_modules' \
  --exclude='./dist' --exclude='./*/dist' \
  --exclude='./build' --exclude='./*/build' \
  --exclude='./target' --exclude='./*/target' \
  --exclude='./coverage' --exclude='./*/coverage' \
  --exclude='./.cache' --exclude='./*/.cache' \
  --exclude='./__pycache__' --exclude='./*/__pycache__' \
  --exclude='./.venv' --exclude='./*/.venv' \
  --exclude='./venv' --exclude='./*/venv' \
  -C "$SOURCE_TARGET_ROOT" -cf - . | tar -C "$COPIED_TARGET_ROOT" -xf -

log "installing target-local Portolan wrappers"
"$ROOT/scripts/portolan-install.sh" "$COPIED_TARGET_ROOT" \
  --portolan-path "$ROOT" \
  --bundle-dir "$BUNDLE_DIR" \
  --harness all >"$OUT_DIR/install.log"

PORTOLAN_BIN="$COPIED_TARGET_ROOT/.portolan/bin"
[[ -x "$PORTOLAN_BIN/portolan-scan.sh" ]] || fail "installed scan wrapper missing"
[[ -x "$PORTOLAN_BIN/portolan-bundle-query.sh" ]] || fail "installed query wrapper missing"
[[ -x "$PORTOLAN_BIN/portolan-query-eval.sh" ]] || fail "installed query-eval wrapper missing"
[[ -x "$PORTOLAN_BIN/portolan-captain-handoff.sh" ]] || fail "installed handoff wrapper missing"

log "running doctor, dry-run, and scan"
"$PORTOLAN_BIN/portolan-scan.sh" --doctor "$COPIED_TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer >"$OUT_DIR/doctor.json"
"$PORTOLAN_BIN/portolan-scan.sh" --dry-run "$COPIED_TARGET_ROOT" "$BUNDLE_DIR" --skip-install --no-viewer >"$OUT_DIR/dry-run.txt"
"$PORTOLAN_BIN/portolan-scan.sh" "$COPIED_TARGET_ROOT" "$BUNDLE_DIR" \
  --yes \
  --skip-install \
  --no-viewer \
  --producers "$PRODUCERS" \
  --hotspot-budget "$HOTSPOT_BUDGET" \
  --shard-timeout "$SHARD_TIMEOUT" >"$OUT_DIR/scan.log"
"$PORTOLAN_BIN/portolan-scan.sh" --status "$COPIED_TARGET_ROOT" "$BUNDLE_DIR" >"$OUT_DIR/status.json"

log "building Q&A and captain handoff"
"$PORTOLAN_BIN/portolan-query-eval.sh" --run "$BUNDLE_DIR" >"$OUT_DIR/query-eval.log"
"$PORTOLAN_BIN/portolan-captain-handoff.sh" "$BUNDLE_DIR" >"$OUT_DIR/captain-handoff.log"

[[ -f "$BUNDLE_DIR/manifest.json" ]] || fail "manifest.json missing"
[[ -f "$BUNDLE_DIR/repos.json" ]] || fail "repos.json missing"
[[ -f "$BUNDLE_DIR/captain-atlas-scorecard.json" ]] || fail "captain-atlas-scorecard.json missing"
[[ -f "$BUNDLE_DIR/captain-qna-eval.json" ]] || fail "captain-qna-eval.json missing"
[[ -f "$BUNDLE_DIR/captain-handoff.json" ]] || fail "captain-handoff.json missing"
[[ -f "$BUNDLE_DIR/captain-handoff.md" ]] || fail "captain-handoff.md missing"

jq -e '.repo_count >= 2 and .repo_discovered_total == .repo_count and (.repo_limit_applied // 0) == 0 and (.relationship_count // 0) >= 1' \
  "$BUNDLE_DIR/manifest.json" >/dev/null ||
  fail "fresh second OSS manifest does not prove exhaustive multi-repo relationship-bearing scan"
jq -e '.local_first.target_source_mutation == false and .status == "completed" and .exit_code == 0' \
  "$BUNDLE_DIR/receipt.json" >/dev/null ||
  fail "receipt does not prove completed local-first scan"
jq -e '.scenario == "captain-atlas-first-run" and .verdict == "verified" and .target.repo_count >= 2 and (.kill_pack_build.recommendation == "pack-and-navigate")' \
  "$BUNDLE_DIR/captain-atlas-scorecard.json" >/dev/null ||
  fail "scorecard does not verify captain-atlas usefulness"
jq -e '.scenario == "captain-agent-qna-drilldown" and .verdict == "verified" and .answer_count == 7' \
  "$BUNDLE_DIR/captain-qna-eval.json" >/dev/null ||
  fail "captain Q&A eval is not verified"
jq -e '.scenario == "captain-atlas-handoff" and .verdict == "verified" and .statuses.relationship_drill_down == "verified" and .statuses.selected_code_drill_down == "verified"' \
  "$BUNDLE_DIR/captain-handoff.json" >/dev/null ||
  fail "captain handoff is not verified for relationship and selected-code drill-down"

"$PORTOLAN_BIN/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 5 |
  jq -e '.records | length >= 2' >/dev/null
"$PORTOLAN_BIN/portolan-bundle-query.sh" relationships --bundle "$BUNDLE_DIR" --limit 20 |
  jq -e '.query.family == "relationships" and .total_records >= 1' >/dev/null
"$PORTOLAN_BIN/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20 |
  jq -e '.query.family == "gaps" and (.records | type == "array")' >/dev/null

SEARCH_ROW=$(jq -rc 'select((.repo_id // "") != "" and (.path // "") != "")' "$BUNDLE_DIR/search-index.jsonl" | head -n 1 || true)
if [[ -z "$SEARCH_ROW" ]]; then
  fail "search-index has no selectable source row"
fi
SEARCH_REPO=$(jq -r '.repo_id' <<<"$SEARCH_ROW")
SEARCH_PATH=$(jq -r '.path' <<<"$SEARCH_ROW")
SEARCH_LINE=$(jq -r '.line // 1' <<<"$SEARCH_ROW")
"$PORTOLAN_BIN/portolan-bundle-query.sh" selected-code --bundle "$BUNDLE_DIR" --repo "$SEARCH_REPO" --path "$SEARCH_PATH" --line "$SEARCH_LINE" --limit 20 |
  jq -e '.query.family == "selected-code" and (.records | length >= 1)' >/dev/null ||
  fail "selected-code drill-down query failed"

VIEWER_STATUS="not_assessed"
if [[ "$VIEWER_SMOKE" -eq 1 ]]; then
  log "running viewer smoke"
  "$ROOT/scripts/harness-viewer-corpus-smoke.sh" \
    --second-oss-bundle "$BUNDLE_DIR" \
    --require-second-oss-relationships \
    --output-dir "$OUT_DIR/viewer" >"$OUT_DIR/viewer-smoke.log"
  VIEWER_STATUS="verified"
fi

SOURCE_AFTER=$(source_snapshot "$SOURCE_TARGET_ROOT")
if [[ "$SOURCE_BEFORE" != "$SOURCE_AFTER" ]]; then
  fail "source target changed during first-run proof"
fi

REPO_COUNT=$(jq -r '.repo_count' "$BUNDLE_DIR/manifest.json")
RELATIONSHIP_COUNT=$(jq -r '.relationship_count // 0' "$BUNDLE_DIR/manifest.json")
jq -n \
  --arg source_target_root "$SOURCE_TARGET_ROOT" \
  --arg copied_target_root "$COPIED_TARGET_ROOT" \
  --arg bundle_dir "$BUNDLE_DIR" \
  --arg out_dir "$OUT_DIR" \
  --arg producers "$PRODUCERS" \
  --arg viewer_status "$VIEWER_STATUS" \
  --arg source_before "$SOURCE_BEFORE" \
  --arg source_after "$SOURCE_AFTER" \
  --argjson repo_count "$REPO_COUNT" \
  --argjson relationship_count "$RELATIONSHIP_COUNT" \
  '{
    schema_version:"0.1.0",
    scenario:"real-second-oss-first-run",
    verdict:"verified",
    source_target_root:$source_target_root,
    copied_target_root:$copied_target_root,
    bundle_dir:$bundle_dir,
    out_dir:$out_dir,
    copy_exclusions:["top-level .git",".portolan",".cursor","node_modules","dist","build","target","coverage",".cache","__pycache__",".venv","venv"],
    producers:$producers,
    repo_count:$repo_count,
    relationship_count:$relationship_count,
    source_target_read_only:($source_before == $source_after),
    viewer_smoke:$viewer_status
  }' >"$BUNDLE_DIR/real-second-oss-first-run.json"

log "ok source=$SOURCE_TARGET_ROOT bundle=$BUNDLE_DIR repos=$REPO_COUNT relationships=$RELATIONSHIP_COUNT viewer=$VIEWER_STATUS"
