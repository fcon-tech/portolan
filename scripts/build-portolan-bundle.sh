#!/usr/bin/env bash
# Build Portolan bundle from target root and producer outputs under
# <bundle-dir>/producers/. See harness/SKILL.md and docs/captain-atlas/.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <target-root> <bundle-dir>" >&2
  exit 2
fi

TARGET_ROOT=$(cd "$1" && pwd)

normalize_bundle_dir() {
  local raw=$1 out
  [[ -n "$raw" ]] || { echo "bundle dir is required" >&2; exit 2; }
  [[ "$raw" != "/" ]] || { echo "refusing to use / as bundle dir" >&2; exit 2; }
  if [[ -e "$raw" && ! -d "$raw" ]]; then
    echo "bundle dir exists and is not a directory: $raw" >&2
    exit 2
  fi
  mkdir -p "$raw"
  out=$(cd "$raw" && pwd)
  if [[ "$out" == "/" || "$out" == "$TARGET_ROOT" ]]; then
    echo "refusing unsafe bundle dir: $out" >&2
    exit 2
  fi
  if [[ -n "${HOME:-}" && "$out" == "$HOME" ]]; then
    echo "refusing unsafe bundle dir: $out" >&2
    exit 2
  fi
  printf '%s\n' "$out"
}

BUNDLE_DIR=$(normalize_bundle_dir "$2")
PRODUCERS_DIR="$BUNDLE_DIR/producers"
HOTSPOT_BUDGET="${PORTOLAN_HOTSPOT_BUDGET:-200}"
GAP_BUDGET="${PORTOLAN_GAP_BUDGET:-20}"
if ! [[ "$HOTSPOT_BUDGET" =~ ^[0-9]+$ ]] || [[ "$HOTSPOT_BUDGET" -lt 1 ]]; then
  echo "invalid PORTOLAN_HOTSPOT_BUDGET: $HOTSPOT_BUDGET" >&2
  exit 2
fi
if ! [[ "$GAP_BUDGET" =~ ^[0-9]+$ ]] || [[ "$GAP_BUDGET" -lt 1 ]]; then
  echo "invalid PORTOLAN_GAP_BUDGET: $GAP_BUDGET" >&2
  exit 2
fi
mkdir -p "$BUNDLE_DIR" "$PRODUCERS_DIR"

command -v jq >/dev/null 2>&1 || {
  echo "jq is required" >&2
  exit 1
}

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
# shellcheck source=portolan-ignore.sh
. "$SCRIPT_DIR/portolan-ignore.sh"
# shellcheck source=lib/repo-discovery.sh
. "$SCRIPT_DIR/lib/repo-discovery.sh"

hash_text() {
  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s' "$1" | sha256sum | cut -d' ' -f1
  elif command -v shasum >/dev/null 2>&1; then
    printf '%s' "$1" | shasum -a 256 | cut -d' ' -f1
  else
    echo "sha256sum or shasum is required" >&2
    exit 1
  fi
}

producer_repo_slug() {
  local p=$1
  local base hash
  base=$(basename "$p" | tr ' /' '__')
  hash=$(hash_text "$p" | cut -c1-8)
  echo "${base}-${hash}"
}

# --- repos.json (slug ids: basename + path hash, collision-safe) ---
# PORTOLAN_LIMIT_REPOS keeps the bundle repo set consistent with the
# --limit-repos cap applied to sharded producers in portolan-scan.sh.
LIMIT_REPOS="${PORTOLAN_LIMIT_REPOS:-0}"
repos='[]'
repo_seen=0
mapfile -t discovered_repos < <(portolan_discover_repos "$TARGET_ROOT")
repo_discovered_total=${#discovered_repos[@]}
for repo in "${discovered_repos[@]}"; do
  [[ -z "$repo" ]] && continue
  if [[ "$LIMIT_REPOS" -gt 0 && "$repo_seen" -ge "$LIMIT_REPOS" ]]; then
    break
  fi
  repo_seen=$((repo_seen + 1))
  name=$(basename "$repo")
  repos=$(echo "$repos" | jq --arg id "$(producer_repo_slug "$repo")" --arg path "$repo" --arg name "$name" \
    '. + [{id: $id, path: $path, name: $name}]')
done
echo "$repos" >"$BUNDLE_DIR/repos.json"
repo_limit_applied=0
if [[ "$LIMIT_REPOS" -gt 0 && "$repo_discovered_total" -gt "$repo_seen" ]]; then
  repo_limit_applied=1
fi

# --- repo-profiles.json ---
# drop any stale profiles first: a failed producer must leave no previous-run
# artifact behind while the gap says cannot_verify
rm -f "$BUNDLE_DIR/repo-profiles.json"
if ! "$SCRIPT_DIR/scan-repo-profiles.sh" "$TARGET_ROOT" "$BUNDLE_DIR" 2>&1; then
  echo "warn: scan-repo-profiles failed; recording gap" >&2
  rm -f "$BUNDLE_DIR/repo-profiles.json"
  PROFILE_GAP=1
else
  PROFILE_GAP=0
fi

hotspots_raw=$(mktemp)
: >"$hotspots_raw"
gaps_raw=$(mktemp)
: >"$gaps_raw"

append_gap() {
  jq -nc \
    --arg id "$1" --arg surface "$2" --arg status "$3" \
    --arg summary "$4" --arg recipe "${5:-}" \
    '{id:$id,surface:$surface,status:$status,summary:$summary} + (if $recipe != "" then {recipe:$recipe} else {} end)' >>"$gaps_raw"
}

[[ "${PROFILE_GAP:-0}" -eq 1 ]] && append_gap "gap-repo-profiles" "repo-profiles" "cannot_verify" \
  "scan-repo-profiles failed during bundle build." "scripts/scan-repo-profiles.sh"
if [[ "$repo_limit_applied" -eq 1 ]]; then
  append_gap "gap-repository-inventory-limit" "repository-inventory" "cannot_verify" \
    "Repository inventory is non_exhaustive: PORTOLAN_LIMIT_REPOS=$LIMIT_REPOS kept $repo_seen of $repo_discovered_total discovered repositories." \
    "rerun without --limit-repos for full inventory"
fi

bundle_path_ignored() {
  local p=$1
  [[ -z "$p" || "$p" == "(dependency-hub)" ]] && return 1
  local norm root
  norm=$(printf '%s' "$p" | sed 's|\\|/|g')
  root="$TARGET_ROOT"
  while IFS= read -r rpath; do
    [[ -z "$rpath" ]] && continue
    if [[ "$norm" == "$rpath" || "$norm" == "$rpath"/* ]]; then
      root="$rpath"
      break
    fi
  done < <(jq -r '.[].path' "$BUNDLE_DIR/repos.json")
  portolan_path_is_ignored "$root" "$norm"
}

filter_paths_json() {
  local raw=$1
  local -a kept=()
  local p
  while IFS= read -r p; do
    [[ -z "$p" ]] && continue
    bundle_path_ignored "$p" && continue
    kept+=("$p")
  done < <(jq -r '.[]?' <<<"$raw")
  if [[ ${#kept[@]} -eq 0 ]]; then
    echo '[]'
    return 0
  fi
  printf '%s\n' "${kept[@]}" | jq -Rsc 'split("\n") | map(select(length > 0))'
}

symbol_density_path_ignored() {
  local p=$1 base norm
  norm=$(printf '%s' "$p" | sed 's|\\|/|g')
  base=$(basename "$norm")
  case "$base" in
    package.json|package-lock.json|pnpm-lock.yaml|yarn.lock|bun.lockb|composer.json|composer.lock|Cargo.toml|Cargo.lock|go.mod|go.sum|pom.xml|build.gradle|build.gradle.kts|settings.gradle|settings.gradle.kts|pyproject.toml|poetry.lock|requirements.txt)
      return 0
      ;;
  esac
  case "$norm" in
    */package.json|*/package-lock.json|*/node_modules/*|*/vendor/*|*/dist/*|*/build/*|*/target/*|*/generated/*)
      return 0
      ;;
  esac
  return 1
}

process_jscpd_file() {
  local jfile=$1
  jq -r --arg ref "$jfile" '
    .duplicates[]? |
    select(.firstFile.name != null and .firstFile.name != "") |
    [
      .firstFile.name,
      (.secondFile.name // ""),
      (.lines // 0 | tostring),
      (.firstFile.start // .firstFile.startLine // .firstFile.line // 1 | tostring),
      (.secondFile.start // .secondFile.startLine // .secondFile.line // 1 | tostring),
      $ref
    ] | @tsv
  ' "$jfile" | while IFS=$'\t' read -r first second lines first_line second_line ref; do
    [[ -z "$first" ]] && continue
    bundle_path_ignored "$first" && continue
    [[ -n "$second" ]] && bundle_path_ignored "$second" && continue
    id="dup-$(hash_text "${first}${second}" | cut -c1-12)"
    jq -nc \
      --arg id "$id" --arg first "$first" --arg second "$second" \
      --argjson lines "${lines:-0}" --argjson first_line "${first_line:-1}" --argjson second_line "${second_line:-1}" --arg ref "$ref" \
      '{id:$id,kind:"duplication",severity:"medium",summary:("Duplicate block (~"+($lines|tostring)+" lines): "+$first),paths:([$first]+(if $second != "" then [$second] else [] end)),line:$first_line,locations:([{path:$first,line:$first_line}]+(if $second != "" then [{path:$second,line:$second_line}] else [] end)),evidence_state:"metadata-visible",producer:"jscpd",producer_ref:$ref}' >>"$hotspots_raw"
  done
}

process_jscpd_cross_file() {
  # Cross-repo clone pairs only. Intra-repo pairs are intentionally
  # skipped here: per-repo jscpd shards already cover them.
  local jfile=$1
  jq -r --slurpfile repos "$BUNDLE_DIR/repos.json" --arg ref "$jfile" '
    def repo_of($p):
      [ $repos[0][] | . as $r | select($p == $r.path or ($p | startswith($r.path + "/"))) ]
      | sort_by(-(.path | length)) | (.[0].id // "");
    .duplicates[]? |
    select(.firstFile.name != null and .secondFile.name != null) |
    . as $d |
    (repo_of($d.firstFile.name)) as $ra |
    (repo_of($d.secondFile.name)) as $rb |
    select($ra != "" and $rb != "" and $ra != $rb) |
    [
      $d.firstFile.name,
      $d.secondFile.name,
      ($d.lines // 0 | tostring),
      ($d.firstFile.start // $d.firstFile.startLine // $d.firstFile.line // 1 | tostring),
      ($d.secondFile.start // $d.secondFile.startLine // $d.secondFile.line // 1 | tostring),
      $ra,
      $rb,
      $ref
    ] | @tsv
  ' "$jfile" | while IFS=$'\t' read -r first second lines first_line second_line ra rb ref; do
    [[ -z "$first" ]] && continue
    bundle_path_ignored "$first" && continue
    bundle_path_ignored "$second" && continue
    id="xdup-$(hash_text "${first}${second}" | cut -c1-12)"
    jq -nc \
      --arg id "$id" --arg first "$first" --arg second "$second" \
      --argjson lines "${lines:-0}" --argjson first_line "${first_line:-1}" --argjson second_line "${second_line:-1}" --arg ref "$ref" --arg ra "$ra" --arg rb "$rb" \
      '{id:$id,kind:"duplication",severity:"high",summary:("Cross-repo duplicate (~"+($lines|tostring)+" lines): "+$ra+" <-> "+$rb),paths:[$first,$second],line:$first_line,locations:[{path:$first,line:$first_line},{path:$second,line:$second_line}],evidence_state:"metadata-visible",producer:"jscpd",producer_ref:$ref}' >>"$hotspots_raw"
  done
}

process_semgrep_file() {
  local sfile=$1
  jq -r --arg ref "$sfile" '
    .results[]? |
    [.path, .check_id, (.extra.severity // "WARNING"), (.start.line // .extra.start.line // 1 | tostring), $ref] | @tsv
  ' "$sfile" | while IFS=$'\t' read -r fpath check sev_raw line ref; do
    [[ -z "$fpath" ]] && continue
    bundle_path_ignored "$fpath" && continue
    sev=$(echo "$sev_raw" | tr '[:upper:]' '[:lower:]')
    case "$sev" in
      error|critical) severity="critical" ;;
      warning) severity="medium" ;;
      info) severity="info" ;;
      *) severity="low" ;;
    esac
    id="semgrep-$(hash_text "${fpath}${check}" | cut -c1-12)"
    jq -nc \
      --arg id "$id" --arg path "$fpath" --arg summary "Semgrep $check" \
      --argjson line "${line:-1}" --arg ref "$ref" --arg severity "$severity" \
      '{id:$id,kind:"static-finding",severity:$severity,summary:$summary,paths:[$path],line:$line,locations:[{path:$path,line:$line}],evidence_state:"metadata-visible",producer:"semgrep",producer_ref:$ref}' >>"$hotspots_raw"
  done
}

# --- jscpd (producers/jscpd/**) ---
jscpd_found=0
while IFS= read -r jfile; do
  [[ -f "$jfile" ]] || continue
  jq -e '.duplicates' "$jfile" >/dev/null 2>&1 || continue
  jscpd_found=1
  process_jscpd_file "$jfile"
done < <(find "$PRODUCERS_DIR/jscpd" -type f -name '*.json' 2>/dev/null; find "$PRODUCERS_DIR" -maxdepth 2 -name 'jscpd-report.json' -not -path '*/jscpd-cross/*' 2>/dev/null)

[[ "$jscpd_found" -eq 1 ]] || append_gap "gap-duplication" "duplication" "not_assessed" \
  "No jscpd producer output found." "harness/recipes/duplication-jscpd.md"

# Per-repo jscpd coverage: every repo must have a report when jscpd ran, and
# bounded or sampled runs must remain visible as degraded coverage.
if [[ -d "$PRODUCERS_DIR/jscpd" ]] && [[ -f "$BUNDLE_DIR/repos.json" ]]; then
  while IFS=$'\t' read -r rid rpath; do
    [[ -z "$rid" || -z "$rpath" ]] && continue
    rslug=$(producer_repo_slug "$rpath")
    repo_ok=0
    if [[ -d "$PRODUCERS_DIR/jscpd/$rslug" ]]; then
      while IFS= read -r jf; do
        [[ -f "$jf" ]] || continue
        jq -e '.duplicates | type == "array"' "$jf" >/dev/null 2>&1 && repo_ok=1 && break
      done < <(find "$PRODUCERS_DIR/jscpd/$rslug" -type f -name '*.json' 2>/dev/null)
    fi
    if [[ "$repo_ok" -eq 0 ]]; then
      append_gap "gap-duplication-${rid}" "duplication" "cannot_verify" \
        "No bounded jscpd report for repo ${rid}." "harness/recipes/duplication-jscpd.md"
    fi
    coverage_file="$PRODUCERS_DIR/jscpd/$rslug/_coverage.json"
    if [[ ! -f "$coverage_file" ]]; then
      append_gap "gap-duplication-coverage-metadata-${rid}" "duplication" "cannot_verify" \
        "jscpd coverage metadata is missing for repo ${rid}; duplication completeness cannot be proven." \
        "harness/recipes/duplication-jscpd.md"
      continue
    fi
    coverage_status=$(jq -r '.status // "cannot_verify"' "$coverage_file" 2>/dev/null || echo "cannot_verify")
    coverage_mode=$(jq -r '.coverage_mode // "unknown"' "$coverage_file" 2>/dev/null || echo "unknown")
    truncated_segments=$(jq -r 'if .truncated_segments == true then 1 else 0 end' "$coverage_file" 2>/dev/null || echo 0)
    segment_total=$(jq -r '.segment_total // 0' "$coverage_file" 2>/dev/null || echo 0)
    selected_segment_count=$(jq -r '.selected_segment_count // 0' "$coverage_file" 2>/dev/null || echo 0)
    if [[ "$coverage_status" != "complete" || "$coverage_mode" != "complete" || "$truncated_segments" -ne 0 ]]; then
      append_gap "gap-duplication-stratified-${rid}" "duplication" "cannot_verify" \
        "jscpd coverage for repo ${rid} is ${coverage_status}/${coverage_mode}: selected ${selected_segment_count} of ${segment_total} top-level segment(s); clone absence outside selected segments is not proven." \
        "harness/recipes/duplication-jscpd.md"
    fi
  done < <(jq -r '.[] | [.id, .path] | @tsv' "$BUNDLE_DIR/repos.json")
fi

# --- cross-repo duplication pairs (producers/jscpd-cross/**, opt-in) ---
while IFS= read -r jfile; do
  [[ -f "$jfile" ]] || continue
  [[ "$(basename "$jfile")" == "_scan.json" ]] && continue
  jq -e '.duplicates' "$jfile" >/dev/null 2>&1 || continue
  process_jscpd_cross_file "$jfile"
done < <(find "$PRODUCERS_DIR/jscpd-cross" -type f -name '*.json' ! -name '_scan.json' 2>/dev/null)

if [[ -f "$PRODUCERS_DIR/jscpd-cross/_scan.json" ]]; then
  cross_coverage_mode=$(jq -r '.coverage_mode // "unknown"' "$PRODUCERS_DIR/jscpd-cross/_scan.json" 2>/dev/null || echo "unknown")
  cross_has_coverage_metadata=$(jq -r 'has("coverage_mode")' "$PRODUCERS_DIR/jscpd-cross/_scan.json" 2>/dev/null || echo "false")
  cross_truncated_repo_count=$(jq -r '.truncated_repo_count // 0' "$PRODUCERS_DIR/jscpd-cross/_scan.json" 2>/dev/null || echo 0)
  cross_pair_limit_applied=$(jq -r '.pair_limit_applied // 0' "$PRODUCERS_DIR/jscpd-cross/_scan.json" 2>/dev/null || echo 0)
  if [[ "$cross_coverage_mode" != "complete" || "$cross_truncated_repo_count" -gt 0 || "$cross_pair_limit_applied" -ne 0 ]]; then
    if [[ "$cross_has_coverage_metadata" != "true" ]]; then
      append_gap "gap-cross-repo-dup-stratified" "duplication" "cannot_verify" \
        "cross-repo duplication coverage metadata is missing; absence of clone pairs outside staged files is not proven." \
        "harness/recipes/duplication-jscpd.md"
    else
      append_gap "gap-cross-repo-dup-stratified" "duplication" "cannot_verify" \
        "cross-repo duplication is ${cross_coverage_mode}: ${cross_truncated_repo_count} repo(s) had capped staged files and pair_limit_applied=${cross_pair_limit_applied}; absence of clone pairs outside staged files is not proven." \
        "harness/recipes/duplication-jscpd.md"
    fi
  fi
fi

# --- semgrep (producers/semgrep/**) ---
semgrep_found=0
while IFS= read -r sfile; do
  [[ -f "$sfile" ]] || continue
  jq -e '.results' "$sfile" >/dev/null 2>&1 || continue
  semgrep_found=1
  process_semgrep_file "$sfile"
done < <(find "$PRODUCERS_DIR/semgrep" -type f -name '*.json' 2>/dev/null)

[[ "$semgrep_found" -eq 1 ]] || append_gap "gap-static" "static-findings" "not_assessed" \
  "No Semgrep producer output found." "harness/recipes/static-semgrep-local.md"

# --- cyclonedx (producers/syft/**) ---
syft_found=0
syft_file_seen=0
dep_hub_min=8
while IFS= read -r sbom; do
  [[ -f "$sbom" ]] || continue
  syft_file_seen=1
  jq -e '.components' "$sbom" >/dev/null 2>&1 || continue
  syft_found=1
  jq -r --arg ref "$sbom" --argjson min "$dep_hub_min" '
    (.dependencies // []) as $deps |
    def dep_count($r):
      [$deps[] | select(.ref == $r) | .dependsOn[]?] | length;
    .components[]? | select(.name != null) |
    . as $c |
    ($c."bom-ref" // $c.name) as $r |
    {name: $c.name, dep_count: dep_count($r)} |
    select(.dep_count >= $min) |
    [.name, (.dep_count | tostring), $ref] | @tsv
  ' "$sbom" | while IFS=$'\t' read -r name dep_count ref; do
    id="dep-$(hash_text "$name" | cut -c1-12)"
    jq -nc \
      --arg id "$id" --arg summary "Dependency hub: $name ($dep_count dependencies)" \
      --arg ref "$ref" \
      '{id:$id,kind:"dep-hub",severity:"low",summary:$summary,paths:["(dependency-hub)"],evidence_state:"metadata-visible",producer:"syft",producer_ref:$ref}' >>"$hotspots_raw"
  done
done < <(find "$PRODUCERS_DIR/syft" -type f \( -name 'cyclonedx.json' -o -name '*cyclonedx*.json' \) 2>/dev/null)

if [[ "$syft_found" -eq 1 ]]; then
  :
elif [[ "$syft_file_seen" -eq 1 ]]; then
  append_gap "gap-deps" "dependencies" "not_assessed" \
    "Syft CycloneDX output had no usable components." "harness/recipes/deps-syft-cyclonedx.md"
else
  append_gap "gap-deps" "dependencies" "not_assessed" \
    "No Syft/CycloneDX producer output found." "harness/recipes/deps-syft-cyclonedx.md"
fi

declare -A SLUG_REPO_ROOT=()
while IFS= read -r rpath; do
  [[ -z "$rpath" ]] && continue
  slug=$(producer_repo_slug "$rpath")
  SLUG_REPO_ROOT[$slug]="$rpath"
done < <(jq -r '.[].path' "$BUNDLE_DIR/repos.json")

# --- config surfaces (producers/config/*.jsonl) ---
while IFS= read -r cfile; do
  [[ -f "$cfile" ]] || continue
  [[ -s "$cfile" ]] || continue
  cslug=$(basename "$cfile" .jsonl)
  repo_root="${SLUG_REPO_ROOT[$cslug]:-$TARGET_ROOT}"
  jq -s -c --arg ref "$cfile" --arg root "$repo_root" '
    group_by(.surface_kind) | map(
      .[0].surface_kind as $k |
      {surface_kind: $k,
       paths: ([.[].path] | unique |
         map(if startswith($root) or startswith("/") then . else ($root + "/" + .) end) | .[0:5]),
       count: length}
    ) | .[] |
    select(.count > 0)
  ' "$cfile" | while IFS= read -r group; do
    [[ -z "$group" ]] && continue
    surface_kind=$(echo "$group" | jq -r '.surface_kind')
    paths_json=$(filter_paths_json "$(echo "$group" | jq -c '.paths')")
    [[ "$(jq 'length' <<<"$paths_json")" -eq 0 ]] && continue
    count=$(jq 'length' <<<"$paths_json")
    id="cfg-$(hash_text "${cfile}${surface_kind}" | cut -c1-12)"
    jq -nc \
      --arg id "$id" --arg surface_kind "$surface_kind" --argjson count "$count" \
      --argjson paths "$paths_json" --arg ref "$cfile" \
      '{id:$id,kind:"config",severity:"info",summary:("Config surface: "+$surface_kind+" ("+($count|tostring)+" files)"),paths:$paths,evidence_state:"source-visible",producer:"config-scan",producer_ref:$ref}' >>"$hotspots_raw"
  done
done < <(find "$PRODUCERS_DIR/config" -type f -name '*.jsonl' 2>/dev/null)

# --- ctags symbol density (producers/ctags/**/tags.json) ---
CTAGS_MIN_SYMBOLS="${CTAGS_MIN_SYMBOLS:-5}"
ctags_found=0
while IFS= read -r tfile; do
  [[ -f "$tfile" ]] || continue
  jq -e '.' "$tfile" >/dev/null 2>&1 || continue
  ctags_found=1
  ctags_repo_id=$(basename "$(dirname "$tfile")")
  jq -s -r --arg ref "$tfile" --argjson min "$CTAGS_MIN_SYMBOLS" --arg root "$TARGET_ROOT" '
    def tag_rows:
      if length == 1 and (.[0] | type) == "array" then .[0] else . end;
    def rel_path($p):
      if ($p | startswith($root)) then $p[($root | length):] | ltrimstr("/") else $p end;
    [tag_rows[] | select((._type == "tag" or (._type == null and .name != null)) and .path != null) |
      rel_path(.path) as $rp | select($rp != "") | $rp] |
    group_by(.) | map({path: .[0], count: length}) |
    map(select(.count >= $min)) | sort_by(-.count) | .[0:30] |
    .[] | [.path, (.count|tostring), $ref] | @tsv
  ' "$tfile" | while IFS=$'\t' read -r fpath symcount ref; do
    [[ -z "$fpath" ]] && continue
    bundle_path_ignored "$fpath" && continue
    symbol_density_path_ignored "$fpath" && continue
    id="sym-$(hash_text "${ctags_repo_id}:${fpath}" | cut -c1-12)"
    jq -nc \
      --arg id "$id" --arg path "$fpath" --argjson n "${symcount:-0}" --arg ref "$ref" --arg repo_id "$ctags_repo_id" \
      '{id:$id,kind:"debt-candidate",severity:"medium",summary:("Symbol-dense file: "+$path+" ("+($n|tostring)+" symbols)"),paths:[$path],repo_id:$repo_id,evidence_state:"source-visible",producer:"ctags",producer_ref:$ref}' >>"$hotspots_raw"
  done
done < <(find "$PRODUCERS_DIR/ctags" -type f -name 'tags.json' 2>/dev/null)

if [[ "$ctags_found" -eq 0 ]]; then
  if [[ ! -f "$PRODUCERS_DIR/_gaps.jsonl" ]] || ! grep -q 'gap-ctags' "$PRODUCERS_DIR/_gaps.jsonl" 2>/dev/null; then
    append_gap "gap-ctags" "symbols" "not_assessed" \
      "No ctags producer output found." "harness/recipes/symbols-ctags.md"
  fi
fi

# Per-repo ctags coverage: every repo must have tags.json when ctags ran.
if [[ -d "$PRODUCERS_DIR/ctags" ]] && [[ -f "$BUNDLE_DIR/repos.json" ]]; then
  while IFS=$'\t' read -r rid rpath; do
    [[ -z "$rid" || -z "$rpath" ]] && continue
    rslug=$(producer_repo_slug "$rpath")
    tfile="$PRODUCERS_DIR/ctags/$rslug/tags.json"
    if [[ ! -f "$tfile" ]] || ! jq -e . "$tfile" >/dev/null 2>&1; then
      append_gap "gap-ctags-${rid}" "symbols" "cannot_verify" \
        "No usable ctags tags.json for repo ${rid}." "harness/recipes/symbols-ctags.md"
    fi
  done < <(jq -r '.[] | [.id, .path] | @tsv' "$BUNDLE_DIR/repos.json")
fi

# --- relationships.jsonl ---
if ! "$SCRIPT_DIR/scan-cross-repo.sh" "$TARGET_ROOT" "$BUNDLE_DIR" 2>&1; then
  echo "warn: scan-cross-repo failed; recording gap" >&2
  append_gap "gap-relationships" "relationships" "cannot_verify" \
    "scan-cross-repo failed during bundle build." "scripts/scan-cross-repo.sh"
  : >"$BUNDLE_DIR/relationships.jsonl"
fi

# --- merge shard gaps from portolan-scan producers ---
if [[ -f "$PRODUCERS_DIR/_gaps.jsonl" ]]; then
  cat "$PRODUCERS_DIR/_gaps.jsonl" >>"$gaps_raw"
fi
if ! command -v rg >/dev/null 2>&1; then
  append_gap "search-index-rg" "search-index" "not_assessed" \
    "ripgrep not installed; search index uses bounded head-only lines per file" \
    "install ripgrep for fuller code index"
fi

# Sort all hotspots; write full list; apply kind-quota budget
sorted_all=$(mktemp)
if [[ -s "$hotspots_raw" ]]; then
  jq -sc '
    def sev_rank(s):
      if s == "critical" then 0 elif s == "high" then 1 elif s == "medium" then 2
      elif s == "low" then 3 elif s == "info" then 4 else 5 end;
    def kind_rank(k):
      if k == "static-finding" then 0
      elif k == "duplication" then 1
      elif k == "config" then 2
      elif k == "debt-candidate" then 3
      elif k == "dep-hub" then 4
      else 5 end;
    def path_blob: ((.paths // []) | join(" ") | ascii_downcase);
    def noise_rank:
      path_blob as $p |
      if ($p | test("(^|/)(docs?|site|examples?|samples?)/|(^|/)(changelog|release_notes|readme|license|notice)(\\.|$)|(^|/)target/|(^|/)build/|(^|/)dist/|generated|openapi-gen|/i18n/|/locales?/|/test/resources/|/tests?/.*\\.(json|yaml|yml)$|\\.schema\\.json$|\\.(md|rst|adoc)$")) then 1 else 0 end;
    unique_by(.id) |
    sort_by(
      sev_rank(.severity),
      kind_rank(.kind),
      noise_rank,
      .summary
    ) | .[]
  ' "$hotspots_raw" >"$sorted_all"
else
  : >"$sorted_all"
fi

total_before=$(wc -l <"$sorted_all" | tr -d ' ')

: >"$BUNDLE_DIR/hotspots-full.jsonl"
cp "$sorted_all" "$BUNDLE_DIR/hotspots-full.jsonl"

budgeted=$(mktemp)
if [[ "$total_before" -gt "$HOTSPOT_BUDGET" ]]; then
  jq -sc --argjson budget "$HOTSPOT_BUDGET" '
    def sev_rank(s):
      if s == "critical" then 0 elif s == "high" then 1 elif s == "medium" then 2
      elif s == "low" then 3 elif s == "info" then 4 else 5 end;
    def kind_rank(k):
      if k == "static-finding" then 0
      elif k == "duplication" then 1
      elif k == "config" then 2
      elif k == "debt-candidate" then 3
      elif k == "dep-hub" then 4
      else 5 end;
    def path_blob: ((.paths // []) | join(" ") | ascii_downcase);
    def noise_rank:
      path_blob as $p |
      if ($p | test("(^|/)(docs?|site|examples?|samples?)/|(^|/)(changelog|release_notes|readme|license|notice)(\\.|$)|(^|/)target/|(^|/)build/|(^|/)dist/|generated|openapi-gen|/i18n/|/locales?/|/test/resources/|/tests?/.*\\.(json|yaml|yml)$|\\.schema\\.json$|\\.(md|rst|adoc)$")) then 1 else 0 end;
    def sort_h: sort_by(sev_rank(.severity), kind_rank(.kind), noise_rank, .summary);
    def quota(k):
      if k == "static-finding" then ($budget * 0.45 | floor)
      elif k == "duplication" then ($budget * 0.25 | floor)
      elif k == "dep-hub" then ($budget * 0.15 | floor)
      elif k == "config" then ($budget * 0.15 | floor)
      else 0 end;
    (unique_by(.id)) as $all |
    (["static-finding", "duplication", "dep-hub", "config"] | map(
      . as $k | ([$all[] | select(.kind == $k)] | sort_h) | .[0:quota($k)]
    ) | add) as $selected |
    ($selected | map(.id)) as $ids |
    ($budget - ($selected | length)) as $rem |
    ([$all[] | select(.id as $i | ($ids | index($i) | not)) | select(.kind == "debt-candidate")] | sort_h | .[0:$rem]) as $debt_fill |
    ($selected + $debt_fill) |
    sort_h | .[]
  ' "$hotspots_raw" >"$budgeted" || {
    echo "warn: kind-quota jq failed; falling back to global head budget" >&2
    head -n "$HOTSPOT_BUDGET" "$sorted_all" >"$budgeted"
  }
  truncated=1
else
  cp "$sorted_all" "$budgeted"
  truncated=0
fi

budget_count=$(wc -l <"$budgeted" | tr -d ' ')
if [[ "$budget_count" -gt "$HOTSPOT_BUDGET" ]]; then
  head -n "$HOTSPOT_BUDGET" "$budgeted" >"${budgeted}.cut"
  mv "${budgeted}.cut" "$budgeted"
  truncated=1
fi

: >"$BUNDLE_DIR/hotspots.jsonl"
rank=0
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  rank=$((rank + 1))
  echo "$line" | jq -c --argjson rank "$rank" '. + {rank: $rank}' >>"$BUNDLE_DIR/hotspots.jsonl"
done <"$budgeted"

hotspot_count=$(wc -l <"$BUNDLE_DIR/hotspots.jsonl" | tr -d ' ')

kind_counts_total=$(jq -s 'group_by(.kind) | map({(.[0].kind): length}) | add // {}' "$BUNDLE_DIR/hotspots-full.jsonl" 2>/dev/null || echo '{}')
kind_counts=$(jq -s 'group_by(.kind) | map({(.[0].kind): length}) | add // {}' "$BUNDLE_DIR/hotspots.jsonl" 2>/dev/null || echo '{}')

: >"$BUNDLE_DIR/gaps-full.jsonl"
: >"$BUNDLE_DIR/gaps.jsonl"
gaps_truncated=0
gap_total=0
if [[ -s "$gaps_raw" ]]; then
  gap_sorted=$(mktemp)
  jq -sc '
    sort_by(
      (if .status == "cannot_verify" then 0
       elif .status == "not_assessed" then 1
       else 2 end),
      .surface,
      .summary
    ) | .[]
  ' "$gaps_raw" >"$gap_sorted"
  gap_total=$(wc -l <"$gap_sorted" | tr -d ' ')
  cat "$gap_sorted" >>"$BUNDLE_DIR/gaps-full.jsonl"
  if [[ "$gap_total" -gt "$GAP_BUDGET" ]]; then
    head -n "$GAP_BUDGET" "$gap_sorted" >>"$BUNDLE_DIR/gaps.jsonl"
    gaps_truncated=1
  else
    cat "$gap_sorted" >>"$BUNDLE_DIR/gaps.jsonl"
  fi
  rm -f "$gap_sorted"
fi
gap_count=$(wc -l <"$BUNDLE_DIR/gaps.jsonl" | tr -d ' ')

repo_count=$(jq 'length' "$BUNDLE_DIR/repos.json" 2>/dev/null || echo 0)
relationship_count=0
if [[ -f "$BUNDLE_DIR/relationships.jsonl" ]]; then
  relationship_count=$(wc -l <"$BUNDLE_DIR/relationships.jsonl" | tr -d ' ')
fi
core_only=false
if [[ "${PORTOLAN_BUNDLE_CORE_ONLY:-0}" == "1" ]]; then
  core_only=true
fi
proof_profile="${PORTOLAN_PROOF_PROFILE:-bounded}"

cross_dup_json='null'
if [[ -f "$PRODUCERS_DIR/jscpd-cross/_scan.json" ]]; then
  cross_dup_json=$(jq -c '
    if .pairs_failed == 0 and .pairs_ok == .pairs_total then
      {
        status:(if (.coverage_mode // "unknown") == "complete" then "complete" else "stratified" end),
        coverage_mode:(.coverage_mode // "unknown"),
        pairs_total:.pairs_total,
        pairs_ok:.pairs_ok,
        clone_pairs:(.clone_pairs // 0),
        files_per_repo_limit:(.files_per_repo_limit // null),
        truncated_repo_count:(.truncated_repo_count // null),
        pair_limit_applied:(.pair_limit_applied // null),
        resolution_limit:(.resolution_limit // "")
      }
    else
      {
        status:"incomplete",
        coverage_mode:(.coverage_mode // "unknown"),
        pairs_total:.pairs_total,
        pairs_ok:(.pairs_ok // 0),
        pairs_failed:(.pairs_failed // 0),
        files_per_repo_limit:(.files_per_repo_limit // null),
        truncated_repo_count:(.truncated_repo_count // null),
        pair_limit_applied:(.pair_limit_applied // null),
        resolution_limit:(.resolution_limit // "")
      }
    end
  ' "$PRODUCERS_DIR/jscpd-cross/_scan.json" 2>/dev/null || echo 'null')
fi

jq -n \
  --arg schema_version "0.1.0" \
  --arg target_root "$TARGET_ROOT" \
  --arg generated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --argjson hotspot_count "$hotspot_count" \
  --argjson gap_count "$gap_count" \
  --argjson repo_count "$repo_count" \
  --argjson relationship_count "$relationship_count" \
  --argjson hotspot_budget "$HOTSPOT_BUDGET" \
  --argjson hotspots_truncated "$truncated" \
  --argjson hotspots_total "$total_before" \
  --argjson kind_counts "$kind_counts" \
  --argjson kind_counts_total "$kind_counts_total" \
  --argjson gap_budget "$GAP_BUDGET" \
  --argjson gaps_truncated "$gaps_truncated" \
  --argjson gaps_total "$gap_total" \
  --argjson repo_discovered_total "$repo_discovered_total" \
  --argjson repo_limit_applied "$repo_limit_applied" \
  --argjson core_only "$core_only" \
  --arg proof_profile "$proof_profile" \
  --argjson cross_repo_duplication "$cross_dup_json" \
  '{schema_version:$schema_version,target_root:$target_root,generated_at:$generated_at,hotspot_count:$hotspot_count,gap_count:$gap_count,repo_count:$repo_count,relationship_count:$relationship_count,hotspot_budget:$hotspot_budget,hotspots_truncated:$hotspots_truncated,hotspots_total:$hotspots_total,kind_counts:$kind_counts,kind_counts_total:$kind_counts_total,gap_budget:$gap_budget,gaps_truncated:$gaps_truncated,gaps_total:$gaps_total,repo_discovered_total:$repo_discovered_total,repo_limit_applied:$repo_limit_applied,core_only:$core_only,proof_profile:$proof_profile} + (if $cross_repo_duplication != null then {cross_repo_duplication:$cross_repo_duplication} else {} end)' \
  >"$BUNDLE_DIR/manifest.json"

# graph-slice: findings + unique path nodes for map tab
jq -s '
  . as $hs |
  ($hs | map(.paths[]? // empty) | map(select(. != "(dependency-hub)")) | unique) as $paths |
  {
    schema_version: "0.1.0",
    nodes: (
      [ $hs[] | {id: .id, type: "finding", label: .summary, kind: .kind, severity: .severity, rank: .rank, paths: (.paths // [])} ]
      + [ $paths[] | {id: ("path:" + .), type: "path", label: (. | split("/") | last), path: .} ]
    ),
    edges: [ $hs[] | . as $h | .paths[]? | select(. != "(dependency-hub)") | {from: ("path:" + .), to: $h.id, kind: "finding_at"} ]
  }
' "$BUNDLE_DIR/hotspots.jsonl" >"$BUNDLE_DIR/graph-slice.json" 2>/dev/null || \
  echo '{"schema_version":"0.1.0","nodes":[],"edges":[]}' >"$BUNDLE_DIR/graph-slice.json"

if [[ "${PORTOLAN_BUNDLE_CORE_ONLY:-0}" == "1" ]]; then
  "$SCRIPT_DIR/build-evidence-promotion-atlas.sh" "$BUNDLE_DIR" "$TARGET_ROOT"
  rm -f "$hotspots_raw" "$gaps_raw" "$sorted_all" "$budgeted"
  echo "Portolan core bundle written to $BUNDLE_DIR (hotspots=$hotspot_count gaps=$gap_count total_before=$total_before truncated=$truncated)"
  exit 0
fi

# landscape-card.json
"$SCRIPT_DIR/scan-landscape-card.sh" "$TARGET_ROOT" "$BUNDLE_DIR/landscape-card.json" "$BUNDLE_DIR/repos.json" || \
  echo '{"version":"0.1.0","identity":{"name":"unknown"},"scale":{},"maturity":{},"health_signals":{}}' >"$BUNDLE_DIR/landscape-card.json"

# landscape-report.json (map.md-inspired sections)
jq -n \
  --slurpfile manifest "$BUNDLE_DIR/manifest.json" \
  --slurpfile repos "$BUNDLE_DIR/repos.json" \
  --slurpfile card "$BUNDLE_DIR/landscape-card.json" \
  --rawfile hotspots "$BUNDLE_DIR/hotspots.jsonl" \
  --rawfile gaps "$BUNDLE_DIR/gaps.jsonl" \
  --rawfile hotspots_full "$BUNDLE_DIR/hotspots-full.jsonl" \
  '
  def hs_lines: ($hotspots | split("\n") | map(select(length > 0)) | map(fromjson));
  def gap_lines: ($gaps | split("\n") | map(select(length > 0)) | map(fromjson));
  def kind_groups:
    hs_lines | group_by(.kind) | map({
      kind: .[0].kind,
      count: length,
      items: map({id: .id, summary: .summary, severity: .severity, rank: .rank, evidence_ref: ("hotspot:" + .id)})
    });
  {
    schema_version: "0.1.0",
    generated_at: $manifest[0].generated_at,
    target_root: $manifest[0].target_root,
    sections: [
      {
        id: "overview",
        title: "Overview",
        blocks: [
          {type: "text", text: ("Target: " + $manifest[0].target_root)},
          {type: "text", text: ("Findings shown: " + ($manifest[0].hotspot_count|tostring) + " of " + ($manifest[0].hotspots_total|tostring) + " found by scan")},
          {type: "card_ref", evidence_ref: "landscape-card.json"}
        ]
      },
      {
        id: "repos",
        title: "Repositories",
        items: [ $repos[0][] | {id: .id, name: .name, path: .path, evidence_ref: ("repo:" + .id)} ]
      },
      {
        id: "findings_by_kind",
        title: "Findings",
        groups: kind_groups
      },
      {
        id: "gaps",
        title: "Not assessed",
        items: [ gap_lines[] | {id: .id, surface: .surface, status: .status, summary: .summary, evidence_ref: ("gap:" + .id)} ]
      },
      {
        id: "next_steps",
        title: "Where to look first",
        items: (
          hs_lines | sort_by(.rank) | .[0:5] | map({
            summary: .summary,
            kind: .kind,
            rank: .rank,
            evidence_ref: ("hotspot:" + .id)
          })
        )
      }
    ]
  }
  ' >"$BUNDLE_DIR/landscape-report.json"

rm -f \
  "$BUNDLE_DIR/atlas-surfaces.json" \
  "$BUNDLE_DIR/atlas-facts.json" \
  "$BUNDLE_DIR/atlas-surface-content.json" \
  "$BUNDLE_DIR/symbol-index.jsonl" \
  "$BUNDLE_DIR/search-index.jsonl" \
  "$BUNDLE_DIR/.search-index-meta.json"

"$SCRIPT_DIR/build-atlas-surfaces.sh" "$TARGET_ROOT" "$BUNDLE_DIR" || true
"$SCRIPT_DIR/build-atlas-facts.sh" "$TARGET_ROOT" "$BUNDLE_DIR" || true
"$SCRIPT_DIR/build-atlas-surface-content.sh" "$BUNDLE_DIR" || true

rm -f "$hotspots_raw" "$gaps_raw" "$sorted_all" "$budgeted"

"$SCRIPT_DIR/build-symbol-index.sh" "$BUNDLE_DIR" || true
"$SCRIPT_DIR/build-search-index.sh" "$TARGET_ROOT" "$BUNDLE_DIR" || true
"$SCRIPT_DIR/build-evidence-promotion-atlas.sh" "$BUNDLE_DIR" "$TARGET_ROOT"

echo "Portolan bundle written to $BUNDLE_DIR (hotspots=$hotspot_count gaps=$gap_count total_before=$total_before truncated=$truncated)"
