#!/usr/bin/env bash
# One-command orient: tool check → consent install → recipes → bundle → viewer.
# See docs/specs/089-orient-wizard/ and harness/SKILL.md.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)

YES=0
SKIP_INSTALL=0
NO_VIEWER=0
PORT=4173
LIMIT_REPOS=0
PRODUCERS="jscpd,semgrep,syft"
HOTSPOT_BUDGET=200
SHARD_TIMEOUT=600
JSCPD_MEMORY_MB=2048

usage() {
  cat <<'EOF'
usage: orient-wizard.sh <target-root> <orient-dir> [options]

Options:
  --yes              Auto-approve tool installs
  --skip-install     Never install missing tools (gaps only)
  --no-viewer        Build bundle only; do not start viewer
  --port N           Viewer port (default 4173)
  --limit-repos N    Cap discovered git repos for sharded producers
  --producers LIST   Comma-separated: jscpd,semgrep,syft (default all three)
  --hotspot-budget N Max hotspots in bundle (default 200)
  --shard-timeout SEC Per-shard timeout in seconds (default 600)
  --jscpd-memory-mb N Node heap cap for each jscpd shard (default 2048)
  -h, --help         Show this help
EOF
}

log() { echo "orient-wizard: $*" >&2; }
fail_log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >>"$FAILURES_LOG"; }

POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) YES=1; shift ;;
    --skip-install) SKIP_INSTALL=1; shift ;;
    --no-viewer) NO_VIEWER=1; shift ;;
    --port) PORT="$2"; shift 2 ;;
    --limit-repos) LIMIT_REPOS="$2"; shift 2 ;;
    --producers) PRODUCERS="$2"; shift 2 ;;
    --hotspot-budget) HOTSPOT_BUDGET="$2"; shift 2 ;;
    --shard-timeout) SHARD_TIMEOUT="$2"; shift 2 ;;
    --jscpd-memory-mb) JSCPD_MEMORY_MB="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    --) shift; POSITIONAL+=("$@"); break ;;
    -*) echo "unknown option: $1" >&2; usage; exit 2 ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

if [[ ${#POSITIONAL[@]} -lt 2 ]]; then
  usage >&2
  exit 2
fi

TARGET_ROOT=$(cd "${POSITIONAL[0]}" && pwd)
ORIENT_DIR=${POSITIONAL[1]}
PRODUCERS_DIR="$ORIENT_DIR/producers"
FAILURES_LOG="$PRODUCERS_DIR/_failures.log"
SHARD_GAPS="$PRODUCERS_DIR/_gaps.jsonl"
SEMGREP_RULES="$ROOT/harness/recipes/semgrep-rules/portolan-local.yaml"

mkdir -p "$ORIENT_DIR" "$PRODUCERS_DIR"
: >"$FAILURES_LOG"
: >"$SHARD_GAPS"

append_shard_gap() {
  local id=$1 surface=$2 status=$3 summary=$4 repo=$5
  jq -nc \
    --arg id "$id" --arg surface "$surface" --arg status "$status" \
    --arg summary "$summary" --arg repo "$repo" \
    '{id:$id,surface:$surface,status:$status,summary:$summary,repo:$repo}' >>"$SHARD_GAPS"
}

run_shard() {
  local producer=$1 repo=$2
  shift 2
  local slug
  slug=$(repo_slug "$repo")
  if ! timeout "$SHARD_TIMEOUT" "$@"; then
    local code=$?
    if [[ $code -eq 124 ]]; then
      append_shard_gap "shard-${producer}-${slug}" "$producer" "failed" \
        "${producer} timed out after ${SHARD_TIMEOUT}s on ${slug}" "$repo"
      fail_log "${producer} timeout: $repo"
    else
      append_shard_gap "shard-${producer}-${slug}" "$producer" "failed" \
        "${producer} failed (exit ${code}) on ${slug}" "$repo"
      fail_log "${producer} failed: $repo (exit $code)"
    fi
    return 1
  fi
  return 0
}

command -v jq >/dev/null || { log "jq is required"; exit 1; }
command -v node >/dev/null || { log "node is required for viewer"; exit 1; }

has_producer() {
  local p=$1
  [[ ",$PRODUCERS," == *",$p,"* ]]
}

confirm() {
  local prompt=$1
  [[ "$YES" -eq 1 ]] && return 0
  read -r -p "$prompt [y/N] " ans
  [[ "${ans,,}" == "y" || "${ans,,}" == "yes" ]]
}

install_tool() {
  local tool=$1
  shift
  local -a cmds=("$@")
  if [[ "$SKIP_INSTALL" -eq 1 ]]; then
    log "skip install $tool (--skip-install)"
    return 1
  fi
  if command -v "$tool" >/dev/null 2>&1; then
    return 0
  fi
  log "missing: $tool"
  for c in "${cmds[@]}"; do
    log "  try: $c"
  done
  if ! confirm "Install $tool now?"; then
    log "skipped $tool (operator declined)"
    return 1
  fi
  for c in "${cmds[@]}"; do
  log "running: $c"
    if eval "$c"; then
      command -v "$tool" >/dev/null && return 0
    fi
  done
  log "failed to install $tool"
  return 1
}

ensure_tools() {
  if has_producer jscpd; then
    install_tool jscpd \
      "npm install -g jscpd" \
      "brew install jscpd" || true
  fi
  if has_producer semgrep; then
    install_tool semgrep \
      "pipx install semgrep" \
      "brew install semgrep" || true
  fi
  if has_producer syft; then
    install_tool syft \
      "brew install syft" \
      "curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin" || true
  fi
}

discover_repos() {
  local -a repos=()
  if [[ -d "$TARGET_ROOT/.git" ]]; then
    repos=("$TARGET_ROOT")
  else
    while IFS= read -r gitdir; do
      repos+=("$(dirname "$gitdir")")
    done < <(find "$TARGET_ROOT" -name .git -type d 2>/dev/null | sort)
    if [[ ${#repos[@]} -eq 0 ]]; then
      repos=("$TARGET_ROOT")
    fi
  fi
  if [[ "$LIMIT_REPOS" -gt 0 && ${#repos[@]} -gt "$LIMIT_REPOS" ]]; then
    log "limiting repos from ${#repos[@]} to $LIMIT_REPOS"
    repos=("${repos[@]:0:$LIMIT_REPOS}")
  fi
  printf '%s\n' "${repos[@]}"
}

repo_slug() {
  local p=$1
  basename "$p" | tr ' /' '__'
}

run_jscpd() {
  command -v jscpd >/dev/null || { log "jscpd not available"; return 1; }
  local repo out
  while IFS= read -r repo; do
    [[ -z "$repo" ]] && continue
    local slug
    slug=$(repo_slug "$repo")
    out="$PRODUCERS_DIR/jscpd/$slug"
    mkdir -p "$out"
    log "jscpd: $repo (${JSCPD_MEMORY_MB}MB cap, ${SHARD_TIMEOUT}s timeout)"
    NODE_OPTIONS="--max-old-space-size=${JSCPD_MEMORY_MB}" \
      run_shard jscpd "$repo" \
      jscpd "$repo" \
        --reporters json \
        --output "$out" \
        --min-lines 5 \
        --min-tokens 50 \
        --threshold 999999 \
        --noSymlinks \
        --ignore "**/node_modules/**,**/.git/**,**/vendor/**" \
        2>>"$FAILURES_LOG" || true
  done < <(discover_repos)
}

run_semgrep() {
  command -v semgrep >/dev/null || { log "semgrep not available"; return 1; }
  local rules="$SEMGREP_RULES"
  if [[ ! -f "$rules" ]]; then
    rules="p/default"
    log "local semgrep rules missing; using p/default (needs approval for network rules)"
  fi
  mkdir -p "$PRODUCERS_DIR/semgrep"
  local repos
  mapfile -t repos < <(discover_repos)
  if [[ ${#repos[@]} -eq 1 ]]; then
    log "semgrep: ${repos[0]}"
    run_shard semgrep "${repos[0]}" \
      semgrep scan "${repos[0]}" \
        --config "$rules" \
        --json \
        --output "$PRODUCERS_DIR/semgrep/findings.json" \
        --metrics off 2>>"$FAILURES_LOG" || true
  else
    local repo slug
    for repo in "${repos[@]}"; do
      slug=$(repo_slug "$repo")
      log "semgrep: $repo"
      run_shard semgrep "$repo" \
        semgrep scan "$repo" \
          --config "$rules" \
          --json \
          --output "$PRODUCERS_DIR/semgrep/${slug}.json" \
          --metrics off 2>>"$FAILURES_LOG" || true
    done
  fi
}

run_syft() {
  command -v syft >/dev/null || { log "syft not available"; return 1; }
  mkdir -p "$PRODUCERS_DIR/syft"
  local repo slug
  while IFS= read -r repo; do
    [[ -z "$repo" ]] && continue
    slug=$(repo_slug "$repo")
    log "syft: $repo"
    run_shard syft "$repo" \
      syft scan "dir:$repo" -o cyclonedx-json \
        >"$PRODUCERS_DIR/syft/${slug}-cyclonedx.json" 2>>"$FAILURES_LOG" || true
  done < <(discover_repos)
}

ensure_tools

if has_producer jscpd && command -v jscpd >/dev/null; then
  run_jscpd || true
elif has_producer jscpd; then
  fail_log "jscpd skipped: not installed"
fi

if has_producer semgrep && command -v semgrep >/dev/null; then
  run_semgrep || true
elif has_producer semgrep; then
  fail_log "semgrep skipped: not installed"
fi

if has_producer syft && command -v syft >/dev/null; then
  run_syft || true
elif has_producer syft; then
  fail_log "syft skipped: not installed"
fi

export ORIENT_HOTSPOT_BUDGET="$HOTSPOT_BUDGET"
"$ROOT/scripts/build-orient-bundle.sh" "$TARGET_ROOT" "$ORIENT_DIR"

log "--- summary ---"
if [[ -f "$ORIENT_DIR/manifest.json" ]]; then
  jq -r '"hotspots=\(.hotspot_count) gaps=\(.gap_count) target=\(.target_root)"' "$ORIENT_DIR/manifest.json"
fi
if [[ -f "$ORIENT_DIR/hotspots.jsonl" ]]; then
  log "top hotspots:"
  head -5 "$ORIENT_DIR/hotspots.jsonl" | jq -r '"  #\(.rank) [\(.kind)] \(.summary)"'
fi
if [[ -f "$ORIENT_DIR/gaps.jsonl" && -s "$ORIENT_DIR/gaps.jsonl" ]]; then
  log "gaps:"
  cat "$ORIENT_DIR/gaps.jsonl" | jq -r '"  \(.surface): \(.status) — \(.summary)"'
fi

if [[ "$NO_VIEWER" -eq 1 ]]; then
  log "bundle ready at $ORIENT_DIR (--no-viewer)"
  exit 0
fi

cd "$ROOT/viewer"
node scripts/build-static.js
log "viewer: http://127.0.0.1:$PORT/ (Ctrl+C to stop)"
exec node scripts/serve.js --bundle "$ORIENT_DIR" --port "$PORT"
