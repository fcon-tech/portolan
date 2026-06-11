#!/usr/bin/env bash
# Build symbol-index.jsonl from ctags producer output (spec 096).
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <bundle-dir>" >&2
  exit 2
fi

BUNDLE_DIR=$1
PRODUCERS="$BUNDLE_DIR/producers/ctags"
OUT="$BUNDLE_DIR/symbol-index.jsonl"
AST_OUT="$BUNDLE_DIR/producers/ast-index/symbol-index.jsonl"

command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }

: >"$OUT"
count=0

if [[ -d "$PRODUCERS" ]]; then
  while IFS= read -r tags_file; do
    [[ -f "$tags_file" ]] || continue
    while IFS= read -r row; do
      [[ -z "$row" ]] && continue
      echo "$row" | jq -c \
        --arg producer "ctags" \
        --arg resolution_limit "definition-only; not a full call graph" \
        --arg evidence_state "metadata-visible" \
        '. + {producer:$producer,resolution_limit:$resolution_limit,evidence_state:$evidence_state}' >>"$OUT"
      count=$((count + 1))
    done < <(jq -c '.[] | select(.name and .path) | {name, path, kind, line: (.line // 1)}' "$tags_file" 2>/dev/null || true)
  done < <(find "$PRODUCERS" -name 'tags.json' 2>/dev/null)
fi

if [[ -f "$AST_OUT" ]]; then
  while IFS= read -r row; do
    [[ -z "$row" ]] && continue
    echo "$row" >>"$OUT"
    count=$((count + 1))
  done <"$AST_OUT"
fi

if [[ $count -eq 0 ]]; then
  echo "symbol-index: no ctags or ast-index symbols (skipped)" >&2
  exit 0
fi

echo "symbol-index: $count symbols -> $OUT"
