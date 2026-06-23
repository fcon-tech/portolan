#!/usr/bin/env bash
# One-command Portolan scan: tool check → recipes → bundle → viewer.
# See harness/SKILL.md and docs/captain-atlas/.
set -euo pipefail

ORIGINAL_ARGS=("$@")
START_EPOCH=$(date +%s)
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
# shellcheck source=lib/repo-discovery.sh
. "$(dirname "$0")/lib/repo-discovery.sh"

JSCPD_IGNORE_GLOBS="**/.git/**,**/.portolan/**,**/.codex-subagents/**,**/.cursor/**,**/.agents/**,**/node_modules/**,**/vendor/**,**/build/**,**/dist/**,**/target/**,**/portolan-smoke/**,**/generated/**"

YES=0
SKIP_INSTALL=0
NO_VIEWER=0
DOCTOR=0
DRY_RUN=0
STATUS=0
CLEAN=0
WITH_MAP_BRIDGE=0
CORE_ONLY=0
CROSS_REPO_DUP=0
CROSS_REPO_DUP_ONLY=0
CROSS_REPO_DUP_MAX_PAIRS=0
PROOF_PROFILE="bounded"
PORT=4173
LIMIT_REPOS=0
PRODUCERS="config,jscpd,semgrep,syft,ctags"
HOTSPOT_BUDGET=200
SHARD_TIMEOUT=600
JSCPD_MEMORY_MB=2048
JSCPD_SUBSHARD_FILE_THRESHOLD="${PORTOLAN_JSCPD_SUBSHARD_THRESHOLD:-3000}"
JSCPD_SUBSHARD_MAX="${PORTOLAN_JSCPD_SUBSHARD_MAX:-12}"
CROSS_JSCPD_FILES_PER_REPO="${PORTOLAN_CROSS_JSCPD_FILES_PER_REPO:-1500}"
EVIDENCE_SOURCE_CLASSIFICATION_LIMIT="${PORTOLAN_EVIDENCE_SOURCE_CLASSIFICATION_LIMIT:-5000}"
EVIDENCE_PROMOTED_FACT_LIMIT="${PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT:-200}"

usage() {
  cat <<'EOF'
usage: portolan-scan.sh <target-root> <bundle-dir> [options]

Options:
  --doctor           Report target shape, writable bundle path, tools, size, and local-first expectations
  --dry-run, --plan  Print doctor plus the scan read/write/tool plan; do not create outputs
  --status           Read live progress/receipt/manifest/gaps and print JSON; do not create outputs
  --clean            Safely remove generated Portolan bundle output; never delete target source
  --yes              Auto-approve tool installs
  --skip-install     Never install missing tools (gaps only)
  --no-viewer        Build bundle only; do not start viewer
  --core-only        Stop after core bundle artifacts (manifest/repos/hotspots/gaps/graph-slice)
  --with-map-bridge  After bundle build, run portolan map + map-bridge sidecar (opt-in)
  --cross-repo-dup   Pairwise bounded jscpd across repo pairs (multi-repo only)
  --cross-repo-dup-only  Re-run only cross-repo jscpd + bundle build (existing producers)
  --cross-repo-dup-max-pairs N  Cap cross-repo pairs (0 = all pairs; default 0)
  --proof-profile NAME  Evidence proof profile: bounded or full (default bounded).
                     full removes jscpd stratification caps and raises evidence
                     promotion limits; it is expensive and intended for strict
                     corpus proof, not default first-run UX.
  --port N           Viewer port (default 4173)
  --limit-repos N    Cap discovered git repos for sharded producers
  --producers LIST   Comma-separated: config,jscpd,semgrep,syft,ctags (default all five)
  --hotspot-budget N Max hotspots in bundle (default 200)
  --shard-timeout SEC Per-shard timeout in seconds (default 600)
  --jscpd-memory-mb N Node heap cap for each jscpd shard (default 2048)
  -h, --help         Show this help

First-run flow:
  1. portolan-scan.sh --doctor <target-root> <bundle-dir> --skip-install
  2. portolan-scan.sh --dry-run <target-root> <bundle-dir> --skip-install --no-viewer
  3. portolan-scan.sh <target-root> <bundle-dir> --yes --skip-install --no-viewer

Running scans write <bundle-dir>/progress.json. Completed and failed scans write
<bundle-dir>/receipt.json with command, target, bundle, producer states/gaps,
local-first flags, duration, and viewer handoff.
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

trim_trailing_slash() {
  local value=$1
  while [[ "$value" != "/" && "$value" == */ ]]; do
    value=${value%/}
  done
  printf '%s\n' "$value"
}

abs_path_maybe_missing() {
  local raw=$1 path probe suffix parent base
  [[ -n "$raw" ]] || { echo "path is required" >&2; exit 2; }
  if [[ "$raw" != /* ]]; then
    raw="$PWD/$raw"
  fi
  path=$(trim_trailing_slash "$raw")
  if [[ -e "$path" ]]; then
    if [[ -d "$path" ]]; then
      (cd "$path" && pwd)
    else
      parent=$(dirname "$path")
      base=$(basename "$path")
      printf '%s/%s\n' "$(cd "$parent" && pwd)" "$base"
    fi
    return 0
  fi
  probe="$path"
  suffix=""
  while [[ "$probe" != "/" && ! -e "$probe" ]]; do
    suffix="/$(basename "$probe")$suffix"
    probe=$(dirname "$probe")
  done
  if [[ -d "$probe" ]]; then
    printf '%s%s\n' "$(cd "$probe" && pwd)" "$suffix"
  else
    printf '%s\n' "$path"
  fi
}

status_gap_count() {
  local bundle=$1
  local manifest="$bundle/manifest.json"
  local gaps="$bundle/gaps.jsonl"
  if [[ -f "$manifest" ]] && jq -e '.gap_count != null' "$manifest" >/dev/null 2>&1; then
    jq -r '.gap_count' "$manifest"
  elif [[ -f "$gaps" ]]; then
    wc -l <"$gaps" | tr -d ' '
  else
    printf '0\n'
  fi
}

run_status() {
  local bundle=$1
  local progress="$bundle/progress.json"
  local receipt="$bundle/receipt.json"
  local manifest="$bundle/manifest.json"
  local gaps="$bundle/gaps.jsonl"
  local exists=false progress_exists=false receipt_exists=false manifest_exists=false gaps_exists=false
  local receipt_status="" receipt_target="" manifest_target="" generated_at="" compatibility="missing"
  local progress_status="" progress_phase="" progress_target="" progress_updated_at="" progress_json
  local progress_age_seconds=0 progress_elapsed_seconds=0 now_epoch progress_updated_epoch progress_start_epoch
  local reusable=false gap_count=0 producers_json viewer_json manifest_summary_json
  [[ -d "$bundle" ]] && exists=true
  [[ -f "$progress" ]] && progress_exists=true
  [[ -f "$receipt" ]] && receipt_exists=true
  [[ -f "$manifest" ]] && manifest_exists=true
  [[ -f "$gaps" ]] && gaps_exists=true
  if [[ "$manifest_exists" == true ]]; then
    manifest_target=$(jq -r '.target_root // ""' "$manifest" 2>/dev/null || true)
    generated_at=$(jq -r '.generated_at // ""' "$manifest" 2>/dev/null || true)
    manifest_summary_json=$(jq -c '
      {
        target_root:(.target_root // ""),
        generated_at:(.generated_at // ""),
        repo_count:(.repo_count // 0),
        repo_discovered_total:(.repo_discovered_total // .repo_count // 0),
        repo_limit_applied:(.repo_limit_applied // 0),
        proof_profile:(.proof_profile // "bounded"),
        hotspot_count:(.hotspot_count // 0),
        hotspots_total:(.hotspots_total // .hotspot_count // 0),
        hotspots_truncated:(.hotspots_truncated // 0),
        gap_count:(.gap_count // 0),
        gaps_total:(.gaps_total // .gap_count // 0),
        gaps_truncated:(.gaps_truncated // 0),
        cross_repo_duplication:(.cross_repo_duplication // null),
        promotion_health:(
          if .promotion_health then
            {
              classified_source_count:(.promotion_health.classified_source_count // 0),
              promoted_fact_count:(.promotion_health.promoted_fact_count // 0),
              unsupported_family_count:(.promotion_health.unsupported_family_count // 0),
              not_assessed_family_count:(.promotion_health.not_assessed_family_count // 0),
              statuses:(.promotion_health.statuses // {})
            }
          else null end
        )
      }
    ' "$manifest" 2>/dev/null || printf 'null')
  else
    manifest_summary_json='null'
  fi
  if [[ "$receipt_exists" == true ]]; then
    receipt_status=$(jq -r '.status // ""' "$receipt" 2>/dev/null || true)
    receipt_target=$(jq -r '.target.root // ""' "$receipt" 2>/dev/null || true)
    [[ -n "$generated_at" ]] || generated_at=$(jq -r '.completed_at // ""' "$receipt" 2>/dev/null || true)
  fi
  if [[ "$progress_exists" == true ]]; then
    progress_status=$(jq -r '.status // ""' "$progress" 2>/dev/null || true)
    progress_phase=$(jq -r '.phase // ""' "$progress" 2>/dev/null || true)
    progress_target=$(jq -r '.target.root // ""' "$progress" 2>/dev/null || true)
    progress_updated_at=$(jq -r '.updated_at // ""' "$progress" 2>/dev/null || true)
  fi
  if [[ "$exists" == false ]]; then
    compatibility="missing"
  elif [[ -n "$progress_target" && "$progress_target" != "$TARGET_ROOT" ]]; then
    compatibility="incompatible"
  elif [[ "$progress_status" == "running" && "$receipt_status" != "completed" && "$receipt_status" != "viewer_starting" ]]; then
    compatibility="running"
  elif [[ "$receipt_exists" != true && "$manifest_exists" != true ]]; then
    compatibility="incompatible"
  elif [[ -n "$receipt_target" && "$receipt_target" != "$TARGET_ROOT" ]]; then
    compatibility="incompatible"
  elif [[ -n "$manifest_target" && "$manifest_target" != "$TARGET_ROOT" ]]; then
    compatibility="incompatible"
  elif [[ "$manifest_exists" == true && ( "$receipt_status" == "completed" || "$receipt_status" == "viewer_starting" ) ]]; then
    compatibility="fresh"
    reusable=true
  elif [[ "$receipt_status" == "completed" || "$receipt_status" == "viewer_starting" ]]; then
    compatibility="stale"
  elif [[ "$manifest_exists" == true ]]; then
    compatibility="stale"
    reusable=true
  else
    compatibility="stale"
  fi
  [[ "$exists" == true ]] && gap_count=$(status_gap_count "$bundle")
  producers_json='[]'
  if [[ "$receipt_exists" == true ]]; then
    producers_json=$(jq -c '.producers // []' "$receipt" 2>/dev/null || printf '[]')
    viewer_json=$(jq -c '.viewer // null' "$receipt" 2>/dev/null || printf 'null')
  else
    viewer_json='null'
  fi
  if [[ "$progress_exists" == true ]]; then
    progress_json=$(jq -c . "$progress" 2>/dev/null || printf 'null')
    now_epoch=$(date +%s)
    progress_updated_epoch=$(date -d "$progress_updated_at" +%s 2>/dev/null || printf '0')
    progress_start_epoch=$(jq -r '.started_epoch // 0' "$progress" 2>/dev/null || printf '0')
    if [[ "$progress_updated_epoch" =~ ^[0-9]+$ && "$progress_updated_epoch" -gt 0 ]]; then
      progress_age_seconds=$(( now_epoch - progress_updated_epoch ))
    fi
    if [[ "$progress_start_epoch" =~ ^[0-9]+$ && "$progress_start_epoch" -gt 0 ]]; then
      progress_elapsed_seconds=$(( now_epoch - progress_start_epoch ))
    elif [[ "$progress_age_seconds" -gt 0 ]]; then
      progress_elapsed_seconds=$progress_age_seconds
    fi
  else
    progress_json='null'
  fi
  jq -n \
    --arg target "$TARGET_ROOT" \
    --arg bundle "$bundle" \
    --arg progress "$progress" \
    --arg receipt "$receipt" \
    --arg manifest "$manifest" \
    --arg gaps "$gaps" \
    --arg compatibility "$compatibility" \
    --arg receipt_status "$receipt_status" \
    --arg progress_status "$progress_status" \
    --arg progress_phase "$progress_phase" \
    --arg progress_updated_at "$progress_updated_at" \
    --arg generated_at "$generated_at" \
    --argjson progress_age_seconds "$progress_age_seconds" \
    --argjson progress_elapsed_seconds "$progress_elapsed_seconds" \
    --argjson exists "$exists" \
    --argjson progress_exists "$progress_exists" \
    --argjson receipt_exists "$receipt_exists" \
    --argjson manifest_exists "$manifest_exists" \
    --argjson gaps_exists "$gaps_exists" \
    --argjson reusable "$reusable" \
    --argjson gap_count "$gap_count" \
    --argjson producers "$producers_json" \
    --argjson viewer "$viewer_json" \
    --argjson progress_json "$progress_json" \
    --argjson manifest_summary "$manifest_summary_json" \
    '{
      schema_version:"0.1.0",
      target:$target,
      bundle:$bundle,
      exists:$exists,
      compatibility:$compatibility,
      reusable:$reusable,
      progress:{
        path:$progress,
        exists:$progress_exists,
        status:$progress_status,
        phase:$progress_phase,
        updated_at:$progress_updated_at,
        age_seconds:$progress_age_seconds,
        elapsed_seconds:$progress_elapsed_seconds,
        state:$progress_json
      },
      receipt:{path:$receipt,exists:$receipt_exists,status:$receipt_status},
      manifest:{path:$manifest,exists:$manifest_exists,summary:$manifest_summary},
      gaps:{path:$gaps,exists:$gaps_exists,count:$gap_count},
      generated_at:$generated_at,
      producer_states:$producers,
      viewer_handoff:$viewer,
      local_first:{read_only:true,target_source_mutation:false}
    }'
}

is_generated_bundle_marked() {
  local bundle=$1
  local receipt="$bundle/receipt.json"
  [[ -f "$bundle/.portolan-generated-bundle" ]] && return 0
  [[ -f "$receipt" ]] || return 1
  jq -e \
    --arg target "$TARGET_ROOT" \
    --arg bundle "$bundle" \
    '(.target.root == $target) and (.bundle.path == $bundle) and (.local_first.target_source_mutation == false)' \
    "$receipt" >/dev/null 2>&1
}

is_under_default_atlas() {
  local bundle=$1 default_atlas
  default_atlas=$(abs_path_maybe_missing "$TARGET_ROOT/.portolan/atlas")
  [[ "$bundle" == "$default_atlas" || "$bundle" == "$default_atlas"/* ]]
}

refuse_risky_clean_path() {
  local bundle=$1
  [[ "$bundle" != "/" ]] || { echo "refusing to clean unsafe path: /" >&2; exit 2; }
  [[ "$bundle" != "$TARGET_ROOT" ]] || { echo "refusing to clean target root: $bundle" >&2; exit 2; }
  [[ "$bundle" != "$ROOT" ]] || { echo "refusing to clean Portolan repo root: $bundle" >&2; exit 2; }
  [[ "$bundle" != "$PWD" ]] || { echo "refusing to clean cwd: $bundle" >&2; exit 2; }
  [[ -z "${HOME:-}" || "$bundle" != "$HOME" ]] || { echo "refusing to clean home: $bundle" >&2; exit 2; }
}

run_clean() {
  local bundle=$1
  refuse_risky_clean_path "$bundle"
  if [[ ! -e "$bundle" ]]; then
    jq -n --arg target "$TARGET_ROOT" --arg bundle "$bundle" \
      '{schema_version:"0.1.0",target:$target,bundle:$bundle,removed:false,reason:"missing"}'
    return 0
  fi
  [[ -d "$bundle" ]] || { echo "refusing to clean non-directory bundle path: $bundle" >&2; exit 2; }
  if ! is_under_default_atlas "$bundle" && ! is_generated_bundle_marked "$bundle"; then
    echo "refusing to clean unapproved bundle path: $bundle" >&2
    echo "clean is allowed only under <target-root>/.portolan/atlas or for a generated Portolan bundle marker/receipt" >&2
    exit 2
  fi
  rm -rf -- "$bundle"
  jq -n --arg target "$TARGET_ROOT" --arg bundle "$bundle" \
    '{schema_version:"0.1.0",target:$target,bundle:$bundle,removed:true,local_first:{target_source_mutation:false}}'
}

POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --doctor) DOCTOR=1; shift ;;
    --dry-run|--plan) DRY_RUN=1; shift ;;
    --status) STATUS=1; shift ;;
    --clean) CLEAN=1; shift ;;
    --yes) YES=1; shift ;;
    --skip-install) SKIP_INSTALL=1; shift ;;
    --no-viewer) NO_VIEWER=1; shift ;;
    --core-only) CORE_ONLY=1; shift ;;
    --with-map-bridge) WITH_MAP_BRIDGE=1; shift ;;
    --cross-repo-dup) CROSS_REPO_DUP=1; shift ;;
    --cross-repo-dup-only) CROSS_REPO_DUP=1; CROSS_REPO_DUP_ONLY=1; shift ;;
    --cross-repo-dup-max-pairs) require_opt_value --cross-repo-dup-max-pairs "${2:-}"; CROSS_REPO_DUP_MAX_PAIRS="$2"; shift 2 ;;
    --proof-profile) require_opt_value --proof-profile "${2:-}"; PROOF_PROFILE="$2"; shift 2 ;;
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

if [[ "$STATUS" -eq 1 && "$CLEAN" -eq 1 ]]; then
  echo "--status and --clean are mutually exclusive" >&2
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
case "$PROOF_PROFILE" in
  bounded)
    ;;
  full)
    if [[ "$LIMIT_REPOS" -ne 0 ]]; then
      echo "--proof-profile full cannot be combined with --limit-repos" >&2
      exit 2
    fi
    # Full proof mode is deliberately expensive. It removes sampling caps while
    # keeping large repos sharded; "full" means every segment is scanned, not
    # that one giant jscpd process must load the whole repo.
    JSCPD_SUBSHARD_FILE_THRESHOLD="${PORTOLAN_JSCPD_FULL_FILE_THRESHOLD:-3000}"
    JSCPD_SUBSHARD_MAX="${PORTOLAN_JSCPD_FULL_SUBSHARD_MAX:-1000000000}"
    CROSS_JSCPD_FILES_PER_REPO="${PORTOLAN_CROSS_JSCPD_FULL_FILES_PER_REPO:-0}"
    EVIDENCE_SOURCE_CLASSIFICATION_LIMIT="${PORTOLAN_EVIDENCE_FULL_SOURCE_CLASSIFICATION_LIMIT:-1000000000}"
    EVIDENCE_PROMOTED_FACT_LIMIT="${PORTOLAN_EVIDENCE_FULL_PROMOTED_FACT_LIMIT:-1000000000}"
    ;;
  *)
    echo "invalid --proof-profile: $PROOF_PROFILE (expected bounded or full)" >&2
    exit 2
    ;;
esac

TARGET_ROOT=$(cd "${POSITIONAL[0]}" && pwd)

command -v jq >/dev/null || { log "jq is required"; exit 1; }

if [[ "$STATUS" -eq 1 ]]; then
  BUNDLE_DIR=$(abs_path_maybe_missing "${POSITIONAL[1]}")
  run_status "$BUNDLE_DIR"
  exit 0
fi

if [[ "$CLEAN" -eq 1 ]]; then
  BUNDLE_DIR=$(abs_path_maybe_missing "${POSITIONAL[1]}")
  run_clean "$BUNDLE_DIR"
  exit 0
fi

if [[ "$DOCTOR" -eq 1 || "$DRY_RUN" -eq 1 ]]; then
  PREFLIGHT_MODE="--doctor"
  [[ "$DRY_RUN" -eq 1 ]] && PREFLIGHT_MODE="--dry-run"
  PREFLIGHT_ARGS=(
    "$PREFLIGHT_MODE"
    "$TARGET_ROOT"
    "${POSITIONAL[1]}"
    --producers "$PRODUCERS"
    --port "$PORT"
    --limit-repos "$LIMIT_REPOS"
    --hotspot-budget "$HOTSPOT_BUDGET"
    --shard-timeout "$SHARD_TIMEOUT"
    --jscpd-memory-mb "$JSCPD_MEMORY_MB"
  )
  [[ "$PROOF_PROFILE" != "bounded" ]] && PREFLIGHT_ARGS+=(--proof-profile "$PROOF_PROFILE")
  [[ "$YES" -eq 1 ]] && PREFLIGHT_ARGS+=(--yes)
  [[ "$SKIP_INSTALL" -eq 1 ]] && PREFLIGHT_ARGS+=(--skip-install)
  [[ "$NO_VIEWER" -eq 1 ]] && PREFLIGHT_ARGS+=(--no-viewer)
  [[ "$CORE_ONLY" -eq 1 ]] && PREFLIGHT_ARGS+=(--core-only)
  [[ "$WITH_MAP_BRIDGE" -eq 1 ]] && PREFLIGHT_ARGS+=(--with-map-bridge)
  [[ "$CROSS_REPO_DUP" -eq 1 ]] && PREFLIGHT_ARGS+=(--cross-repo-dup)
  [[ "$CROSS_REPO_DUP_ONLY" -eq 1 ]] && PREFLIGHT_ARGS+=(--cross-repo-dup-only)
  exec "$ROOT/scripts/portolan-scan-preflight.sh" "${PREFLIGHT_ARGS[@]}"
fi

BUNDLE_DIR=$(normalize_bundle_dir "${POSITIONAL[1]}")
PRODUCERS_DIR="$BUNDLE_DIR/producers"
FAILURES_LOG="$PRODUCERS_DIR/_failures.log"
SHARD_GAPS="$PRODUCERS_DIR/_gaps.jsonl"
SEMGREP_RULES="$ROOT/harness/recipes/semgrep-rules/portolan-local.yaml"
PROGRESS_PATH="$BUNDLE_DIR/progress.json"
RECEIPT_PATH="$BUNDLE_DIR/receipt.json"
SCAN_PHASE="initializing"
RECEIPT_WRITTEN=0

mkdir -p "$BUNDLE_DIR" "$PRODUCERS_DIR"
: >"$FAILURES_LOG"
: >"$SHARD_GAPS"

write_progress() {
  local status=${1:-running}
  local now duration tmp
  now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  duration=$(( $(date +%s) - START_EPOCH ))
  tmp=$(mktemp)
  jq -n \
    --arg schema_version "0.1.0" \
    --arg updated_at "$now" \
    --arg status "$status" \
    --arg phase "$SCAN_PHASE" \
    --arg target "$TARGET_ROOT" \
    --arg bundle "$BUNDLE_DIR" \
    --arg progress "$PROGRESS_PATH" \
    --arg receipt "$RECEIPT_PATH" \
    --argjson pid "$$" \
    --argjson started_epoch "$START_EPOCH" \
    --argjson duration_seconds "$duration" \
    '{
      schema_version:$schema_version,
      updated_at:$updated_at,
      status:$status,
      phase:$phase,
      pid:$pid,
      started_epoch:$started_epoch,
      duration_seconds:$duration_seconds,
      target:{root:$target},
      bundle:{path:$bundle,progress_path:$progress,receipt_path:$receipt},
      local_first:{read_only:true,target_source_mutation:false}
    }' >"$tmp"
  mv "$tmp" "$PROGRESS_PATH"
}

set_phase() {
  SCAN_PHASE=$1
  write_progress "running"
}

write_progress "running"

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
  if command -v "$tool" >/dev/null 2>&1; then
    return 0
  fi
  if [[ "$SKIP_INSTALL" -eq 1 ]]; then
    log "skip install $tool (--skip-install)"
    return 1
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

json_array_from_args() {
  local value
  for value in "$@"; do
    jq -nc --arg value "$value" '$value'
  done | jq -s .
}

find_output_file() {
  local dir=$1 pattern=${2:-*}
  [[ -d "$dir" ]] || return 1
  find "$dir" -type f -name "$pattern" -print -quit 2>/dev/null | grep -q .
}

producer_gap_count() {
  local producer=$1
  local gaps="$BUNDLE_DIR/gaps.jsonl"
  [[ -s "$gaps" ]] || gaps="$SHARD_GAPS"
  [[ -s "$gaps" ]] || { printf '0\n'; return 0; }
  case "$producer" in
    config)
      jq -r 'select(.surface == "config") | .id' "$gaps" 2>/dev/null | wc -l | tr -d ' '
      ;;
    jscpd)
      jq -r 'select(.surface == "jscpd" or .surface == "duplication") | .id' "$gaps" 2>/dev/null | wc -l | tr -d ' '
      ;;
    semgrep)
      jq -r 'select(.surface == "semgrep" or .surface == "static-analysis") | .id' "$gaps" 2>/dev/null | wc -l | tr -d ' '
      ;;
    syft)
      jq -r 'select(.surface == "syft" or .surface == "dependencies") | .id' "$gaps" 2>/dev/null | wc -l | tr -d ' '
      ;;
    ctags)
      jq -r 'select(.surface == "ctags" or .surface == "symbols") | .id' "$gaps" 2>/dev/null | wc -l | tr -d ' '
      ;;
    *)
      printf '0\n'
      ;;
  esac
}

producer_output_present() {
  local producer=$1
  case "$producer" in
    config) find_output_file "$PRODUCERS_DIR/config" "*.jsonl" ;;
    jscpd) find_output_file "$PRODUCERS_DIR/jscpd" "jscpd-report.json" ;;
    semgrep) find_output_file "$PRODUCERS_DIR/semgrep" "*.json" ;;
    syft) find_output_file "$PRODUCERS_DIR/syft" "*.json" ;;
    ctags) find_output_file "$PRODUCERS_DIR/ctags" "tags.json" ;;
    *) return 1 ;;
  esac
}

producer_tool_available() {
  local producer=$1
  case "$producer" in
    config) return 0 ;;
    jscpd) command -v jscpd >/dev/null 2>&1 ;;
    semgrep) command -v semgrep >/dev/null 2>&1 ;;
    syft) command -v syft >/dev/null 2>&1 ;;
    ctags) command -v ctags >/dev/null 2>&1 ;;
    *) return 1 ;;
  esac
}

producer_state_one() {
  local producer=$1 status detail gaps
  gaps=$(producer_gap_count "$producer")
  if ! has_producer "$producer"; then
    status="skipped"
    detail="not requested"
  elif [[ "$gaps" =~ ^[0-9]+$ && "$gaps" -gt 0 ]]; then
    status="cannot_verify"
    detail="${gaps} gap record(s)"
  elif producer_output_present "$producer"; then
    status="completed"
    detail="output present"
  elif producer_tool_available "$producer"; then
    status="not_assessed"
    detail="requested but no output detected"
  else
    status="not_assessed"
    detail="tool missing or unavailable"
  fi
  jq -nc \
    --arg name "$producer" \
    --arg status "$status" \
    --arg detail "$detail" \
    '{name:$name,status:$status,detail:$detail}'
}

producer_states_json() {
  local old_ifs=$IFS producer
  IFS=,
  for producer in $PRODUCERS; do
    [[ -n "$producer" ]] || continue
    producer_state_one "$producer"
  done | jq -s .
  IFS=$old_ifs
}

receipt_gap_count() {
  if [[ -s "$BUNDLE_DIR/gaps.jsonl" ]]; then
    wc -l <"$BUNDLE_DIR/gaps.jsonl" | tr -d ' '
  elif [[ -s "$SHARD_GAPS" ]]; then
    wc -l <"$SHARD_GAPS" | tr -d ' '
  else
    printf '0\n'
  fi
}

write_captain_atlas_scorecard() {
  local scorecard="$BUNDLE_DIR/captain-atlas-scorecard.json"
  local manifest="$BUNDLE_DIR/manifest.json"
  local gaps="$BUNDLE_DIR/gaps-full.jsonl"
  local hotspots="$BUNDLE_DIR/hotspots-full.jsonl"
  local relationships="$BUNDLE_DIR/relationships.jsonl"
  local manifest_json gaps_json hotspots_json relationships_json qna_status tmp
  [[ -f "$RECEIPT_PATH" ]] || return 0
  [[ -f "$manifest" ]] && manifest_json=$(jq -c . "$manifest" 2>/dev/null || printf 'null') || manifest_json='null'
  [[ -s "$gaps" ]] || gaps="$BUNDLE_DIR/gaps.jsonl"
  if [[ -s "$gaps" ]]; then
    gaps_json=$(jq -s -c '
      {
        count:length,
        by_status:(group_by(.status // "unknown") | map({(.[0].status // "unknown"): length}) | add // {}),
        sample:(.[0:5] | map({id:(.id // ""), surface:(.surface // ""), status:(.status // ""), summary:(.summary // "")}))
      }
    ' "$gaps" 2>/dev/null || printf '{"count":0,"by_status":{},"sample":[]}')
  else
    gaps_json='{"count":0,"by_status":{},"sample":[]}'
  fi
  [[ -s "$hotspots" ]] || hotspots="$BUNDLE_DIR/hotspots.jsonl"
  if [[ -s "$hotspots" ]]; then
    hotspots_json=$(jq -s -c '
      {
        count:length,
        sample:(.[0:5] | map({
          id:(.id // ""),
          kind:(.kind // ""),
          severity:(.severity // ""),
          summary:(.summary // ""),
          paths:(.paths // []),
          line:(.line // null)
        }))
      }
    ' "$hotspots" 2>/dev/null || printf '{"count":0,"sample":[]}')
  else
    hotspots_json='{"count":0,"sample":[]}'
  fi
  if [[ -s "$relationships" ]]; then
    relationships_json=$(jq -s -c '
      {
        count:length,
        sample:(.[0:5] | map({
          id:(.id // ""),
          type:(.type // ""),
          from_repo:(.from_repo // ""),
          to_repo:(.to_repo // ""),
          summary:(.summary // "")
        }))
      }
    ' "$relationships" 2>/dev/null || printf '{"count":0,"sample":[]}')
  else
    relationships_json='{"count":0,"sample":[]}'
  fi
  if [[ -f "$BUNDLE_DIR/captain-qna-eval.json" ]]; then
    qna_status="present"
  else
    qna_status="not_assessed"
  fi
  tmp=$(mktemp)
  jq -n \
    --slurpfile receipt "$RECEIPT_PATH" \
    --arg scorecard_path "$scorecard" \
    --arg manifest_path "$manifest" \
    --arg receipt_path "$RECEIPT_PATH" \
    --arg qna_path "$BUNDLE_DIR/captain-qna-eval.json" \
    --arg qna_status "$qna_status" \
    --argjson manifest "$manifest_json" \
    --argjson gaps "$gaps_json" \
    --argjson hotspots "$hotspots_json" \
    --argjson relationships "$relationships_json" \
    '
    def verdict_for_run($r):
      if ($r.status == "completed" or $r.status == "viewer_starting") and ($r.exit_code == 0)
      then "verified"
      else "failed"
      end;
    def verdict_if($cond): if $cond then "verified" else "not_assessed" end;
    def first_insight($m; $hotspots; $relationships; $gaps):
      if (($relationships.count // 0) > 0) then
        ($relationships.sample[0] // {}) as $rel |
        {
          family:"relationship",
          summary:("Found " + (($relationships.count // 0)|tostring) + " relationship record(s); inspect " + (($rel.from_repo // "unknown")|tostring) + " -> " + (($rel.to_repo // "unknown")|tostring) + "."),
          evidence_ref:($rel.id // "relationships.jsonl"),
          route:("#view=graph&edge=" + (($rel.id // "")|tostring))
        }
      elif (($hotspots.count // 0) > 0) then
        ($hotspots.sample[0] // {}) as $hotspot |
        {
          family:"risk",
          summary:(($hotspot.summary // "Top risk candidate")|tostring),
          evidence_ref:($hotspot.id // "hotspots.jsonl"),
          route:("#view=risks&finding=" + (($hotspot.id // "")|tostring))
        }
      elif (($gaps.count // 0) > 0) then
        ($gaps.sample[0] // {}) as $gap |
        {
          family:"gap",
          summary:(($gap.summary // "Coverage gap recorded")|tostring),
          evidence_ref:($gap.id // "gaps.jsonl"),
          route:"#view=graph"
        }
      else
        {
          family:"inventory",
          summary:("Atlas identified " + (($m.repo_count // 0)|tostring) + " repo(s)."),
          evidence_ref:"manifest.json",
          route:"#view=atlas"
        }
      end;
    def next_actions_for($producer_states; $gaps):
      (
        ($producer_states // [])
        | map(select((.status // "") != "completed"))
        | .[0:5]
        | map({
            reason:(.detail // (.status // "not_assessed")),
            action:("Inspect producer " + (.name // "unknown") + " status; install or approve local tool only if the captain wants this evidence family."),
            evidence_path:"receipt.json",
            status:(.status // "not_assessed")
          })
      ) +
      (
        ($gaps.sample // [])
        | .[0:5]
        | map({
            reason:(.summary // .surface // "Coverage gap"),
            action:("Review " + (.surface // "gap") + " coverage and decide whether to rerun with the related local producer."),
            evidence_path:"gaps.jsonl",
            status:(.status // "unknown")
          })
      );
    ($receipt[0] // {}) as $r |
    ($manifest // null) as $m |
    (first_insight($m; $hotspots; $relationships; $gaps)) as $first_insight |
    (next_actions_for($r.producers; $gaps)) as $next_actions |
    {
      schema_version:"0.1.0",
      scenario:"captain-atlas-first-run",
      verdict:verdict_for_run($r),
      target:{
        root:($r.target.root // ""),
        repo_count:($m.repo_count // 0),
        repo_discovered_total:($m.repo_discovered_total // $m.repo_count // 0),
        core_only:($m.core_only // false),
        proof_profile:($m.proof_profile // "bounded")
      },
      command:{
        argv:($r.command.argv // []),
        duration_seconds:($r.duration_seconds // 0)
      },
      manual_interventions:{
        clarifying_questions:[],
        operator_actions:[],
        approvals_used:(if ($r.local_first.tool_install_attempts_allowed // false) then ["tool_install"] else [] end),
        approvals_required:($r.local_first.approval_required // [])
      },
      result:{
        status:($r.status // "unknown"),
        exit_code:($r.exit_code // null),
        phase:($r.phase // ""),
        producer_states:($r.producers // []),
        failures:($r.producers // [] | map(select((.status // "") | IN("failed","cannot_verify","not_assessed"))) | map({name, status, detail}))
      },
      demo_evidence:{
        bundle_path:($r.bundle.path // ""),
        manifest_path:$manifest_path,
        receipt_path:$receipt_path,
        scorecard_path:$scorecard_path,
        qna_eval_path:$qna_path,
        qna_eval_status:$qna_status,
        viewer_handoff:($r.viewer.launch_argv // []),
        viewer_url:($r.viewer.url // "")
      },
      first_useful_captain_insight:$first_insight,
      captain_next:{
        open:{
          label:"Open local atlas",
          command:($r.viewer.launch_argv // []),
          url:($r.viewer.url // ""),
          status:verdict_if((($r.viewer.launch_argv // []) | length) > 0)
        },
        inspect_first:$first_insight,
        ask_next:[
          "Which relationships are supported by local evidence?",
          "Where are the highest-risk or smelliest areas?",
          "Which evidence families are missing or cannot_verify?"
        ]
      },
      next_actions:$next_actions,
      acceptance_assertions:{
        first_run_handoff:{
          status:verdict_if((($r.bundle.path // "") != "") and ($manifest_path != "") and ($scorecard_path != "") and (((($r.viewer.launch_argv // []) | length) > 0) or (($r.viewer.url // "") != ""))),
          evidence:[$manifest_path,$receipt_path,$scorecard_path]
        },
        first_user_visible_value:{
          status:verdict_if(($first_insight.summary // "") != ""),
          evidence:($first_insight.evidence_ref // "")
        },
        failures_have_next_actions:{
          status:(if (($r.producers // []) | map(select((.status // "") | IN("failed","cannot_verify","not_assessed"))) | length) == 0 then "verified" elif ($next_actions | length) > 0 then "verified" else "failed" end),
          evidence:($next_actions | map(.evidence_path) | unique)
        },
        local_first_safety:{
          status:verdict_if(($r.local_first.network_expected == false) and ($r.local_first.target_source_mutation == false) and (($r.local_first.writes // []) | length) > 0),
          evidence:($r.local_first // {})
        }
      },
      coverage:{
        hotspot_count:($m.hotspot_count // 0),
        hotspots_total:($m.hotspots_total // $m.hotspot_count // 0),
        hotspots_truncated:($m.hotspots_truncated // 0),
        gap_count:($m.gap_count // 0),
        gaps_total:($m.gaps_total // $m.gap_count // 0),
        gaps_truncated:($m.gaps_truncated // 0),
        relationship_count:($m.relationship_count // 0),
        cross_repo_duplication:($m.cross_repo_duplication // null),
        promotion_health:($m.promotion_health // null)
      },
      gaps:{
        count:($gaps.count // 0),
        by_status:($gaps.by_status // {}),
        sample:($gaps.sample // [])
      },
      dimensions:[
        {
          name:"agent_autonomy",
          verdict:"not_assessed",
          note:"This scan receipt proves the local Portolan run, not a live coding-agent lane. Use harness-agent-runtime-acceptance for Cursor/OpenCode autonomy."
        },
        {
          name:"install_reliability",
          verdict:verdict_for_run($r),
          note:"Target-local commands produced receipt, manifest, and viewer handoff."
        },
        {
          name:"atlas_usefulness",
          verdict:verdict_if(($m.repo_count // 0) > 0),
          note:"Useful only to the extent visible repos, relationships, hotspots, and gaps are present in the bundle."
        },
	        {
	          name:"drill_down",
	          verdict:"not_assessed",
	          note:"Drill-down is verified only after bounded Q&A/selected-code eval records captain-qna-eval.json; counts alone are not proof."
	        },
        {
          name:"scale",
          verdict:verdict_if((($m.repo_count // 0) > 1) or (($m.gaps_truncated // 0) == 1) or (($m.hotspots_truncated // 0) == 1)),
          note:"Large-corpus proof requires an external corpus scorecard; truncated or stratified outputs are partial evidence, not strict proof."
        },
        {
          name:"portability",
          verdict:"not_assessed",
          note:"A single bundle cannot prove portability; compare this scorecard with another target ecosystem."
        },
        {
          name:"oss_honesty",
          verdict:"verified",
          note:"Producer states and gaps preserve missing, skipped, cannot_verify, and not_assessed instead of treating absent tools as clean results."
        }
      ],
      bdd_scenarios:[
        {
          name:"agent_discovers_first_run_instructions",
          verdict:"not_assessed",
          evidence:"A scan receipt cannot prove a live agent found the instructions; use runtime acceptance for Cursor/OpenCode lanes."
        },
        {
          name:"atlas_build_completed",
          verdict:verdict_for_run($r),
          evidence:$receipt_path
        },
        {
          name:"receipt_records_run",
          verdict:verdict_if(($r.bundle.receipt_path // "") != "" and ($r.command.argv | length) > 0),
          evidence:$receipt_path
        },
        {
          name:"viewer_handoff_available",
          verdict:verdict_if(($r.viewer.launch_argv | length) > 0),
          evidence:($r.viewer.launch_argv // [])
        },
        {
          name:"agent_qna_eval_recorded",
          verdict:(if $qna_status == "present" then "verified" else "not_assessed" end),
          evidence:$qna_path
        },
        {
          name:"local_first_safety_explicit",
          verdict:verdict_if(($r.local_first.network_expected == false) and ($r.local_first.target_source_mutation == false)),
          evidence:($r.local_first // {})
        }
      ],
      kill_pack_build:{
        recommendation:"pack-and-navigate",
        rationale:"Portolan packages local producers, bundle query, viewer navigation, and agent run guidance; it should wrap/import mature scanners before custom analysis."
      }
    }' >"$tmp"
  mv "$tmp" "$scorecard"
}

write_receipt() {
  local exit_code=$1 status=$2
  [[ "$RECEIPT_WRITTEN" -eq 0 ]] || return 0
  local now duration argv_json producers_json viewer_json install_attempts git_commit gap_count tmp
  now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  duration=$(( $(date +%s) - START_EPOCH ))
  argv_json=$(json_array_from_args "$0" "${ORIGINAL_ARGS[@]}")
  producers_json=$(producer_states_json)
  viewer_json=$(json_array_from_args "$TARGET_ROOT/.portolan/bin/portolan-viewer.sh" --bundle "$BUNDLE_DIR")
  install_attempts=false
  if [[ "$YES" -eq 1 && "$SKIP_INSTALL" -eq 0 ]]; then
    install_attempts=true
  fi
  git_commit=$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || printf 'unknown')
  gap_count=$(receipt_gap_count)
  tmp=$(mktemp)
  jq -n \
    --arg schema_version "0.1.0" \
    --arg completed_at "$now" \
    --arg status "$status" \
    --arg phase "$SCAN_PHASE" \
    --arg target "$TARGET_ROOT" \
    --arg bundle "$BUNDLE_DIR" \
    --arg receipt "$RECEIPT_PATH" \
    --arg git_commit "$git_commit" \
    --arg viewer_url "http://127.0.0.1:$PORT/" \
    --argjson exit_code "$exit_code" \
    --argjson duration_seconds "$duration" \
    --argjson argv "$argv_json" \
    --argjson producers "$producers_json" \
    --argjson viewer_argv "$viewer_json" \
    --argjson gap_count "$gap_count" \
    --argjson target_source_mutation false \
    --argjson tool_install_attempts "$install_attempts" \
    '{
      schema_version:$schema_version,
      completed_at:$completed_at,
      status:$status,
      exit_code:$exit_code,
      phase:$phase,
      duration_seconds:$duration_seconds,
      command:{argv:$argv},
      version:{portolan_git_commit:$git_commit},
      target:{root:$target},
      bundle:{
        path:$bundle,
        manifest_path:($bundle + "/manifest.json"),
        receipt_path:$receipt,
        scorecard_path:($bundle + "/captain-atlas-scorecard.json"),
        gaps_path:($bundle + "/gaps.jsonl"),
        gap_count:$gap_count
      },
      producers:$producers,
      viewer:{
        launch_argv:$viewer_argv,
        url:$viewer_url,
        note:"Use the installed viewer wrapper for human navigation."
      },
      local_first:{
        network_expected:false,
        target_source_mutation:$target_source_mutation,
        tool_install_attempts_allowed:$tool_install_attempts,
        writes:["bundle_dir","receipt_json"],
        approval_required:["network installs","credentials","daemons","runtime capture","writes outside bundle_dir"]
      }
    }' >"$tmp"
  mv "$tmp" "$RECEIPT_PATH"
  write_captain_atlas_scorecard
  printf 'generated_by=portolan-scan\n' >"$BUNDLE_DIR/.portolan-generated-bundle"
  write_progress "$status"
  RECEIPT_WRITTEN=1
  log "receipt: $RECEIPT_PATH"
}

on_exit() {
  local code=$?
  if [[ "$RECEIPT_WRITTEN" -eq 0 && -n "${BUNDLE_DIR:-}" && -d "${BUNDLE_DIR:-}" ]]; then
    write_receipt "$code" "failed" || true
  fi
}

trap on_exit EXIT

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
  mapfile -t repos < <(portolan_discover_repos "$TARGET_ROOT")
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

write_jscpd_repo_coverage() {
  local out_base=$1 repo=$2 slug=$3 status=$4 coverage_mode=$5 file_count=$6 segment_total=$7 segment_limit=$8 selected_segment_count=$9 report_count=${10}
  jq -n \
    --arg schema_version "0.1.0" \
    --arg repo_path "$repo" \
    --arg repo_slug "$slug" \
    --arg status "$status" \
    --arg coverage_mode "$coverage_mode" \
    --argjson file_count "$file_count" \
    --argjson segment_total "$segment_total" \
    --argjson segment_limit "$segment_limit" \
    --argjson selected_segment_count "$selected_segment_count" \
    --argjson report_count "$report_count" \
    '{
      schema_version:$schema_version,
      repo_path:$repo_path,
      repo_slug:$repo_slug,
      status:$status,
      coverage_mode:$coverage_mode,
      file_count:$file_count,
      segment_total:$segment_total,
      segment_limit:$segment_limit,
      selected_segment_count:$selected_segment_count,
      report_count:$report_count,
      truncated_segments:($segment_total > $selected_segment_count),
      resolution_limit:(
        if $status == "complete" then
          "jscpd ran against the repo within Portolan ignore and bounded-profile rules"
        else
          "jscpd ran against a capped top-level segment sample; absence of clones outside selected segments is cannot_verify"
        end
      )
    }' >"$out_base/_coverage.json"
}

run_jscpd_repo() {
  local repo=$1 slug=$2 out_base=$3
  local list_file file_count ok=0 seg subpath out code
  local segment_total=0 selected_segment_count=0 report_count=0 status="cannot_verify" coverage_mode="complete"
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
    [[ "$ok" -eq 1 ]] && report_count=1
  else
    local segments_file
    coverage_mode="stratified"
    segments_file=$(mktemp)
    awk -F/ '
      $1 == "node_modules" || $1 == "vendor" || $1 == "build" || $1 == "dist" || $1 == "target" || $1 == "generated" || $1 == ".git" || $1 == ".portolan" || $1 == ".codex-subagents" || $1 == ".cursor" || $1 == ".agents" || $1 == "portolan-smoke" { next }
      NF == 1 && $1 != "" { print "__root__"; next }
      NF > 1 && $1 != "" { print $1 }
    ' "$list_file" | sort -u >"$segments_file"
    segment_total=$(wc -l <"$segments_file" | tr -d ' ')
	    log "jscpd: $repo ($file_count files → sub-shards, max $JSCPD_SUBSHARD_MAX)"
	    while IFS= read -r seg; do
	      [[ -z "$seg" ]] && continue
	      selected_segment_count=$((selected_segment_count + 1))
	      out="$out_base/$seg"
	      mkdir -p "$out"
	      if [[ "$seg" == "__root__" ]]; then
        root_stage=$(mktemp -d)
        root_file_count=0
        while IFS= read -r root_file; do
          if [[ -n "$root_file" && -f "$repo/$root_file" ]]; then
            cp -p "$repo/$root_file" "$root_stage/$root_file" 2>/dev/null || true
            [[ -f "$root_stage/$root_file" ]] && root_file_count=$((root_file_count + 1))
          fi
        done < <(awk -F/ 'NF == 1 { print $0 }' "$list_file")
        if [[ "$root_file_count" -eq 0 ]]; then
          rm -rf "$root_stage"
          continue
        fi
        log "jscpd sub-shard: $repo/<root-files>"
        if jscpd_try_bounded "$root_stage" "$out"; then
          if jscpd_dir_has_report "$out"; then
            ok=1
            report_count=$((report_count + 1))
          fi
        fi
        rm -rf "$root_stage"
        continue
      fi
      subpath="$repo/$seg"
      [[ -d "$subpath" ]] || continue
      log "jscpd sub-shard: $repo/$seg"
      if jscpd_try_bounded "$subpath" "$out"; then
        if jscpd_dir_has_report "$out"; then
          ok=1
          report_count=$((report_count + 1))
        fi
      fi
    done < <(head -n "$JSCPD_SUBSHARD_MAX" "$segments_file")
    rm -f "$segments_file"
  fi
  rm -f "$list_file"

  if [[ "$ok" -eq 1 ]]; then
    if [[ "$coverage_mode" == "stratified" && ( "$segment_total" -gt "$selected_segment_count" || "$report_count" -lt "$selected_segment_count" ) ]]; then
      status="non_exhaustive"
    else
      status="complete"
      coverage_mode="complete"
    fi
  fi
  write_jscpd_repo_coverage "$out_base" "$repo" "$slug" "$status" "$coverage_mode" "$file_count" "$segment_total" "$JSCPD_SUBSHARD_MAX" "$selected_segment_count" "$report_count"

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
  local dest="$staging/$label" f source_path rel d total=0 staged=0
  mkdir -p "$dest"
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    source_path="$repo/$f"
    [[ ! -f "$source_path" ]] && continue
    total=$((total + 1))
    [[ "$max_files" -gt 0 && "$staged" -ge "$max_files" ]] && continue
    rel="$f"
    [[ -z "$rel" ]] && continue
    d="$dest/$(dirname "$rel")"
    mkdir -p "$d"
    ln -sf "$source_path" "$dest/$rel"
    staged=$((staged + 1))
  done < <(portolan_repo_file_list "$repo")
  echo "$total $staged"
}

run_jscpd_cross() {
  # Pairwise bounded cross-repo duplication: one jscpd per repo pair.
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
	  local staging_root
	  staging_root=$(mktemp -d)
	  local repos_meta_file="$cross_root/_repos.jsonl"
	  : >"$repos_meta_file"
	  declare -A repo_total_by_slug
	  declare -A repo_staged_max_by_slug
	  declare -A repo_path_by_slug
	  local staged_total staged_count
	  local file_limit_label
	  if [[ "$CROSS_JSCPD_FILES_PER_REPO" -gt 0 ]]; then
	    file_limit_label="≤${CROSS_JSCPD_FILES_PER_REPO} files/repo"
	  else
	    file_limit_label="all gitignore-aware files/repo"
	  fi
	  for ra in "${repos[@]}"; do
	    slug_a=$(repo_slug "$ra")
	    repo_path_by_slug["$slug_a"]="$ra"
	    log "jscpd-cross stage repo: $slug_a ($file_limit_label)"
	    read -r staged_total staged_count < <(jscpd_cross_stage_repo "$ra" "$staging_root" "$slug_a" "$CROSS_JSCPD_FILES_PER_REPO")
	    repo_total_by_slug["$slug_a"]="$staged_total"
	    repo_staged_max_by_slug["$slug_a"]="$staged_count"
	    log "jscpd-cross staged: $slug_a ${repo_staged_max_by_slug[$slug_a]}/${repo_total_by_slug[$slug_a]} files"
	  done
	  log "jscpd-cross: pairwise bounded passes for ${#repos[@]} repos ($file_limit_label)"
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
	      log "jscpd-cross pair: $slug_a <-> $slug_b ($file_limit_label)"
	      na="${repo_staged_max_by_slug[$slug_a]}"
	      nb="${repo_staged_max_by_slug[$slug_b]}"
	      pair_ok=0
	      if [[ "$na" -eq 0 || "$nb" -eq 0 ]]; then
	        printf '%s\n' '{"duplicates":[]}' >"$pair_dir/jscpd-report.json"
	        pair_ok=1
	      elif jscpd_try_bounded "$staging_root/$slug_a" "$staging_root/$slug_b" "$pair_dir"; then
	        jscpd_dir_has_report "$pair_dir" && pair_ok=1
	      fi
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

  local truncated_repo_count=0 slug total staged
  for slug in "${!repo_total_by_slug[@]}"; do
	    total="${repo_total_by_slug[$slug]}"
	    staged="${repo_staged_max_by_slug[$slug]}"
	    [[ "$total" -gt "$staged" ]] && truncated_repo_count=$((truncated_repo_count + 1))
    jq -nc \
      --arg slug "$slug" \
      --arg path "${repo_path_by_slug[$slug]}" \
      --argjson total "$total" \
      --argjson staged "$staged" \
      '{repo_slug:$slug,repo_path:$path,total_files:$total,staged_files:$staged,truncated:($total > $staged)}' \
      >>"$repos_meta_file"
  done
  local pair_limit_applied=0 coverage_mode="complete"
  if [[ "$pair_limit" -gt 0 && "$pairs_total" -lt $(( ${#repos[@]} * (${#repos[@]} - 1) / 2 )) ]]; then
    pair_limit_applied=1
  fi
  if [[ "$truncated_repo_count" -gt 0 || "$pair_limit_applied" -eq 1 ]]; then
    coverage_mode="stratified"
  fi

  jq -n \
    --arg completed_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --arg coverage_mode "$coverage_mode" \
    --argjson pairs_total "$pairs_total" \
    --argjson pairs_ok "$pairs_ok" \
    --argjson pairs_failed "$pairs_failed" \
    --argjson clone_pairs "$clone_pairs" \
    --argjson files_per_repo_limit "$CROSS_JSCPD_FILES_PER_REPO" \
    --argjson truncated_repo_count "$truncated_repo_count" \
    --argjson pair_limit_applied "$pair_limit_applied" \
    --slurpfile repos "$repos_meta_file" \
    '{
      schema_version:"0.1.0",
      completed_at:$completed_at,
      coverage_mode:$coverage_mode,
      pairs_total:$pairs_total,
      pairs_ok:$pairs_ok,
      pairs_failed:$pairs_failed,
      clone_pairs:$clone_pairs,
      files_per_repo_limit:$files_per_repo_limit,
      truncated_repo_count:$truncated_repo_count,
      pair_limit_applied:$pair_limit_applied,
      repos:$repos,
      resolution_limit:(
        if $coverage_mode == "complete" then
          "all discovered repo-pair files were staged within the Portolan ignore and bounded-profile rules"
        else
          "cross-repo duplication ran over a capped per-repo sample; absence of clone pairs outside the staged files is cannot_verify"
        end
      )
    }' \
    >"$cross_root/_scan.json"
  rm -f "$repos_meta_file"

  if [[ "$pairs_failed" -gt 0 ]]; then
    append_gap_record "gap-cross-repo-dup" "duplication" "cannot_verify" \
      "cross-repo pairwise jscpd: ${pairs_failed}/${pairs_total} pair(s) failed" \
      "harness/recipes/duplication-jscpd.md"
	  else
	    log "jscpd-cross: complete ${pairs_ok}/${pairs_total} pairs, clone_pairs=$clone_pairs"
	  fi
	  rm -rf "$staging_root"
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

set_phase "tool-preflight"
ensure_tools

if [[ "$CROSS_REPO_DUP_ONLY" -eq 1 ]]; then
  set_phase "cross-repo-dup-only"
  rm -rf "$PRODUCERS_DIR/jscpd-cross"
  run_jscpd_cross || true
  export PORTOLAN_HOTSPOT_BUDGET="$HOTSPOT_BUDGET"
  export PORTOLAN_LIMIT_REPOS="$LIMIT_REPOS"
  export PORTOLAN_BUNDLE_CORE_ONLY="$CORE_ONLY"
  export PORTOLAN_PROOF_PROFILE="$PROOF_PROFILE"
  export PORTOLAN_EVIDENCE_SOURCE_CLASSIFICATION_LIMIT="$EVIDENCE_SOURCE_CLASSIFICATION_LIMIT"
  export PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT="$EVIDENCE_PROMOTED_FACT_LIMIT"
  set_phase "bundle-build"
  "$ROOT/scripts/build-portolan-bundle.sh" "$TARGET_ROOT" "$BUNDLE_DIR"
  set_phase "receipt"
  write_receipt 0 "completed"
  log "done (cross-repo-dup-only): $BUNDLE_DIR"
  exit 0
fi

if has_producer config; then
  set_phase "producer-config"
  run_config || true
fi

if has_producer jscpd && command -v jscpd >/dev/null; then
  set_phase "producer-jscpd"
  run_jscpd || true
elif has_producer jscpd; then
  fail_log "jscpd skipped: not installed"
fi

if has_producer semgrep && command -v semgrep >/dev/null; then
  set_phase "producer-semgrep"
  run_semgrep || true
elif has_producer semgrep; then
  fail_log "semgrep skipped: not installed"
fi

if has_producer syft && command -v syft >/dev/null; then
  set_phase "producer-syft"
  run_syft || true
elif has_producer syft; then
  fail_log "syft skipped: not installed"
fi

if has_producer ctags && command -v ctags >/dev/null; then
  set_phase "producer-ctags"
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
  set_phase "producer-cross-repo-dup"
  run_jscpd_cross || true
fi

export PORTOLAN_HOTSPOT_BUDGET="$HOTSPOT_BUDGET"
export PORTOLAN_LIMIT_REPOS="$LIMIT_REPOS"
export PORTOLAN_BUNDLE_CORE_ONLY="$CORE_ONLY"
export PORTOLAN_PROOF_PROFILE="$PROOF_PROFILE"
export PORTOLAN_EVIDENCE_SOURCE_CLASSIFICATION_LIMIT="$EVIDENCE_SOURCE_CLASSIFICATION_LIMIT"
export PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT="$EVIDENCE_PROMOTED_FACT_LIMIT"
set_phase "bundle-build"
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
  set_phase "map-bridge"
  run_map_bridge || true
fi

set_phase "summary"
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
  set_phase "receipt"
  write_receipt 0 "completed"
  log "bundle ready at $BUNDLE_DIR (--no-viewer)"
  exit 0
fi

command -v node >/dev/null || { log "node is required for viewer"; exit 1; }

cd "$ROOT/viewer"
set_phase "viewer-build"
node scripts/build-static.js
set_phase "receipt"
write_receipt 0 "viewer_starting"
log "viewer: http://127.0.0.1:$PORT/ (Ctrl+C to stop)"
exec node scripts/serve.js --bundle "$BUNDLE_DIR" --port "$PORT"
