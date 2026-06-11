#!/usr/bin/env bash
# Build bounded search-index.jsonl for bundle query (spec 096).
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

command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }

: >"$OUT"
count=0
BUDGET="${PORTOLAN_SEARCH_INDEX_BUDGET:-5000}"

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
      lineno=0
      while IFS= read -r line && [[ $lineno -lt $MAX_LINES ]]; do
        lineno=$((lineno + 1))
        [[ -z "${line// }" ]] && continue
        jq -nc \
          --arg path "$rel" \
          --argjson line "$lineno" \
          --arg text "$line" \
          '{path:$path,line:$line,text:$text}' >>"$OUT"
        count=$((count + 1))
        [[ $count -ge $BUDGET ]] && break 2
      done < <(head -n "$MAX_LINES" "$fp" 2>/dev/null || true)
    done < <(git -C "$repo" ls-files 2>/dev/null || find "$repo" -type f 2>/dev/null | sed "s|^$repo/||")
  else
    while IFS= read -r fp; do
      rel=${fp#"$repo/"}
      case "$fp" in
        *.go|*.js|*.ts|*.py|*.md|*.yaml|*.yml|*.json|*.sh)
          ;;
        *) continue ;;
      esac
      lineno=0
      while IFS= read -r line && [[ $lineno -lt $MAX_LINES ]]; do
        lineno=$((lineno + 1))
        [[ -z "${line// }" ]] && continue
        jq -nc \
          --arg path "$rel" \
          --argjson line "$lineno" \
          --arg text "$line" \
          '{path:$path,line:$line,text:$text}' >>"$OUT"
        count=$((count + 1))
        [[ $count -ge $BUDGET ]] && break 2
      done < <(head -n "$MAX_LINES" "$fp" 2>/dev/null || true)
    done < <(find "$repo" -type f 2>/dev/null | head -n 500)
  fi
done < <(list_files)

echo "search-index: $count lines -> $OUT"
