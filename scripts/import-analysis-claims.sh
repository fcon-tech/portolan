#!/usr/bin/env bash
# Import agent analysis claims into a Portolan bundle (spec 106).
#
# Validates each claim and resolves every cited ref against the bundle:
#   hotspot:<id> gap:<id> relationship:<id> repo:<id>
#   path:<repo-relative-or-absolute>[:line]  producer_ref:<path>
#
# analytical/synthetic claims need >=1 cited ref and all refs valid; otherwise
# the claim is rejected with a reason in claims-import-report.json (no silent
# downgrade). speculative claims may cite nothing but stay labeled claim-only.
# The importer never raises a tier and always forces evidence_state=claim-only.
# Re-import replaces previously imported claims of the same agent.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <bundle-dir> <claims-file.jsonl>" >&2
  exit 2
fi

BUNDLE_DIR=$(cd "$1" && pwd)
CLAIMS_FILE=$2
OUT="$BUNDLE_DIR/claims.jsonl"
REPORT="$BUNDLE_DIR/claims-import-report.json"

command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }
[[ -f "$CLAIMS_FILE" ]] || { echo "claims file not found: $CLAIMS_FILE" >&2; exit 2; }
[[ -f "$BUNDLE_DIR/repos.json" ]] || { echo "not a Portolan bundle (repos.json missing): $BUNDLE_DIR" >&2; exit 2; }

NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BUNDLE_GENERATED_AT=$(jq -r '.generated_at // ""' "$BUNDLE_DIR/manifest.json" 2>/dev/null || echo "")

# --- known-id universe ---
ids_tmp=$(mktemp)
trap 'rm -f "$ids_tmp"' EXIT
{
  for f in hotspots-full.jsonl hotspots.jsonl; do
    [[ -f "$BUNDLE_DIR/$f" ]] && jq -r '"hotspot:" + .id' "$BUNDLE_DIR/$f" 2>/dev/null
  done
  [[ -f "$BUNDLE_DIR/gaps.jsonl" ]] && jq -r '"gap:" + .id' "$BUNDLE_DIR/gaps.jsonl" 2>/dev/null
  [[ -f "$BUNDLE_DIR/relationships.jsonl" ]] && jq -r '"relationship:" + .id' "$BUNDLE_DIR/relationships.jsonl" 2>/dev/null
  jq -r '.[] | "repo:" + .id' "$BUNDLE_DIR/repos.json" 2>/dev/null
  true
} | sort -u >"$ids_tmp"

mapfile -t REPO_ROOTS < <(jq -r '.[].path' "$BUNDLE_DIR/repos.json")
TARGET_ROOT=$(jq -r '.target_root // ""' "$BUNDLE_DIR/manifest.json" 2>/dev/null || echo "")

# canonical containment check: file exists and its realpath stays under root's
# realpath (blocks ../ traversal and symlink escapes in cited refs)
file_under_root() {
  local root=$1 candidate=$2 rootreal absreal
  [[ -n "$root" && -f "$candidate" ]] || return 1
  rootreal=$(readlink -f -- "$root" 2>/dev/null) || return 1
  absreal=$(readlink -f -- "$candidate" 2>/dev/null) || return 1
  [[ "$absreal" == "$rootreal" || "$absreal" == "$rootreal"/* ]]
}

resolve_path_ref() {
  # path:<p>[:line] — file must canonically resolve under a repo root (or target root)
  local raw=$1 p root
  p=${raw#path:}
  if [[ "$p" =~ ^(.+):([0-9]+)$ ]]; then
    p="${BASH_REMATCH[1]}"
  fi
  [[ -z "$p" ]] && return 1
  if [[ "$p" = /* ]]; then
    for root in "${REPO_ROOTS[@]}" "$TARGET_ROOT"; do
      file_under_root "$root" "$p" && return 0
    done
    return 1
  fi
  for root in "${REPO_ROOTS[@]}" "$TARGET_ROOT"; do
    file_under_root "$root" "$root/$p" && return 0
  done
  return 1
}

resolve_producer_ref() {
  # producer_ref:<p> — must canonically resolve inside the bundle dir only
  local p=${1#producer_ref:}
  [[ -z "$p" ]] && return 1
  if [[ "$p" = /* ]]; then
    file_under_root "$BUNDLE_DIR" "$p"
  else
    file_under_root "$BUNDLE_DIR" "$BUNDLE_DIR/$p"
  fi
}

accepted_tmp=$(mktemp)
rejected_tmp=$(mktemp)
agents_tmp=$(mktemp)
: >"$accepted_tmp"; : >"$rejected_tmp"; : >"$agents_tmp"
total=0
lineno=0

reject() {
  jq -nc --arg id "$1" --arg reason "$2" '{id:$id,reason:$reason}' >>"$rejected_tmp"
}

while IFS= read -r line || [[ -n "$line" ]]; do
  lineno=$((lineno + 1))
  [[ -z "${line// /}" ]] && continue
  total=$((total + 1))

  if ! jq -e . >/dev/null 2>&1 <<<"$line"; then
    reject "line-$lineno" "malformed JSON"
    continue
  fi

  cid=$(jq -r '.id // empty' <<<"$line")
  if [[ -z "$cid" ]]; then
    reject "line-$lineno" "missing id"
    continue
  fi

  err=$(jq -r '
    (.claim_tier) as $tier |
    if ($tier | type) != "string" or (["analytical","synthetic","speculative"] | index($tier)) == null
      then "claim_tier must be analytical | synthetic | speculative"
    elif (.statement | type) != "string" or (.statement | length) == 0
      then "statement required"
    elif (.subject | type) != "string" or (.subject | length) == 0
      then "subject required (landscape | repo:<id> | path:<path>)"
    elif (.cited_refs | type) != "array"
      then "cited_refs must be an array"
    elif ([.cited_refs[]? | select(type != "string" or length == 0)] | length) > 0
      then "cited_refs must contain non-empty strings"
    elif (.agent | type) != "string" or (.agent | length) == 0
      then "agent required (agent/model id)"
    else ""
    end' <<<"$line")
  if [[ -n "$err" ]]; then
    reject "$cid" "$err"
    continue
  fi

  # re-import contract: every schema-valid row claims its agent slot, so an
  # import file where all rows of an agent are rejected still purges that
  # agent's prior claims instead of leaving stale ones
  jq -r '.agent' <<<"$line" >>"$agents_tmp"

  tier=$(jq -r '.claim_tier' <<<"$line")
  subject=$(jq -r '.subject' <<<"$line")
  refs_count=$(jq -r '.cited_refs | length' <<<"$line")

  # subject resolution
  case "$subject" in
    landscape) : ;;
    repo:*)
      if ! grep -Fxq "$subject" "$ids_tmp"; then
        reject "$cid" "subject does not resolve: $subject"
        continue
      fi
      ;;
    path:*)
      if ! resolve_path_ref "$subject"; then
        reject "$cid" "subject does not resolve: $subject"
        continue
      fi
      ;;
    *)
      reject "$cid" "invalid subject format: $subject (landscape | repo:<id> | path:<path>)"
      continue
      ;;
  esac

  if [[ "$tier" != "speculative" && "$refs_count" -eq 0 ]]; then
    reject "$cid" "$tier claim requires >=1 cited ref"
    continue
  fi

  bad_ref=""
  while IFS= read -r ref; do
    [[ -z "$ref" ]] && continue
    case "$ref" in
      hotspot:*|gap:*|relationship:*|repo:*)
        grep -Fxq "$ref" "$ids_tmp" || { bad_ref="$ref"; break; }
        ;;
      path:*)
        resolve_path_ref "$ref" || { bad_ref="$ref"; break; }
        ;;
      producer_ref:*)
        resolve_producer_ref "$ref" || { bad_ref="$ref"; break; }
        ;;
      *)
        bad_ref="$ref (unknown ref scheme)"
        break
        ;;
    esac
  done < <(jq -r '.cited_refs[]?' <<<"$line")

  if [[ -n "$bad_ref" ]]; then
    reject "$cid" "cited ref does not resolve in bundle: $bad_ref"
    continue
  fi

  jq -c --arg now "$NOW" \
    '. + {evidence_state: "claim-only", imported_at: $now}' <<<"$line" >>"$accepted_tmp"
done <"$CLAIMS_FILE"

# duplicate ids within the import file: keep first, reject later ones
dedup_tmp=$(mktemp)
jq -sc 'group_by(.id) | map(.[0])[]' "$accepted_tmp" >"$dedup_tmp" 2>/dev/null || cp "$accepted_tmp" "$dedup_tmp"
dup_count=$(( $(wc -l <"$accepted_tmp") - $(wc -l <"$dedup_tmp") ))
if [[ "$dup_count" -gt 0 ]]; then
  jq -sc 'group_by(.id) | map(select(length > 1) | .[1:][]) | .[]' "$accepted_tmp" 2>/dev/null |
    jq -r '.id' | while IFS= read -r d; do
      reject "$d" "duplicate claim id in import file"
    done
fi
mv "$dedup_tmp" "$accepted_tmp"

# replace prior claims of the same agent(s); keep other agents.
# Per-line filtering: one malformed line in the existing claims.jsonl must not
# destroy other agents' claims, so unparseable lines are preserved as-is.
agents_json=$(sort -u "$agents_tmp" | jq -Rsc 'split("\n") | map(select(length > 0))')
merged_tmp=$(mktemp)
: >"$merged_tmp"
if [[ -f "$OUT" ]]; then
  while IFS= read -r prev || [[ -n "$prev" ]]; do
    [[ -z "${prev// /}" ]] && continue
    if jq -e . >/dev/null 2>&1 <<<"$prev"; then
      keep=$(jq -c --argjson agents "$agents_json" 'select(.agent as $a | ($agents | index($a)) == null)' <<<"$prev")
      [[ -n "$keep" ]] && printf '%s\n' "$keep" >>"$merged_tmp"
    else
      printf '%s\n' "$prev" >>"$merged_tmp"
    fi
  done <"$OUT"
fi
cat "$accepted_tmp" >>"$merged_tmp"
mv "$merged_tmp" "$OUT"

accepted_count=$(wc -l <"$accepted_tmp" | tr -d ' ')
rejected_json=$(jq -sc '.' "$rejected_tmp")
accepted_ids=$(jq -sc 'map(.id)' "$accepted_tmp")

jq -n \
  --arg schema_version "0.1.0" \
  --arg imported_at "$NOW" \
  --arg bundle "$BUNDLE_DIR" \
  --arg claims_file "$CLAIMS_FILE" \
  --arg bundle_generated_at "$BUNDLE_GENERATED_AT" \
  --argjson agents "$agents_json" \
  --argjson total "$total" \
  --argjson accepted_count "$accepted_count" \
  --argjson accepted "$accepted_ids" \
  --argjson rejected "$rejected_json" \
  '{schema_version:$schema_version,imported_at:$imported_at,bundle:$bundle,claims_file:$claims_file,
    bundle_generated_at:$bundle_generated_at,
    note: "claims are valid for this bundle snapshot; re-scan invalidates unresolved refs at re-import",
    agents:$agents,total_in_file:$total,accepted_count:$accepted_count,
    rejected_count:($rejected | length),accepted:$accepted,rejected:$rejected}' \
  >"$REPORT"

rm -f "$accepted_tmp" "$rejected_tmp" "$agents_tmp"

echo "claims import: accepted=$accepted_count rejected=$(jq -r '.rejected_count' "$REPORT") -> $OUT (report: $REPORT)" >&2
