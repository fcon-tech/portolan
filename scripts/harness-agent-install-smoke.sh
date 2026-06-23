#!/usr/bin/env bash
# Smoke test for installing Portolan harness instructions.
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

make_source_copy() {
  local dest=$1
  mkdir -p "$dest"
  (
    cd "$ROOT"
    tar \
      --exclude='./.git' \
      --exclude='./.portolan' \
      --exclude='./viewer/node_modules' \
      --exclude='./viewer/dist' \
      -cf - .
  ) | tar -C "$dest" -xf -
}

DRY_TARGET="$TMP_DIR/target-dry-run"
mkdir -p "$DRY_TARGET"
git -C "$DRY_TARGET" init -q

"$ROOT/scripts/portolan-install.sh" "$DRY_TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$DRY_TARGET/.portolan/atlas" \
  --harness all \
  --dry-run >/dev/null

if [[ -e "$DRY_TARGET/.cursor/rules/portolan-atlas.mdc" || -e "$DRY_TARGET/AGENTS.md" || -e "$DRY_TARGET/CLAUDE.md" || -e "$DRY_TARGET/.portolan" ]]; then
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
test -f "$TARGET/CLAUDE.md"
test -x "$TARGET/.portolan/bin/portolan-scan.sh"
test -x "$TARGET/.portolan/bin/portolan-bundle-query.sh"
test -x "$TARGET/.portolan/bin/portolan-query-eval.sh"
test -x "$TARGET/.portolan/bin/portolan-captain-handoff.sh"
test -x "$TARGET/.portolan/bin/portolan-import-analysis-claims.sh"
test -x "$TARGET/.portolan/bin/portolan-viewer.sh"

rg -q 'PORTOLAN_BIN=.*/\.portolan/bin' "$TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'PORTOLAN_BIN=.*/\.portolan/bin' "$TARGET/AGENTS.md"
rg -q 'PORTOLAN_BIN=.*/\.portolan/bin' "$TARGET/CLAUDE.md"
if rg -q 'PORTOLAN_PATH=|harness/SKILL\.md|harness/recipes' \
  "$TARGET/.cursor/rules/portolan-atlas.mdc" "$TARGET/AGENTS.md" "$TARGET/CLAUDE.md"; then
  echo "installed agent instructions expose source-checkout guidance" >&2
  exit 1
fi
if rg -q -F "$ROOT" "$TARGET/.cursor/rules/portolan-atlas.mdc" "$TARGET/AGENTS.md" "$TARGET/CLAUDE.md"; then
  echo "installed agent instructions expose the Portolan source checkout path" >&2
  exit 1
fi
rg -q 'portolan-scan\.sh.*--yes --skip-install --no-viewer$' "$TARGET/.cursor/rules/portolan-atlas.mdc"
if rg -q -- '--core-only' "$TARGET/.cursor/rules/portolan-atlas.mdc"; then
  echo "default scan profile unexpectedly includes --core-only" >&2
  exit 1
fi
rg -q 'portolan-bundle-query\.sh.*repos --bundle' "$TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'portolan-bundle-query\.sh.*gaps --bundle' "$TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'captain-atlas-scorecard\.json' "$TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'portolan-query-eval\.sh.*--run' "$TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'captain-qna-eval\.json' "$TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'portolan-captain-handoff\.sh' "$TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'captain-handoff\.md' "$TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'portolan-scan\.sh.*--yes --skip-install --no-viewer$' "$TARGET/AGENTS.md"
if rg -q -- '--core-only' "$TARGET/AGENTS.md"; then
  echo "default AGENTS.md scan profile unexpectedly includes --core-only" >&2
  exit 1
fi
rg -q 'portolan-bundle-query\.sh.*gaps --bundle' "$TARGET/AGENTS.md"
rg -q 'captain-atlas-scorecard\.json' "$TARGET/AGENTS.md"
rg -q 'portolan-query-eval\.sh.*--run' "$TARGET/AGENTS.md"
rg -q 'captain-qna-eval\.json' "$TARGET/AGENTS.md"
rg -q 'portolan-captain-handoff\.sh' "$TARGET/AGENTS.md"
rg -q 'captain-handoff\.json' "$TARGET/AGENTS.md"
rg -q 'config,jscpd,semgrep,syft,ctags' "$TARGET/AGENTS.md"
rg -q 'PORTOLAN START' "$TARGET/AGENTS.md"
rg -q 'Keep this line\.' "$TARGET/AGENTS.md"
rg -q 'portolan-scan\.sh.*--yes --skip-install --no-viewer$' "$TARGET/CLAUDE.md"
rg -q 'portolan-bundle-query\.sh.*gaps --bundle' "$TARGET/CLAUDE.md"
rg -q 'captain-atlas-scorecard\.json' "$TARGET/CLAUDE.md"
rg -q 'portolan-query-eval\.sh.*--run' "$TARGET/CLAUDE.md"
rg -q 'captain-qna-eval\.json' "$TARGET/CLAUDE.md"
rg -q 'portolan-captain-handoff\.sh' "$TARGET/CLAUDE.md"
rg -q 'captain-handoff\.json' "$TARGET/CLAUDE.md"
rg -q 'config,jscpd,semgrep,syft,ctags' "$TARGET/CLAUDE.md"
rg -q 'PORTOLAN START' "$TARGET/CLAUDE.md"
rg -q '^\.portolan/$' "$TARGET/.git/info/exclude"

# Idempotent re-run must not fail when generated files are unchanged.
"$ROOT/scripts/portolan-install.sh" "$TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$TARGET/.portolan/atlas" \
  --harness all

echo "harness-agent-install-smoke: ok"

FAST_TARGET="$TMP_DIR/target-fast"
mkdir -p "$FAST_TARGET"
git -C "$FAST_TARGET" init -q

"$ROOT/scripts/portolan-install.sh" "$FAST_TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$FAST_TARGET/.portolan/atlas" \
  --harness all \
  --scan-profile fast

rg -q 'portolan-scan\.sh.*--yes --skip-install --no-viewer --core-only --producers config,ctags --shard-timeout 30 --hotspot-budget 50' "$FAST_TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'portolan-scan\.sh.*--yes --skip-install --no-viewer --core-only --producers config,ctags --shard-timeout 30 --hotspot-budget 50' "$FAST_TARGET/AGENTS.md"
rg -q 'portolan-scan\.sh.*--yes --skip-install --no-viewer --core-only --producers config,ctags --shard-timeout 30 --hotspot-budget 50' "$FAST_TARGET/CLAUDE.md"

echo "harness-agent-install-smoke-fast-profile: ok"

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
if [[ -e "$STALE_TARGET/.portolan" ]]; then
  echo "refused managed-block install left partial .portolan output" >&2
  exit 1
fi

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

CODEX_TARGET="$TMP_DIR/target-codex-only"
mkdir -p "$CODEX_TARGET"
git -C "$CODEX_TARGET" init -q

"$ROOT/scripts/portolan-install.sh" "$CODEX_TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$CODEX_TARGET/.portolan/atlas" \
  --harness codex >/dev/null

test -f "$CODEX_TARGET/AGENTS.md"
test ! -e "$CODEX_TARGET/.cursor/rules/portolan-atlas.mdc"
test ! -e "$CODEX_TARGET/CLAUDE.md"
test -x "$CODEX_TARGET/.portolan/bin/portolan-scan.sh"
rg -q 'PORTOLAN_BIN=.*/\.portolan/bin' "$CODEX_TARGET/AGENTS.md"
rg -q 'portolan-captain-handoff\.sh' "$CODEX_TARGET/AGENTS.md"

echo "harness-agent-install-smoke-codex-only: ok"

CLAUDE_CONFLICT_TARGET="$TMP_DIR/target-claude-conflict"
mkdir -p "$CLAUDE_CONFLICT_TARGET"
git -C "$CLAUDE_CONFLICT_TARGET" init -q
cat >"$CLAUDE_CONFLICT_TARGET/CLAUDE.md" <<'EOF'
# Existing Claude Instructions

Keep this before.

<!-- PORTOLAN START -->
stale claude block
<!-- PORTOLAN END -->

Keep this after.
EOF

if "$ROOT/scripts/portolan-install.sh" "$CLAUDE_CONFLICT_TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$CLAUDE_CONFLICT_TARGET/.portolan/atlas" \
  --harness claude >/dev/null 2>&1; then
  echo "stale Claude managed block was replaced without --force" >&2
  exit 1
fi
rg -q 'stale claude block' "$CLAUDE_CONFLICT_TARGET/CLAUDE.md"
if [[ -e "$CLAUDE_CONFLICT_TARGET/.portolan" ]]; then
  echo "refused Claude install left partial .portolan output" >&2
  exit 1
fi

"$ROOT/scripts/portolan-install.sh" "$CLAUDE_CONFLICT_TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$CLAUDE_CONFLICT_TARGET/.portolan/atlas" \
  --harness claude \
  --force >/dev/null

rg -q 'Keep this before\.' "$CLAUDE_CONFLICT_TARGET/CLAUDE.md"
rg -q 'Keep this after\.' "$CLAUDE_CONFLICT_TARGET/CLAUDE.md"
rg -q 'PORTOLAN START' "$CLAUDE_CONFLICT_TARGET/CLAUDE.md"
if rg -q 'stale claude block' "$CLAUDE_CONFLICT_TARGET/CLAUDE.md"; then
  echo "force Claude install left stale block text" >&2
  exit 1
fi

echo "harness-agent-install-smoke-claude-conflict: ok"

CURSOR_CONFLICT_TARGET="$TMP_DIR/target-cursor-conflict"
mkdir -p "$CURSOR_CONFLICT_TARGET/.cursor/rules"
git -C "$CURSOR_CONFLICT_TARGET" init -q
printf 'user-owned cursor rule\n' >"$CURSOR_CONFLICT_TARGET/.cursor/rules/portolan-atlas.mdc"

if "$ROOT/scripts/portolan-install.sh" "$CURSOR_CONFLICT_TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$CURSOR_CONFLICT_TARGET/.portolan/atlas" \
  --harness cursor >/dev/null 2>&1; then
  echo "cursor rule conflict was overwritten without --force" >&2
  exit 1
fi
rg -q 'user-owned cursor rule' "$CURSOR_CONFLICT_TARGET/.cursor/rules/portolan-atlas.mdc"
if [[ -e "$CURSOR_CONFLICT_TARGET/.portolan" ]]; then
  echo "refused cursor install left partial .portolan output" >&2
  exit 1
fi

"$ROOT/scripts/portolan-install.sh" "$CURSOR_CONFLICT_TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$CURSOR_CONFLICT_TARGET/.portolan/atlas" \
  --harness cursor \
  --force >/dev/null

test -x "$CURSOR_CONFLICT_TARGET/.portolan/bin/portolan-scan.sh"
test -x "$CURSOR_CONFLICT_TARGET/.portolan/bin/portolan-captain-handoff.sh"
rg -q 'Portolan Atlas' "$CURSOR_CONFLICT_TARGET/.cursor/rules/portolan-atlas.mdc"
if rg -q 'user-owned cursor rule' "$CURSOR_CONFLICT_TARGET/.cursor/rules/portolan-atlas.mdc"; then
  echo "force cursor install left stale rule text" >&2
  exit 1
fi

echo "harness-agent-install-smoke-cursor-conflict: ok"

FULL_TARGET="$TMP_DIR/target-full"
mkdir -p "$FULL_TARGET"
git -C "$FULL_TARGET" init -q

"$ROOT/scripts/portolan-install.sh" "$FULL_TARGET" \
  --portolan-path "$ROOT" \
  --bundle-dir "$FULL_TARGET/.portolan/atlas" \
  --harness all \
  --scan-profile full

test -x "$FULL_TARGET/.portolan/bin/portolan-scan.sh"
test -x "$FULL_TARGET/.portolan/bin/portolan-import-analysis-claims.sh"
rg -q 'portolan-scan\.sh.*--yes --skip-install --no-viewer$' "$FULL_TARGET/.cursor/rules/portolan-atlas.mdc"
rg -q 'portolan-scan\.sh.*--yes --skip-install --no-viewer$' "$FULL_TARGET/AGENTS.md"
rg -q 'portolan-scan\.sh.*--yes --skip-install --no-viewer$' "$FULL_TARGET/CLAUDE.md"
if rg -q -- '--core-only' "$FULL_TARGET/.cursor/rules/portolan-atlas.mdc"; then
  echo "full scan profile unexpectedly includes --core-only" >&2
  exit 1
fi
if rg -q -- '--core-only' "$FULL_TARGET/CLAUDE.md"; then
  echo "full Claude scan profile unexpectedly includes --core-only" >&2
  exit 1
fi

echo "harness-agent-install-smoke-full-profile: ok"

AUTONOMY_SOURCE="$TMP_DIR/portolan-source-copy"
AUTONOMY_TARGET="$TMP_DIR/target-autonomy"
make_source_copy "$AUTONOMY_SOURCE"
mkdir -p "$AUTONOMY_TARGET"
git -C "$AUTONOMY_TARGET" init -q
printf '# Runtime Autonomy Target\n' >"$AUTONOMY_TARGET/README.md"

"$AUTONOMY_SOURCE/scripts/portolan-install.sh" "$AUTONOMY_TARGET" \
  --portolan-path "$AUTONOMY_SOURCE" \
  --bundle-dir "$AUTONOMY_TARGET/.portolan/atlas" \
  --harness all >/dev/null

test -x "$AUTONOMY_TARGET/.portolan/runtime/portolan/scripts/portolan-scan.sh"
test -x "$AUTONOMY_TARGET/.portolan/bin/portolan-scan.sh"
test -x "$AUTONOMY_TARGET/.portolan/bin/portolan-bundle-query.sh"
if rg -q -F "$AUTONOMY_SOURCE" "$AUTONOMY_TARGET/.portolan/bin"; then
  echo "installed wrappers depend on the Portolan source copy path" >&2
  exit 1
fi
if rg -q -F "$AUTONOMY_SOURCE" \
  "$AUTONOMY_TARGET/.cursor/rules/portolan-atlas.mdc" \
  "$AUTONOMY_TARGET/AGENTS.md" \
  "$AUTONOMY_TARGET/CLAUDE.md"; then
  echo "installed instructions expose the Portolan source copy path" >&2
  exit 1
fi
mv "$AUTONOMY_SOURCE" "$TMP_DIR/portolan-source-copy-removed"
"$AUTONOMY_TARGET/.portolan/bin/portolan-scan.sh" \
  --doctor \
  "$AUTONOMY_TARGET" \
  "$AUTONOMY_TARGET/.portolan/atlas" \
  --skip-install \
  --no-viewer \
  --producers config,ctags >/dev/null
"$AUTONOMY_TARGET/.portolan/bin/portolan-bundle-query.sh" --help >/dev/null

echo "harness-agent-install-smoke-runtime-autonomy: ok"
