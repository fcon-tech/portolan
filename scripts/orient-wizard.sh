#!/usr/bin/env bash
# One-command orient: tool check → consent install → recipes → bundle → viewer.
# See docs/specs/089-orient-wizard/ and harness/SKILL.md.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
# shellcheck source=orient-ignore.sh
. "$(dirname "$0")/orient-ignore.sh"

JSCPD_IGNORE_GLOBS="**/.git/**,**/.portolan/**,**/.codex-subagents/**,**/.cursor/**,**/.agents/**,**/node_modules/**,**/vendor/**,**/build/**,**/dist/**,**/target/**,**/orient-smoke/**,**/generated/**"

YES=0
SKIP_INSTALL=0
NO_VIEWER=0
PORT=4173
LIMIT_REPOS=0
PRODUCERS="config,jscpd,semgrep,syft,ctags"
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
  --producers LIST   Comma-separated: config,jscpd,semgrep,syft,ctags (default all five)
  --hotspot-budget N Max hotspots in bundle (default 200)
  --shard-timeout SEC Per-shard timeout in seconds (default 600)
  --jscpd-memory-mb N Node heap cap for each jscpd shard (default 2048)
  -h, --help         Show this help
EOF
}

log() { echo "orient-wizard: $*" >&2; }
fail_log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >>"$FAILURES_LOG"; }

require_opt_value() {
  local flag=$1 val=${2:-}
  if [[ -z "$val" || "$val" == -* ]]; then
    echo "option $flag requires a value" >&2
    usage >&2
    exit 2
  fi
}

POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) YES=1; shift ;;
    --skip-install) SKIP_INSTALL=1; shift ;;
    --no-viewer) NO_VIEWER=1; shift ;;
    --port) require_opt_value --port "${2:-}"; PORT="$2"; shift 2 ;;
    --limit-repos) require_opt_value --limit-repos "${2:-}"; LIMIT_REPOS="$2"; shift 2 ;;
    --producers) require_opt_value --producers "${2:-}"; PRODUCERS="$2"; shift 2 ;;
    --hotspot-budget) require_opt_value --hotspot-budget "${2:-}"; HOTSPOT_BUDGET="$2"; shift 2 ;;
    --shard-timeout) require_opt_value --shard-timeout "${2:-}"; SHARD_TIMEOUT="$2"; shift 2 ;;
    --jscpd-memory-mb) require_opt_value --jscpd-memory-mb "${2:-}"; JSCPD_MEMORY_MB="$2"; shift 2 ;;
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

if ! [[ "$HOTSPOT_BUDGET" =~ ^[0-9]+$ ]] || [[ "$HOTSPOT_BUDGET" -lt 1 ]]; then
  echo "invalid --hotspot-budget: $HOTSPOT_BUDGET (positive integer required)" >&2
  exit 2
fi
if ! [[ "$SHARD_TIMEOUT" =~ ^[0-9]+$ ]] || [[ "$SHARD_TIMEOUT" -lt 1 ]]; then
  echo "invalid --shard-timeout: $SHARD_TIMEOUT (positive integer required)" >&2
  exit 2
fi
if ! [[ "$JSCPD_MEMORY_MB" =~ ^[0-9]+$ ]] || [[ "$JSCPD_MEMORY_MB" -lt 256 ]]; then
  echo "invalid --jscpd-memory-mb: $JSCPD_MEMORY_MB (integer >= 256 required)" >&2
  exit 2
fi
if [[ "$LIMIT_REPOS" != 0 ]] && { ! [[ "$LIMIT_REPOS" =~ ^[0-9]+$ ]] || [[ "$LIMIT_REPOS" -lt 1 ]]; }; then
  echo "invalid --limit-repos: $LIMIT_REPOS (positive integer required)" >&2
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

append_gap_record() {
  local id=$1 surface=$2 status=$3 summary=$4 recipe=${5:-}
  jq -nc \
    --arg id "$id" --arg surface "$surface" --arg status "$status" \
    --arg summary "$summary" --arg recipe "$recipe" \
    '{id:$id,surface:$surface,status:$status,summary:$summary} + (if $recipe != "" then {recipe:$recipe} else {} end)' >>"$SHARD_GAPS"
}

run_shard() {
  local producer=$1 repo=$2
  shift 2
  local slug
  slug=$(repo_slug "$repo")
  if ! timeout "$SHARD_TIMEOUT" "$@"; then
    local code=$?
    if [[ $code -eq 124 ]]; then
      append_shard_gap "shard-${producer}-${slug}" "$producer" "cannot_verify" \
        "${producer} timed out after ${SHARD_TIMEOUT}s on ${slug}" "$repo"
      fail_log "${producer} timeout: $repo"
    else
      append_shard_gap "shard-${producer}-${slug}" "$producer" "cannot_verify" \
        "${producer} failed (exit ${code}) on ${slug}" "$repo"
      fail_log "${producer} failed: $repo (exit $code)"
    fi
    return 1
  fi
  return 0
}

command -v jq >/dev/null || { log "jq is required"; exit 1; }

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
  if has_producer ctags; then
    install_tool ctags \
      "brew install universal-ctags" \
      "apt-get install -y universal-ctags" || true
  fi
}

run_config() {
  mkdir -p "$PRODUCERS_DIR/config"
  local repo slug out
  while IFS= read -r repo; do
    [[ -z "$repo" ]] && continue
    slug=$(repo_slug "$repo")
    out="$PRODUCERS_DIR/config/${slug}.jsonl"
    log "config-surfaces: $repo"
    run_shard config "$repo" \
      "$ROOT/scripts/scan-config-surfaces.sh" "$repo" "$out" 2>>"$FAILURES_LOG" || true
  done < <(discover_repos)
}

run_ctags() {
  command -v ctags >/dev/null || { log "ctags not available"; return 1; }
  mkdir -p "$PRODUCERS_DIR/ctags"
  local repo slug outdir list_file
  while IFS= read -r repo; do
    [[ -z "$repo" ]] && continue
    slug=$(repo_slug "$repo")
    outdir="$PRODUCERS_DIR/ctags/$slug"
    mkdir -p "$outdir"
    list_file=$(mktemp)
    orient_repo_file_list "$repo" >"$list_file"
    if [[ ! -s "$list_file" ]]; then
      log "ctags: $repo (no non-ignored files)"
      rm -f "$list_file"
      continue
    fi
    log "ctags: $repo ($(wc -l <"$list_file" | tr -d ' ') files, gitignore-aware)"
    run_shard ctags "$repo" \
      bash -c 'cd "$1" && ctags --output-format=json --fields=+nKz --links=no -L "$2" -f "$3"' \
      _ "$repo" "$list_file" "$outdir/tags.json" 2>>"$FAILURES_LOG" || true
    rm -f "$list_file"
  done < <(discover_repos)
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
  local base hash
  base=$(basename "$p" | tr ' /' '__')
  hash=$(printf '%s' "$p" | sha256sum | cut -c1-8)
  echo "${base}-${hash}"
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
        --gitignore \
        --ignore "$JSCPD_IGNORE_GLOBS" \
        2>>"$FAILURES_LOG" || true
  done < <(discover_repos)
}

run_semgrep() {
  command -v semgrep >/dev/null || { log "semgrep not available"; return 1; }
  local rules="$SEMGREP_RULES"
  if [[ ! -f "$rules" ]]; then
    log "local semgrep rules missing at $rules; recording gap (no network fallback)"
    append_gap_record "gap-semgrep-rules" "static-analysis" "not_assessed" \
      "Local semgrep rules missing; install harness/recipes/semgrep-rules/portolan-local.yaml" \
      "harness/recipes/static-semgrep-local.md"
    return 1
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

if has_producer config; then
  run_config || true
fi

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

if has_producer ctags && command -v ctags >/dev/null; then
  run_ctags || true
elif has_producer ctags; then
  append_gap_record "gap-ctags" "symbols" "not_assessed" \
    "ctags not installed; see harness/recipes/symbols-ctags.md" \
    "harness/recipes/symbols-ctags.md"
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

command -v node >/dev/null || { log "node is required for viewer"; exit 1; }

cd "$ROOT/viewer"
node scripts/build-static.js
log "viewer: http://127.0.0.1:$PORT/ (Ctrl+C to stop)"
exec node scripts/serve.js --bundle "$ORIENT_DIR" --port "$PORT"
