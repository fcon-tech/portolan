#!/usr/bin/env bash
# Doctor/preflight for portolan-scan first runs.
# Usage:
#   portolan-scan-preflight.sh --doctor <target-root> <bundle-dir> [options]
#   portolan-scan-preflight.sh --dry-run <target-root> <bundle-dir> [options]
#   portolan-scan-preflight.sh --producers LIST [--yes] [--skip-install]
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
# shellcheck source=lib/install-ctags.sh
. "$ROOT/scripts/lib/install-ctags.sh"
# shellcheck source=lib/repo-discovery.sh
. "$ROOT/scripts/lib/repo-discovery.sh"

YES=0
SKIP_INSTALL=0
PRODUCERS="config,jscpd,semgrep,syft,ctags"
MODE="check"
NO_VIEWER=0
CORE_ONLY=0
WITH_MAP_BRIDGE=0
CROSS_REPO_DUP=0
CROSS_REPO_DUP_ONLY=0
PROOF_PROFILE="bounded"
LIMIT_REPOS=0
PORT=4173
HOTSPOT_BUDGET=200
SHARD_TIMEOUT=600
JSCPD_MEMORY_MB=2048
POSITIONAL=()

usage() {
  cat <<'EOF'
usage: portolan-scan-preflight.sh [--doctor|--dry-run] <target-root> <bundle-dir> [options]
       portolan-scan-preflight.sh [--producers LIST] [--yes] [--skip-install]

Modes:
  --doctor           Report target shape, output safety, tools, size, risks
  --dry-run, --plan  Print doctor plus the scan read/write/tool plan

Options mirrored from portolan-scan:
  --yes              Auto-approve tool installs for strict tool-check mode
  --skip-install     Never install missing tools
  --no-viewer        Plan/build bundle only; do not start viewer
  --core-only        Plan/build core bundle artifacts only
  --with-map-bridge  Include legacy map bridge sidecar in the plan
  --cross-repo-dup   Include cross-repo duplication pass in the plan
  --cross-repo-dup-only
  --proof-profile NAME  bounded or full; full is expensive and removes
                     sampling caps for strict corpus proof
  --limit-repos N
  --port N
  --producers LIST   Comma-separated: config,jscpd,semgrep,syft,ctags
  --hotspot-budget N
  --shard-timeout SEC
  --jscpd-memory-mb N
  -h, --help

Doctor and dry-run modes are read-only: they do not create the bundle directory,
install tools, write target files, start a viewer, or use the network.
EOF
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
    --doctor|doctor) MODE="doctor"; shift ;;
    --dry-run|--plan|dry-run|plan) MODE="dry-run"; shift ;;
    --yes) YES=1; shift ;;
    --skip-install) SKIP_INSTALL=1; shift ;;
    --no-viewer) NO_VIEWER=1; shift ;;
    --core-only) CORE_ONLY=1; shift ;;
    --with-map-bridge) WITH_MAP_BRIDGE=1; shift ;;
    --cross-repo-dup) CROSS_REPO_DUP=1; shift ;;
    --cross-repo-dup-only) CROSS_REPO_DUP=1; CROSS_REPO_DUP_ONLY=1; shift ;;
    --proof-profile) require_opt_value --proof-profile "${2:-}"; PROOF_PROFILE="$2"; shift 2 ;;
    --limit-repos) require_opt_value --limit-repos "${2:-}"; LIMIT_REPOS="$2"; shift 2 ;;
    --port) require_opt_value --port "${2:-}"; PORT="$2"; shift 2 ;;
    --producers) require_opt_value --producers "${2:-}"; PRODUCERS="$2"; shift 2 ;;
    --hotspot-budget) require_opt_value --hotspot-budget "${2:-}"; HOTSPOT_BUDGET="$2"; shift 2 ;;
    --shard-timeout) require_opt_value --shard-timeout "${2:-}"; SHARD_TIMEOUT="$2"; shift 2 ;;
    --jscpd-memory-mb) require_opt_value --jscpd-memory-mb "${2:-}"; JSCPD_MEMORY_MB="$2"; shift 2 ;;
    -h|--help)
      usage
      exit 0
      ;;
    --) shift; POSITIONAL+=("$@"); break ;;
    -*) echo "unknown option: $1" >&2; exit 2 ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

has_producer() { [[ ",$PRODUCERS," == *",$1,"* ]]; }

case "$PROOF_PROFILE" in
  bounded|full) ;;
  *) echo "invalid --proof-profile: $PROOF_PROFILE (expected bounded or full)" >&2; exit 2 ;;
esac
if [[ "$PROOF_PROFILE" == "full" && "$LIMIT_REPOS" -ne 0 ]]; then
  echo "--proof-profile full cannot be combined with --limit-repos" >&2
  exit 2
fi

require_tool() {
  local tool=$1
  shift
  local -a install_cmds=("$@")
  if command -v "$tool" >/dev/null 2>&1; then
    return 0
  fi
  [[ "$SKIP_INSTALL" -eq 1 ]] && return 1
  if [[ "$YES" -ne 1 ]]; then
    echo "portolan-scan-preflight: missing $tool (use --yes to install or --skip-install to record gaps)" >&2
    return 1
  fi
  for c in "${install_cmds[@]}"; do
    if eval "$c"; then
      command -v "$tool" >/dev/null && return 0
    fi
  done
  return 1
}

trim_trailing_slash() {
  local value=$1
  while [[ "$value" != "/" && "$value" == */ ]]; do
    value=${value%/}
  done
  printf '%s\n' "$value"
}

abs_maybe_missing() {
  local raw=$1 path probe suffix parent base
  [[ -n "$raw" ]] || return 1
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

nearest_existing_parent() {
  local path=$1 probe
  probe=$(trim_trailing_slash "$path")
  if [[ -e "$probe" && ! -d "$probe" ]]; then
    probe=$(dirname "$probe")
  fi
  while [[ "$probe" != "/" && ! -d "$probe" ]]; do
    probe=$(dirname "$probe")
  done
  printf '%s\n' "$probe"
}

rough_file_count() {
  local target=$1 count
  count=$(find "$target" -mindepth 1 \
    \( -name .git -o -name .portolan -o -name .codex-subagents -o -name .cursor -o -name .agents -o -name node_modules -o -name vendor -o -name build -o -name dist -o -name target -o -name generated \) -prune \
    -o -type f -print 2>/dev/null | wc -l | tr -d ' ') || count="unknown"
  printf '%s\n' "${count:-unknown}"
}

rough_dir_count() {
  local target=$1 count
  count=$(find "$target" -mindepth 1 \
    \( -name .git -o -name .portolan -o -name .codex-subagents -o -name .cursor -o -name .agents -o -name node_modules -o -name vendor -o -name build -o -name dist -o -name target -o -name generated \) -prune \
    -o -type d -print 2>/dev/null | wc -l | tr -d ' ') || count="unknown"
  printf '%s\n' "${count:-unknown}"
}

rough_size_label() {
  local files=$1
  if ! [[ "$files" =~ ^[0-9]+$ ]]; then
    printf 'unknown\n'
  elif [[ "$files" -le 2000 ]]; then
    printf 'small\n'
  elif [[ "$files" -le 20000 ]]; then
    printf 'medium\n'
  else
    printf 'large\n'
  fi
}

rough_disk_size() {
  local target=$1 size
  size=$(du -sh "$target" 2>/dev/null | awk '{print $1}') || size="unknown"
  printf '%s\n' "${size:-unknown}"
}

discovered_repo_count() {
  local target=$1
  portolan_discover_repos "$target" | wc -l | tr -d ' '
}

discovered_repo_note() {
  local target=$1 count=$2
  if [[ -e "$target/.git" ]]; then
    printf 'target root is a git repo/worktree\n'
  elif portolan_discover_git_repos "$target" | grep -q .; then
    [[ "$count" -gt 1 ]] && printf 'multi-repo Git landscape discovered under target\n' || printf 'single nested Git repo discovered under target\n'
  elif [[ "$count" -gt 1 ]]; then
    printf 'multi-repo exported corpus discovered under target\n'
  else
    printf 'no repo roots discovered; target will be treated as one plain directory\n'
  fi
}

tool_line() {
  local name=$1 kind=$2 detail=${3:-}
  local path version
  if command -v "$name" >/dev/null 2>&1; then
    path=$(command -v "$name")
    version=$("$name" --version 2>/dev/null | head -1 || true)
    [[ -n "$version" ]] || version="available"
    printf '  - %s [%s]: available (%s; %s)\n' "$name" "$kind" "$path" "$version"
  else
    printf '  - %s [%s]: missing%s\n' "$name" "$kind" "${detail:+ ($detail)}"
  fi
}

hash_tool_line() {
  if command -v sha256sum >/dev/null 2>&1; then
    tool_line sha256sum core
  elif command -v shasum >/dev/null 2>&1; then
    tool_line shasum core
  else
    printf '  - sha256sum|shasum [core]: missing (one hash tool is required)\n'
  fi
}

producer_tool_lines() {
  has_producer config && printf '  - config [producer]: built-in script available\n'
  has_producer jscpd && tool_line jscpd producer "duplication gaps if absent"
  has_producer semgrep && tool_line semgrep producer "static-analysis gaps if absent"
  has_producer syft && tool_line syft producer "dependency gaps if absent"
  has_producer ctags && tool_line ctags producer "symbol gaps if absent"
}

bundle_status() {
  local target=$1 bundle=$2 parent status detail
  parent=$(nearest_existing_parent "$bundle")
  if [[ "$bundle" == "/" || "$bundle" == "$target" || ( -n "${HOME:-}" && "$bundle" == "$HOME" ) ]]; then
    printf 'unsafe|refusing unsafe bundle path\n'
  elif [[ -e "$bundle" && ! -d "$bundle" ]]; then
    printf 'unsafe|path exists and is not a directory\n'
  elif [[ -d "$bundle" ]]; then
    if [[ -w "$bundle" ]]; then
      printf 'writable|existing directory is writable\n'
    else
      printf 'not_writable|existing directory is not writable\n'
    fi
  elif [[ -d "$parent" && -w "$parent" ]]; then
    detail="nearest existing parent is writable: $parent"
    printf 'creatable|%s\n' "$detail"
  else
    printf 'not_writable|nearest existing parent is not writable: %s\n' "$parent"
  fi
}

emit_doctor() {
  local target=$1 bundle_raw=$2 bundle parent_status status detail files dirs size label repos note
  bundle=$(abs_maybe_missing "$bundle_raw")
  parent_status=$(bundle_status "$target" "$bundle")
  status=${parent_status%%|*}
  detail=${parent_status#*|}
  files=$(rough_file_count "$target")
  dirs=$(rough_dir_count "$target")
  size=$(rough_disk_size "$target")
  label=$(rough_size_label "$files")
  repos=$(discovered_repo_count "$target")
  note=$(discovered_repo_note "$target" "$repos")

  cat <<EOF
Portolan doctor

Target:
  root: $target
  shape: $repos repo(s); $files file(s); $dirs dir(s); $size on disk; rough size=$label
  note: $note
  scan repo cap: $LIMIT_REPOS (0 means uncapped)

Bundle:
  requested: $bundle_raw
  resolved: $bundle
  status: $status ($detail)

Tools:
EOF
  tool_line jq core
  tool_line timeout core "required by sharded producer timeouts"
  hash_tool_line
  if [[ "$NO_VIEWER" -eq 0 ]]; then
    tool_line node viewer "required only when starting the viewer"
  else
    printf '  - node [viewer]: not required for --no-viewer scan\n'
  fi
  producer_tool_lines

  cat <<EOF

Local-first expectations:
  network: none for doctor/dry-run/scan by default; semgrep runs with --metrics off
  installs: disabled when --skip-install is present; removing it with --yes may run local package-manager install commands
  target mutation: no target source writes; Portolan writes bundle artifacts to the resolved bundle path
  viewer: local 127.0.0.1:$PORT only when viewer is enabled
  approval-required: network installs, credentials, daemons, external writes, runtime capture
EOF

  case "$status" in
    writable|creatable) return 0 ;;
    *) return 1 ;;
  esac
}

emit_dry_run_plan() {
  local target=$1 bundle_raw=$2 bundle viewer_state install_state
  bundle=$(abs_maybe_missing "$bundle_raw")
  if [[ "$NO_VIEWER" -eq 1 ]]; then
    viewer_state="not started (--no-viewer)"
  else
    viewer_state="build static viewer assets in the Portolan checkout and serve bundle on 127.0.0.1:$PORT"
  fi
  if [[ "$SKIP_INSTALL" -eq 1 ]]; then
    install_state="no install attempts; missing producers become gaps"
  elif [[ "$YES" -eq 1 ]]; then
    install_state="approved by flags; missing producer tools may invoke package-manager install commands"
  else
    install_state="prompt before any install attempt"
  fi

  cat <<EOF

Dry-run plan

Reads:
  - target tree: $target
  - git metadata and ignore rules where present
  - local producer binaries on PATH for requested producers: $PRODUCERS
  - local Portolan recipes and contracts under: $ROOT/harness

Writes:
  - bundle directory: $bundle
  - producer outputs: $bundle/producers/
  - bundle artifacts: manifest.json, atlas-facts.json, repo-profiles.json, relationships.jsonl, hotspots*.jsonl, gaps.jsonl
  - first-run receipt: $bundle/receipt.json
  - target source files: none

Tool commands:
  - config: scripts/scan-config-surfaces.sh per discovered repo
  - jscpd: bounded local duplication scan when jscpd is requested and available
  - semgrep: semgrep scan with local rules and --metrics off when requested and available
  - syft: syft scan dir:<repo> when requested and available
  - ctags: ctags JSON symbol index when requested and available
  - bundle: scripts/build-portolan-bundle.sh after producer attempts
  - map bridge: $([[ "$WITH_MAP_BRIDGE" -eq 1 ]] && printf 'enabled via --with-map-bridge' || printf 'not enabled')
  - cross-repo duplication: $([[ "$CROSS_REPO_DUP" -eq 1 ]] && printf 'enabled' || printf 'not enabled')
  - viewer: $viewer_state

Expected controls:
  - producers: $PRODUCERS
  - proof-profile: $PROOF_PROFILE
  - core-only: $CORE_ONLY
  - limit-repos: $LIMIT_REPOS
  - hotspot-budget: $HOTSPOT_BUDGET
  - shard-timeout: ${SHARD_TIMEOUT}s
  - jscpd-memory: ${JSCPD_MEMORY_MB}MB
  - installs: $install_state
  - network: no network expected unless install approval is granted outside --skip-install

Approval-required actions:
  - remove --skip-install or install missing OSS tools
  - enable network package downloads
  - start target services, daemons, runtime capture, or credentials
  - write outside the selected bundle path
EOF
}

if [[ ${#POSITIONAL[@]} -gt 0 ]]; then
  if [[ ${#POSITIONAL[@]} -ne 2 ]]; then
    usage >&2
    exit 2
  fi
  MODE=$([[ "$MODE" == "check" ]] && printf 'doctor' || printf '%s' "$MODE")
  TARGET_ROOT=$(cd "${POSITIONAL[0]}" && pwd)
  BUNDLE_DIR="${POSITIONAL[1]}"
fi

if [[ "$MODE" == "doctor" || "$MODE" == "dry-run" ]]; then
  if [[ ${#POSITIONAL[@]} -ne 2 ]]; then
    usage >&2
    exit 2
  fi
  doctor_status=0
  emit_doctor "$TARGET_ROOT" "$BUNDLE_DIR" || doctor_status=$?
  if [[ "$MODE" == "dry-run" ]]; then
    emit_dry_run_plan "$TARGET_ROOT" "$BUNDLE_DIR"
  fi
  exit "$doctor_status"
fi

fail=0

if has_producer jscpd; then
  require_tool jscpd "npm install -g jscpd" "brew install jscpd" || fail=1
fi
if has_producer semgrep; then
  require_tool semgrep "pipx install semgrep" "brew install semgrep" || fail=1
fi
if has_producer syft; then
  require_tool syft \
    "brew install syft" || fail=1
fi
if has_producer ctags; then
  require_tool ctags "portolan_install_ctags" "brew install universal-ctags" || fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  echo "portolan-scan-preflight: required producer tool(s) missing after install attempts" >&2
  if [[ "$YES" -eq 1 ]]; then
    exit 2
  fi
  exit 1
fi

echo "portolan-scan-preflight: ok (producers: $PRODUCERS)" >&2
