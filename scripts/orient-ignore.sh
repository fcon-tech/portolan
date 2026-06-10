#!/usr/bin/env bash
# Gitignore-aware path filtering for orient harness producers.
# Source from other scripts: . "$(dirname "$0")/orient-ignore.sh"

orient_path_to_repo_rel() {
  local repo_root=$1 path=$2
  repo_root=$(cd "$repo_root" && pwd)
  local norm
  norm=$(printf '%s' "$path" | sed 's|\\|/|g')
  if [[ "$norm" == "$repo_root" ]]; then
    echo ""
    return 0
  fi
  if [[ "$norm" == "$repo_root"/* ]]; then
    echo "${norm#"$repo_root"/}"
    return 0
  fi
  if [[ "$norm" != /* ]]; then
    echo "$norm"
    return 0
  fi
  return 1
}

orient_fallback_ignored_rel() {
  local rel=$1
  [[ -z "$rel" ]] && return 1
  case "$rel" in
    .git|*/.git|*.git/*|*/.git/*) return 0 ;;
  esac
  local part
  IFS=/ read -r -a parts <<<"$rel"
  for part in "${parts[@]}"; do
    case "$part" in
      node_modules|vendor|.git|.portolan|.codex-subagents|.cursor|orient-smoke|dist|bin|generated|.DS_Store|.idea|.vscode) return 0 ;;
    esac
  done
  case "$rel" in
    .agents/*)
      [[ "$rel" == .agents/skills/* ]] && return 1
      return 0
      ;;
    viewer/dist/*|*/orient-smoke/*|**/orient-smoke/**) return 0 ;;
  esac
  return 1
}

orient_rel_path_is_ignored() {
  local repo_root=$1 rel=$2
  [[ -z "$rel" ]] && return 1
  rel="${rel#./}"
  if [[ -d "$repo_root/.git" ]] && command -v git >/dev/null 2>&1; then
    if git -C "$repo_root" check-ignore -q -- "$rel" 2>/dev/null; then
      return 0
    fi
  fi
  orient_fallback_ignored_rel "$rel"
}

orient_path_is_ignored() {
  local repo_root=$1 path=$2
  local rel
  rel=$(orient_path_to_repo_rel "$repo_root" "$path" 2>/dev/null) || return 1
  orient_rel_path_is_ignored "$repo_root" "$rel"
}

orient_repo_file_list() {
  local repo_root=$1
  repo_root=$(cd "$repo_root" && pwd)
  if [[ -d "$repo_root/.git" ]] && command -v git >/dev/null 2>&1; then
    git -C "$repo_root" ls-files -co --exclude-standard 2>/dev/null || true
    return 0
  fi
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    local rel
    rel=$(orient_path_to_repo_rel "$repo_root" "$f" 2>/dev/null) || continue
    orient_rel_path_is_ignored "$repo_root" "$rel" && continue
    printf '%s\n' "$rel"
  done < <(find -P "$repo_root" -type f \
    \( -path '*/.git/*' -o -path '*/node_modules/*' -o -path '*/vendor/*' \
      -o -path '*/.portolan/*' -o -path '*/.codex-subagents/*' -o -path '*/orient-smoke/*' \
      -o -path '*/dist/*' -o -path '*/.cursor/*' \) -prune \
    -o -type f -print 2>/dev/null)
}
