#!/usr/bin/env bash
# Shared read-only repository root discovery for Portolan shell entrypoints.
#
# Order:
#   1. real Git worktrees/repos;
#   2. repo-like children under <target>/repos for exported corpora;
#   3. strong repo-like direct children;
#   4. the target root as one plain directory.

portolan_discovery_is_ignored_dirname() {
  local path=$1 name
  name=$(basename "$path")
  case "$name" in
    .git|.portolan|.codex-subagents|.cursor|.agents|node_modules|vendor|build|dist|target|generated|metadata|runtime|claims)
      return 0
      ;;
  esac
  return 1
}

portolan_repo_like_has_marker() {
  local dir=$1 mode=${2:-strong} marker
  [[ -d "$dir" ]] || return 1
  portolan_discovery_is_ignored_dirname "$dir" && return 1

  for marker in \
    package.json go.mod pom.xml build.gradle build.gradle.kts settings.gradle settings.gradle.kts \
    Cargo.toml pyproject.toml composer.json Gemfile mix.exs pubspec.yaml Makefile Dockerfile \
    docker-compose.yml docker-compose.yaml compose.yml compose.yaml; do
    [[ -f "$dir/$marker" ]] && return 0
  done

  [[ -d "$dir/src" || -d "$dir/cmd" || -d "$dir/internal" || -d "$dir/app" ]] && return 0

  if [[ "$mode" == "loose" ]]; then
    for marker in README.md README.MD Readme.md readme.md README README.rst README.txt; do
      [[ -f "$dir/$marker" ]] && return 0
    done
  fi

  return 1
}

portolan_discover_git_repos() {
  local target=$1 repo
  local -a repos=()
  mapfile -t repos < <(find "$target" -mindepth 1 \
    \( -name .portolan -o -name .codex-subagents -o -name .cursor -o -name .agents \
      -o -name node_modules -o -name vendor -o -name build -o -name dist -o -name target \
      -o -name generated \) -prune \
    -o -name .git \( -type d -o -type f \) -print 2>/dev/null |
    while IFS= read -r git_marker; do
      dirname "$git_marker"
    done | sort -u)

  if [[ ${#repos[@]} -gt 1 ]]; then
    for repo in "${repos[@]}"; do
      [[ "$repo" == "$target" ]] && continue
      printf '%s\n' "$repo"
    done
    return 0
  fi

  if [[ ${#repos[@]} -eq 1 ]]; then
    printf '%s\n' "${repos[0]}"
  fi
}

portolan_discover_repo_like_children() {
  local target=$1 child
  if [[ -d "$target/repos" ]]; then
    while IFS= read -r child; do
      portolan_repo_like_has_marker "$child" loose && printf '%s\n' "$child"
    done < <(find "$target/repos" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort)
    return 0
  fi

  while IFS= read -r child; do
    portolan_repo_like_has_marker "$child" strong && printf '%s\n' "$child"
  done < <(find "$target" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort)
}

portolan_discover_repos() {
  local target=$1
  local -a repos=()

  mapfile -t repos < <(portolan_discover_git_repos "$target")
  if [[ ${#repos[@]} -gt 0 ]]; then
    printf '%s\n' "${repos[@]}"
    return 0
  fi

  mapfile -t repos < <(portolan_discover_repo_like_children "$target")
  if [[ ${#repos[@]} -gt 0 ]]; then
    printf '%s\n' "${repos[@]}"
    return 0
  fi

  printf '%s\n' "$target"
}
