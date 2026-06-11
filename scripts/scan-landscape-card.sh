#!/usr/bin/env bash
# Emit landscape-card.json (standalone Portolan contract; no sdp_lab runtime).
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <target-root> <out.json>" >&2
  exit 2
fi

TARGET_ROOT=$(cd "$1" && pwd)
OUT=$2

command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
# shellcheck source=portolan-ignore.sh
. "$SCRIPT_DIR/portolan-ignore.sh"

scan_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
name=$(basename "$TARGET_ROOT")

# Language detection from source extensions (git ls-files when possible)
declare -A lang_files
total_files=0
source_files=0
test_files=0

count_file() {
  local rel=$1
  local ext="${rel##*.}"
  case "$ext" in
    go) lang_files[go]=$(( ${lang_files[go]:-0} + 1 )) ; source_files=$((source_files + 1)) ;;
    ts|tsx) lang_files[typescript]=$(( ${lang_files[typescript]:-0} + 1 )) ; source_files=$((source_files + 1)) ;;
    js|jsx|mjs|cjs) lang_files[javascript]=$(( ${lang_files[javascript]:-0} + 1 )) ; source_files=$((source_files + 1)) ;;
    py) lang_files[python]=$(( ${lang_files[python]:-0} + 1 )) ; source_files=$((source_files + 1)) ;;
    sh|bash) lang_files[shell]=$(( ${lang_files[shell]:-0} + 1 )) ; source_files=$((source_files + 1)) ;;
    md) lang_files[markdown]=$(( ${lang_files[markdown]:-0} + 1 )) ;;
    json|jsonl|yaml|yml) lang_files[config]=$(( ${lang_files[config]:-0} + 1 )) ;;
    *) ;;
  esac
  if [[ "$rel" == *test* || "$rel" == *_test.go ]]; then
    test_files=$((test_files + 1))
  fi
  total_files=$((total_files + 1))
}

if [[ -d "$TARGET_ROOT/.git" ]]; then
  while IFS= read -r rel; do
    [[ -z "$rel" ]] && continue
    portolan_rel_path_is_ignored "$TARGET_ROOT" "$rel" && continue
    count_file "$rel"
  done < <(portolan_repo_file_list "$TARGET_ROOT")
else
  while IFS= read -r f; do
    rel=${f#"$TARGET_ROOT"/}
    count_file "$rel"
  done < <(find "$TARGET_ROOT" -type f 2>/dev/null | head -5000)
fi

primary_lang="unknown"
max_count=0
for lang in "${!lang_files[@]}"; do
  c=${lang_files[$lang]}
  if [[ $c -gt $max_count ]]; then
    max_count=$c
    primary_lang=$lang
  fi
done

languages_json='{}'
for lang in "${!lang_files[@]}"; do
  ratio=0
  if [[ $source_files -gt 0 ]]; then
    ratio=$(awk "BEGIN {printf \"%.4f\", ${lang_files[$lang]} / $source_files}")
  fi
  languages_json=$(echo "$languages_json" | jq --arg l "$lang" --argjson f "${lang_files[$lang]}" --argjson r "$ratio" \
    '. + {($l): {files: $f, ratio: ($r | tonumber)}}')
done

test_ratio=0
if [[ $source_files -gt 0 ]]; then
  test_ratio=$(awk "BEGIN {printf \"%.4f\", $test_files / $source_files}")
fi

# Git activity
last_commit=null
contributors=0
commits_30d=0
if [[ -d "$TARGET_ROOT/.git" ]]; then
  last_commit=$(git -C "$TARGET_ROOT" log -1 --format=%cs 2>/dev/null || echo null)
  contributors=$(git -C "$TARGET_ROOT" shortlog -sn --all 2>/dev/null | wc -l | tr -d ' ')
  commits_30d=$(git -C "$TARGET_ROOT" log --since=30.days.ago --oneline 2>/dev/null | wc -l | tr -d ' ')
fi

staleness="unknown"
if [[ "$last_commit" != "null" && -n "$last_commit" ]]; then
  days_ago=$(( ($(date +%s) - $(date -d "$last_commit" +%s 2>/dev/null || echo 0)) / 86400 ))
  if [[ $days_ago -lt 30 ]]; then staleness="active"
  elif [[ $days_ago -lt 180 ]]; then staleness="recent"
  elif [[ $days_ago -lt 365 ]]; then staleness="stale"
  else staleness="dormant"
  fi
fi

has_readme=false
has_ci=false
has_tests=false
has_docker=false
[[ -f "$TARGET_ROOT/README.md" || -f "$TARGET_ROOT/readme.md" ]] && has_readme=true
[[ -d "$TARGET_ROOT/.github/workflows" ]] && has_ci=true
[[ $test_files -gt 0 ]] && has_tests=true
[[ -f "$TARGET_ROOT/Dockerfile" || -f "$TARGET_ROOT/docker-compose.yml" ]] && has_docker=true

monorepo=false
repo_count=0
if [[ -d "$TARGET_ROOT/.git" ]]; then
  repo_count=1
else
  while IFS= read -r gitdir; do
    repo_count=$((repo_count + 1))
  done < <(find "$TARGET_ROOT" -maxdepth 4 -type d -name .git 2>/dev/null)
  [[ $repo_count -gt 1 ]] && monorepo=true
fi
[[ $repo_count -eq 0 ]] && repo_count=1

build_system=null
for f in go.mod package.json Cargo.toml pom.xml build.gradle; do
  if [[ -f "$TARGET_ROOT/$f" ]]; then
    case "$f" in
      go.mod) build_system="go" ;;
      package.json) build_system="npm" ;;
      Cargo.toml) build_system="cargo" ;;
      pom.xml|build.gradle) build_system="maven" ;;
    esac
    break
  fi
done

jq -n \
  --arg version "0.1.0" \
  --arg scanned_at "$scan_at" \
  --arg name "$name" \
  --arg primary_language "$primary_lang" \
  --argjson languages "$languages_json" \
  --argjson monorepo "$monorepo" \
  --arg build_system "${build_system:-null}" \
  --argjson total_files "$total_files" \
  --argjson source_files "$source_files" \
  --argjson test_files "$test_files" \
  --argjson test_ratio "$test_ratio" \
  --arg last_commit "${last_commit:-null}" \
  --argjson contributors "$contributors" \
  --argjson commits_30d "$commits_30d" \
  --argjson has_readme "$has_readme" \
  --argjson has_ci "$has_ci" \
  --argjson has_tests "$has_tests" \
  --argjson has_docker "$has_docker" \
  --arg staleness "$staleness" \
  --argjson repo_count "$repo_count" \
  '{
    version: $version,
    scanned_at: $scanned_at,
    identity: {
      name: $name,
      primary_language: $primary_language,
      languages: $languages,
      monorepo: $monorepo,
      build_system: (if $build_system == "null" then null else $build_system end),
      repo_count: $repo_count
    },
    scale: {
      total_files: $total_files,
      source_files: $source_files,
      test_files: $test_files,
      test_ratio: $test_ratio
    },
    activity: {
      last_commit: (if $last_commit == "null" then null else $last_commit end),
      contributors: $contributors,
      commits_30d: $commits_30d
    },
    maturity: {
      has_readme: $has_readme,
      has_ci: $has_ci,
      has_tests: $has_tests,
      has_docker: $has_docker
    },
    health_signals: {
      staleness: $staleness,
      test_coverage_hint: (if $test_ratio > 0.3 then "good" elif $test_ratio > 0.1 then "partial" elif $test_files > 0 then "low" else "none" end)
    }
  }' >"$OUT"

echo "landscape-card: $OUT" >&2
