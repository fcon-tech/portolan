#!/usr/bin/env bash
# Build Portolan bundle from target root and producer outputs under
# <bundle-dir>/producers/. See harness/SKILL.md and spec 088/091/093.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <target-root> <orient-dir>" >&2
  exit 2
fi

TARGET_ROOT=$(cd "$1" && pwd)
ORIENT_DIR=$2
PRODUCERS_DIR="$ORIENT_DIR/producers"
HOTSPOT_BUDGET="${ORIENT_HOTSPOT_BUDGET:-200}"
GAP_BUDGET="${ORIENT_GAP_BUDGET:-20}"
if ! [[ "$HOTSPOT_BUDGET" =~ ^[0-9]+$ ]] || [[ "$HOTSPOT_BUDGET" -lt 1 ]]; then
  echo "invalid ORIENT_HOTSPOT_BUDGET: $HOTSPOT_BUDGET" >&2
  exit 2
fi
if ! [[ "$GAP_BUDGET" =~ ^[0-9]+$ ]] || [[ "$GAP_BUDGET" -lt 1 ]]; then
  echo "invalid ORIENT_GAP_BUDGET: $GAP_BUDGET" >&2
  exit 2
fi
mkdir -p "$ORIENT_DIR" "$PRODUCERS_DIR"

command -v jq >/dev/null 2>&1 || {
  echo "jq is required" >&2
  exit 1
}

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
# shellcheck source=portolan-ignore.sh
. "$SCRIPT_DIR/portolan-ignore.sh"

producer_repo_slug() {
  local p=$1
  local base hash
  base=$(basename "$p" | tr ' /' '__')
  hash=$(printf '%s' "$p" | sha256sum | cut -c1-8)
  echo "${base}-${hash}"
}

# --- repos.json ---
if [[ -d "$TARGET_ROOT/.git" ]]; then
  jq -n --arg path "$TARGET_ROOT" --arg name "$(basename "$TARGET_ROOT")" \
    '[{id: $name, path: $path, name: $name}]' >"$ORIENT_DIR/repos.json"
else
  repos='[]'
  while IFS= read -r gitdir; do
    repo=$(dirname "$gitdir")
    name=$(basename "$repo")
    repos=$(echo "$repos" | jq --arg id "$name" --arg path "$repo" --arg name "$name" \
      '. + [{id: $id, path: $path, name: $name}]')
  done < <(find "$TARGET_ROOT" -name .git -type d 2>/dev/null || true)
  if [[ "$(echo "$repos" | jq 'length')" -eq 0 ]]; then
    repos=$(jq -n --arg path "$TARGET_ROOT" --arg name "$(basename "$TARGET_ROOT")" \
      '[{id: $name, path: $path, name: $name}]')
  fi
  echo "$repos" >"$ORIENT_DIR/repos.json"
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
  done < <(jq -r '.[].path' "$ORIENT_DIR/repos.json")
  orient_path_is_ignored "$root" "$norm"
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

process_jscpd_file() {
  local jfile=$1
  jq -r --arg ref "$jfile" '
    .duplicates[]? |
    select(.firstFile.name != null and .firstFile.name != "") |
    [.firstFile.name, (.secondFile.name // ""), (.lines // 0 | tostring), $ref] | @tsv
  ' "$jfile" | while IFS=$'\t' read -r first second lines ref; do
    [[ -z "$first" ]] && continue
    bundle_path_ignored "$first" && continue
    [[ -n "$second" ]] && bundle_path_ignored "$second" && continue
    id="dup-$(printf '%s%s' "$first" "$second" | sha256sum | cut -c1-12)"
    jq -nc \
      --arg id "$id" --arg first "$first" --arg second "$second" \
      --argjson lines "${lines:-0}" --arg ref "$ref" \
      '{id:$id,kind:"duplication",severity:"medium",summary:("Duplicate block (~"+($lines|tostring)+" lines): "+$first),paths:([$first]+(if $second != "" then [$second] else [] end)),evidence_state:"metadata-visible",producer:"jscpd",producer_ref:$ref}' >>"$hotspots_raw"
  done
}

process_semgrep_file() {
  local sfile=$1
  jq -r --arg ref "$sfile" '
    .results[]? |
    [.path, .check_id, (.extra.severity // "WARNING"), $ref] | @tsv
  ' "$sfile" | while IFS=$'\t' read -r fpath check sev_raw ref; do
    [[ -z "$fpath" ]] && continue
    bundle_path_ignored "$fpath" && continue
    sev=$(echo "$sev_raw" | tr '[:upper:]' '[:lower:]')
    case "$sev" in
      error|critical) severity="critical" ;;
      warning) severity="medium" ;;
      info) severity="info" ;;
      *) severity="low" ;;
    esac
    id="semgrep-$(printf '%s%s' "$fpath" "$check" | sha256sum | cut -c1-12)"
    jq -nc \
      --arg id "$id" --arg path "$fpath" --arg summary "Semgrep $check" \
      --arg ref "$ref" --arg severity "$severity" \
      '{id:$id,kind:"static-finding",severity:$severity,summary:$summary,paths:[$path],evidence_state:"metadata-visible",producer:"semgrep",producer_ref:$ref}' >>"$hotspots_raw"
  done
}

# --- jscpd (producers/jscpd/**) ---
jscpd_found=0
while IFS= read -r jfile; do
  [[ -f "$jfile" ]] || continue
  jq -e '.duplicates' "$jfile" >/dev/null 2>&1 || continue
  jscpd_found=1
  process_jscpd_file "$jfile"
done < <(find "$PRODUCERS_DIR/jscpd" -type f -name '*.json' 2>/dev/null; find "$PRODUCERS_DIR" -maxdepth 2 -name 'jscpd-report.json' 2>/dev/null)

[[ "$jscpd_found" -eq 1 ]] || append_gap "gap-duplication" "duplication" "not_assessed" \
  "No jscpd producer output found." "harness/recipes/duplication-jscpd.md"

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
    id="dep-$(printf '%s' "$name" | sha256sum | cut -c1-12)"
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
done < <(jq -r '.[].path' "$ORIENT_DIR/repos.json")

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
    id="cfg-$(printf '%s%s' "$cfile" "$surface_kind" | sha256sum | cut -c1-12)"
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
    id="sym-$(printf '%s' "$fpath" | sha256sum | cut -c1-12)"
    jq -nc \
      --arg id "$id" --arg path "$fpath" --argjson n "${symcount:-0}" --arg ref "$ref" \
      '{id:$id,kind:"debt-candidate",severity:"medium",summary:("Symbol-dense file: "+$path+" ("+($n|tostring)+" symbols)"),paths:[$path],evidence_state:"source-visible",producer:"ctags",producer_ref:$ref}' >>"$hotspots_raw"
  done
done < <(find "$PRODUCERS_DIR/ctags" -type f -name 'tags.json' 2>/dev/null)

if [[ "$ctags_found" -eq 0 ]]; then
  if [[ ! -f "$PRODUCERS_DIR/_gaps.jsonl" ]] || ! grep -q 'gap-ctags' "$PRODUCERS_DIR/_gaps.jsonl" 2>/dev/null; then
    append_gap "gap-ctags" "symbols" "not_assessed" \
      "No ctags producer output found." "harness/recipes/symbols-ctags.md"
  fi
fi

# --- merge shard gaps from wizard ---
if [[ -f "$PRODUCERS_DIR/_gaps.jsonl" ]]; then
  cat "$PRODUCERS_DIR/_gaps.jsonl" >>"$gaps_raw"
fi

# Sort all hotspots; write full list; apply kind-quota budget
sorted_all=$(mktemp)
if [[ -s "$hotspots_raw" ]]; then
  jq -sc '
    sort_by(
      (if .severity == "critical" then 0
       elif .severity == "high" then 1
       elif .severity == "medium" then 2
       elif .severity == "low" then 3
       else 4 end),
      .kind,
      .summary
    ) | .[]
  ' "$hotspots_raw" >"$sorted_all"
else
  : >"$sorted_all"
fi

total_before=$(wc -l <"$sorted_all" | tr -d ' ')

: >"$ORIENT_DIR/hotspots-full.jsonl"
cp "$sorted_all" "$ORIENT_DIR/hotspots-full.jsonl"

budgeted=$(mktemp)
if [[ "$total_before" -gt "$HOTSPOT_BUDGET" ]]; then
  jq -sc --argjson budget "$HOTSPOT_BUDGET" '
    def sev_rank(s):
      if s == "critical" then 0 elif s == "high" then 1 elif s == "medium" then 2
      elif s == "low" then 3 else 4 end;
    def sort_h: sort_by(sev_rank(.severity), .summary);
    def quota(k):
      if k == "static-finding" then ($budget * 0.45 | floor)
      elif k == "duplication" then ($budget * 0.25 | floor)
      elif k == "dep-hub" then ($budget * 0.15 | floor)
      elif k == "config" then ($budget * 0.15 | floor)
      else 0 end;
    . as $all |
    (["static-finding", "duplication", "dep-hub", "config"] | map(
      . as $k | ([$all[] | select(.kind == $k)] | sort_h) | .[0:quota($k)]
    ) | add) as $selected |
    ($selected | map(.id)) as $ids |
    ($budget - ($selected | length)) as $rem |
    ([$all[] | select(.id as $i | ($ids | index($i) | not)) | select(.kind == "debt-candidate")] | sort_h | .[0:$rem]) as $debt_fill |
    ($selected + $debt_fill) |
    sort_by(sev_rank(.severity), .kind, .summary) | .[]
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

: >"$ORIENT_DIR/hotspots.jsonl"
rank=0
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  rank=$((rank + 1))
  echo "$line" | jq -c --argjson rank "$rank" '. + {rank: $rank}' >>"$ORIENT_DIR/hotspots.jsonl"
done <"$budgeted"

hotspot_count=$(wc -l <"$ORIENT_DIR/hotspots.jsonl" | tr -d ' ')

kind_counts_total=$(jq -s 'group_by(.kind) | map({(.[0].kind): length}) | add // {}' "$ORIENT_DIR/hotspots-full.jsonl" 2>/dev/null || echo '{}')
kind_counts=$(jq -s 'group_by(.kind) | map({(.[0].kind): length}) | add // {}' "$ORIENT_DIR/hotspots.jsonl" 2>/dev/null || echo '{}')

: >"$ORIENT_DIR/gaps.jsonl"
gaps_truncated=0
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
  if [[ "$gap_total" -gt "$GAP_BUDGET" ]]; then
    head -n "$GAP_BUDGET" "$gap_sorted" >>"$ORIENT_DIR/gaps.jsonl"
    gaps_truncated=1
  else
    cat "$gap_sorted" >>"$ORIENT_DIR/gaps.jsonl"
  fi
  rm -f "$gap_sorted"
fi
gap_count=$(wc -l <"$ORIENT_DIR/gaps.jsonl" | tr -d ' ')

jq -n \
  --arg schema_version "0.1.0" \
  --arg target_root "$TARGET_ROOT" \
  --arg generated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --argjson hotspot_count "$hotspot_count" \
  --argjson gap_count "$gap_count" \
  --argjson hotspot_budget "$HOTSPOT_BUDGET" \
  --argjson hotspots_truncated "$truncated" \
  --argjson hotspots_total "$total_before" \
  --argjson kind_counts "$kind_counts" \
  --argjson kind_counts_total "$kind_counts_total" \
  --argjson gap_budget "$GAP_BUDGET" \
  --argjson gaps_truncated "$gaps_truncated" \
  '{schema_version:$schema_version,target_root:$target_root,generated_at:$generated_at,hotspot_count:$hotspot_count,gap_count:$gap_count,hotspot_budget:$hotspot_budget,hotspots_truncated:$hotspots_truncated,hotspots_total:$hotspots_total,kind_counts:$kind_counts,kind_counts_total:$kind_counts_total,gap_budget:$gap_budget,gaps_truncated:$gaps_truncated}' \
  >"$ORIENT_DIR/manifest.json"

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
' "$ORIENT_DIR/hotspots.jsonl" >"$ORIENT_DIR/graph-slice.json" 2>/dev/null || \
  echo '{"schema_version":"0.1.0","nodes":[],"edges":[]}' >"$ORIENT_DIR/graph-slice.json"

# landscape-card.json (spec 093)
"$SCRIPT_DIR/scan-landscape-card.sh" "$TARGET_ROOT" "$ORIENT_DIR/landscape-card.json" || \
  echo '{"version":"0.1.0","identity":{"name":"unknown"},"scale":{},"maturity":{},"health_signals":{}}' >"$ORIENT_DIR/landscape-card.json"

# landscape-report.json (map.md-inspired sections)
jq -n \
  --slurpfile manifest "$ORIENT_DIR/manifest.json" \
  --slurpfile repos "$ORIENT_DIR/repos.json" \
  --slurpfile card "$ORIENT_DIR/landscape-card.json" \
  --rawfile hotspots "$ORIENT_DIR/hotspots.jsonl" \
  --rawfile gaps "$ORIENT_DIR/gaps.jsonl" \
  --rawfile hotspots_full "$ORIENT_DIR/hotspots-full.jsonl" \
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
  ' >"$ORIENT_DIR/landscape-report.json"

rm -f "$hotspots_raw" "$gaps_raw" "$sorted_all" "$budgeted"
echo "Portolan bundle written to $ORIENT_DIR (hotspots=$hotspot_count gaps=$gap_count total_before=$total_before truncated=$truncated)"
