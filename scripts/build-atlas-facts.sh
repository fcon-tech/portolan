#!/usr/bin/env bash
# Build a normalized atlas-facts.json pack from existing bundle artifacts.
# This is read-only: it summarizes source/corpus metadata, local repo profiles,
# hotspots, and relationship records without fetching external surfaces.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <target-root> <bundle-dir>" >&2
  exit 2
fi

TARGET_ROOT=$(cd "$1" && pwd)
BUNDLE_DIR=$2
OUT="$BUNDLE_DIR/atlas-facts.json"

command -v jq >/dev/null 2>&1 || {
  echo "jq is required" >&2
  exit 1
}

atlas_file="$BUNDLE_DIR/atlas-surfaces.json"
repos_file="$BUNDLE_DIR/repos.json"
profiles_file="$BUNDLE_DIR/repo-profiles.json"
manifest_file="$BUNDLE_DIR/manifest.json"
hotspots_file="$BUNDLE_DIR/hotspots-full.jsonl"
relationships_file="$BUNDLE_DIR/relationships.jsonl"

empty_json=$(mktemp)
empty_jsonl=$(mktemp)
trap 'rm -f "$empty_json" "$empty_jsonl"' EXIT
echo '{}' >"$empty_json"
: >"$empty_jsonl"

[[ -f "$atlas_file" ]] || atlas_file="$empty_json"
[[ -f "$repos_file" ]] || repos_file="$empty_json"
[[ -f "$profiles_file" ]] || profiles_file="$empty_json"
[[ -f "$manifest_file" ]] || manifest_file="$empty_json"
[[ -f "$hotspots_file" ]] || hotspots_file="$BUNDLE_DIR/hotspots.jsonl"
[[ -f "$hotspots_file" ]] || hotspots_file="$empty_jsonl"
[[ -f "$relationships_file" ]] || relationships_file="$empty_jsonl"

jq -n \
  --arg generated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --arg target_root "$TARGET_ROOT" \
  --slurpfile atlas "$atlas_file" \
  --slurpfile repos "$repos_file" \
  --slurpfile profiles "$profiles_file" \
  --slurpfile manifest "$manifest_file" \
  --rawfile hotspots_raw "$hotspots_file" \
  --rawfile relationships_raw "$relationships_file" '
  def jsonl($text): $text | split("\n") | map(select(length > 0) | fromjson?);
  def repo_list: if ($repos[0] | type) == "array" then $repos[0] else [] end;
  def profile_list: if ($profiles[0].repos | type) == "array" then $profiles[0].repos else [] end;
  def targets: if ($atlas[0].targets | type) == "array" then $atlas[0].targets else [] end;
  def surfaces: if ($atlas[0].surfaces | type) == "array" then $atlas[0].surfaces else [] end;
  def hotspots: jsonl($hotspots_raw);
  def relationships: jsonl($relationships_raw);
  def repo_like($t): (($t.kind == "repository") or ($t.kind == "retired-project"));
  def repo_id_for_target($target_id):
    (repo_list | map(select(.id == $target_id or .name == $target_id)) | .[0].id) // "";
  def profile_for_repo($repo_id):
    (profile_list | map(select(.id == $repo_id)) | .[0]) // null;
  def target_label($target_id):
    (targets | map(select(.id == $target_id)) | .[0].label) // $target_id;
  def target_surface($target_id; $kinds):
    (surfaces | map(select(.target_id == $target_id and ((.kind as $kind | $kinds | index($kind)) != null))) | .[0]) // null;
  def surface_state($surface):
    if $surface == null then "missing"
    elif (($surface.evidence_state // "metadata-visible") | IN("cannot_verify", "unknown", "claim-only")) then "gap"
    else "ok"
    end;
  def first_path($h): (($h.paths // []) | map(select(. != "(dependency-hub)" and length > 0)) | .[0]) // "";
  def hotspot_repo($h):
    if ($h.repo_id // "") != "" then $h.repo_id
    else
      first_path($h) as $p |
      if $p == "" then ""
      else
        (repo_list
          | map(. as $repo | select($p == $repo.path or ($p | startswith($repo.path + "/"))))
          | sort_by(-(.path | length))
          | .[0].id) // ""
      end
    end;
  def severity_counts($rows):
    {
      critical: ($rows | map(select(.severity == "critical")) | length),
      high: ($rows | map(select(.severity == "high")) | length),
      medium: ($rows | map(select(.severity == "medium")) | length),
      low: ($rows | map(select(.severity == "low")) | length),
      info: ($rows | map(select(.severity == "info")) | length)
    };
  def kind_counts($rows):
    $rows | group_by(.kind // "unknown") | map({(.[0].kind // "unknown"): length}) | add // {};
  def surface_fact($target_id; $label; $kinds):
    target_surface($target_id; $kinds) as $surface |
    {
      id: ("surface-" + $label),
      label: $label,
      value: (if $surface == null then "missing" else ($surface.evidence_state // "metadata-visible") end),
      state: surface_state($surface),
      source: (if $surface == null then "atlas-facts" else ($surface.source // "atlas-surfaces") end),
      evidence_ref: (if $surface == null then "" else ("atlas-surfaces.json#surface:" + ($surface.id // "")) end)
    };
  def surface_route($target_id; $slot; $label; $kinds):
    target_surface($target_id; $kinds) as $surface |
    {
      slot: $slot,
      label: $label,
      state: surface_state($surface),
      kind: (if $surface == null then $slot else ($surface.kind // $slot) end),
      url: (if $surface == null then "" else ($surface.url // "") end),
      evidence_state: (if $surface == null then "missing" else ($surface.evidence_state // "metadata-visible") end),
      source: (if $surface == null then "atlas-facts" else ($surface.source // "atlas-surfaces") end),
      evidence_ref: (if $surface == null then "" else ("atlas-surfaces.json#surface:" + ($surface.id // "")) end)
    };
  def number_fact($id; $label; $value; $state; $source; $evidence_ref):
    {id:$id,label:$label,value:($value | tostring),state:$state,source:$source,evidence_ref:$evidence_ref};
  def profile_summary($profile):
    if $profile == null then null else {
      file_count: $profile.scale.file_count,
      primary_languages: (($profile.languages // []) | .[0:5]),
      module_ids: (($profile.module_ids // []) | .[0:8]),
      ci_files_count: (($profile.ci_files // []) | length),
      manifest_count: (($profile.purpose.manifests // []) | length),
      compose_file_count: (($profile.purpose.compose // []) | length),
      compose_service_count: ([($profile.purpose.compose // [])[] | (.services // []) | length] | add // 0),
      dockerfile_count: (($profile.purpose.docker // []) | length),
      entrypoint_count: (($profile.purpose.entrypoints // []) | length),
      api_spec_count: (($profile.purpose.api_specs // []) | length),
      last_commit: $profile.activity.last_commit,
      commits_30d: $profile.activity.commits_30d
    } end;
  def good_signals($target; $profile; $tracker; $wiki; $docs; $repo_hotspots):
    [
      if $profile.maturity.has_readme then "README visible" else empty end,
      if $profile.maturity.has_ci then "CI surface visible" else empty end,
      if $profile.maturity.has_tests then "test surface visible" else empty end,
      if $profile.maturity.has_docker then "Docker/deploy surface visible" else empty end,
      if surface_state($tracker) == "ok" then "tracker mapped" else empty end,
      if surface_state($wiki) == "ok" then "wiki mapped" else empty end,
      if surface_state($docs) == "ok" then "docs/release mapped" else empty end,
      if (($repo_hotspots | length) == 0) then "no loaded findings" else empty end
    ];
  def attention_signals($target; $profile; $tracker; $wiki; $docs; $sev):
    [
      if $sev.critical > 0 then (($sev.critical | tostring) + " critical finding(s)") else empty end,
      if $sev.high > 0 then (($sev.high | tostring) + " high finding(s)") else empty end,
      if $sev.medium > 0 then (($sev.medium | tostring) + " medium finding(s)") else empty end,
      if surface_state($wiki) == "gap" then "wiki cannot_verify" else empty end,
      if surface_state($tracker) == "missing" then "tracker missing" else empty end,
      if surface_state($docs) == "missing" then "docs/release surface missing" else empty end,
      if ($profile != null and ($profile.maturity.has_tests | not)) then "tests not detected" else empty end,
      if ($profile != null and ($profile.maturity.has_ci | not)) then "CI not detected" else empty end
    ];
  def unknown_signals($repo_id; $profile):
    [
      if $repo_id == "" then "no local repo id" else empty end,
      if $profile == null then "repo profile missing" else empty end,
      "runtime call topology not_assessed",
      "live deployments/secrets/vendor config not_assessed"
    ];
  def component_for_target($target):
    repo_id_for_target($target.id) as $repo_id |
    profile_for_repo($repo_id) as $profile |
    ([hotspots[] | select(hotspot_repo(.) == $repo_id)]) as $repo_hotspots |
    ([relationships[] | select(.from_repo == $repo_id or .to_repo == $repo_id or ((.repos // []) | index($repo_id)))]) as $repo_relationships |
    ([targets[] | select((.depends_on // []) | index($target.id)) | .id]) as $inbound_targets |
    (($target.depends_on // []) | map(select((targets | map(.id) | index(.)) != null))) as $outbound_targets |
    target_surface($target.id; ["repository", "official-repo"]) as $repo_surface |
    target_surface($target.id; ["project-site"]) as $site_surface |
    target_surface($target.id; ["issue-tracker", "official-issue-tracker"]) as $tracker_surface |
    target_surface($target.id; ["wiki", "official-wiki"]) as $wiki_surface |
    target_surface($target.id; ["documentation", "official-doc", "release", "official-release"]) as $docs_surface |
    severity_counts($repo_hotspots) as $sev |
    {
      id: ("component:" + $target.id),
      target_id: $target.id,
      repo_id: $repo_id,
      label: ($target.label // $target.id),
      kind: ($target.kind // "unknown"),
      lifecycle: ($target.lifecycle // "unknown"),
      role: ($target.role // ""),
      evidence_state: ($target.evidence_state // "metadata-visible"),
      summary: (($target.notes // "") | tostring),
      profile: profile_summary($profile),
      counts: {
        findings: ($repo_hotspots | length),
        severities: $sev,
        kind_counts: kind_counts($repo_hotspots),
        inbound_manifest_deps: ($inbound_targets | length),
        outbound_manifest_deps: ($outbound_targets | length),
        relationship_records: ($repo_relationships | length),
        surfaces: ([ $repo_surface, $site_surface, $tracker_surface, $wiki_surface, $docs_surface ] | map(select(. != null)) | length)
      },
      surfaces: {
        repository: $repo_surface,
        site: $site_surface,
        tracker: $tracker_surface,
        wiki: $wiki_surface,
        docs: $docs_surface
      },
      surface_routes: [
        surface_route($target.id; "repository"; "Repository"; ["repository", "official-repo"]),
        surface_route($target.id; "project-site"; "Project site"; ["project-site"]),
        surface_route($target.id; "tracker"; "Tracker"; ["issue-tracker", "official-issue-tracker"]),
        surface_route($target.id; "wiki"; "Wiki"; ["wiki", "official-wiki"]),
        surface_route($target.id; "docs"; "Docs/release"; ["documentation", "official-doc", "release", "official-release"])
      ],
      facts: [
        number_fact("files"; "Files"; ($profile.scale.file_count // "unknown"); (if $profile == null then "missing" else "ok" end); "repo-profiles"; ("repo-profiles.json#repo:" + $repo_id)),
        number_fact("findings"; "Findings"; ($repo_hotspots | length); (if ($repo_hotspots | length) > 0 then "watch" else "ok" end); "hotspots-full"; "hotspots-full.jsonl"),
        number_fact("manifest-deps-in"; "Manifest deps in"; ($inbound_targets | length); "ok"; "corpus-manifest"; ("atlas-surfaces.json#target:" + $target.id)),
        number_fact("manifest-deps-out"; "Manifest deps out"; ($outbound_targets | length); "ok"; "corpus-manifest"; ("atlas-surfaces.json#target:" + $target.id)),
        number_fact("relationship-records"; "Relationship records"; ($repo_relationships | length); (if ($repo_relationships | length) > 0 then "ok" else "missing" end); "relationships"; "relationships.jsonl"),
        number_fact("ci-files"; "CI files"; ($profile.ci_files | length // 0); (if ($profile.maturity.has_ci // false) then "ok" else "missing" end); "repo-profiles"; ("repo-profiles.json#repo:" + $repo_id)),
        number_fact("compose-services"; "Compose services"; ([($profile.purpose.compose // [])[] | (.services // []) | length] | add // 0); (if ([($profile.purpose.compose // [])[] | (.services // []) | length] | add // 0) > 0 then "ok" else "missing" end); "repo-profiles"; ("repo-profiles.json#repo:" + $repo_id)),
        surface_fact($target.id; "repo"; ["repository", "official-repo"]),
        surface_fact($target.id; "tracker"; ["issue-tracker", "official-issue-tracker"]),
        surface_fact($target.id; "wiki"; ["wiki", "official-wiki"]),
        surface_fact($target.id; "docs"; ["documentation", "official-doc", "release", "official-release"])
      ],
      signals: {
        good: good_signals($target; $profile; $tracker_surface; $wiki_surface; $docs_surface; $repo_hotspots),
        attention: attention_signals($target; $profile; $tracker_surface; $wiki_surface; $docs_surface; $sev),
        unknown: unknown_signals($repo_id; $profile)
      },
      top_findings: ($repo_hotspots | sort_by(.rank // 999999, .summary // .id) | .[0:8] | map({
        id,
        rank,
        kind,
        severity,
        summary,
        evidence_state,
        evidence_ref: ("hotspots-full.jsonl#hotspot:" + .id)
      })),
      inbound_targets: $inbound_targets,
      outbound_targets: $outbound_targets,
      relationship_ids: ($repo_relationships | map(.id) | .[0:20])
    };
  def manifest_edges:
    [targets[] as $source
      | ($source.depends_on // [])[]? as $target_id
      | select(repo_id_for_target($source.id) != "" and repo_id_for_target($target_id) != "")
      | {
          id: ("manifest-dep:" + $source.id + "->" + $target_id),
          kind: "manifest-dependency",
          from_target: $source.id,
          to_target: $target_id,
          from_repo: repo_id_for_target($source.id),
          to_repo: repo_id_for_target($target_id),
          label: (($source.label // $source.id) + " depends on " + target_label($target_id)),
          evidence_state: "metadata-visible",
          source: "corpus-manifest",
          evidence_ref: ("atlas-surfaces.json#target:" + $source.id)
        }];
  def relationship_edges:
    [relationships[] | {
      id: ("relationship:" + (.id // "")),
      kind: (.type // "relationship"),
      repo_ids: ([.from_repo, .to_repo] + (.repos // []) | map(select(. != null and . != "")) | unique),
      label: (.summary // .id // "relationship"),
      evidence_state: (.evidence_state // "metadata-visible"),
      source: (.producer // "relationships"),
      evidence_ref: ("relationships.jsonl#relationship:" + (.id // "")),
      detail: (.detail // {})
    }];
  def surface_directory($components):
    $components | map({
      target_id,
      repo_id,
      label,
      role,
      lifecycle,
      evidence_state,
      routes: .surface_routes
    });
  (targets | map(select(repo_like(.))) | map(component_for_target(.))) as $components |
  (manifest_edges + relationship_edges) as $edges |
  surface_directory($components) as $surface_directory |
  {
    schema_version: "0.1.0",
    generated_at: $generated_at,
    target_root: $target_root,
    corpus: ($atlas[0].corpus // null),
    coverage: {
      component_count: ($components | length),
      repo_count: (repo_list | length),
      repo_profile_count: (profile_list | length),
      hotspot_count: (hotspots | length),
      relationship_count: (relationships | length),
      fact_count: ($components | map(.facts | length) | add // 0),
      surface_route_count: ([$surface_directory[].routes[] | select(.state != "missing")] | length),
      repository_route_count: ([$surface_directory[].routes[] | select(.slot == "repository" and .state != "missing")] | length),
      tracker_route_count: ([$surface_directory[].routes[] | select(.slot == "tracker" and .state != "missing")] | length),
      wiki_route_count: ([$surface_directory[].routes[] | select(.slot == "wiki" and .state != "missing")] | length),
      public_wiki_route_count: ([$surface_directory[].routes[] | select(.slot == "wiki" and .state != "missing" and .evidence_state != "cannot_verify")] | length),
      docs_route_count: ([$surface_directory[].routes[] | select(.slot == "docs" and .state != "missing")] | length),
      cannot_verify_surface_routes: ([$surface_directory[].routes[] | select(.evidence_state == "cannot_verify")] | length),
      edge_count: ($edges | length),
      manifest_dependency_edges: (manifest_edges | length),
      relationship_edges: (relationship_edges | length),
      runtime_topology: "not_assessed"
    },
    components: $components,
    surface_directory: $surface_directory,
    edges: $edges,
    gaps: [
      {
        id: "atlas-facts-runtime-topology",
        surface: "runtime topology",
        status: "not_assessed",
        summary: "Runtime calls, live deployments, secrets, and vendor configuration are not proven by this local atlas facts pack.",
        source: "atlas-facts"
      }
    ]
  }
' >"$OUT"

echo "atlas-facts: $OUT" >&2
