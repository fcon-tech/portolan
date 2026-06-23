#!/usr/bin/env bash
# Cross-repo relationships producer: internal depends-on edges,
# shared external dependencies (syft SBOM intersection), cross-repo duplication
# edges (opt-in jscpd-cross pass). Reads repos.json + repo-profiles.json +
# producers/. Writes relationships.jsonl. Read-only; single repo -> empty file.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 <target-root> <bundle-dir>" >&2
  exit 2
fi

TARGET_ROOT=$(cd "$1" && pwd)
BUNDLE_DIR=$2
REPOS_JSON="$BUNDLE_DIR/repos.json"
PROFILES_JSON="$BUNDLE_DIR/repo-profiles.json"
PRODUCERS_DIR="$BUNDLE_DIR/producers"
OUT="$BUNDLE_DIR/relationships.jsonl"
SHARED_DEP_TOP="${PORTOLAN_SHARED_DEP_TOP:-30}"
DUP_PAIR_SAMPLES=5

command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }
[[ -f "$REPOS_JSON" ]] || { echo "repos.json missing in $BUNDLE_DIR" >&2; exit 1; }

hash_text() {
  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s' "$1" | sha256sum | cut -d' ' -f1
  elif command -v shasum >/dev/null 2>&1; then
    printf '%s' "$1" | shasum -a 256 | cut -d' ' -f1
  else
    echo "sha256sum or shasum required" >&2
    exit 1
  fi
}

repo_count=$(jq 'length' "$REPOS_JSON")
: >"$OUT"
if [[ "$repo_count" -lt 2 ]]; then
  echo "relationships: single repo landscape; no cross-repo edges" >&2
  exit 0
fi

edges_tmp=$(mktemp)
: >"$edges_tmp"

# --- internal depends-on: declared_deps(A) x module_ids(B) ---
if [[ -f "$PROFILES_JSON" ]]; then
  jq -c '
    .repos as $repos |
    [ $repos[] | {id, deps: (.declared_deps // [])} ] as $deps |
    [ $repos[] | {id, mods: (.module_ids // [])} ] as $mods |
    [
      $deps[] as $a |
      $mods[] as $b |
      select($a.id != $b.id) |
      (($a.deps - ($a.deps - $b.mods))) as $matched |
      select(($matched | length) > 0) |
      {from: $a.id, to: $b.id, matched: $matched}
    ][]
  ' "$PROFILES_JSON" 2>/dev/null | while IFS= read -r edge; do
    from=$(jq -r '.from' <<<"$edge")
    to=$(jq -r '.to' <<<"$edge")
    id="rel-dep-$(hash_text "${from}->${to}" | cut -c1-12)"
    jq -nc --arg id "$id" --arg from "$from" --arg to "$to" \
      --argjson matched "$(jq -c '.matched' <<<"$edge")" \
      '{id:$id,type:"depends-on",from_repo:$from,to_repo:$to,
        summary:("Repo " + $from + " declares dependency on module(s) of " + $to),
        detail:{matched_modules:$matched},
        evidence_state:"metadata-visible",producer:"scan-cross-repo",
        producer_ref:"repo-profiles.json"}' >>"$edges_tmp"
  done

  # --- compose image referencing another repo by name/module id ---
  jq -c '
    .repos as $repos |
    [ $repos[] | {id, names: ([.name] + (.module_ids // []))} ] as $names |
    [
      $repos[] as $r |
      ($r.purpose.compose // [])[] as $cf |
      ($cf.services // [])[] as $svc |
      select($svc.image != null) |
      ($svc.image | split(":")[0] | split("/") | last) as $img |
      $names[] |
      select(.id != $r.id) |
      select((.names | map(ascii_downcase) | index($img | ascii_downcase)) != null) |
      {from: $r.id, to: .id, file: $cf.file, service: $svc.name, image: $svc.image}
    ][]
  ' "$PROFILES_JSON" 2>/dev/null | while IFS= read -r edge; do
    from=$(jq -r '.from' <<<"$edge")
    to=$(jq -r '.to' <<<"$edge")
    svc=$(jq -r '.service' <<<"$edge")
    id="rel-img-$(hash_text "${from}->${to}:${svc}" | cut -c1-12)"
    jq -nc --arg id "$id" --argjson e "$edge" \
      '{id:$id,type:"uses-image",from_repo:$e.from,to_repo:$e.to,
        summary:("Compose service " + $e.service + " in " + $e.from + " uses image matching repo " + $e.to),
        detail:{file:$e.file,service:$e.service,image:$e.image},
        evidence_state:"metadata-visible",producer:"scan-cross-repo",
        producer_ref:"repo-profiles.json"}' >>"$edges_tmp"
  done
fi

# --- shared external dependencies from syft SBOMs (slug filename = repo id) ---
sbom_components=$(mktemp)
: >"$sbom_components"
while IFS= read -r sbom; do
  [[ -f "$sbom" ]] || continue
  jq -e '.components' "$sbom" >/dev/null 2>&1 || continue
  slug=$(basename "$sbom" | sed 's/-cyclonedx\.json$//;s/\.json$//;s/^cyclonedx$//')
  [[ -z "$slug" ]] && continue
  jq -r --arg repo "$slug" --arg ref "$sbom" '
    .components[]? | select(.name != null) |
    [$repo, .name, (.["bom-ref"] // .purl // .name), $ref] | @tsv
  ' "$sbom" >>"$sbom_components" 2>/dev/null || true
done < <(find "$PRODUCERS_DIR/syft" -type f -name '*.json' 2>/dev/null)

if [[ -s "$sbom_components" ]]; then
  known_ids=$(jq -c '[.[].id]' "$REPOS_JSON")
  sort -u "$sbom_components" | awk -F'\t' '{print $1 "\t" $2 "\t" $4}' | sort -u |
    jq -Rsc --argjson known "$known_ids" --argjson top "$SHARED_DEP_TOP" '
      split("\n") | map(select(length > 0) | split("\t") | {repo: .[0], name: .[1], ref: .[2]}) |
      map(select(.repo as $r | $known | index($r))) |
      group_by(.name) |
      map({name: .[0].name, repos: ([.[].repo] | unique), ref: .[0].ref}) |
      map(select((.repos | length) >= 2)) |
      sort_by([-(.repos | length), .name]) |
      .[0:$top][]
    ' 2>/dev/null | while IFS= read -r comp; do
    name=$(jq -r '.name' <<<"$comp")
    id="rel-shared-$(hash_text "$name" | cut -c1-12)"
    jq -nc --arg id "$id" --argjson c "$comp" \
      '{id:$id,type:"shared-dependency",from_repo:null,to_repo:null,
        repos:$c.repos,
        summary:("Shared dependency " + $c.name + " (" + ($c.repos | length | tostring) + " repos)"),
        detail:{component:$c.name},
        evidence_state:"metadata-visible",producer:"syft",
        producer_ref:$c.ref}' >>"$edges_tmp"
  done
fi
rm -f "$sbom_components"

# --- cross-repo duplication pairs from opt-in jscpd-cross pass ---
while IFS= read -r jfile; do
  [[ -f "$jfile" ]] || continue
  jq -e '.duplicates' "$jfile" >/dev/null 2>&1 || continue
  jq -c --slurpfile repos "$REPOS_JSON" --arg ref "$jfile" '
    def repo_of($p):
      [ $repos[0][] | . as $r | select($p == $r.path or ($p | startswith($r.path + "/"))) ]
      | sort_by(-(.path | length)) | (.[0].id // null);
    [
      .duplicates[]? |
      select(.firstFile.name != null and .secondFile.name != null) |
      {a: .firstFile.name, b: .secondFile.name, lines: (.lines // 0)} |
      (repo_of(.a)) as $ra | (repo_of(.b)) as $rb |
      select($ra != null and $rb != null and $ra != $rb) |
      {pair: ([$ra, $rb] | sort), a: .a, b: .b, lines}
    ] |
    group_by(.pair) |
    map({
      from: .[0].pair[0], to: .[0].pair[1],
      clone_count: length,
      total_lines: (map(.lines) | add),
      samples: (.[0:'"$DUP_PAIR_SAMPLES"'] | map({first: .a, second: .b, lines}))
    })[]
  ' "$jfile" 2>/dev/null | while IFS= read -r pair; do
    from=$(jq -r '.from' <<<"$pair")
    to=$(jq -r '.to' <<<"$pair")
    id="rel-xdup-$(hash_text "${from}<->${to}" | cut -c1-12)"
    jq -nc --arg id "$id" --argjson p "$pair" --arg ref "$jfile" \
      '{id:$id,type:"cross-repo-duplication",from_repo:$p.from,to_repo:$p.to,
        summary:("Cross-repo duplication: " + ($p.clone_count | tostring) + " clone pair(s), ~" + ($p.total_lines | tostring) + " lines between " + $p.from + " and " + $p.to),
        detail:{clone_count:$p.clone_count,total_lines:$p.total_lines,samples:$p.samples},
        evidence_state:"metadata-visible",producer:"jscpd",
        producer_ref:$ref}' >>"$edges_tmp"
  done
done < <(find "$PRODUCERS_DIR/jscpd-cross" -type f -name '*.json' ! -name '_scan.json' 2>/dev/null)

# stable order: type, then from/repos; dedup by id (multiple producer report
# files for the same pair must not emit ambiguous duplicate edges)
if [[ -s "$edges_tmp" ]]; then
  jq -sc 'unique_by(.id) | sort_by([.type, (.from_repo // ""), (.to_repo // ""), .id])[]' "$edges_tmp" >"$OUT"
fi
rm -f "$edges_tmp"

echo "relationships: $(wc -l <"$OUT" | tr -d ' ') edges -> $OUT" >&2
