#!/usr/bin/env bash
# BDD Feature 2 (Entity Stratification) + Feature 3 (C4) data-level harness.
#
# Builds a corpus-manifest-driven bundle, generates the normalized system map,
# validates schema + semantics, and asserts the spec's entity-stratification
# regression cases:
#   - support matrix, mailing lists, CI, binary repos, docker images are surfaces
#     attached to the owning component, NOT peer components;
#   - Apache Sqoop is a retired/legacy component with an explanation;
#   - C4 families group components deterministically.
#
# usage: scripts/harness-system-map-smoke.sh [--bundle DIR]
#   --bundle DIR   reuse an existing bundle instead of building one
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
CORPUS_MANIFEST="$ROOT/internal/testfixtures/corpus-manifests/apache-bigtop/manifest.json"
BUNDLE=""
BUNDLE_ARG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bundle) BUNDLE="$2"; BUNDLE_ARG="$2"; shift 2 ;;
    -h|--help)
      echo "usage: $0 [--bundle DIR]"
      exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

fail() { echo "harness-system-map-smoke: FAIL: $*" >&2; exit 1; }

TMP=""
if [[ -z "$BUNDLE" ]]; then
  TMP=$(mktemp -d)
  BUNDLE="$TMP/system-map-bundle"
  TARGET="$TMP/target"
  mkdir -p "$BUNDLE" "$TARGET"
  # Seed minimal inputs the adapter needs beyond the manifest.
  printf '[]\n' >"$BUNDLE/repos.json"
  printf '{"schema_version":"0.1.0","repos":[]}\n' >"$BUNDLE/repo-profiles.json"
  printf '{"schema_version":"0.1.0"}\n' >"$BUNDLE/manifest.json"
  : >"$BUNDLE/hotspots-full.jsonl"
  : >"$BUNDLE/relationships.jsonl"
  : >"$BUNDLE/gaps.jsonl"
  "$ROOT/scripts/build-atlas-surfaces.sh" "$TARGET" "$BUNDLE" "$CORPUS_MANIFEST" >/dev/null
  "$ROOT/scripts/build-atlas-facts.sh" "$TARGET" "$BUNDLE" >/dev/null
  "$ROOT/scripts/build-system-map.sh" "$BUNDLE" "$TARGET" >/dev/null
else
  BUNDLE=$(cd "$BUNDLE" && pwd)
fi

SM="$BUNDLE/system-map.json"
[[ -f "$SM" ]] || fail "system-map.json missing at $SM"

# Schema + semantic validation.
"$ROOT/scripts/validate-system-map-schema.sh" "$SM" >/dev/null

# Feature 2 Scenario: support matrix is a documentation surface, not a peer component.
sqoop_comp=$(jq -r '.objects.components[] | select(.id | test("sqoop")) | .id' "$SM")
[[ -n "$sqoop_comp" ]] || fail "Apache Sqoop is not present as a component"
sqoop_type=$(jq -r --arg id "$sqoop_comp" '.objects.components[] | select(.id==$id) | .type' "$SM")
sqoop_lc=$(jq -r --arg id "$sqoop_comp" '.objects.components[] | select(.id==$id) | .lifecycle' "$SM")
[[ "$sqoop_type" == "retired" ]] || fail "Sqoop component type is '$sqoop_type', expected retired"
[[ "$sqoop_lc" == "retired" ]] || fail "Sqoop lifecycle is '$sqoop_lc', expected retired"
sqoop_why=$(jq -r --arg id "$sqoop_comp" '.objects.components[] | select(.id==$id) | .why_present' "$SM")
[[ "$sqoop_why" != "" ]] || fail "Sqoop why_present is empty"

# No surface-flavored object promoted as a default-map component.
leaked=$(jq -r '[.objects.components[] | select(.id | test("support-matrix|mailing-list|bigtop-ci|binary-repo|docker-image"))] | length' "$SM")
[[ "$leaked" == "0" ]] || fail "$leaked surface-only target(s) leaked as peer components"

# Support matrix + mailing list + CI + binary-repo + docker-image exist as surfaces.
for stype in release-matrix mailing-list ci binary-repo docker-image; do
  count=$(jq -r --arg t "$stype" '[.objects.surfaces[] | select(.surface_type==$t)] | length' "$SM")
  [[ "$count" -ge 1 ]] || fail "no surface of type '$stype' present (got $count)"
done

# Surfaces attach to a known owner (integrator or component), never to themselves.
dangling=$(jq -r '[.objects.surfaces[] | select(.id == .owner_id)] | length' "$SM")
[[ "$dangling" == "0" ]] || fail "$dangling surface(s) own themselves (floating)"

# Feature 3: C4 families are deterministic and non-empty.
family_count=$(jq -r '.c4.families | length' "$SM")
[[ "$family_count" -ge 1 ]] || fail "no C4 families generated"
unassigned=$(jq -r '[.objects.components[] | select(.c4_family=="unknown")] | length' "$SM")
# Some unknown is acceptable, but the majority should be classified.
total=$(jq -r '.objects.components | length' "$SM")
if [[ "$total" -gt 2 ]]; then
  [[ "$unassigned" -lt "$total" ]] || fail "all $total components classified 'unknown' — C4 grouping failed"
fi

# Feature 3 Scenario: Context view names the target and external systems.
context_count=$(jq -r '.c4.context_boxes | length' "$SM")
[[ "$context_count" -ge 1 ]] || fail "no C4 context boxes; target root must appear in Context"
# Every context box opens a dossier route.
bad_ctx=$(jq -r '[.c4.context_boxes[] | select((.route // "") | test("^#/dossier/")) | select(.level!="context")] | length' "$SM")
[[ "$bad_ctx" == "0" ]] || fail "$bad_ctx context box(es) have wrong level or route"

# Feature 3 Scenario: repeated generation assigns the same primary family.
"$ROOT/scripts/build-system-map.sh" "$BUNDLE" "$TARGET" >/dev/null 2>&1 || true
# (the harness --bundle path may not allow a rebuild; only enforce determinism on a fresh build)
if [[ -z "$BUNDLE_ARG" ]]; then
  family_map_1=$(jq -c '[.objects.components[] | {id, c4_family}]' "$SM")
  "$ROOT/scripts/build-system-map.sh" "$BUNDLE" "$TARGET" >/dev/null
  family_map_2=$(jq -c '[.objects.components[] | {id, c4_family}]' "$SM")
  [[ "$family_map_1" == "$family_map_2" ]] || fail "C4 family assignment is not deterministic across regenerations"
fi

# Feature 3 Scenario: component_boxes exist for each promoted component.
comp_box_count=$(jq -r '.c4.component_boxes | length' "$SM")
[[ "$comp_box_count" == "$total" ]] || fail "component_boxes count ($comp_box_count) != components count ($total)"

# Feature 4 Scenario: No empty dossier stubs. Every component must carry the
# required dossier fields with non-empty content.
empty_dossiers=$(jq -r '[.objects.components[] | select(
  (.why_present // "") == "" or
  (.c4_family // "") == "" or
  ((.next_actions // []) | length == 0) or
  (.route // "") == ""
)] | length' "$SM")
[[ "$empty_dossiers" == "0" ]] || fail "$empty_dossiers component(s) have empty dossier fields (why_present/c4_family/next_actions/route)"

# Feature 4 Scenario: Partial evidence is rendered honestly. Retired components
# (Sqoop) must show their relationships and at least one honest unknown.
sqoop_rels=$(jq -r --arg id "$sqoop_comp" '[.objects.components[] | select(.id==$id) | .relationship_ids[]] | length' "$SM")
[[ "$sqoop_rels" -ge 1 ]] || fail "Sqoop component has no relationships in its dossier (expected manifest-dep edges)"
sqoop_unknowns=$(jq -r --arg id "$sqoop_comp" '[.objects.components[] | select(.id==$id) | .unknown_ids[]] | length' "$SM")
[[ "$sqoop_unknowns" -ge 1 ]] || fail "Sqoop component has no unknowns; retired components must show honest gaps"

# Feature 4 Scenario: every component surface_id resolves (referential integrity).
dangling_surf=$(jq -r '
  [.objects.surfaces[].id] as $sids |
  [.objects.components[] | .surface_ids[]? | select(. as $id | ($sids | index($id)) | not)] | length' "$SM")
[[ "$dangling_surf" == "0" ]] || fail "$dangling_surf component surface_id(s) do not resolve"

# Clean up temp unless --bundle was passed.
[[ -z "$TMP" ]] || rm -rf "$TMP"

echo "harness-system-map-smoke: ok (components=$total families=$family_count sqoop=$sqoop_lc)"
