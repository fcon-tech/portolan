#!/usr/bin/env bash
# Install Portolan atlas instructions into a target project for Cursor/OpenCode.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)

HARNESS="all"
PORTOLAN_PATH="$ROOT"
BUNDLE_DIR=""
FORCE=0
DRY_RUN=0
ADD_GIT_EXCLUDE=1
SCAN_PROFILE="fast"

usage() {
  local prog=${PORTOLAN_INSTALL_PROG:-$(basename "$0")}
  cat <<EOF
usage: $prog <target-root> [options]

Installs Portolan as an agent-usable atlas layer in a target project:
  - Cursor:  .cursor/rules/portolan-atlas.mdc
  - OpenCode: managed Portolan block in AGENTS.md

Options:
  --harness LIST          Comma-separated: cursor,opencode,all (default all)
  --portolan-path PATH    Portolan checkout path (default: this checkout)
  --bundle-dir PATH       Bundle output dir (default: <target-root>/.portolan/atlas)
  --force                 Replace an existing managed Portolan block/rule
  --scan-profile PROFILE  Initial scan profile: fast or full (default fast)
  --dry-run               Print planned writes without changing files
  --no-git-exclude        Do not add .portolan/ to .git/info/exclude
  -h, --help              Show this help

The installed instructions are local-first, read-only for target inspection, and
run portolan-scan with --skip-install by default. The fast profile builds an
initial atlas with config + ctags; agents can run the full enrichment command
after the first bundle is queryable.
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

shell_quote() {
  printf "'%s'" "$(printf '%s' "$1" | sed "s/'/'\\\\''/g")"
}

PORTOLAN_PATH_SH=$(shell_quote "$PORTOLAN_PATH")
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
      all|cursor|opencode) ;;
      *) echo "unknown harness in --harness: $item" >&2; exit 2 ;;
    esac
  done
  IFS=$old_ifs
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
PORTOLAN_PATH=$PORTOLAN_PATH_SH
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
\`\`\`

Build the atlas first by running this complete block:

\`\`\`bash
PORTOLAN_PATH=$PORTOLAN_PATH_SH
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
"\$PORTOLAN_PATH/scripts/portolan-scan.sh" "\$TARGET_ROOT" "\$BUNDLE_DIR" $SCAN_ARGS
\`\`\`

Remove \`--skip-install\` only after explicit operator approval to install
missing OSS tools. Missing producers stay as gaps.

After the first bundle is queryable, deepen it when the user wants duplication,
Semgrep, Syft, and larger hotspot coverage:

\`\`\`bash
PORTOLAN_PATH=$PORTOLAN_PATH_SH
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
"\$PORTOLAN_PATH/scripts/portolan-scan.sh" "\$TARGET_ROOT" "\$BUNDLE_DIR" $FULL_SCAN_ARGS
\`\`\`

Query the bundle instead of loading everything into chat:

\`\`\`bash
PORTOLAN_PATH=$PORTOLAN_PATH_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
"\$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" repos --bundle "\$BUNDLE_DIR" --limit 20
"\$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" relationships --bundle "\$BUNDLE_DIR" --limit 20
"\$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" hotspots --bundle "\$BUNDLE_DIR" --limit 20
"\$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" gaps --bundle "\$BUNDLE_DIR" --limit 20
"\$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" search --bundle "\$BUNDLE_DIR" --q "<term>" --limit 20
"\$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" source --bundle "\$BUNDLE_DIR" --repo "<repo-id>" --path "<path>" --line 1
\`\`\`

For selected code, resolve the repo/path through \`repos\`, \`search\`,
\`symbol\`, \`source\`, \`hotspots --repo\`, \`relationships\`, and \`gaps\`.
Cite bundle record ids or source paths for material claims. Open the viewer for
human navigation:

\`\`\`bash
PORTOLAN_PATH=$PORTOLAN_PATH_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
cd "\$PORTOLAN_PATH/viewer" && node scripts/build-static.js && node scripts/serve.js --bundle "\$BUNDLE_DIR"
\`\`\`
EOF
}

make_opencode_block() {
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
PORTOLAN_PATH=$PORTOLAN_PATH_SH
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
\`\`\`

Build the atlas first by running this complete block:

\`\`\`bash
PORTOLAN_PATH=$PORTOLAN_PATH_SH
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
"\$PORTOLAN_PATH/scripts/portolan-scan.sh" "\$TARGET_ROOT" "\$BUNDLE_DIR" $SCAN_ARGS
\`\`\`

Remove \`--skip-install\` only after explicit operator approval to install
missing OSS tools. Missing producers stay as gaps.

After the first bundle is queryable, deepen it when the user wants duplication,
Semgrep, Syft, and larger hotspot coverage:

\`\`\`bash
PORTOLAN_PATH=$PORTOLAN_PATH_SH
TARGET_ROOT=$TARGET_ROOT_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
"\$PORTOLAN_PATH/scripts/portolan-scan.sh" "\$TARGET_ROOT" "\$BUNDLE_DIR" $FULL_SCAN_ARGS
\`\`\`

Query the bundle instead of loading everything into chat:

\`\`\`bash
PORTOLAN_PATH=$PORTOLAN_PATH_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
"\$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" repos --bundle "\$BUNDLE_DIR" --limit 20
"\$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" relationships --bundle "\$BUNDLE_DIR" --limit 20
"\$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" hotspots --bundle "\$BUNDLE_DIR" --limit 20
"\$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" gaps --bundle "\$BUNDLE_DIR" --limit 20
"\$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" search --bundle "\$BUNDLE_DIR" --q "<term>" --limit 20
"\$PORTOLAN_PATH/scripts/portolan-bundle-query.sh" source --bundle "\$BUNDLE_DIR" --repo "<repo-id>" --path "<path>" --line 1
\`\`\`

For selected code, resolve the repo/path through \`repos\`, \`search\`,
\`symbol\`, \`source\`, \`hotspots --repo\`, \`relationships\`, and \`gaps\`.
Cite bundle record ids or source paths for material claims. Open the viewer for
human navigation:

\`\`\`bash
PORTOLAN_PATH=$PORTOLAN_PATH_SH
BUNDLE_DIR=$BUNDLE_DIR_SH
cd "\$PORTOLAN_PATH/viewer" && node scripts/build-static.js && node scripts/serve.js --bundle "\$BUNDLE_DIR"
\`\`\`
<!-- PORTOLAN END -->
EOF
}

check_harness_list
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

if has_harness cursor; then
  cursor_rule="$TMP_DIR/portolan-atlas.mdc"
  make_cursor_rule "$cursor_rule"
  write_if_changed "$TARGET_ROOT/.cursor/rules/portolan-atlas.mdc" "$cursor_rule"
fi

if has_harness opencode; then
  opencode_block="$TMP_DIR/opencode-portolan-block.md"
  make_opencode_block "$opencode_block"
  replace_managed_block "$TARGET_ROOT/AGENTS.md" "<!-- PORTOLAN START -->" "<!-- PORTOLAN END -->" "$opencode_block"
fi

add_git_exclude

cat >&2 <<EOF
portolan install: complete
  target:        $TARGET_ROOT
  portolan path: $PORTOLAN_PATH
  bundle dir:    $BUNDLE_DIR
  harness:       $HARNESS
  scan profile:  $SCAN_PROFILE
EOF
