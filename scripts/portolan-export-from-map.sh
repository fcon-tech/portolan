#!/usr/bin/env bash
# Bridge legacy portolan map bundle -> Portolan bundle layout.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <map-bundle-dir> <bundle-dir>" >&2
  exit 2
fi

MAP_DIR=$1
BUNDLE_DIR=$2
mkdir -p "$BUNDLE_DIR"

command -v jq >/dev/null 2>&1 || { echo "jq required" >&2; exit 1; }

target_root=""
if [[ -f "$MAP_DIR/run.json" ]]; then
  target_root=$(jq -r '.root // empty' "$MAP_DIR/run.json")
fi
[[ -z "$target_root" ]] && target_root=$(jq -r '.target_root // "."' "$BUNDLE_DIR/manifest.json" 2>/dev/null || echo ".")

rank=0
: >"$BUNDLE_DIR/hotspots.jsonl"
if [[ -f "$MAP_DIR/findings.jsonl" ]]; then
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    kind=$(echo "$line" | jq -r '.kind')
    mapped_kind=$kind
    case "$kind" in
      duplication) mapped_kind="duplication" ;;
      configuration) mapped_kind="config" ;;
      technical-debt) mapped_kind="debt-candidate" ;;
      relationships) mapped_kind="dep-hub" ;;
      *) mapped_kind="debt-candidate" ;;
    esac
  rank=$((rank + 1))
    echo "$line" | jq -c \
      --argjson rank "$rank" \
      --arg mk "$mapped_kind" \
      '{
        id: (.id // ("map-" + ($rank|tostring))),
        kind: $mk,
        severity: (if .severity == "high" then "high" elif .severity == "medium" then "medium" else "low" end),
        summary: (.summary // "finding"),
        paths: [],
        evidence_state: (.evidence_state // "metadata-visible"),
        producer: "portolan-map",
        producer_ref: "findings.jsonl",
        rank: $rank
      }' >>"$BUNDLE_DIR/hotspots.jsonl"
  done <"$MAP_DIR/findings.jsonl"
fi

: >"$BUNDLE_DIR/gaps.jsonl"
if [[ -f "$MAP_DIR/coverage.json" ]]; then
  jq -c '.records[]? | select(.status == "not_assessed" or .status == "unknown")' "$MAP_DIR/coverage.json" 2>/dev/null | head -20 | while read -r rec; do
    echo "$rec" | jq -c '{id:("gap-" + (.surface // "unknown")),surface:(.surface // "unknown"),status:(.status // "not_assessed"),summary:(.summary // .surface)}' >>"$BUNDLE_DIR/gaps.jsonl"
  done
fi

if [[ -f "$MAP_DIR/summary.json" ]]; then
  cp "$MAP_DIR/summary.json" "$BUNDLE_DIR/legacy-summary.json" 2>/dev/null || true
fi

hotspot_count=$(wc -l <"$BUNDLE_DIR/hotspots.jsonl" | tr -d ' ')
gap_count=0
[[ -f "$BUNDLE_DIR/gaps.jsonl" ]] && gap_count=$(wc -l <"$BUNDLE_DIR/gaps.jsonl" | tr -d ' ')

jq -n \
  --arg schema_version "0.1.0" \
  --arg target_root "$target_root" \
  --arg generated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --argjson hotspot_count "$hotspot_count" \
  --argjson gap_count "$gap_count" \
  --arg source "portolan-map-bridge" \
  '{schema_version:$schema_version,target_root:$target_root,generated_at:$generated_at,hotspot_count:$hotspot_count,gap_count:$gap_count,source:$source}' \
  >"$BUNDLE_DIR/manifest.json"

echo '{"schema_version":"0.1.0","repos":[]}' >"$BUNDLE_DIR/repos.json"
if [[ -f "$MAP_DIR/run.json" ]]; then
  jq -n --arg r "$target_root" '[{id:"root",path:$r,name:( $r | split("/") | last)}]' >"$BUNDLE_DIR/repos.json"
fi

jq -s '{schema_version:"0.1.0",nodes:[.[]|{id:.id,label:.summary,kind:.kind}],edges:[]}' \
  "$BUNDLE_DIR/hotspots.jsonl" >"$BUNDLE_DIR/graph-slice.json" 2>/dev/null || \
  echo '{"schema_version":"0.1.0","nodes":[],"edges":[]}' >"$BUNDLE_DIR/graph-slice.json"

echo "exported map bundle from $MAP_DIR to $BUNDLE_DIR"
