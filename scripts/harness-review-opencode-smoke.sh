#!/usr/bin/env bash
# Preflight OpenCode review harness health. Skips live review when tools absent.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
fail() { echo "harness-review-opencode-smoke: FAIL: $1" >&2; exit 1; }
skip() { echo "harness-review-opencode-smoke: skip: $1" >&2; exit 0; }

command -v codex-subagent >/dev/null || skip "codex-subagent not installed"
command -v opencode >/dev/null || skip "opencode not installed"

opencode models zai-coding-plan 2>/dev/null | grep -qx 'zai-coding-plan/glm-5.1' ||
  fail "model missing: zai-coding-plan/glm-5.1"
opencode models minimax 2>/dev/null | grep -qx 'minimax/MiniMax-M2.7' ||
  fail "model missing: minimax/MiniMax-M2.7"
opencode models kimi-for-coding 2>/dev/null | grep -qx 'kimi-for-coding/k2p6' ||
  fail "model missing: kimi-for-coding/k2p6"

PACK_DIR="$ROOT/.codex-subagents/context"
mkdir -p "$PACK_DIR"
CTX="$PACK_DIR/harness-review-smoke-$$.json"
trap 'rm -f "$CTX"' EXIT

codex-subagent context build \
  --cwd "$ROOT" \
  --subject "Harness review smoke" \
  --mode review \
  --goal "Confirm scripts/lib/jscpd-bounded.sh defines bounded jscpd flags." \
  --non-goal "Edit files" \
  --file scripts/lib/jscpd-bounded.sh \
  --out "$CTX"

OUT=$(mktemp)
if ! codex-subagent run opencode \
  --cwd "$ROOT" \
  --profile review \
  --context-pack "$CTX" \
  --role-template code-reviewer \
  --model "zai-coding-plan/glm-5.1" \
  --timeout 180 \
  >"$OUT" 2>&1; then
  fail "codex-subagent opencode smoke failed: $(tail -8 "$OUT")"
fi
[[ -s "$OUT" ]] || fail "empty review output"

echo "harness-review-opencode-smoke: ok"
