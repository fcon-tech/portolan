#!/usr/bin/env bash
# One-command Portolan scan: tool check → recipes → bundle → viewer.
# See docs/specs/089-portolan-scan/ (superseded by portolan-scan) and harness/SKILL.md.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
prepend_path_if_dir() {
  local dir=$1
  [[ -n "$dir" && -d "$dir" ]] || return 0
  case ":$PATH:" in
    *":$dir:"*) ;;
    *) PATH="$dir:$PATH" ;;
  esac
}
if [[ -n "${PORTOLAN_EXTRA_PATH:-}" ]]; then
  IFS=':' read -r -a portolan_extra_paths <<<"$PORTOLAN_EXTRA_PATH"
  for portolan_extra_path in "${portolan_extra_paths[@]}"; do
    prepend_path_if_dir "$portolan_extra_path"
  done
fi
if [[ -n "${HOME:-}" ]]; then
  prepend_path_if_dir "${HOME}/.local/bin"
fi
prepend_path_if_dir "/home/linuxbrew/.linuxbrew/bin"
prepend_path_if_dir "/opt/homebrew/bin"
export PATH
# shellcheck source=portolan-ignore.sh
. "$(dirname "$0")/portolan-ignore.sh"
# shellcheck source=lib/jscpd-bounded.sh
. "$(dirname "$0")/lib/jscpd-bounded.sh"
# shellcheck source=lib/install-ctags.sh
. "$(dirname "$0")/lib/install-ctags.sh"

JSCPD_IGNORE_GLOBS="**/.git/**,**/.portolan/**,**/.codex-subagents/**,**/.cursor/**,**/.agents/**,**/node_modules/**,**/vendor/**,**/build/**,**/dist/**,**/target/**,**/portolan-smoke/**,**/generated/**"

YES=0
SKIP_INSTALL=0
NO_VIEWER=0
WITH_MAP_BRIDGE=0
CORE_ONLY=0
CROSS_REPO_DUP=0
CROSS_REPO_DUP_ONLY=0
CROSS_REPO_DUP_MAX_PAIRS=0
PORT=4173
LIMIT_REPOS=0
PRODUCERS="config,jscpd,semgrep,syft,ctags"
HOTSPOT_BUDGET=200
SHARD_TIMEOUT=600
JSCPD_MEMORY_MB=2048
JSCPD_SUBSHARD_FILE_THRESHOLD="${PORTOLAN_JSCPD_SUBSHARD_THRESHOLD:-3000}"
JSCPD_SUBSHARD_MAX="${PORTOLAN_JSCPD_SUBSHARD_MAX:-12}"
CROSS_JSCPD_FILES_PER_REPO="${PORTOLAN_CROSS_JSCPD_FILES_PER_REPO:-1500}"

usage() {
  cat <<'EOF'
usage: portolan-scan.sh <target-root> <bundle-dir> [options]

Options:
  --yes              Auto-approve tool installs
  --skip-install     Never install missing tools (gaps only)
  --no-viewer        Build bundle only; do not start viewer
  --core-only        Stop after core bundle artifacts (manifest/repos/hotspots/gaps/graph-slice)
  --with-map-bridge  After bundle build, run portolan map + map-bridge sidecar (opt-in)
  --cross-repo-dup   Pairwise bounded jscpd across repo pairs (multi-repo only)
  --cross-repo-dup-only  Re-run only cross-repo jscpd + bundle build (existing producers)
  --cross-repo-dup-max-pairs N  Cap cross-repo pairs (0 = all pairs; default 0)
  --port N           Viewer port (default 4173)
  --limit-repos N    Cap discovered git repos for sharded producers
  --producers LIST   Comma-separated: config,jscpd,semgrep,syft,ctags (default all five)
  --hotspot-budget N Max hotspots in bundle (default 200)
  --shard-timeout SEC Per-shard timeout in seconds (default 600)
  --jscpd-memory-mb N Node heap cap for each jscpd shard (default 2048)
  -h, --help         Show this help
EOF
}

log() { echo "portolan scan: $*" >&2; }
fail_log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >>"$FAILURES_LOG"; }

require_opt_value() {
  local flag=$1 val=${2:-}
  if [[ -z "$val" || "$val" == -* ]]; then
    echo "option $flag requires a value" >&2
    usage >&2
    exit 2
  fi
}

normalize_bundle_dir() {
  local raw=$1 out
  [[ -n "$raw" ]] || { echo "bundle dir is required" >&2; exit 2; }
  [[ "$raw" != "/" ]] || { echo "refusing to use / as bundle dir" >&2; exit 2; }
  if [[ -e "$raw" && ! -d "$raw" ]]; then
    echo "bundle dir exists and is not a directory: $raw" >&2
    exit 2
  fi
  mkdir -p "$raw"
  out=$(cd "$raw" && pwd)
  if [[ "$out" == "/" || "$out" == "$TARGET_ROOT" ]]; then
    echo "refusing unsafe bundle dir: $out" >&2
    exit 2
  fi
  if [[ -n "${HOME:-}" && "$out" == "$HOME" ]]; then
    echo "refusing unsafe bundle dir: $out" >&2
    exit 2
  fi
  printf '%s\n' "$out"
}

POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) YES=1; shift ;;
    --skip-install) SKIP_INSTALL=1; shift ;;
    --no-viewer) NO_VIEWER=1; shift ;;
    --core-only) CORE_ONLY=1; shift ;;
    --with-map-bridge) WITH_MAP_BRIDGE=1; shift ;;
    --cross-repo-dup) CROSS_REPO_DUP=1; shift ;;
    --cross-repo-dup-only) CROSS_REPO_DUP=1; CROSS_REPO_DUP_ONLY=1; shift ;;
    --cross-repo-dup-max-pairs) require_opt_value --cross-repo-dup-max-pairs "${2:-}"; CROSS_REPO_DUP_MAX_PAIRS="$2"; shift 2 ;;
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
BUNDLE_DIR=$(normalize_bundle_dir "${POSITIONAL[1]}")
PRODUCERS_DIR="$BUNDLE_DIR/producers"
FAILURES_LOG="$PRODUCERS_DIR/_failures.log"
SHARD_GAPS="$PRODUCERS_DIR/_gaps.jsonl"
SEMGREP_RULES="$ROOT/harness/recipes/semgrep-rules/portolan-local.yaml"

mkdir -p "$BUNDLE_DIR" "$PRODUCERS_DIR"
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
  local code=0
  timeout "$SHARD_TIMEOUT" "$@" || code=$?
  if [[ $code -ne 0 ]]; then
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

hash_text() {
  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s' "$1" | sha256sum | cut -d' ' -f1
  elif command -v shasum >/dev/null 2>&1; then
    printf '%s' "$1" | shasum -a 256 | cut -d' ' -f1
  else
    log "sha256sum or shasum is required"
    exit 1
  fi
}

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
  local missing=0
  if has_producer jscpd; then
    install_tool jscpd \
      "npm install -g jscpd" \
      "brew install jscpd" || missing=1
  fi
  if has_producer semgrep; then
    install_tool semgrep \
      "pipx install semgrep" \
      "brew install semgrep" || missing=1
  fi
  if has_producer syft; then
    install_tool syft \
      "brew install syft" || missing=1
  fi
  if has_producer ctags; then
    if ! install_tool ctags \
      "portolan_install_ctags" \
      "brew install universal-ctags"; then
      missing=1
    fi
  fi
  if [[ "$missing" -ne 0 && "$YES" -eq 1 && "$SKIP_INSTALL" -eq 0 ]]; then
    log "required producer tool(s) missing after install attempts; aborting (--yes)"
    exit 2
  fi
}

# Bounded jscpd without recording a shard gap (sub-shard / pair attempts).
jscpd_try_bounded() {
  local code=0
  jscpd_run_bounded "$@" || code=$?
  return "$code"
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
    portolan_repo_file_list "$repo" >"$list_file"
    if [[ ! -s "$list_file" ]]; then
      log "ctags: $repo (no non-ignored files)"
      rm -f "$list_file"
      continue
    fi
    log "ctags: $repo ($(wc -l <"$list_file" | tr -d ' ') files, gitignore-aware)"
    local ok=0
    if run_shard ctags "$repo" \
      bash -c 'cd "$1" && ctags --output-format=json --fields=+nKz --links=no -L "$2" -f "$3"' \
      _ "$repo" "$list_file" "$outdir/tags.json" 2>>"$FAILURES_LOG"; then
      ok=1
    fi
    if [[ "$ok" -eq 0 ]] || [[ ! -f "$outdir/tags.json" ]] || ! jq -e . "$outdir/tags.json" >/dev/null 2>&1; then
      append_shard_gap "shard-ctags-${slug}" "ctags" "cannot_verify" \
        "ctags produced no usable tags.json" "$repo"
      fail_log "ctags failed: $repo"
    fi
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
  hash=$(hash_text "$p" | cut -c1-8)
  echo "${base}-${hash}"
}

jscpd_subshard_segments() {
  # Emit top-level path segments (first component) for sub-sharding, capped.
  local list_file=$1
  awk -F/ 'NF > 0 && $1 != "" { print $1 }' "$list_file" | sort -u | head -n "$JSCPD_SUBSHARD_MAX"
}

run_jscpd_repo() {
  local repo=$1 slug=$2 out_base=$3
  local list_file file_count ok=0 seg subpath out code
  list_file=$(mktemp)
  portolan_repo_file_list "$repo" >"$list_file"
  file_count=$(wc -l <"$list_file" | tr -d ' ')

  if [[ "$file_count" -le "$JSCPD_SUBSHARD_FILE_THRESHOLD" ]]; then
    out="$out_base"
    mkdir -p "$out"
    log "jscpd: $repo ($file_count files, bounded, ${JSCPD_MEMORY_MB}MB, ${SHARD_TIMEOUT}s)"
    code=0
    if jscpd_try_bounded "$repo" "$out"; then
      jscpd_dir_has_report "$out" && ok=1
    else
      code=$?
      [[ "$code" -eq 124 ]] && fail_log "jscpd timeout: $repo"
    fi
  else
    log "jscpd: $repo ($file_count files → sub-shards, max $JSCPD_SUBSHARD_MAX)"
    while IFS= read -r seg; do
      [[ -z "$seg" ]] && continue
      subpath="$repo/$seg"
      [[ -d "$subpath" ]] || continue
      out="$out_base/$seg"
      mkdir -p "$out"
      log "jscpd sub-shard: $repo/$seg"
      if jscpd_try_bounded "$subpath" "$out"; then
        jscpd_dir_has_report "$out" && ok=1
      fi
    done < <(jscpd_subshard_segments "$list_file")
  fi
  rm -f "$list_file"

  if [[ "$ok" -eq 0 ]]; then
    append_shard_gap "shard-jscpd-${slug}" "jscpd" "cannot_verify" \
      "jscpd produced no report for repo (all sub-shards failed or timed out)" "$repo"
    fail_log "jscpd failed: $repo"
    return 1
  fi
  return 0
}

run_jscpd() {
  command -v jscpd >/dev/null || { log "jscpd not available"; return 1; }
  local repo slug out_base
  while IFS= read -r repo; do
    [[ -z "$repo" ]] && continue
    slug=$(repo_slug "$repo")
    out_base="$PRODUCERS_DIR/jscpd/$slug"
    mkdir -p "$out_base"
    run_jscpd_repo "$repo" "$slug" "$out_base" || true
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

jscpd_cross_stage_repo() {
  local repo=$1 staging=$2 label=$3 max_files=$4
  local dest="$staging/$label" f rel d n=0
  mkdir -p "$dest"
  while IFS= read -r f; do
    [[ -z "$f" || ! -f "$f" ]] && continue
    [[ "$n" -ge "$max_files" ]] && break
    rel="${f#"$repo"/}"
    [[ -z "$rel" || "$rel" == "$f" ]] && continue
    d="$dest/$(dirname "$rel")"
    mkdir -p "$d"
    ln -sf "$f" "$dest/$rel"
    n=$((n + 1))
  done < <(portolan_repo_file_list "$repo")
  echo "$n"
}

run_jscpd_cross() {
  # Pairwise bounded cross-repo duplication (spec 110): one jscpd per repo pair.
  if ! command -v jscpd >/dev/null; then
    fail_log "jscpd-cross skipped: jscpd not installed"
    append_gap_record "gap-cross-repo-dup" "duplication" "not_assessed" \
      "--cross-repo-dup requested but jscpd is not installed" \
      "harness/recipes/duplication-jscpd.md"
    return 0
  fi
  local -a repos=()
  mapfile -t repos < <(discover_repos)
  if [[ ${#repos[@]} -lt 2 ]]; then
    log "jscpd-cross: single repo landscape; skipping cross pass"
    return 0
  fi
  local cross_root="$PRODUCERS_DIR/jscpd-cross"
  mkdir -p "$cross_root"
  local pairs_total=0 pairs_ok=0 pairs_failed=0 clone_pairs=0
  local i j ra rb slug_a slug_b pair_dir pair_limit=$CROSS_REPO_DUP_MAX_PAIRS
  log "jscpd-cross: pairwise bounded passes for ${#repos[@]} repos"
  for ((i = 0; i < ${#repos[@]}; i++)); do
    for ((j = i + 1; j < ${#repos[@]}; j++)); do
      if [[ "$pair_limit" -gt 0 && "$pairs_total" -ge "$pair_limit" ]]; then
        break 2
      fi
      ra="${repos[$i]}"
      rb="${repos[$j]}"
      slug_a=$(repo_slug "$ra")
      slug_b=$(repo_slug "$rb")
      pair_dir="$cross_root/${slug_a}--${slug_b}"
      mkdir -p "$pair_dir"
      pairs_total=$((pairs_total + 1))
      log "jscpd-cross pair: $slug_a <-> $slug_b (≤${CROSS_JSCPD_FILES_PER_REPO} files/repo)"
      staging=$(mktemp -d)
      na=$(jscpd_cross_stage_repo "$ra" "$staging" "$slug_a" "$CROSS_JSCPD_FILES_PER_REPO")
      nb=$(jscpd_cross_stage_repo "$rb" "$staging" "$slug_b" "$CROSS_JSCPD_FILES_PER_REPO")
      pair_ok=0
      if [[ "$na" -eq 0 && "$nb" -eq 0 ]]; then
        printf '%s\n' '{"duplicates":[]}' >"$pair_dir/jscpd-report.json"
        pair_ok=1
      elif jscpd_try_bounded "$staging/$slug_a" "$staging/$slug_b" "$pair_dir"; then
        jscpd_dir_has_report "$pair_dir" && pair_ok=1
      fi
      rm -rf "$staging"
      if [[ "$pair_ok" -eq 1 ]]; then
        pairs_ok=$((pairs_ok + 1))
        n=$(jq -r '.duplicates | map(select(.firstFile.name != null and .secondFile.name != null)) | length' \
          "$pair_dir"/jscpd-report.json 2>/dev/null || echo 0)
        [[ "$n" =~ ^[0-9]+$ ]] && clone_pairs=$((clone_pairs + n))
      else
        pairs_failed=$((pairs_failed + 1))
        fail_log "jscpd-cross pair failed: $slug_a -- $slug_b"
      fi
    done
  done

  jq -n \
    --arg completed_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --argjson pairs_total "$pairs_total" \
    --argjson pairs_ok "$pairs_ok" \
    --argjson pairs_failed "$pairs_failed" \
    --argjson clone_pairs "$clone_pairs" \
    '{schema_version:"0.1.0",completed_at:$completed_at,pairs_total:$pairs_total,pairs_ok:$pairs_ok,pairs_failed:$pairs_failed,clone_pairs:$clone_pairs}' \
    >"$cross_root/_scan.json"

  if [[ "$pairs_failed" -gt 0 ]]; then
    append_gap_record "gap-cross-repo-dup" "duplication" "cannot_verify" \
      "cross-repo pairwise jscpd: ${pairs_failed}/${pairs_total} pair(s) failed" \
      "harness/recipes/duplication-jscpd.md"
  else
    log "jscpd-cross: complete ${pairs_ok}/${pairs_total} pairs, clone_pairs=$clone_pairs"
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

if [[ "$CROSS_REPO_DUP_ONLY" -eq 1 ]]; then
  rm -rf "$PRODUCERS_DIR/jscpd-cross"
  run_jscpd_cross || true
  export PORTOLAN_HOTSPOT_BUDGET="$HOTSPOT_BUDGET"
  export PORTOLAN_LIMIT_REPOS="$LIMIT_REPOS"
  export PORTOLAN_BUNDLE_CORE_ONLY="$CORE_ONLY"
  "$ROOT/scripts/build-portolan-bundle.sh" "$TARGET_ROOT" "$BUNDLE_DIR"
  log "done (cross-repo-dup-only): $BUNDLE_DIR"
  exit 0
fi

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
  append_gap_record "gap-ctags" "symbols" "cannot_verify" \
    "ctags required but not installed after preflight; see harness/recipes/symbols-ctags.md" \
    "harness/recipes/symbols-ctags.md"
  if [[ "$YES" -eq 1 && "$SKIP_INSTALL" -eq 0 ]]; then
    log "aborting: ctags required (--yes)"
    exit 2
  fi
fi

if [[ "$CROSS_REPO_DUP" -eq 1 ]]; then
  run_jscpd_cross || true
fi

export PORTOLAN_HOTSPOT_BUDGET="$HOTSPOT_BUDGET"
export PORTOLAN_LIMIT_REPOS="$LIMIT_REPOS"
export PORTOLAN_BUNDLE_CORE_ONLY="$CORE_ONLY"
"$ROOT/scripts/build-portolan-bundle.sh" "$TARGET_ROOT" "$BUNDLE_DIR"

append_bundle_gap() {
  local id=$1 surface=$2 status=$3 summary=$4 recipe=${5:-}
  jq -nc \
    --arg id "$id" --arg surface "$surface" --arg status "$status" \
    --arg summary "$summary" --arg recipe "$recipe" \
    '{id:$id,surface:$surface,status:$status,summary:$summary} + (if $recipe != "" then {recipe:$recipe} else {} end)' \
    >>"$BUNDLE_DIR/gaps.jsonl"
  if [[ -f "$BUNDLE_DIR/manifest.json" ]]; then
    local gc tmp
    gc=$(wc -l <"$BUNDLE_DIR/gaps.jsonl" | tr -d ' ')
    tmp=$(mktemp)
    jq --argjson gc "$gc" '.gap_count = $gc' "$BUNDLE_DIR/manifest.json" >"$tmp"
    mv "$tmp" "$BUNDLE_DIR/manifest.json"
  fi
}

run_map_bridge() {
  local map_out="$BUNDLE_DIR/map"
  log "map-bridge: portolan map → $map_out"
  if ! (cd "$ROOT" && go run ./cmd/portolan map --root "$TARGET_ROOT" --out "$map_out" --force); then
    fail_log "map-bridge: portolan map failed"
    append_bundle_gap "gap-map-bridge" "map" "cannot_verify" \
      "portolan map failed during --with-map-bridge scan" \
      "harness/SKILL.md"
    return 0
  fi
  if ! "$ROOT/scripts/build-map-bridge.sh" "$map_out" "$BUNDLE_DIR"; then
    fail_log "map-bridge: build-map-bridge.sh failed"
    append_bundle_gap "gap-map-bridge-copy" "map" "cannot_verify" \
      "map output present but map-bridge sidecar copy failed" \
      "scripts/build-map-bridge.sh"
    return 0
  fi
  log "map-bridge: sidecar at $BUNDLE_DIR/map-bridge"
}

if [[ "$WITH_MAP_BRIDGE" -eq 1 ]]; then
  run_map_bridge || true
fi

log "--- summary ---"
if [[ -f "$BUNDLE_DIR/manifest.json" ]]; then
  jq -r '"hotspots=\(.hotspot_count) gaps=\(.gap_count) target=\(.target_root)"' "$BUNDLE_DIR/manifest.json"
fi
if [[ -f "$BUNDLE_DIR/hotspots.jsonl" ]]; then
  log "top hotspots:"
  head -5 "$BUNDLE_DIR/hotspots.jsonl" | jq -r '"  #\(.rank) [\(.kind)] \(.summary)"'
fi
if [[ -f "$BUNDLE_DIR/gaps.jsonl" && -s "$BUNDLE_DIR/gaps.jsonl" ]]; then
  log "gaps:"
  cat "$BUNDLE_DIR/gaps.jsonl" | jq -r '"  \(.surface): \(.status) — \(.summary)"'
fi

if [[ "$NO_VIEWER" -eq 1 ]]; then
  log "bundle ready at $BUNDLE_DIR (--no-viewer)"
  exit 0
fi

command -v node >/dev/null || { log "node is required for viewer"; exit 1; }

cd "$ROOT/viewer"
node scripts/build-static.js
log "viewer: http://127.0.0.1:$PORT/ (Ctrl+C to stop)"
exec node scripts/serve.js --bundle "$BUNDLE_DIR" --port "$PORT"
