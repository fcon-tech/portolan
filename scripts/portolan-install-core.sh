#!/usr/bin/env bash
# Install Portolan atlas instructions into a target project for agent harnesses.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)

HARNESS="all"
PORTOLAN_PATH="$ROOT"
BUNDLE_DIR=""
RUNTIME_MODE="copy"
RUNTIME_DIR=""
FORCE=0
DRY_RUN=0
ADD_GIT_EXCLUDE=1
SCAN_PROFILE="full"

usage() {
  local prog=${PORTOLAN_INSTALL_PROG:-$(basename "$0")}
  cat <<EOF
usage: $prog <target-root> [options]

Installs Portolan as an agent-usable atlas layer in a target project:
  - Cursor:  .cursor/rules/portolan-atlas.mdc
  - OpenCode/Codex: managed Portolan block in AGENTS.md
  - Claude: managed Portolan block in CLAUDE.md
  - Commands: target-local wrappers in .portolan/bin/

Options:
  --harness LIST          Comma-separated: cursor,opencode,codex,claude,all (default all)
  --portolan-path PATH    Portolan checkout path (default: this checkout)
  --bundle-dir PATH       Bundle output dir (default: <target-root>/.portolan/atlas)
  --runtime-mode MODE     Runtime install mode: copy or link (default copy)
  --runtime-dir PATH      Runtime copy dir (default: <target-root>/.portolan/runtime/portolan)
  --force                 Replace an existing managed Portolan block/rule
  --scan-profile PROFILE  Initial scan profile: full or fast (default full)
  --dry-run               Print planned writes without changing files
  --no-git-exclude        Do not add .portolan/ to .git/info/exclude
  -h, --help              Show this help

The installed instructions are local-first, read-only for target inspection, and
run portolan-scan with --skip-install by default. The default full profile builds
a usable atlas first; use --scan-profile fast only for an explicit lightweight
survey before the full atlas command.
EOF
}

log() { echo "portolan install: $*" >&2; }

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
    --harness) require_opt_value --harness "${2:-}"; HARNESS="$2"; shift 2 ;;
    --portolan-path) require_opt_value --portolan-path "${2:-}"; PORTOLAN_PATH="$2"; shift 2 ;;
    --bundle-dir) require_opt_value --bundle-dir "${2:-}"; BUNDLE_DIR="$2"; shift 2 ;;
    --runtime-mode) require_opt_value --runtime-mode "${2:-}"; RUNTIME_MODE="$2"; shift 2 ;;
    --runtime-dir) require_opt_value --runtime-dir "${2:-}"; RUNTIME_DIR="$2"; shift 2 ;;
    --force) FORCE=1; shift ;;
    --scan-profile) require_opt_value --scan-profile "${2:-}"; SCAN_PROFILE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --no-git-exclude) ADD_GIT_EXCLUDE=0; shift ;;
    -h|--help) usage; exit 0 ;;
    --) shift; POSITIONAL+=("$@"); break ;;
    -*) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

if [[ ${#POSITIONAL[@]} -ne 1 ]]; then
  usage >&2
  exit 2
fi

TARGET_ROOT=$(cd "${POSITIONAL[0]}" && pwd)
PORTOLAN_PATH=$(cd "$PORTOLAN_PATH" && pwd)

if [[ -z "$BUNDLE_DIR" ]]; then
  BUNDLE_DIR="$TARGET_ROOT/.portolan/atlas"
elif [[ "$BUNDLE_DIR" != /* ]]; then
  BUNDLE_DIR="$TARGET_ROOT/$BUNDLE_DIR"
fi
if [[ -z "$RUNTIME_DIR" ]]; then
  RUNTIME_DIR="$TARGET_ROOT/.portolan/runtime/portolan"
elif [[ "$RUNTIME_DIR" != /* ]]; then
  RUNTIME_DIR="$TARGET_ROOT/$RUNTIME_DIR"
fi

shell_quote() {
  printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"
}

TARGET_ROOT_SH=$(shell_quote "$TARGET_ROOT")
BUNDLE_DIR_SH=$(shell_quote "$BUNDLE_DIR")

if [[ ! -x "$PORTOLAN_PATH/scripts/portolan-scan.sh" ]]; then
  echo "missing executable: $PORTOLAN_PATH/scripts/portolan-scan.sh" >&2
  exit 2
fi
if [[ ! -x "$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" ]]; then
  echo "missing executable: $PORTOLAN_PATH/scripts/portolan-bundle-query.sh" >&2
  exit 2
fi
if [[ ! -x "$PORTOLAN_PATH/scripts/import-analysis-claims.sh" ]]; then
  echo "missing executable: $PORTOLAN_PATH/scripts/import-analysis-claims.sh" >&2
  exit 2
fi
if [[ ! -x "$PORTOLAN_PATH/scripts/build-captain-handoff.sh" ]]; then
  echo "missing executable: $PORTOLAN_PATH/scripts/build-captain-handoff.sh" >&2
  exit 2
fi

case "$RUNTIME_MODE" in
  copy|link) ;;
  *)
    echo "invalid --runtime-mode: $RUNTIME_MODE (expected copy or link)" >&2
    exit 2
    ;;
esac

case "$SCAN_PROFILE" in
  fast)
    SCAN_ARGS="--yes --skip-install --no-viewer --core-only --producers config,ctags --shard-timeout 30 --hotspot-budget 50"
    ;;
  full)
    SCAN_ARGS="--yes --skip-install --no-viewer"
    ;;
  *)
    echo "invalid --scan-profile: $SCAN_PROFILE (expected fast or full)" >&2
    exit 2
    ;;
esac

FULL_SCAN_ARGS="--yes --skip-install --no-viewer --producers config,jscpd,semgrep,syft,ctags --shard-timeout 600 --hotspot-budget 200"

has_harness() {
  local name=$1
  [[ "$HARNESS" == "all" || ",$HARNESS," == *",$name,"* ]]
}

check_harness_list() {
  local old_ifs=$IFS item
  IFS=,
  for item in $HARNESS; do
    case "$item" in
      all|cursor|opencode|codex|claude) ;;
      *) echo "unknown harness in --harness: $item" >&2; exit 2 ;;
    esac
  done
  IFS=$old_ifs
}

has_agent_instructions_harness() {
  has_harness opencode || has_harness codex
}

write_if_changed() {
  local path=$1 content_file=$2
  if [[ -f "$path" ]] && cmp -s "$path" "$content_file"; then
    log "unchanged $path"
    return 0
  fi
  if [[ -f "$path" && "$FORCE" -ne 1 ]]; then
    echo "refusing to overwrite $path without --force" >&2
    exit 2
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "would write $path"
    sed 's/^/  /' "$content_file" >&2
    return 0
  fi
  mkdir -p "$(dirname "$path")"
  cp "$content_file" "$path"
  log "wrote $path"
}

write_managed_executable() {
  local path=$1 content_file=$2
  if [[ -f "$path" ]] && cmp -s "$path" "$content_file"; then
    if [[ "$DRY_RUN" -eq 0 ]]; then
      chmod +x "$path"
    fi
    log "unchanged $path"
    return 0
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "would write $path"
    sed 's/^/  /' "$content_file" >&2
    return 0
  fi
  mkdir -p "$(dirname "$path")"
  cp "$content_file" "$path"
  chmod +x "$path"
  log "wrote $path"
}

replace_managed_block() {
  local file=$1 begin=$2 end=$3 block_file=$4
  local tmp
  tmp=$(mktemp)

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "would update managed block in $file"
    sed 's/^/  /' "$block_file" >&2
    rm -f "$tmp"
    return 0
  fi

  mkdir -p "$(dirname "$file")"
  if [[ ! -f "$file" ]]; then
    cp "$block_file" "$file"
    log "wrote $file"
    rm -f "$tmp"
    return 0
  fi

  if grep -Fq "$begin" "$file"; then
    current=$(mktemp)
    awk -v begin="$begin" -v end="$end" '
      $0 == begin { capture = 1 }
      capture { print }
      $0 == end { capture = 0 }
    ' "$file" >"$current"
    if cmp -s "$current" "$block_file"; then
      log "unchanged $file"
      rm -f "$tmp" "$current"
      return 0
    fi
    rm -f "$current"
    if [[ "$FORCE" -ne 1 ]]; then
      echo "refusing to replace existing Portolan block in $file without --force" >&2
      rm -f "$tmp"
      exit 2
    fi
  fi

  awk -v begin="$begin" -v end="$end" -v block_file="$block_file" '
    $0 == begin {
      if (!inserted) {
        while ((getline line < block_file) > 0) print line
        close(block_file)
        inserted = 1
      }
      skipping = 1
      next
    }
    $0 == end {
      skipping = 0
      next
    }
    !skipping { print }
    END {
      if (!inserted) {
        if (NR > 0) print ""
        while ((getline line < block_file) > 0) print line
        close(block_file)
      }
    }
  ' "$file" >"$tmp"
  mv "$tmp" "$file"
  log "updated $file"
}

assert_write_allowed() {
  local path=$1 content_file=$2
  if [[ -f "$path" ]] && ! cmp -s "$path" "$content_file" && [[ "$FORCE" -ne 1 ]]; then
    echo "refusing to overwrite $path without --force" >&2
    exit 2
  fi
}

assert_managed_block_allowed() {
  local file=$1 begin=$2 end=$3 block_file=$4
  local current
  [[ -f "$file" ]] || return 0
  grep -Fq "$begin" "$file" || return 0

  current=$(mktemp)
  awk -v begin="$begin" -v end="$end" '
    $0 == begin { capture = 1 }
    capture { print }
    $0 == end { capture = 0 }
  ' "$file" >"$current"
  if ! cmp -s "$current" "$block_file" && [[ "$FORCE" -ne 1 ]]; then
    rm -f "$current"
    echo "refusing to replace existing Portolan block in $file without --force" >&2
    exit 2
  fi
  rm -f "$current"
}

add_git_exclude() {
  local exclude_file="$TARGET_ROOT/.git/info/exclude"
  [[ "$ADD_GIT_EXCLUDE" -eq 1 ]] || return 0
  [[ -f "$exclude_file" ]] || return 0
  if grep -Fxq ".portolan/" "$exclude_file"; then
    return 0
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "would add .portolan/ to $exclude_file"
    return 0
  fi
  printf '\n.portolan/\n' >>"$exclude_file"
  log "added .portolan/ to $exclude_file"
}

copy_runtime() {
  local tmp_runtime parent marker
  if [[ "$RUNTIME_MODE" == "link" ]]; then
    ACTIVE_PORTOLAN_PATH="$PORTOLAN_PATH"
    return 0
  fi

  [[ "$RUNTIME_DIR" != "/" ]] || { echo "refusing runtime dir: /" >&2; exit 2; }
  [[ "$RUNTIME_DIR" != "$TARGET_ROOT" ]] || { echo "refusing runtime dir equal to target root: $RUNTIME_DIR" >&2; exit 2; }
  [[ "$RUNTIME_DIR" != "$PORTOLAN_PATH" ]] || { echo "refusing runtime dir equal to source checkout: $RUNTIME_DIR" >&2; exit 2; }
  [[ -z "${HOME:-}" || "$RUNTIME_DIR" != "$HOME" ]] || { echo "refusing runtime dir equal to home: $RUNTIME_DIR" >&2; exit 2; }

  ACTIVE_PORTOLAN_PATH="$RUNTIME_DIR"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "would copy Portolan runtime to $RUNTIME_DIR"
    return 0
  fi

  parent=$(dirname "$RUNTIME_DIR")
  tmp_runtime="$parent/.portolan-runtime.$$.tmp"
  rm -rf "$tmp_runtime"
  mkdir -p "$tmp_runtime"
  (
    cd "$PORTOLAN_PATH"
    tar \
      --exclude='./.git' \
      --exclude='./.portolan' \
      --exclude='./.codex-subagents' \
      --exclude='./viewer/node_modules' \
      --exclude='./viewer/dist' \
      -cf - .
  ) | tar -C "$tmp_runtime" -xf -
  marker="$tmp_runtime/.portolan-runtime.json"
  jq -n \
    --arg installed_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{schema_version:"0.1.0",mode:"copy",installed_at:$installed_at}' \
    >"$marker"
  rm -rf "$RUNTIME_DIR"
  mkdir -p "$parent"
  mv "$tmp_runtime" "$RUNTIME_DIR"
  log "copied runtime to $RUNTIME_DIR"
}

make_cursor_rule() {
  local out=$1
  cat >"$out" <<EOF
---
description: Build and query a Portolan atlas for broad architecture, landscape, dependency, duplication, config, or technical-debt questions.
globs:
alwaysApply: false
---

# Portolan Atlas

Use this rule when the user asks to map, understand, explain, navigate, compare,
or audit this local software landscape.

Portolan is a local read-only discovery substrate. It writes only to the selected
bundle directory and preserves unknown / cannot_verify / not_assessed instead of
inventing architecture.

Set these paths for this project:

\`\`\`bash
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
\`\`\`

Use the target-local wrappers above as the installed Portolan interface. Do not
inspect or depend on the external Portolan source checkout during routine atlas
runs; the wrappers already know where it is.

Run doctor first before building. It is read-only and reports target shape,
bundle writability, tool availability, rough size, and local-first expectations:

\`\`\`bash
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$SCAN_WRAPPER_SH --doctor $TARGET_ROOT_SH $BUNDLE_DIR_SH --skip-install --no-viewer
\`\`\`

Show the captain the plan when useful. Dry-run is read-only and lists planned
reads, writes, tool commands, network expectations, and approval-required
actions:

\`\`\`bash
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$SCAN_WRAPPER_SH --dry-run $TARGET_ROOT_SH $BUNDLE_DIR_SH --skip-install --no-viewer
\`\`\`

Build the atlas first by running this complete block:

\`\`\`bash
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$SCAN_WRAPPER_SH $TARGET_ROOT_SH $BUNDLE_DIR_SH $SCAN_ARGS
\`\`\`

Remove \`--skip-install\` only after explicit operator approval to install
missing OSS tools. Missing producers stay as gaps.

Check bundle status after the scan:

\`\`\`bash
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$SCAN_WRAPPER_SH --status $TARGET_ROOT_SH $BUNDLE_DIR_SH
\`\`\`

After each scan, read \`receipt.json\` and
\`captain-atlas-scorecard.json\` under the configured bundle directory before
handoff. Preserve producer states/gaps, local-first flags, duration, first
useful captain insight, next actions, and viewer launch path.

Generate the deterministic Q&A/drill-down artifact before answering:

\`\`\`bash
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$QUERY_EVAL_WRAPPER_SH --run $BUNDLE_DIR_SH
\`\`\`

Then read \`captain-qna-eval.json\` and include its status in the handoff.

Build the captain-facing handoff files:

\`\`\`bash
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$HANDOFF_WRAPPER_SH $BUNDLE_DIR_SH
\`\`\`

Then read \`captain-handoff.md\` for the final captain summary and keep
\`captain-handoff.json\` as the machine-readable run artifact.

After the first bundle is queryable, deepen it when the user wants duplication,
Semgrep, Syft, and larger hotspot coverage:

\`\`\`bash
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$SCAN_WRAPPER_SH $TARGET_ROOT_SH $BUNDLE_DIR_SH $FULL_SCAN_ARGS
\`\`\`

Query the bundle instead of loading everything into chat:

\`\`\`bash
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$QUERY_WRAPPER_SH repos --bundle $BUNDLE_DIR_SH --limit 20
$QUERY_WRAPPER_SH relationships --bundle $BUNDLE_DIR_SH --limit 20
$QUERY_WRAPPER_SH hotspots --bundle $BUNDLE_DIR_SH --limit 20
$QUERY_WRAPPER_SH gaps --bundle $BUNDLE_DIR_SH --limit 20
$QUERY_WRAPPER_SH search --bundle $BUNDLE_DIR_SH --q "<term>" --limit 20
$QUERY_WRAPPER_SH source --bundle $BUNDLE_DIR_SH --repo "<repo-id>" --path "<path>" --line 1
\`\`\`

For selected code, ask the atlas for a bounded context packet first:

\`\`\`bash
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$QUERY_WRAPPER_SH selected-code --bundle $BUNDLE_DIR_SH --repo "<repo-id>" --path "<path>" --line 1 --limit 20
\`\`\`

If repo/path are unclear, resolve them through \`repos\`, \`search\`, \`symbol\`,
\`source\`, \`hotspots --repo\`, \`relationships\`, and \`gaps\`. Cite bundle
record ids or source paths for material claims. Open the viewer for human
navigation:

\`\`\`bash
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$VIEWER_WRAPPER_SH --bundle $BUNDLE_DIR_SH
\`\`\`
EOF
}

make_agent_instructions_block() {
  local out=$1
  cat >"$out" <<EOF
<!-- PORTOLAN START -->
## Portolan Atlas Harness

When asked to map, understand, explain, navigate, compare, or audit this local
software landscape, use Portolan before making broad architecture claims.

Portolan is a local read-only discovery substrate. It writes only to the selected
bundle directory and preserves unknown / cannot_verify / not_assessed instead of
inventing architecture.

Project paths:

\`\`\`bash
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
\`\`\`

Use the target-local wrappers above as the installed Portolan interface. Do not
inspect or depend on the external Portolan source checkout during routine atlas
runs; the wrappers already know where it is.

Run doctor first before building. It is read-only and reports target shape,
bundle writability, tool availability, rough size, and local-first expectations:

\`\`\`bash
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$SCAN_WRAPPER_SH --doctor $TARGET_ROOT_SH $BUNDLE_DIR_SH --skip-install --no-viewer
\`\`\`

Show the captain the plan when useful. Dry-run is read-only and lists planned
reads, writes, tool commands, network expectations, and approval-required
actions:

\`\`\`bash
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$SCAN_WRAPPER_SH --dry-run $TARGET_ROOT_SH $BUNDLE_DIR_SH --skip-install --no-viewer
\`\`\`

Build the atlas first by running this complete block:

\`\`\`bash
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$SCAN_WRAPPER_SH $TARGET_ROOT_SH $BUNDLE_DIR_SH $SCAN_ARGS
\`\`\`

Remove \`--skip-install\` only after explicit operator approval to install
missing OSS tools. Missing producers stay as gaps.

Check bundle status after the scan:

\`\`\`bash
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$SCAN_WRAPPER_SH --status $TARGET_ROOT_SH $BUNDLE_DIR_SH
\`\`\`

After each scan, read \`receipt.json\` and
\`captain-atlas-scorecard.json\` under the configured bundle directory before
handoff. Preserve producer states/gaps, local-first flags, duration, first
useful captain insight, next actions, and viewer launch path.

Generate the deterministic Q&A/drill-down artifact before answering:

\`\`\`bash
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$QUERY_EVAL_WRAPPER_SH --run $BUNDLE_DIR_SH
\`\`\`

Then read \`captain-qna-eval.json\` and include its status in the handoff.

Build the captain-facing handoff files:

\`\`\`bash
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$HANDOFF_WRAPPER_SH $BUNDLE_DIR_SH
\`\`\`

Then read \`captain-handoff.md\` for the final captain summary and keep
\`captain-handoff.json\` as the machine-readable run artifact.

After the first bundle is queryable, deepen it when the user wants duplication,
Semgrep, Syft, and larger hotspot coverage:

\`\`\`bash
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$SCAN_WRAPPER_SH $TARGET_ROOT_SH $BUNDLE_DIR_SH $FULL_SCAN_ARGS
\`\`\`

Query the bundle instead of loading everything into chat:

\`\`\`bash
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$QUERY_WRAPPER_SH repos --bundle $BUNDLE_DIR_SH --limit 20
$QUERY_WRAPPER_SH relationships --bundle $BUNDLE_DIR_SH --limit 20
$QUERY_WRAPPER_SH hotspots --bundle $BUNDLE_DIR_SH --limit 20
$QUERY_WRAPPER_SH gaps --bundle $BUNDLE_DIR_SH --limit 20
$QUERY_WRAPPER_SH search --bundle $BUNDLE_DIR_SH --q "<term>" --limit 20
$QUERY_WRAPPER_SH source --bundle $BUNDLE_DIR_SH --repo "<repo-id>" --path "<path>" --line 1
\`\`\`

For selected code, ask the atlas for a bounded context packet first:

\`\`\`bash
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$QUERY_WRAPPER_SH selected-code --bundle $BUNDLE_DIR_SH --repo "<repo-id>" --path "<path>" --line 1 --limit 20
\`\`\`

If repo/path are unclear, resolve them through \`repos\`, \`search\`, \`symbol\`,
\`source\`, \`hotspots --repo\`, \`relationships\`, and \`gaps\`. Cite bundle
record ids or source paths for material claims. Open the viewer for human
navigation:

\`\`\`bash
BUNDLE_DIR=$BUNDLE_DIR_SH
PORTOLAN_BIN=$WRAPPER_DIR_SH
$VIEWER_WRAPPER_SH --bundle $BUNDLE_DIR_SH
\`\`\`
<!-- PORTOLAN END -->
EOF
}

make_claude_block() {
  local out=$1
  make_agent_instructions_block "$out"
}

make_scan_wrapper() {
  local out=$1
  cat >"$out" <<EOF
#!/usr/bin/env bash
set -euo pipefail
PORTOLAN_PATH=$PORTOLAN_PATH_SH
exec "\$PORTOLAN_PATH/scripts/portolan-scan.sh" "\$@"
EOF
}

make_query_wrapper() {
  local out=$1
  cat >"$out" <<EOF
#!/usr/bin/env bash
set -euo pipefail
PORTOLAN_PATH=$PORTOLAN_PATH_SH
exec "\$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" "\$@"
EOF
}

make_query_eval_wrapper() {
  local out=$1
  cat >"$out" <<EOF
#!/usr/bin/env bash
set -euo pipefail
PORTOLAN_PATH=$PORTOLAN_PATH_SH
exec "\$PORTOLAN_PATH/scripts/run-query-eval.sh" "\$@"
EOF
}

make_handoff_wrapper() {
  local out=$1
  cat >"$out" <<EOF
#!/usr/bin/env bash
set -euo pipefail
PORTOLAN_PATH=$PORTOLAN_PATH_SH
exec "\$PORTOLAN_PATH/scripts/build-captain-handoff.sh" "\$@"
EOF
}

make_import_claims_wrapper() {
  local out=$1
  cat >"$out" <<EOF
#!/usr/bin/env bash
set -euo pipefail
PORTOLAN_PATH=$PORTOLAN_PATH_SH
exec "\$PORTOLAN_PATH/scripts/import-analysis-claims.sh" "\$@"
EOF
}

make_viewer_wrapper() {
  local out=$1
  cat >"$out" <<EOF
#!/usr/bin/env bash
set -euo pipefail
PORTOLAN_PATH=$PORTOLAN_PATH_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
if [[ \$# -eq 0 ]]; then
  set -- --bundle "\$BUNDLE_DIR"
fi
# Charter-08: the viewer wrapper opens the atlas as inlined HTML via /portolan:map
# (no HTTP server). Preserves the --bundle handoff contract.
exec node "\$PORTOLAN_PATH/portolan-core/scripts/portolan-map.mjs" "\$@"
EOF
}

install_wrappers() {
  local scan_wrapper query_wrapper query_eval_wrapper handoff_wrapper import_claims_wrapper viewer_wrapper
  scan_wrapper="$TMP_DIR/portolan-scan.sh"
  query_wrapper="$TMP_DIR/portolan-bundle-query.sh"
  query_eval_wrapper="$TMP_DIR/portolan-query-eval.sh"
  handoff_wrapper="$TMP_DIR/portolan-captain-handoff.sh"
  import_claims_wrapper="$TMP_DIR/portolan-import-analysis-claims.sh"
  viewer_wrapper="$TMP_DIR/portolan-viewer.sh"
  make_scan_wrapper "$scan_wrapper"
  make_query_wrapper "$query_wrapper"
  make_query_eval_wrapper "$query_eval_wrapper"
  make_handoff_wrapper "$handoff_wrapper"
  make_import_claims_wrapper "$import_claims_wrapper"
  make_viewer_wrapper "$viewer_wrapper"
  write_managed_executable "$WRAPPER_DIR/portolan-scan.sh" "$scan_wrapper"
  write_managed_executable "$WRAPPER_DIR/portolan-bundle-query.sh" "$query_wrapper"
  write_managed_executable "$WRAPPER_DIR/portolan-query-eval.sh" "$query_eval_wrapper"
  write_managed_executable "$WRAPPER_DIR/portolan-captain-handoff.sh" "$handoff_wrapper"
  write_managed_executable "$WRAPPER_DIR/portolan-import-analysis-claims.sh" "$import_claims_wrapper"
  write_managed_executable "$WRAPPER_DIR/portolan-viewer.sh" "$viewer_wrapper"
}

preflight_harness_conflicts() {
  local cursor_rule agent_block claude_block
  if has_harness cursor; then
    cursor_rule="$TMP_DIR/preflight-portolan-atlas.mdc"
    make_cursor_rule "$cursor_rule"
    assert_write_allowed "$TARGET_ROOT/.cursor/rules/portolan-atlas.mdc" "$cursor_rule"
  fi
  if has_agent_instructions_harness; then
    agent_block="$TMP_DIR/preflight-agents-portolan-block.md"
    make_agent_instructions_block "$agent_block"
    assert_managed_block_allowed "$TARGET_ROOT/AGENTS.md" "<!-- PORTOLAN START -->" "<!-- PORTOLAN END -->" "$agent_block"
  fi
  if has_harness claude; then
    claude_block="$TMP_DIR/preflight-claude-portolan-block.md"
    make_claude_block "$claude_block"
    assert_managed_block_allowed "$TARGET_ROOT/CLAUDE.md" "<!-- PORTOLAN START -->" "<!-- PORTOLAN END -->" "$claude_block"
  fi
}

check_harness_list
WRAPPER_DIR="$TARGET_ROOT/.portolan/bin"
WRAPPER_DIR_SH=$(shell_quote "$WRAPPER_DIR")
SCAN_WRAPPER_SH=$(shell_quote "$WRAPPER_DIR/portolan-scan.sh")
QUERY_WRAPPER_SH=$(shell_quote "$WRAPPER_DIR/portolan-bundle-query.sh")
QUERY_EVAL_WRAPPER_SH=$(shell_quote "$WRAPPER_DIR/portolan-query-eval.sh")
HANDOFF_WRAPPER_SH=$(shell_quote "$WRAPPER_DIR/portolan-captain-handoff.sh")
VIEWER_WRAPPER_SH=$(shell_quote "$WRAPPER_DIR/portolan-viewer.sh")
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

preflight_harness_conflicts
copy_runtime
PORTOLAN_PATH_SH=$(shell_quote "$ACTIVE_PORTOLAN_PATH")

install_wrappers

if has_harness cursor; then
  cursor_rule="$TMP_DIR/portolan-atlas.mdc"
  make_cursor_rule "$cursor_rule"
  write_if_changed "$TARGET_ROOT/.cursor/rules/portolan-atlas.mdc" "$cursor_rule"
fi

if has_agent_instructions_harness; then
  agent_block="$TMP_DIR/agents-portolan-block.md"
  make_agent_instructions_block "$agent_block"
  replace_managed_block "$TARGET_ROOT/AGENTS.md" "<!-- PORTOLAN START -->" "<!-- PORTOLAN END -->" "$agent_block"
fi

if has_harness claude; then
  claude_block="$TMP_DIR/claude-portolan-block.md"
  make_claude_block "$claude_block"
  replace_managed_block "$TARGET_ROOT/CLAUDE.md" "<!-- PORTOLAN START -->" "<!-- PORTOLAN END -->" "$claude_block"
fi

add_git_exclude

cat >&2 <<EOF
portolan install: complete
  target:        $TARGET_ROOT
  runtime mode:  $RUNTIME_MODE
  runtime path:  $ACTIVE_PORTOLAN_PATH
  bundle dir:    $BUNDLE_DIR
  command dir:   $WRAPPER_DIR
  harness:       $HARNESS
  scan profile:  $SCAN_PROFILE
EOF
