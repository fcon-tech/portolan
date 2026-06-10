#!/usr/bin/env bash
# Build orient/ bundle from target root and optional producer outputs under
# <orient-dir>/producers/. See harness/SKILL.md and spec 088/091.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <target-root> <orient-dir>" >&2
  exit 2
fi

TARGET_ROOT=$(cd "$1" && pwd)
ORIENT_DIR=$2
PRODUCERS_DIR="$ORIENT_DIR/producers"
HOTSPOT_BUDGET="${ORIENT_HOTSPOT_BUDGET:-200}"
mkdir -p "$ORIENT_DIR" "$PRODUCERS_DIR"

command -v jq >/dev/null 2>&1 || {
  echo "jq is required" >&2
  exit 1
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

process_jscpd_file() {
  local jfile=$1
  jq -r --arg ref "$jfile" '
    .duplicates[]? |
    select(.firstFile.name != null and .firstFile.name != "") |
    [.firstFile.name, (.secondFile.name // ""), (.lines // 0 | tostring), $ref] | @tsv
  ' "$jfile" | while IFS=$'\t' read -r first second lines ref; do
    [[ -z "$first" ]] && continue
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
dep_hub_min=8
while IFS= read -r sbom; do
  [[ -f "$sbom" ]] || continue
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
      '{id:$id,kind:"dep-hub",severity:"low",summary:$summary,paths:[],evidence_state:"metadata-visible",producer:"syft",producer_ref:$ref}' >>"$hotspots_raw"
  done
done < <(find "$PRODUCERS_DIR/syft" -type f \( -name 'cyclonedx.json' -o -name '*cyclonedx*.json' \) 2>/dev/null)

[[ "$syft_found" -eq 1 ]] || append_gap "gap-deps" "dependencies" "not_assessed" \
  "No Syft/CycloneDX producer output found." "harness/recipes/deps-syft-cyclonedx.md"

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
      if k == "static-finding" then ($budget * 0.5 | floor)
      elif k == "duplication" then ($budget * 0.3 | floor)
      elif k == "dep-hub" then ($budget * 0.2 | floor)
      else 0 end;
    . as $all |
    (["static-finding", "duplication", "dep-hub"] | map(
      . as $k | ([$all[] | select(.kind == $k)] | sort_h) | .[0:quota($k)]
    ) | add) as $selected |
    ($selected | map(.id)) as $ids |
    ([$all[] | select(.id as $i | ($ids | index($i) | not))] | sort_h) as $rest |
    ($selected + $rest[0:($budget - ($selected | length))]) |
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
if [[ -s "$gaps_raw" ]]; then
  cat "$gaps_raw" >>"$ORIENT_DIR/gaps.jsonl"
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
  '{schema_version:$schema_version,target_root:$target_root,generated_at:$generated_at,hotspot_count:$hotspot_count,gap_count:$gap_count,hotspot_budget:$hotspot_budget,hotspots_truncated:$hotspots_truncated,hotspots_total:$hotspots_total,kind_counts:$kind_counts,kind_counts_total:$kind_counts_total}' \
  >"$ORIENT_DIR/manifest.json"

jq -s '{schema_version:"0.1.0",nodes:[.[]|{id:.id,label:.summary,kind:.kind,paths:(.paths//[])}],edges:[]}' \
  "$ORIENT_DIR/hotspots.jsonl" >"$ORIENT_DIR/graph-slice.json" 2>/dev/null || \
  echo '{"schema_version":"0.1.0","nodes":[],"edges":[]}' >"$ORIENT_DIR/graph-slice.json"

rm -f "$hotspots_raw" "$gaps_raw" "$sorted_all" "$budgeted"
echo "orient bundle written to $ORIENT_DIR (hotspots=$hotspot_count gaps=$gap_count total_before=$total_before truncated=$truncated)"
