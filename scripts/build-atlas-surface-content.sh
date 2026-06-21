#!/usr/bin/env bash
# Build atlas-surface-content.json from atlas-facts surface routes and optional
# local exports under <bundle-dir>/producers/surface-content/*.jsonl.
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <bundle-dir>" >&2
  exit 2
fi

BUNDLE_DIR=$1
OUT="$BUNDLE_DIR/atlas-surface-content.json"
FACTS="$BUNDLE_DIR/atlas-facts.json"
PRODUCER_DIR="$BUNDLE_DIR/producers/surface-content"

command -v jq >/dev/null 2>&1 || {
  echo "jq is required" >&2
  exit 1
}

empty_json=$(mktemp)
content_raw=$(mktemp)
trap 'rm -f "$empty_json" "$content_raw"' EXIT
echo '{}' >"$empty_json"
: >"$content_raw"

[[ -f "$FACTS" ]] || FACTS="$empty_json"
if [[ -d "$PRODUCER_DIR" ]]; then
  while IFS= read -r file; do
    [[ -s "$file" ]] || continue
    cat "$file" >>"$content_raw"
    printf '\n' >>"$content_raw"
  done < <(find "$PRODUCER_DIR" -type f -name '*.jsonl' 2>/dev/null | sort)
fi

jq -n \
  --arg generated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --slurpfile facts "$FACTS" \
  --rawfile content_raw "$content_raw" '
  def jsonl($text): $text | split("\n") | map(select(length > 0) | fromjson?);
  def components: if ($facts[0].surface_directory | type) == "array" then $facts[0].surface_directory else [] end;
  def exported_cards:
    jsonl($content_raw)
    | to_entries
    | map(.value as $row | {
        id: ($row.id // ("surface-content-" + (.key | tostring))),
        target_id: ($row.target_id // ""),
        repo_id: ($row.repo_id // ""),
        slot: ($row.slot // $row.kind // "unknown"),
        url: ($row.url // ""),
        title: ($row.title // $row.label // $row.url // "surface content"),
        summary: ($row.summary // $row.text // ""),
        content_ref: ($row.content_ref // $row.path // $row.url // ""),
        evidence_state: ($row.evidence_state // "metadata-visible"),
        source: ($row.source // "surface-content-export"),
        exported_at: ($row.exported_at // ""),
        tags: ($row.tags // [])
      });
  def route_cards($entry; $route; $cards):
    $cards
    | map(select(
        ((.target_id != "" and .target_id == $entry.target_id and .slot == $route.slot)
          or (.repo_id != "" and .repo_id == $entry.repo_id and .slot == $route.slot)
          or (.url != "" and $route.url != "" and .url == $route.url))
      ));
  def route_content($entry; $route; $cards):
    route_cards($entry; $route; $cards) as $matched |
    {
      target_id: $entry.target_id,
      repo_id: $entry.repo_id,
      label: $entry.label,
      role: $entry.role,
      lifecycle: $entry.lifecycle,
      slot: $route.slot,
      route_label: $route.label,
      url: $route.url,
      route_state: $route.state,
      evidence_state: $route.evidence_state,
      route_evidence_ref: $route.evidence_ref,
      content_state: (
        if ($matched | length) > 0 then "imported"
        elif $route.evidence_state == "cannot_verify" then "cannot_verify"
        else "not_imported"
        end
      ),
      content_count: ($matched | length),
      cards: $matched
    };
  exported_cards as $cards |
  ([components[] as $entry | ($entry.routes // [])[]? as $route
    | select($route.state != "missing")
    | route_content($entry; $route; $cards)
  ]) as $routes |
  {
    schema_version: "0.1.0",
    generated_at: $generated_at,
    corpus: ($facts[0].corpus // null),
    coverage: {
      component_count: (components | length),
      route_count: ($routes | length),
      imported_route_count: ([$routes[] | select(.content_state == "imported")] | length),
      exported_card_count: ($cards | length),
      repository_routes: ([$routes[] | select(.slot == "repository")] | length),
      tracker_routes: ([$routes[] | select(.slot == "tracker")] | length),
      wiki_routes: ([$routes[] | select(.slot == "wiki")] | length),
      docs_routes: ([$routes[] | select(.slot == "docs")] | length),
      imported_tracker_routes: ([$routes[] | select(.slot == "tracker" and .content_state == "imported")] | length),
      imported_wiki_routes: ([$routes[] | select(.slot == "wiki" and .content_state == "imported")] | length),
      imported_docs_routes: ([$routes[] | select(.slot == "docs" and .content_state == "imported")] | length),
      missing_tracker_content_targets: ([$routes[] | select(.slot == "tracker" and .content_state == "not_imported") | .target_id]),
      missing_wiki_content_targets: ([$routes[] | select(.slot == "wiki" and .content_state == "not_imported") | .target_id]),
      cannot_verify_content_targets: ([$routes[] | select(.content_state == "cannot_verify") | .target_id] | unique)
    },
    routes: $routes,
    gaps: (
      (if ([$routes[] | select(.slot == "tracker" and .content_state == "not_imported")] | length) > 0 then [{
        id: "surface-content-trackers-not-imported",
        surface: "tracker content",
        status: "not_assessed",
        summary: "Tracker routes are mapped, but not all mapped trackers have local export records imported.",
        source: "atlas-surface-content"
      }] else [] end)
      +
      (if ([$routes[] | select(.slot == "wiki" and .content_state == "not_imported")] | length) > 0 then [{
        id: "surface-content-wiki-not-imported",
        surface: "wiki content",
        status: "not_assessed",
        summary: "Wiki routes are mapped, but not all mapped wiki routes have local export records imported.",
        source: "atlas-surface-content"
      }] else [] end)
    )
  }
' >"$OUT"

echo "atlas-surface-content: $OUT" >&2
