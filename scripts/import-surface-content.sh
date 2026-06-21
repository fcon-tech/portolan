#!/usr/bin/env bash
# Normalize local tracker/wiki/docs export cards into the bundle producer shape
# consumed by build-atlas-surface-content.sh. This script is read-only with
# respect to source repos; it writes only under <bundle-dir>/producers.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <bundle-dir> <input-json-or-jsonl> [output-name]" >&2
  exit 2
fi

BUNDLE_DIR=$1
INPUT=$2
NAME=${3:-surface-content}

[[ -f "$INPUT" ]] || {
  echo "input file not found: $INPUT" >&2
  exit 2
}

command -v jq >/dev/null 2>&1 || {
  echo "jq is required" >&2
  exit 1
}

case "$NAME" in
  *[!A-Za-z0-9_.-]*|'')
    echo "output name must contain only letters, digits, dot, underscore, and dash" >&2
    exit 2
    ;;
esac

OUT_DIR="$BUNDLE_DIR/producers/surface-content"
OUT="$OUT_DIR/$NAME.jsonl"
mkdir -p "$OUT_DIR"

jq -sc '
  def slot_norm:
    ascii_downcase as $s |
    if $s == "issue-tracker" or $s == "jira" or $s == "tracker" then "tracker"
    elif $s == "confluence" or $s == "wiki" then "wiki"
    elif $s == "documentation" or $s == "doc" or $s == "docs" or $s == "release" then "docs"
    elif $s == "repository" or $s == "repo" or $s == "source" then "repository"
    else $s
    end;
  def clean_id:
    tostring | gsub("[^A-Za-z0-9_.:-]+"; "-") | gsub("^-+"; "") | gsub("-+$"; "") | .[0:80];
  def normalize:
    . as $row |
    (($row.slot // $row.kind // $row.surface // "unknown") | tostring | slot_norm) as $slot |
    (($row.target_id // "") | tostring) as $target_id |
    (($row.repo_id // "") | tostring) as $repo_id |
    (($row.title // $row.label // $row.summary // $row.url // "surface content") | tostring) as $title |
    {
      id: (
        ($row.id // "") as $id |
        if ($id | tostring | length) > 0 then ($id | tostring)
        else ("surface-content-" + (($target_id // $repo_id // "unknown") | clean_id) + "-" + ($slot | clean_id) + "-" + ($title | clean_id))
        end
      ),
      target_id: $target_id,
      repo_id: $repo_id,
      slot: $slot,
      url: (($row.url // "") | tostring),
      title: $title,
      summary: (($row.summary // $row.text // $row.description // "") | tostring),
      content_ref: (($row.content_ref // $row.path // $row.url // "") | tostring),
      evidence_state: (($row.evidence_state // "metadata-visible") | tostring),
      source: (($row.source // "surface-content-import") | tostring),
      exported_at: (($row.exported_at // "") | tostring),
      tags: (if ($row.tags | type) == "array" then $row.tags else [] end)
    }
    | select(.slot != "unknown")
    | select((.target_id != "") or (.repo_id != "") or (.url != ""));
  if length == 1 and (.[0] | type) == "array" then
    .[0][] | normalize
  else
    .[] | select(type == "object") | normalize
  end
' "$INPUT" >"$OUT.tmp"

if [[ ! -s "$OUT.tmp" ]]; then
  rm -f "$OUT.tmp"
  echo "no usable surface content records in $INPUT" >&2
  exit 1
fi

mv "$OUT.tmp" "$OUT"
echo "surface-content-import: $OUT" >&2
