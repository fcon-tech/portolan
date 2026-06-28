#!/usr/bin/env bash
# Build captain-facing handoff artifacts from a Portolan bundle.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT_JSON=""
OUT_MD=""
POSITIONAL=()

usage() {
  cat <<'EOF'
usage: build-captain-handoff.sh [--out-json FILE] [--out-md FILE] <bundle-dir>

Writes:
  <bundle-dir>/captain-handoff.json
  <bundle-dir>/captain-handoff.md

The handoff is derived from receipt.json, captain-atlas-scorecard.json,
captain-qna-eval.json, and bounded bundle-query outputs.
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
    --out-json) require_opt_value --out-json "${2:-}"; OUT_JSON="$2"; shift 2 ;;
    --out-md) require_opt_value --out-md "${2:-}"; OUT_MD="$2"; shift 2 ;;
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

BUNDLE=$(cd "${POSITIONAL[0]}" && pwd)
ARGS=()
if [[ -n "$OUT_JSON" ]]; then
  ARGS+=(--out-json "$OUT_JSON")
fi
if [[ -n "$OUT_MD" ]]; then
  ARGS+=(--out-md "$OUT_MD")
fi

node "$ROOT/portolan-core/scripts/captain-handoff.mjs" "${ARGS[@]}" "$BUNDLE"
