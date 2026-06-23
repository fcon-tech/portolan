#!/usr/bin/env bash
# Import operator-supplied ast-index JSON export into symbol-index.jsonl.
# Portolan does NOT execute ast-index; import only.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <ast-index-export.json> <bundle-dir>" >&2
  exit 2
fi

INPUT=$1
BUNDLE_DIR=$2
OUT_DIR="$BUNDLE_DIR/producers/ast-index"
OUT="$OUT_DIR/symbol-index.jsonl"

command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }
[[ -f "$INPUT" ]] || { echo "input not found: $INPUT" >&2; exit 1; }

mkdir -p "$OUT_DIR"
: >"$OUT"

# Supports: array of {name, path, kind, line} or {symbols:[...]} wrapper
while IFS= read -r row; do
  [[ -z "$row" ]] && continue
  written=$(echo "$row" | jq -c \
    --arg producer "ast-index" \
    --arg evidence_state "metadata-visible" \
    --arg resolution_limit "name-based references; not a complete call graph" \
    'select(.name and .path) | . + {
      producer: $producer,
      evidence_state: $evidence_state,
      resolution_limit: $resolution_limit,
      line: (.line // 1)
    }' 2>/dev/null || true)
  [[ -n "$written" && "$written" != "null" ]] && echo "$written" >>"$OUT"
done < <(
  jq -c '
    if type == "array" then .[]
    elif .symbols then .symbols[]
    elif .definitions then .definitions[]
    else empty end
  ' "$INPUT" 2>/dev/null || true
)

count=$(wc -l <"$OUT" | tr -d ' ')
if [[ "$count" -eq 0 ]]; then
  echo "import-ast-index: no symbol rows parsed from $INPUT" >&2
  exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
"$SCRIPT_DIR/build-symbol-index.sh" "$BUNDLE_DIR"

echo "import-ast-index: $count rows -> $OUT"
