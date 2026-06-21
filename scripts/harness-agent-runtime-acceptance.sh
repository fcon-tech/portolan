#!/usr/bin/env bash
# Runtime acceptance for the installable Cursor/OpenCode Portolan harness.
# This is intentionally separate from CI-friendly install smoke: it calls real
# agent CLIs when available and records unavailable lanes as not_assessed unless
# --require is used.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
HARNESS="all"
REQUIRE=""
TIMEOUT_SEC="${PORTOLAN_AGENT_ACCEPTANCE_TIMEOUT:-240}"
OPENCODE_MODEL="${PORTOLAN_OPENCODE_MODEL:-opencode/deepseek-v4-flash-free}"
OPENCODE_DANGEROUS_SKIP_PERMISSIONS=0
KEEP_TMP=0
OUT_DIR=""

usage() {
  cat <<EOF
usage: harness-agent-runtime-acceptance.sh [options]

Options:
  --harness LIST       Comma-separated: cursor,opencode,all (default all)
  --require LIST       Fail if listed runtime lanes are unavailable or fail
                       (cursor,opencode,all)
  --timeout SEC        Per-agent timeout (default ${TIMEOUT_SEC})
  --opencode-model ID  OpenCode model id (default ${OPENCODE_MODEL})
  --opencode-dangerously-skip-permissions
                       Pass OpenCode's permission-bypass flag. Default is off.
  --out DIR            Directory for lane transcripts (default isolated run dir)
  --keep-tmp           Keep isolated target roots
  -h, --help           Show this help

State labels:
  verified      lane ran, installed harness, built core bundle, queried repos/gaps
  not_assessed  lane CLI was unavailable and was not required
  failed        lane was required or ran but did not satisfy the contract
EOF
}

log() { echo "agent-runtime-acceptance: $*" >&2; }
fail() { echo "agent-runtime-acceptance: FAIL: $*" >&2; exit 1; }

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
    --harness) require_opt_value --harness "${2:-}"; HARNESS="$2"; shift 2 ;;
    --require) require_opt_value --require "${2:-}"; REQUIRE="$2"; shift 2 ;;
    --timeout) require_opt_value --timeout "${2:-}"; TIMEOUT_SEC="$2"; shift 2 ;;
    --opencode-model) require_opt_value --opencode-model "${2:-}"; OPENCODE_MODEL="$2"; shift 2 ;;
    --opencode-dangerously-skip-permissions) OPENCODE_DANGEROUS_SKIP_PERMISSIONS=1; shift ;;
    --out) require_opt_value --out "${2:-}"; OUT_DIR="$2"; shift 2 ;;
    --keep-tmp) KEEP_TMP=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if ! [[ "$TIMEOUT_SEC" =~ ^[0-9]+$ ]] || [[ "$TIMEOUT_SEC" -lt 1 ]]; then
  fail "invalid --timeout: $TIMEOUT_SEC"
fi

has_item() {
  local list=$1 item=$2
  [[ "$list" == "all" || ",$list," == *",$item,"* ]]
}

require_lane() {
  local item=$1
  [[ -n "$REQUIRE" ]] && has_item "$REQUIRE" "$item"
}

validate_lane_list() {
  local name=$1 list=$2 allow_empty=${3:-0}
  local old_ifs=$IFS item
  if [[ -z "$list" ]]; then
    [[ "$allow_empty" -eq 1 ]] && return 0
    fail "$name cannot be empty"
  fi
  IFS=,
  for item in $list; do
    case "$item" in
      all|cursor|opencode) ;;
      *) IFS=$old_ifs; fail "unknown lane in $name: $item" ;;
    esac
  done
  IFS=$old_ifs
}

validate_lane_list --harness "$HARNESS"
validate_lane_list --require "$REQUIRE" 1
command -v rg >/dev/null 2>&1 || fail "rg is required for transcript assertions"

TMP_PARENT=$(mktemp -d)
if [[ "$KEEP_TMP" -eq 0 ]]; then
  trap 'rm -rf "$TMP_PARENT"' EXIT
else
  log "keeping temp root $TMP_PARENT"
fi

if [[ -z "$OUT_DIR" ]]; then
  OUT_DIR="$TMP_PARENT/transcripts"
elif [[ "$OUT_DIR" != /* ]]; then
  OUT_DIR="$PWD/$OUT_DIR"
fi
mkdir -p "$OUT_DIR"

make_target() {
  local lane=$1
  local target="$TMP_PARENT/${lane}-target"
  mkdir -p "$target/src"
  git -C "$target" init -q
  printf '# Sample Service\n\nPortolan %s acceptance target.\n' "$lane" >"$target/README.md"
  printf '{"scripts":{"test":"echo ok"},"dependencies":{"express":"latest"}}\n' >"$target/package.json"
  printf 'export function hello(name) { return `hello ${name}`; }\n' >"$target/src/index.js"
  "$ROOT/scripts/portolan-install.sh" "$target" \
    --portolan-path "$ROOT" \
    --bundle-dir "$target/.portolan/atlas" \
    --harness all >/dev/null
  printf '%s\n' "$target"
}

prompt_text() {
  cat <<'EOF'
Use the installed Portolan atlas harness for this workspace.
Build the first atlas bundle only. Then query repos and gaps through
portolan-bundle-query. Answer only JSON with repo_count, gap_count, core_only,
and commands_ran. Do not modify source files.
EOF
}

validate_bundle() {
  local lane=$1 target=$2 transcript=$3
  local bundle="$target/.portolan/atlas"
  [[ -f "$bundle/manifest.json" ]] || fail "$lane did not create manifest.json"
  [[ -f "$bundle/repo-profiles.json" ]] || fail "$lane did not create repo-profiles.json"
  [[ -f "$bundle/gaps.jsonl" ]] || fail "$lane did not create gaps.jsonl"

  local repo_count gap_count core_only
  repo_count=$(jq -r '.repo_count // empty' "$bundle/manifest.json")
  gap_count=$(jq -r '.gap_count // empty' "$bundle/manifest.json")
  core_only=$(jq -r '.core_only // false' "$bundle/manifest.json")
  [[ "$repo_count" == "1" ]] || fail "$lane repo_count=$repo_count (expected 1)"
  [[ "$gap_count" == "3" ]] || fail "$lane gap_count=$gap_count (expected 3)"
  [[ "$core_only" == "true" ]] || fail "$lane core_only=$core_only (expected true)"

  rg -q 'portolan-scan\.sh' "$transcript" || fail "$lane transcript missing portolan-scan.sh"
  rg -q 'portolan-bundle-query\.sh.*repos --bundle' "$transcript" || fail "$lane transcript missing repos query"
  rg -q 'portolan-bundle-query\.sh.*gaps --bundle' "$transcript" || fail "$lane transcript missing gaps query"
  validate_target_read_only "$lane" "$target"
}

validate_target_read_only() {
  local lane=$1 target=$2 unexpected
  cmp -s "$target/README.md" \
    <(printf '# Sample Service\n\nPortolan %s acceptance target.\n' "$lane") \
    || fail "$lane modified README.md"
  cmp -s "$target/package.json" \
    <(printf '{"scripts":{"test":"echo ok"},"dependencies":{"express":"latest"}}\n') \
    || fail "$lane modified package.json"
  cmp -s "$target/src/index.js" \
    <(printf 'export function hello(name) { return `hello ${name}`; }\n') \
    || fail "$lane modified src/index.js"

  unexpected=$(
    cd "$target"
    find . \
      -path './.git' -prune -o \
      -path './.cursor' -prune -o \
      -path './.portolan' -prune -o \
      -type f -print |
      sort |
      grep -Ev '^(\./AGENTS\.md|\./README\.md|\./package\.json|\./src/index\.js)$' || true
  )
  [[ -z "$unexpected" ]] || fail "$lane wrote unexpected target files: $unexpected"
}

run_cursor_lane() {
  if ! has_item "$HARNESS" cursor; then
    return 0
  fi
  if ! command -v cursor-agent >/dev/null 2>&1; then
    if require_lane cursor || [[ "$REQUIRE" == "all" ]]; then
      fail "cursor-agent unavailable"
    fi
    echo "cursor: not_assessed (cursor-agent unavailable)"
    return 0
  fi
  local target transcript rc
  target=$(make_target cursor)
  transcript="$OUT_DIR/cursor.jsonl"
  timeout "$TIMEOUT_SEC" cursor-agent --print --output-format stream-json --force --trust \
    --workspace "$target" "$(prompt_text)" >"$transcript" || rc=$?
  rc=${rc:-0}
  [[ "$rc" -eq 0 ]] || fail "cursor-agent exited $rc"
  validate_bundle cursor "$target" "$transcript"
  echo "cursor: verified"
}

run_opencode_lane() {
  if ! has_item "$HARNESS" opencode; then
    return 0
  fi
  if ! command -v opencode >/dev/null 2>&1; then
    if require_lane opencode || [[ "$REQUIRE" == "all" ]]; then
      fail "opencode unavailable"
    fi
    echo "opencode: not_assessed (opencode unavailable)"
    return 0
  fi
  local target transcript rc
  target=$(make_target opencode)
  transcript="$OUT_DIR/opencode.jsonl"
  local -a cmd=(timeout "$TIMEOUT_SEC" opencode run --dir "$target" --format json -m "$OPENCODE_MODEL")
  if [[ "$OPENCODE_DANGEROUS_SKIP_PERMISSIONS" -eq 1 ]]; then
    cmd+=(--dangerously-skip-permissions)
  fi
  cmd+=("$(prompt_text)")
  "${cmd[@]}" >"$transcript" || rc=$?
  rc=${rc:-0}
  [[ "$rc" -eq 0 ]] || fail "opencode exited $rc"
  validate_bundle opencode "$target" "$transcript"
  echo "opencode: verified"
}

run_cursor_lane
run_opencode_lane

echo "agent-runtime-acceptance: ok"
