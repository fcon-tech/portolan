#!/usr/bin/env bash
# Smoke test for installing Cursor/OpenCode Portolan harness instructions.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

fail() {
  echo "harness-agent-install-smoke: FAIL: $*" >&2
  exit 1
}

require_cmd() {
  local cmd=$1
  command -v "$cmd" >/dev/null 2>&1 || fail "$cmd is required for smoke assertions"
}

require_cmd rg

DRY_TARGET="$TMP_DIR/target-dry-run"
mkdir -p "$DRY_TARGET"
git -C "$DRY_TARGET" init -q

"$ROOT/scripts/portolan-install.sh" "$DRY_TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$DRY_TARGET/.portolan/atlas" \
  --harness all \
  --dry-run >/dev/null

if [[ -e "$DRY_TARGET/.cursor/rules/portolan-atlas.mdc" || -e "$DRY_TARGET/AGENTS.md" || -e "$DRY_TARGET/.portolan" ]]; then
  echo "dry-run wrote install files" >&2
  exit 1
fi
if rg -q '^\.portolan/$' "$DRY_TARGET/.git/info/exclude"; then
  echo "dry-run updated git exclude" >&2
  exit 1
fi

TARGET="$TMP_DIR/target"
mkdir -p "$TARGET"
git -C "$TARGET" init -q
printf '# Existing Project Instructions\n\nKeep this line.\n' >"$TARGET/AGENTS.md"

"$ROOT/scripts/portolan-install.sh" "$TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$TARGET/.portolan/atlas" \
  --harness all

test -f "$TARGET/.cursor/rules/portolan-atlas.mdc"
test -f "$TARGET/AGENTS.md"
test -x "$TARGET/.portolan/bin/portolan-scan.sh"
test -x "$TARGET/.portolan/bin/portolan-bundle-query.sh"
test -x "$TARGET/.portolan/bin/portolan-viewer.sh"

rg -q 'PORTOLAN_BIN=.*/\.portolan/bin' "$TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'PORTOLAN_BIN=.*/\.portolan/bin' "$TARGET/AGENTS.md"
rg -q 'portolan-scan\.sh".*--yes --skip-install --no-viewer --core-only --producers config,ctags --shard-timeout 30 --hotspot-budget 50' "$TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'portolan-bundle-query\.sh" repos --bundle' "$TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'portolan-bundle-query\.sh" gaps --bundle' "$TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'portolan-scan\.sh".*--yes --skip-install --no-viewer --core-only --producers config,ctags --shard-timeout 30 --hotspot-budget 50' "$TARGET/AGENTS.md"
rg -q 'portolan-bundle-query\.sh" gaps --bundle' "$TARGET/AGENTS.md"
rg -q 'config,jscpd,semgrep,syft,ctags' "$TARGET/AGENTS.md"
rg -q 'PORTOLAN START' "$TARGET/AGENTS.md"
rg -q 'Keep this line\.' "$TARGET/AGENTS.md"
rg -q '^\.portolan/$' "$TARGET/.git/info/exclude"

# Idempotent re-run must not fail when generated files are unchanged.
"$ROOT/scripts/portolan-install.sh" "$TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$TARGET/.portolan/atlas" \
  --harness all

echo "harness-agent-install-smoke: ok"

STALE_TARGET="$TMP_DIR/target-stale"
mkdir -p "$STALE_TARGET"
git -C "$STALE_TARGET" init -q
cat >"$STALE_TARGET/AGENTS.md" <<'EOF'
# Existing Project Instructions

Keep this before.

<!-- PORTOLAN START -->
stale managed block
<!-- PORTOLAN END -->

Keep this after.
EOF

if "$ROOT/scripts/portolan-install.sh" "$STALE_TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$STALE_TARGET/.portolan/atlas" \
  --harness opencode >/dev/null 2>&1; then
  echo "stale managed block was replaced without --force" >&2
  exit 1
fi
rg -q 'stale managed block' "$STALE_TARGET/AGENTS.md"

"$ROOT/scripts/portolan-install.sh" "$STALE_TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$STALE_TARGET/.portolan/atlas" \
  --harness opencode \
  --force >/dev/null

rg -q 'Keep this before\.' "$STALE_TARGET/AGENTS.md"
rg -q 'Keep this after\.' "$STALE_TARGET/AGENTS.md"
rg -q 'PORTOLAN START' "$STALE_TARGET/AGENTS.md"
if rg -q 'stale managed block' "$STALE_TARGET/AGENTS.md"; then
  echo "force install left stale managed block in AGENTS.md" >&2
  exit 1
fi

echo "harness-agent-install-smoke-managed-block: ok"

FULL_TARGET="$TMP_DIR/target-full"
mkdir -p "$FULL_TARGET"
git -C "$FULL_TARGET" init -q

"$ROOT/scripts/portolan-install.sh" "$FULL_TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$FULL_TARGET/.portolan/atlas" \
  --harness all \
  --scan-profile full

test -x "$FULL_TARGET/.portolan/bin/portolan-scan.sh"
rg -q 'portolan-scan\.sh".*--yes --skip-install --no-viewer$' "$FULL_TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'portolan-scan\.sh".*--yes --skip-install --no-viewer$' "$FULL_TARGET/AGENTS.md"
if rg -q -- '--core-only' "$FULL_TARGET/.cursor/rules/portolan-atlas.mdc"; then
  echo "full scan profile unexpectedly includes --core-only" >&2
  exit 1
fi

echo "harness-agent-install-smoke-full-profile: ok"
