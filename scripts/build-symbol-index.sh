#!/usr/bin/env bash
# Build symbol-index.jsonl from ctags producer output.
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
    repo_id=$(basename "$(dirname "$tags_file")")
    before=$(wc -l <"$OUT" | tr -d ' ')
    ctags_jq='select((._type == "tag" or (._type == null and .name != null)) and .name and .path) |
      {name, path, kind: (.kind // ""), line: (.line // 1), repo_id: $repo_id, producer: $producer, resolution_limit: $resolution_limit, evidence_state: $evidence_state}'
    if jq -e 'type == "array"' "$tags_file" >/dev/null 2>&1; then
      jq -c --arg producer "ctags" \
        --arg repo_id "$repo_id" \
        --arg resolution_limit "definition-only; not a full call graph" \
        --arg evidence_state "metadata-visible" \
        ".[] | $ctags_jq" "$tags_file" >>"$OUT" 2>/dev/null || true
    else
      jq -c -R \
        --arg producer "ctags" \
        --arg repo_id "$repo_id" \
        --arg resolution_limit "definition-only; not a full call graph" \
        --arg evidence_state "metadata-visible" \
        "fromjson? | select(type == \"object\") | $ctags_jq" \
        "$tags_file" >>"$OUT" 2>/dev/null || true
    fi
    after=$(wc -l <"$OUT" | tr -d ' ')
    count=$((count + after - before))
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
