#!/usr/bin/env bash
# Per-repo tier-A profiles (spec 104): purpose surfaces, module ids, declared deps,
# activity, maturity. Reads repos.json; writes repo-profiles.json. Read-only.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <target-root> <bundle-dir>" >&2
  exit 2
fi

TARGET_ROOT=$(cd "$1" && pwd)
BUNDLE_DIR=$2
REPOS_JSON="$BUNDLE_DIR/repos.json"
OUT="$BUNDLE_DIR/repo-profiles.json"
FILE_CAP="${PORTOLAN_PROFILE_FILE_CAP:-20000}"

command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }
[[ -f "$REPOS_JSON" ]] || { echo "repos.json missing in $BUNDLE_DIR" >&2; exit 1; }

list_files() {
  # gitignore-aware when possible; bounded fallback otherwise.
  # Guards: grep/git may exit non-zero, head may SIGPIPE upstream — neither
  # should kill the producer under set -euo pipefail.
  local root=$1
  if [[ -d "$root/.git" ]] && command -v git >/dev/null; then
    { git -C "$root" ls-files 2>/dev/null || true; } | head -n "$FILE_CAP"
  else
    { (cd "$root" && find . -maxdepth 8 \
      \( -name .git -o -name node_modules -o -name vendor -o -name dist -o -name build -o -name target \) -prune \
      -o -type f -print 2>/dev/null) || true; } | sed 's|^\./||' | head -n "$FILE_CAP"
  fi
}

json_str_or_null() {
  local v=${1:-}
  if [[ -z "$v" ]]; then echo 'null'; else jq -n --arg v "$v" '$v'; fi
}

repo_file() {
  # true iff <root>/<rel> is a regular file whose canonical path stays under
  # the repo root: a symlinked README/manifest must not pull outside content
  # into the bundle (jscpd shards use --noSymlinks; same posture here)
  local root=$1 rel=$2 rootreal absreal
  [[ -f "$root/$rel" ]] || return 1
  rootreal=$(readlink -f -- "$root" 2>/dev/null) || return 1
  absreal=$(readlink -f -- "$root/$rel" 2>/dev/null) || return 1
  [[ "$absreal" == "$rootreal"/* ]]
}

first_readme() {
  local root=$1
  local f
  for f in README.md README.MD Readme.md readme.md README README.rst README.txt; do
    repo_file "$root" "$f" && { echo "$f"; return 0; }
  done
  return 1
}

readme_title() {
  # First markdown heading; fallback to first prose line. Badge images,
  # raw HTML, and comment lines are noise, not a title.
  local file=$1
  local t
  t=$(grep -m1 -E '^#{1,2} ' "$file" 2>/dev/null | sed 's/^#\{1,2\} *//' || true)
  if [[ -z "$t" ]]; then
    t=$(grep -m1 -E '\S' <(grep -ivE '(^\s*(\[!\[|!\[|<|=|-|\*|\||:::|\{%)|licen[sc]e|copyright|this work for additional|to you under|apache\.org/licenses|unless required by|applicable law|express or implied|warranties or conditions|specific language governing|limitations under)' "$file" 2>/dev/null || true) 2>/dev/null |
      sed 's/^[#= ]*//' || true)
  fi
  printf '%s' "$t"
}

toml_field() {
  # toml_field <file> <section> <key> — first match inside [section]
  awk -v section="$2" -v key="$3" '
    /^\[/ { in_sec = ($0 == "[" section "]") }
    in_sec && $0 ~ "^" key "[ \t]*=" {
      val = $0
      sub(/^[^=]*=[ \t]*/, "", val)
      gsub(/^["'\'']|["'\''],?[ \t]*$/, "", val)
      print val
      exit
    }
  ' "$1" 2>/dev/null
}

toml_dep_keys() {
  awk -v section="$2" '
    /^\[/ { in_sec = ($0 == "[" section "]") ; next }
    in_sec && /^[A-Za-z0-9_.-]+[ \t]*=/ {
      key = $0
      sub(/[ \t]*=.*/, "", key)
      print key
    }
  ' "$1" 2>/dev/null
}

xml_first_tag() {
  # crude single-line extraction of first <tag>value</tag> outside <parent> nesting concerns
  grep -m1 -oE "<$2>[^<]*</$2>" "$1" 2>/dev/null | sed -E "s|</?$2>||g"
}

compose_services_json() {
  # Bounded YAML extraction: 2-space indented service keys under services:,
  # with image / ports / depends_on. Best effort; metadata-visible.
  awk '
    function flush() {
      if (svc != "") {
        printf "{\"name\":\"%s\",\"image\":%s,\"ports\":[%s],\"depends_on\":[%s]}\n",
          svc, (img == "" ? "null" : "\"" img "\""), ports, deps
      }
      svc=""; img=""; ports=""; deps=""; mode=""
    }
    /^services:[ \t]*$/ { in_services=1; next }
    in_services && /^[^ \t]/ { flush(); in_services=0 }
    !in_services { next }
    /^  [A-Za-z0-9_.-]+:[ \t]*$/ {
      flush()
      svc=$0; sub(/^  /, "", svc); sub(/:.*$/, "", svc)
      next
    }
    svc == "" { next }
    /^    image:[ \t]*/ {
      img=$0; sub(/^    image:[ \t]*/, "", img); gsub(/["'\''"]/, "", img); mode=""
      next
    }
    /^    ports:[ \t]*$/ { mode="ports"; next }
    /^    depends_on:[ \t]*$/ { mode="deps"; next }
    /^    [A-Za-z0-9_.-]+:/ { mode=""; next }
    mode != "" && /^      - / {
      item=$0; sub(/^      - /, "", item); gsub(/["'\''"]/, "", item)
      entry="\"" item "\""
      if (mode == "ports") ports = (ports == "" ? entry : ports "," entry)
      else deps = (deps == "" ? entry : deps "," entry)
      next
    }
    END { flush() }
  ' "$1" 2>/dev/null | jq -sc '.' 2>/dev/null || echo '[]'
}

profiles='[]'

while IFS=$'\t' read -r rid rpath rname; do
  if [[ -z "$rpath" || ! -d "$rpath" ]]; then
    echo "warn: repo path missing on disk, profile skipped: ${rid} (${rpath})" >&2
    continue
  fi

  files_tmp=$(mktemp)
  list_files "$rpath" >"$files_tmp"
  file_count=$(wc -l <"$files_tmp" | tr -d ' ')

  if [[ -d "$rpath/.git" ]]; then
    files_evidence="source-visible"
  else
    files_evidence="metadata-visible"
  fi

  languages=$({ awk -F. 'NF>1 {print "." $NF}' "$files_tmp" | sort | uniq -c | sort -rn || true; } | head -8 |
    awk '{printf "{\"ext\":\"%s\",\"files\":%s}\n", $2, $1}' | jq -sc '.')

  # --- README ---
  readme_path=""
  readme_title_val=""
  if rp=$(first_readme "$rpath"); then
    readme_path="$rp"
    readme_title_val=$(readme_title "$rpath/$rp")
  fi

  # --- manifests / module ids / declared deps ---
  manifests='[]'
  module_ids='[]'
  declared_deps='[]'

  add_manifest() { manifests=$(jq -c --argjson m "$1" '. + [$m]' <<<"$manifests"); }
  add_module_id() {
    [[ -z "${1:-}" ]] && return 0
    module_ids=$(jq -c --arg v "$1" '. + [$v] | unique' <<<"$module_ids")
  }
  add_deps_json() { declared_deps=$(jq -c --argjson d "$1" '. + $d | unique' <<<"$declared_deps"); }

  if repo_file "$rpath" package.json && jq -e . "$rpath/package.json" >/dev/null 2>&1; then
    nm_name=$(jq -r '.name // empty' "$rpath/package.json")
    nm_desc=$(jq -r '.description // empty' "$rpath/package.json")
    add_manifest "$(jq -nc --arg p package.json --arg n "$nm_name" --arg d "$nm_desc" \
      '{type:"npm",path:$p,name:(if $n=="" then null else $n end),description:(if $d=="" then null else $d end)}')"
    add_module_id "$nm_name"
    add_deps_json "$(jq -c '[(.dependencies // {}), (.devDependencies // {})] | map(keys) | add' "$rpath/package.json")"
  fi
  if repo_file "$rpath" go.mod; then
    gomod=$(grep -m1 -E '^module ' "$rpath/go.mod" | awk '{print $2}' || true)
    add_manifest "$(jq -nc --arg p go.mod --arg m "$gomod" '{type:"gomod",path:$p,module:(if $m=="" then null else $m end)}')"
    add_module_id "$gomod"
    add_deps_json "$(awk '/^require \(/{r=1;next} /^\)/{r=0} r && NF{print $1} /^require [^(]/{print $2}' "$rpath/go.mod" 2>/dev/null |
      jq -Rsc 'split("\n") | map(select(length>0))')"
  fi
  if repo_file "$rpath" pom.xml; then
    mv_artifact=$(xml_first_tag "$rpath/pom.xml" artifactId || true)
    mv_name=$(xml_first_tag "$rpath/pom.xml" name || true)
    mv_desc=$(xml_first_tag "$rpath/pom.xml" description || true)
    add_manifest "$(jq -nc --arg p pom.xml --arg a "$mv_artifact" --arg n "$mv_name" --arg d "$mv_desc" \
      '{type:"maven",path:$p,artifact_id:(if $a=="" then null else $a end),name:(if $n=="" then null else $n end),description:(if $d=="" then null else $d end)}')"
    add_module_id "$mv_artifact"
  fi
  if repo_file "$rpath" Cargo.toml; then
    cg_name=$(toml_field "$rpath/Cargo.toml" package name || true)
    cg_desc=$(toml_field "$rpath/Cargo.toml" package description || true)
    add_manifest "$(jq -nc --arg p Cargo.toml --arg n "$cg_name" --arg d "$cg_desc" \
      '{type:"cargo",path:$p,name:(if $n=="" then null else $n end),description:(if $d=="" then null else $d end)}')"
    add_module_id "$cg_name"
    add_deps_json "$(toml_dep_keys "$rpath/Cargo.toml" dependencies | jq -Rsc 'split("\n") | map(select(length>0))')"
  fi
  if repo_file "$rpath" pyproject.toml; then
    py_name=$(toml_field "$rpath/pyproject.toml" project name || true)
    py_desc=$(toml_field "$rpath/pyproject.toml" project description || true)
    add_manifest "$(jq -nc --arg p pyproject.toml --arg n "$py_name" --arg d "$py_desc" \
      '{type:"python",path:$p,name:(if $n=="" then null else $n end),description:(if $d=="" then null else $d end)}')"
    add_module_id "$py_name"
  fi
  if repo_file "$rpath" composer.json && jq -e . "$rpath/composer.json" >/dev/null 2>&1; then
    cp_name=$(jq -r '.name // empty' "$rpath/composer.json")
    cp_desc=$(jq -r '.description // empty' "$rpath/composer.json")
    add_manifest "$(jq -nc --arg p composer.json --arg n "$cp_name" --arg d "$cp_desc" \
      '{type:"composer",path:$p,name:(if $n=="" then null else $n end),description:(if $d=="" then null else $d end)}')"
    add_module_id "$cp_name"
    add_deps_json "$(jq -c '[(.require // {})] | map(keys) | add' "$rpath/composer.json")"
  fi
  if repo_file "$rpath" settings.gradle || repo_file "$rpath" settings.gradle.kts; then
    sg_file="settings.gradle"; repo_file "$rpath" settings.gradle.kts && sg_file="settings.gradle.kts"
    gr_name=$(grep -m1 -E 'rootProject\.name' "$rpath/$sg_file" 2>/dev/null |
      sed -E "s/.*rootProject\.name[ \t]*=?[ \t]*[\"']([^\"']+)[\"'].*/\1/" || true)
    add_manifest "$(jq -nc --arg p "$sg_file" --arg n "$gr_name" '{type:"gradle",path:$p,name:(if $n=="" then null else $n end)}')"
    add_module_id "$gr_name"
  fi

  # nested manifest scale (counts only; no parsing)
  manifest_counts=$({ grep -E '(^|/)(package\.json|go\.mod|pom\.xml|Cargo\.toml|pyproject\.toml|build\.gradle(\.kts)?)$' "$files_tmp" || true; } |
    awk -F/ '{print $NF}' | sort | uniq -c | awk '{printf "{\"file\":\"%s\",\"count\":%s}\n", $2, $1}' | jq -sc '.')

  # --- compose / docker ---
  compose_files=$({ grep -iE '(^|/)(docker-)?compose[^/]*\.ya?ml$' "$files_tmp" || true; } | head -5)
  compose_services='[]'
  while IFS= read -r cf; do
    { [[ -z "$cf" ]] || ! repo_file "$rpath" "$cf"; } && continue
    svc=$(compose_services_json "$rpath/$cf")
    compose_services=$(jq -c --arg f "$cf" --argjson s "$svc" '. + [{file:$f,services:$s}]' <<<"$compose_services")
  done <<<"$compose_files"

  docker_directives='[]'
  while IFS= read -r df; do
    { [[ -z "$df" ]] || ! repo_file "$rpath" "$df"; } && continue
    dd=$({ grep -E '^(EXPOSE|CMD|ENTRYPOINT) ' "$rpath/$df" 2>/dev/null || true; } |
      jq -Rsc --arg f "$df" 'split("\n") | map(select(length>0)) | {file:$f,directives:.}')
    docker_directives=$(jq -c --argjson d "$dd" '. + [$d]' <<<"$docker_directives")
  done < <({ grep -E '(^|/)Dockerfile[^/]*$' "$files_tmp" || true; } | head -5)

  # --- entrypoints ---
  entrypoints=$(
    {
      { grep -E '^cmd/[^/]+/' "$files_tmp" || true; } | cut -d/ -f1-2 | sort -u | sed 's/^/go:/'
      repo_file "$rpath" main.go && echo "go:main.go"
      repo_file "$rpath" main.py && echo "python:main.py"
      if repo_file "$rpath" package.json && jq -e . "$rpath/package.json" >/dev/null 2>&1; then
        jq -r '(.bin // {}) | if type == "object" then keys[] elif type == "string" then "." else empty end' \
          "$rpath/package.json" 2>/dev/null | sed 's/^/npm-bin:/' || true
        jq -e '.scripts.start' "$rpath/package.json" >/dev/null 2>&1 && echo "npm:scripts.start"
      fi
      true
    } | jq -Rsc 'split("\n") | map(select(length>0)) | unique'
  )

  api_specs=$({ grep -iE '(openapi|swagger|asyncapi)[^/]*\.(json|ya?ml)$' "$files_tmp" || true; } | head -10 |
    jq -Rsc 'split("\n") | map(select(length>0))')

  ci_files=$({ grep -E '(^\.github/workflows/[^/]+\.ya?ml$|^\.gitlab-ci\.yml$|^Jenkinsfile$|^\.circleci/config\.yml$)' "$files_tmp" || true; } |
    head -20 | jq -Rsc 'split("\n") | map(select(length>0))')

  # --- activity (per-repo git) ---
  last_commit=null
  commits_30d=null
  contributors=null
  if [[ -d "$rpath/.git" ]] && command -v git >/dev/null; then
    lc=$(git -C "$rpath" log -1 --format=%cI 2>/dev/null || true)
    [[ -n "$lc" ]] && last_commit=$(jq -n --arg v "$lc" '$v')
    c30=$(git -C "$rpath" rev-list --count --since="30 days ago" HEAD 2>/dev/null || true)
    [[ -n "$c30" ]] && commits_30d=$c30
    cn=$(git -C "$rpath" log --format=%ae 2>/dev/null | sort -u | wc -l | tr -d ' ' || true)
    [[ -n "$cn" && "$cn" != "0" ]] && contributors=$cn
  fi

  # --- maturity ---
  has_readme=false; [[ -n "$readme_path" ]] && has_readme=true
  has_ci=false; [[ "$(jq 'length' <<<"$ci_files")" -gt 0 ]] && has_ci=true
  has_tests=false
  if grep -qiE '(^|/)(tests?|spec|__tests__)/|_test\.|\.test\.|_spec\.' "$files_tmp"; then has_tests=true; fi
  has_docker=false
  if grep -qE '(^|/)Dockerfile' "$files_tmp" || [[ "$(jq 'length' <<<"$compose_services")" -gt 0 ]]; then has_docker=true; fi

  profile=$(jq -nc \
    --arg id "$rid" --arg name "$rname" --arg path "$rpath" \
    --argjson file_count "$file_count" --arg files_evidence "$files_evidence" \
    --argjson languages "$languages" \
    --argjson readme_path "$(json_str_or_null "$readme_path")" \
    --argjson readme_title "$(json_str_or_null "$readme_title_val")" \
    --argjson manifests "$manifests" \
    --argjson manifest_counts "$manifest_counts" \
    --argjson module_ids "$module_ids" \
    --argjson declared_deps "$declared_deps" \
    --argjson compose "$compose_services" \
    --argjson docker "$docker_directives" \
    --argjson entrypoints "$entrypoints" \
    --argjson api_specs "$api_specs" \
    --argjson ci_files "$ci_files" \
    --argjson last_commit "$last_commit" \
    --argjson commits_30d "$commits_30d" \
    --argjson contributors "$contributors" \
    --argjson has_readme "$has_readme" --argjson has_ci "$has_ci" \
    --argjson has_tests "$has_tests" --argjson has_docker "$has_docker" \
    '{
      id: $id, name: $name, path: $path,
      scale: {file_count: $file_count, evidence_state: $files_evidence},
      languages: $languages,
      purpose: {
        readme_path: $readme_path, readme_title: $readme_title,
        manifests: $manifests, manifest_counts: $manifest_counts,
        compose: $compose, docker: $docker,
        entrypoints: $entrypoints, api_specs: $api_specs,
        evidence_state: "metadata-visible"
      },
      module_ids: $module_ids,
      declared_deps: $declared_deps,
      ci_files: $ci_files,
      activity: {last_commit: $last_commit, commits_30d: $commits_30d, contributors: $contributors,
                 evidence_state: (if $last_commit == null then "unknown" else "metadata-visible" end)},
      maturity: {has_readme: $has_readme, has_ci: $has_ci, has_tests: $has_tests, has_docker: $has_docker}
    }')

  profiles=$(jq -c --argjson p "$profile" '. + [$p]' <<<"$profiles")
  rm -f "$files_tmp"
done < <(jq -r '.[] | [.id, .path, .name] | @tsv' "$REPOS_JSON")

jq -n \
  --arg schema_version "0.1.0" \
  --arg generated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --arg target_root "$TARGET_ROOT" \
  --arg producer "scan-repo-profiles" \
  --argjson repos "$profiles" \
  '{schema_version:$schema_version,generated_at:$generated_at,target_root:$target_root,producer:$producer,repos:$repos}' \
  >"$OUT"

echo "repo-profiles: $(jq '.repos | length' "$OUT") repos -> $OUT" >&2
