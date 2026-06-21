#!/usr/bin/env bash
# Build a compact atlas-surfaces.json from repos.json and an optional corpus
# manifest. This is a read-only normalizer; it does not fetch upstream URLs.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <target-root> <bundle-dir> [corpus-manifest]" >&2
  exit 2
fi

TARGET_ROOT=$(cd "$1" && pwd)
BUNDLE_DIR=$2
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
OUT="$BUNDLE_DIR/atlas-surfaces.json"

command -v jq >/dev/null 2>&1 || {
  echo "jq is required" >&2
  exit 1
}

manifest_candidate="${3:-${PORTOLAN_CORPUS_MANIFEST:-}}"

manifest_from_selection() {
  local selection=$1
  [[ -f "$selection" ]] || return 0
  jq -r '.corpus_manifest // empty' "$selection" 2>/dev/null || true
}

if [[ -z "$manifest_candidate" ]]; then
  manifest_candidate=$(manifest_from_selection "$TARGET_ROOT/selection.json")
fi
if [[ -z "$manifest_candidate" ]]; then
  manifest_candidate=$(manifest_from_selection "$(dirname "$TARGET_ROOT")/selection.json")
fi

# Historical Bigtop selections may point at corpora/apache-bigtop/manifest.json,
# while this repo keeps the prepared corpus manifest under internal/testfixtures.
if [[ -n "$manifest_candidate" && ! -f "$manifest_candidate" ]]; then
  case "$manifest_candidate" in
    *apache-bigtop/manifest.json)
      alt="$ROOT/internal/testfixtures/corpus-manifests/apache-bigtop/manifest.json"
      [[ -f "$alt" ]] && manifest_candidate="$alt"
      ;;
  esac
fi

repo_file="$BUNDLE_DIR/repos.json"
if [[ ! -f "$repo_file" ]]; then
  jq -n \
    --arg generated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --arg target_root "$TARGET_ROOT" \
    '{schema_version:"0.1.0", generated_at:$generated_at, target_root:$target_root, corpus:null, coverage:{repo_count:0, target_count:0}, layers:[], targets:[], surfaces:[], gaps:[{id:"atlas-no-repos", surface:"atlas", status:"cannot_verify", summary:"repos.json is missing; atlas surfaces could not be built."}]}' \
    >"$OUT"
  exit 0
fi

if [[ -n "$manifest_candidate" && -f "$manifest_candidate" ]]; then
  jq -n \
    --slurpfile corpus "$manifest_candidate" \
    --slurpfile repos "$repo_file" \
    --arg generated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --arg target_root "$TARGET_ROOT" \
    --arg manifest_path "$(cd "$(dirname "$manifest_candidate")" && pwd)/$(basename "$manifest_candidate")" '
    def repo_names: ($repos[0] // []) | map(.name);
    def repo_like_target_ids: ($corpus[0].targets // []) | map(select(.kind == "repository" or .kind == "retired-project") | .id);
    def target_ids: ($corpus[0].targets // []) | map(.id);
    def visible_repo_like_target_ids: repo_names as $names | repo_like_target_ids | map(. as $id | select($names | index($id)));
    def counts_by($field; $items):
      $items | group_by(.[$field] // "unknown") | map({(.[0][$field] // "unknown"): length}) | add // {};
    def surface($id; $target_id; $kind; $label; $url; $state; $source; $note):
      {id:$id, target_id:$target_id, kind:$kind, label:$label, url:$url, evidence_state:($state // "metadata-visible"), source:$source}
      + (if ($note // "") != "" then {note:$note} else {} end);
    ($corpus[0].targets // []) as $targets |
    ($corpus[0].source_references // []) as $refs |
    {
      schema_version: "0.1.0",
      generated_at: $generated_at,
      target_root: $target_root,
      corpus: {
        id: $corpus[0].id,
        label: $corpus[0].label,
        status: $corpus[0].status,
        purpose: $corpus[0].purpose,
        manifest_path: $manifest_path,
        last_reviewed: $corpus[0].last_reviewed
      },
      coverage: {
        repo_count: (($repos[0] // []) | length),
        target_count: ($targets | length),
        source_reference_count: ($refs | length),
        surface_count: (
          ($refs | length)
          + ([$targets[] | select(.repository_url)] | length)
          + ([$targets[] | select(.project_url)] | length)
          + ([$targets[] | select(.reference_url)] | length)
          + ([$targets[] | select(.tracker_url)] | length)
          + ([$targets[] | select(.wiki_url)] | length)
          + ([$targets[] | select(.docs_url)] | length)
          + ([$targets[] | select(.mailing_list_url)] | length)
        ),
        targets_by_kind: counts_by("kind"; $targets),
	        targets_by_lifecycle: counts_by("lifecycle"; $targets),
	        source_repo_targets: ([$targets[] | select(.kind == "repository" or .kind == "retired-project")] | length),
	        source_repos_visible: (visible_repo_like_target_ids | length),
	        missing_source_targets: (repo_names as $names | [$targets[] | . as $target | select(($target.kind == "repository" or $target.kind == "retired-project") and (($names | index($target.id)) | not)) | $target.id]),
	        extra_on_disk_repos: (target_ids as $ids | [repo_names[] | . as $name | select(($ids | index($name)) | not)]),
	        tracker_targets: ([$targets[] | select(.kind == "repository" or .kind == "retired-project")] | length),
	        tracker_visible: ([$targets[] | select((.kind == "repository" or .kind == "retired-project") and .tracker_url)] | length),
	        missing_tracker_targets: ([$targets[] | . as $target | select(($target.kind == "repository" or $target.kind == "retired-project") and (($target.tracker_url // "") == "")) | $target.id]),
	        wiki_targets: ([$targets[] | select(.kind == "repository" or .kind == "retired-project")] | length),
	        wiki_surface_visible: ([$targets[] | select((.kind == "repository" or .kind == "retired-project") and .wiki_url)] | length),
	        wiki_visible: ([$targets[] | select((.kind == "repository" or .kind == "retired-project") and .wiki_url and ((.wiki_evidence_state // "metadata-visible") != "cannot_verify"))] | length),
	        missing_wiki_targets: ([$targets[] | . as $target | select(($target.kind == "repository" or $target.kind == "retired-project") and (($target.wiki_url // "") == "")) | $target.id]),
	        cannot_verify_wiki_targets: ([$targets[] | . as $target | select(($target.kind == "repository" or $target.kind == "retired-project") and .wiki_url and (($target.wiki_evidence_state // "metadata-visible") == "cannot_verify")) | $target.id]),
	        docs_visible: ([$targets[] | select(.docs_url)] | length),
	        mailing_list_visible: ([$targets[] | select(.mailing_list_url)] | length)
	      },
      layers: ($corpus[0].layers // []),
      targets: $targets,
      surfaces: (
        ([$refs[] | surface(("ref-" + .id); ""; .type; .label; .url; .evidence_state; "corpus-source-reference"; (.note // ""))])
        + ([$targets[] | select(.repository_url) | surface(("repo-" + .id); .id; "repository"; (.label + " repository"); .repository_url; .evidence_state; "corpus-target"; (.notes // ""))])
        + ([$targets[] | select(.project_url) | surface(("site-" + .id); .id; "project-site"; (.label + " project site"); .project_url; "metadata-visible"; "corpus-target"; (.notes // ""))])
        + ([$targets[] | select(.reference_url) | surface(("ref-target-" + .id); .id; .kind; .label; .reference_url; .evidence_state; "corpus-target"; (.notes // ""))])
        + ([$targets[] | select(.tracker_url) | surface(("tracker-" + .id); .id; "issue-tracker"; (.label + " tracker"); .tracker_url; "metadata-visible"; "corpus-target"; (.notes // ""))])
	        + ([$targets[] | select(.wiki_url) | surface(("wiki-" + .id); .id; "wiki"; (.label + " wiki"); .wiki_url; (.wiki_evidence_state // "metadata-visible"); "corpus-target"; (.wiki_note // .notes // ""))])
        + ([$targets[] | select(.docs_url) | surface(("docs-" + .id); .id; "documentation"; (.label + " docs"); .docs_url; "metadata-visible"; "corpus-target"; (.notes // ""))])
        + ([$targets[] | select(.mailing_list_url) | surface(("list-" + .id); .id; "mailing-list"; (.label + " mailing lists"); .mailing_list_url; "metadata-visible"; "corpus-target"; (.notes // ""))])
      ),
      gaps: []
    }
  ' >"$OUT"
else
  jq -n \
    --slurpfile repos "$repo_file" \
    --arg generated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --arg target_root "$TARGET_ROOT" '
    {
      schema_version: "0.1.0",
      generated_at: $generated_at,
      target_root: $target_root,
      corpus: null,
      coverage: {
        repo_count: (($repos[0] // []) | length),
        target_count: (($repos[0] // []) | length),
        source_reference_count: 0,
        surface_count: (($repos[0] // []) | length),
        targets_by_kind: {repository: (($repos[0] // []) | length)},
	        targets_by_lifecycle: {unknown: (($repos[0] // []) | length)},
	        source_repo_targets: (($repos[0] // []) | length),
	        source_repos_visible: (($repos[0] // []) | length),
	        missing_source_targets: [],
	        extra_on_disk_repos: [],
	        tracker_targets: 0,
	        tracker_visible: 0,
	        missing_tracker_targets: [],
	        wiki_targets: 0,
	        wiki_surface_visible: 0,
	        wiki_visible: 0,
	        missing_wiki_targets: [],
	        cannot_verify_wiki_targets: [],
	        docs_visible: 0,
	        mailing_list_visible: 0
	      },
      layers: [],
      targets: [($repos[0] // [])[] | {id:.id, label:(.name // .id), kind:"repository", lifecycle:"unknown", role:"local-repo", evidence_state:"source-visible", path:.path}],
      surfaces: [($repos[0] // [])[] | {id:("repo-" + .id), target_id:.id, kind:"repository", label:(.name // .id), url:"", evidence_state:"source-visible", source:"repos-json", note:.path}],
      gaps: [{id:"atlas-no-corpus-manifest", surface:"atlas", status:"not_assessed", summary:"No corpus manifest was supplied; atlas includes local repositories only."}]
    }
  ' >"$OUT"
fi

echo "atlas-surfaces: $OUT" >&2
