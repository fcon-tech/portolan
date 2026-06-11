#!/usr/bin/env bash
# Build bounded search-index.jsonl for bundle query (spec 096 / 099).
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <target-root> <bundle-dir> [max-lines-per-file]" >&2
  exit 2
fi

TARGET_ROOT=$(cd "$1" && pwd)
BUNDLE_DIR=$2
MAX_LINES="${3:-50}"
OUT="$BUNDLE_DIR/search-index.jsonl"
REPOS_JSON="$BUNDLE_DIR/repos.json"
META="$BUNDLE_DIR/.search-index-meta.json"

command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }

: >"$OUT"
count=0
BUDGET="${PORTOLAN_SEARCH_INDEX_BUDGET:-5000}"
USE_RG=0
if command -v rg >/dev/null 2>&1; then
  USE_RG=1
fi

append_line() {
  local rel=$1 lineno=$2 line=$3
  [[ -z "${line// }" ]] && return 0
  jq -nc \
    --arg path "$rel" \
    --argjson line "$lineno" \
    --arg text "$line" \
    '{path:$path,line:$line,text:$text}' >>"$OUT"
  count=$((count + 1))
}

index_file_head() {
  local fp=$1 rel=$2
  local lineno=0
  while IFS= read -r line && [[ $lineno -lt $MAX_LINES ]]; do
    lineno=$((lineno + 1))
    append_line "$rel" "$lineno" "$line"
    [[ $count -ge $BUDGET ]] && return 1
  done < <(head -n "$MAX_LINES" "$fp" 2>/dev/null || true)
  return 0
}

index_file_rg() {
  local fp=$1 rel=$2
  while IFS= read -r match; do
    [[ -z "$match" ]] && continue
    local lineno="${match%%:*}"
    local text="${match#*:}"
    [[ "$lineno" =~ ^[0-9]+$ ]] || continue
    append_line "$rel" "$lineno" "$text"
    [[ $count -ge $BUDGET ]] && return 1
  done < <(rg -n --no-heading --max-count "$MAX_LINES" '.' "$fp" 2>/dev/null || true)
  return 0
}

index_file() {
  local fp=$1 rel=$2
  if [[ $USE_RG -eq 1 ]]; then
    index_file_rg "$fp" "$rel" || return 1
  else
    index_file_head "$fp" "$rel" || return 1
  fi
  return 0
}

list_files() {
  if [[ -f "$REPOS_JSON" ]]; then
    jq -r '.[].path' "$REPOS_JSON"
  else
    echo "$TARGET_ROOT"
  fi
}

while IFS= read -r repo; do
  [[ -z "$repo" ]] && continue
  if [[ -d "$repo/.git" ]]; then
    while IFS= read -r rel; do
      [[ -z "$rel" ]] && continue
      fp="$repo/$rel"
      [[ -f "$fp" ]] || continue
      case "$fp" in
        *.go|*.js|*.ts|*.tsx|*.py|*.java|*.rb|*.sh|*.yaml|*.yml|*.json|*.md|*.xml|*.gradle|*.kt)
          ;;
        *) continue ;;
      esac
      index_file "$fp" "$rel" || break 2
    done < <(git -C "$repo" ls-files 2>/dev/null || find "$repo" -type f 2>/dev/null | sed "s|^$repo/||")
  else
    while IFS= read -r fp; do
      rel=${fp#"$repo/"}
      case "$fp" in
        *.go|*.js|*.ts|*.py|*.md|*.yaml|*.yml|*.json|*.sh)
          ;;
        *) continue ;;
      esac
      index_file "$fp" "$rel" || break 2
    done < <(find "$repo" -type f 2>/dev/null | head -n 500)
  fi
done < <(list_files)

mode="head-only"
if [[ $USE_RG -eq 1 ]]; then
  mode="rg-bounded"
fi
jq -n --arg mode "$mode" --argjson lines "$count" \
  '{mode:$mode,lines:$lines,budget:'"$BUDGET"'}' >"$META"

echo "search-index: $count lines ($mode) -> $OUT"
