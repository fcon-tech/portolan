#!/usr/bin/env bash
# Smoke test for portolan-bundle-query.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
FIXTURE_TARGET="$ROOT/internal/testfixtures/portolan-bundle/target"
FIXTURE_BUNDLE=$(mktemp -d)
MULTI_FIX=""
trap 'rm -rf "$FIXTURE_BUNDLE" "${MULTI_FIX:-}"' EXIT

mkdir -p "$FIXTURE_BUNDLE/producers"
cp -a "$ROOT/internal/testfixtures/portolan-bundle/producers/." "$FIXTURE_BUNDLE/producers/"
"$ROOT/scripts/build-portolan-bundle.sh" "$FIXTURE_TARGET" "$FIXTURE_BUNDLE"

Q="$ROOT/scripts/portolan-bundle-query.sh"

"$Q" hotspots --bundle "$FIXTURE_BUNDLE" --kind duplication --limit 5 \
  | jq -e '.schema_version and (.records | length) >= 1' >/dev/null

"$Q" gaps --bundle "$FIXTURE_BUNDLE" --limit 5 \
  | jq -e '.schema_version and (.records | type == "array")' >/dev/null

"$Q" landscape --bundle "$FIXTURE_BUNDLE" \
  | jq -e '.records | length >= 1' >/dev/null

"$Q" source --bundle "$FIXTURE_BUNDLE" --path sample.go --line 4 \
  | jq -e '.records[0].payload.lines | length >= 1' >/dev/null
FIXTURE_REPO=$(jq -r '.[0].id' "$FIXTURE_BUNDLE/repos.json")
"$Q" selected-code --bundle "$FIXTURE_BUNDLE" --repo "$FIXTURE_REPO" --path sample.go --line 4 --limit 5 \
  | jq -e '
      .query.family == "selected-code" and
      (.records | length == 1) and
      .records[0].selection.path == "sample.go" and
      (.records[0].bounded_records.source | length >= 1) and
      (.records[0].bounded_records.repo | length >= 1) and
      (.records[0].bounded_records.component | length >= 1) and
      (.records[0].bounded_records.risks | type == "array") and
      (.records[0].bounded_records.relationships | type == "array") and
      (.records[0].bounded_records.gaps | length >= 1) and
      (.records[0].routes.atlas | contains("view=atlas")) and
      (.records[0].routes.source | contains("/source?")) and
      (.records[0].follow_up_queries | any(.family == "source")) and
      (.records[0].follow_up_queries | any(.family == "relationships")) and
      (.records[0].follow_up_queries | any(.family == "atlas"))
    ' >/dev/null

test -f "$FIXTURE_BUNDLE/search-index.jsonl"
"$Q" search --bundle "$FIXTURE_BUNDLE" --q "func" --limit 5 \
  | jq -e '.records | length >= 1' >/dev/null
"$Q" search --bundle "$FIXTURE_BUNDLE" --q "sample" --limit 1 \
  | jq -e '.total_records_relation == "lower_bound" and (.warnings | any(test("lower bound")))' >/dev/null

test -f "$FIXTURE_BUNDLE/symbol-index.jsonl"
"$Q" symbol --bundle "$FIXTURE_BUNDLE" --name Run --limit 5 \
  | jq -e '.records | length >= 1' >/dev/null

jq empty "$ROOT/harness/contracts/bundle-query-result.schema.json"

trap 'rm -rf "$FIXTURE_BUNDLE" "${MULTI_FIX:-}"' EXIT

# map-bridge sidecar (094)
mkdir -p "$FIXTURE_BUNDLE/map-bridge"
echo '{"id":"ev-1","family":"relationships","summary":"fixture edge","evidence_state":"metadata-visible"}' \
  >"$FIXTURE_BUNDLE/map-bridge/evidence-index.jsonl"
"$Q" evidence-index --bundle "$FIXTURE_BUNDLE" --limit 5 \
  | jq -e '.records | length >= 1' >/dev/null

# repos / relationships families (107)
"$Q" repos --bundle "$FIXTURE_BUNDLE" --limit 5 \
  | jq -e '.records | length >= 1' >/dev/null

# unknown repo filter must return no records (not the whole landscape)
"$Q" hotspots --bundle "$FIXTURE_BUNDLE" --repo no-such-repo --limit 5 \
  | jq -e '(.records | length == 0) and (.warnings | length >= 1)' >/dev/null
# single-repo fixture: empty edge list is a valid clean result (file present, no edges)
"$Q" relationships --bundle "$FIXTURE_BUNDLE" --limit 5 \
  | jq -e '.records | type == "array"' >/dev/null
"$Q" promotion-health --bundle "$FIXTURE_BUNDLE" --limit 20 \
  | jq -e '.records | length >= 15 and all(.[]; .stratum == "promotion_health")' >/dev/null
"$Q" promoted-facts --bundle "$FIXTURE_BUNDLE" --limit 5 \
  | jq -e '.records | type == "array" and all(.[]; has("evidence_layer") and has("promotion_basis"))' >/dev/null
"$Q" raw-artifacts --bundle "$FIXTURE_BUNDLE" --limit 5 \
  | jq -e '.records | type == "array"' >/dev/null
"$Q" classified-sources --bundle "$FIXTURE_BUNDLE" --limit 5 \
  | jq -e '.records | length >= 1 and all(.[]; .stratum == "classified_source")' >/dev/null
"$ROOT/scripts/run-query-eval.sh" --run "$FIXTURE_BUNDLE" >/dev/null
jq -e '
  .scenario == "captain-agent-qna-drilldown" and
  .answer_count == 7 and
  .requirements.captain_questions == 5 and
  .requirements.selected_code_questions == 2 and
  .requirements.raw_large_outputs_read == false and
  .requirements.bounded_query_only == true and
  ([.answers[] | select(.id | startswith("captain-"))] | length == 5) and
  ([.answers[] | select(.id | startswith("selected-"))] | length == 2) and
  (.answers | all(.bounded_queries | all(.command | contains("portolan-bundle-query.sh")))) and
  (.answers | any(.id == "selected-file-context" and (.selected_code.repo_id | length > 0) and (.selected_code.path | length > 0))) and
  (.answers | any(.id == "selected-symbol-context" and (.selected_code.symbol | length > 0))) and
  (.answers | any((.citations | length) > 0)) and
  (.answers | any((.routes | length) > 0))
' "$FIXTURE_BUNDLE/captain-qna-eval.json" >/dev/null

LARGE_QUERY_FIX="$FIXTURE_BUNDLE/large-query-fixture"
mkdir -p "$LARGE_QUERY_FIX"
jq -n '{promoted_fact_count: 5000, raw_artifact_count: 0, classified_source_count: 5000}' \
  >"$LARGE_QUERY_FIX/promotion-summary.json"
for i in $(seq 1 5000); do
  jq -nc --arg id "fact-$i" --arg path "src/file-$i.go" \
    '{id:$id,stratum:"promoted_fact",family:"source_code",fact_kind:"source_role",path:$path,evidence_layer:"derived",promotion_basis:"large fixture",resolution_limit:"bounded fixture"}'
done >"$LARGE_QUERY_FIX/promoted-facts.jsonl"
for i in $(seq 1 5000); do
  jq -nc --arg id "source-$i" --arg path "src/file-$i.go" \
    '{id:$id,stratum:"classified_source",family:"source_code",path:$path,source_role:"source_code",status:"observed"}'
done >"$LARGE_QUERY_FIX/classified-sources.jsonl"
"$Q" promoted-facts --bundle "$LARGE_QUERY_FIX" --limit 20 \
  | jq -e '
      (.records | length == 20) and
      .total_records == 5000 and
      .total_records_relation == "exact" and
      (.warnings | length == 0)
    ' >/dev/null
"$Q" classified-sources --bundle "$LARGE_QUERY_FIX" --limit 20 \
  | jq -e '
      (.records | length == 20) and
      .total_records == 5000 and
      .total_records_relation == "exact" and
      (.warnings | length == 0)
    ' >/dev/null
"$Q" promoted-facts --bundle "$LARGE_QUERY_FIX" --family source_code --limit 20 \
  | jq -e '
      (.records | length == 20) and
      .total_records == 20 and
      .total_records_relation == "lower_bound" and
      (.warnings | any(test("lower bound")))
    ' >/dev/null
"$Q" classified-sources --bundle "$LARGE_QUERY_FIX" --family source_code --limit 20 \
  | jq -e '
      (.records | length == 20) and
      .total_records == 20 and
      .total_records_relation == "lower_bound" and
      (.warnings | any(test("lower bound")))
    ' >/dev/null
PROMOTED_FIXTURE_SIZE=$(wc -c <"$LARGE_QUERY_FIX/promoted-facts.jsonl" | tr -d ' ')
CLASSIFIED_FIXTURE_SIZE=$(wc -c <"$LARGE_QUERY_FIX/classified-sources.jsonl" | tr -d ' ')
jq -n \
  --argjson promoted_size "$PROMOTED_FIXTURE_SIZE" \
  --argjson classified_size "$CLASSIFIED_FIXTURE_SIZE" '
  def promoted($i): {
    id: ("fact-" + ($i|tostring)),
    stratum: "promoted_fact",
    family: "source_code",
    fact_kind: "source_role",
    path: ("src/file-" + ($i|tostring) + ".go"),
    evidence_layer: "derived",
    promotion_basis: "large fixture",
    resolution_limit: "bounded fixture"
  };
  def classified($i): {
    id: ("source-" + ($i|tostring)),
    stratum: "classified_source",
    family: "source_code",
    path: ("src/file-" + ($i|tostring) + ".go"),
    source_role: "source_code",
    status: "observed"
  };
  {
    schema_version: "0.1.0",
    sample_limit: 200,
    artifacts: {
      "promoted-facts.jsonl": {
        total: 5000,
        artifact_stats: {row_count: 5000, size_bytes: $promoted_size},
        queries: {
          "family=source_code": {total: 5000, records: [range(1;201) | promoted(.)]},
          "stratum=promoted_fact": {total: 5000, records: [range(1;201) | promoted(.)]},
          "family=source_code&stratum=promoted_fact": {total: 5000, records: [range(1;201) | promoted(.)]}
        }
      },
      "classified-sources.jsonl": {
        total: 5000,
        artifact_stats: {row_count: 5000, size_bytes: $classified_size},
        queries: {
          "family=source_code": {total: 5000, records: [range(1;201) | classified(.)]},
          "status=observed": {total: 5000, records: [range(1;201) | classified(.)]},
          "stratum=classified_source": {total: 5000, records: [range(1;201) | classified(.)]},
          "family=source_code&status=observed": {total: 5000, records: [range(1;201) | classified(.)]},
          "family=source_code&stratum=classified_source": {total: 5000, records: [range(1;201) | classified(.)]},
          "status=observed&stratum=classified_source": {total: 5000, records: [range(1;201) | classified(.)]},
          "family=source_code&status=observed&stratum=classified_source": {total: 5000, records: [range(1;201) | classified(.)]}
        }
      }
    }
  }
' >"$LARGE_QUERY_FIX/promotion-query-index.json"
"$Q" promoted-facts --bundle "$LARGE_QUERY_FIX" --family source_code --limit 20 \
  | jq -e '
      (.records | length == 20) and
      .total_records == 5000 and
      .total_records_relation == "exact" and
      (.warnings | length == 0)
    ' >/dev/null
"$Q" promoted-facts --bundle "$LARGE_QUERY_FIX" --family no_such_family --limit 20 \
  | jq -e '
      (.records | length == 0) and
      .total_records == 0 and
      .total_records_relation == "exact" and
      (.warnings | length == 0)
    ' >/dev/null
"$Q" classified-sources --bundle "$LARGE_QUERY_FIX" --family source_code --status observed --limit 20 \
  | jq -e '
      (.records | length == 20) and
      .total_records == 5000 and
      .total_records_relation == "exact" and
      (.warnings | length == 0)
    ' >/dev/null
jq -nc '{id:"fact-stale",stratum:"promoted_fact",family:"source_code",fact_kind:"source_role",path:"src/stale.go",evidence_layer:"derived",promotion_basis:"stale fixture",resolution_limit:"bounded fixture"}' \
  >>"$LARGE_QUERY_FIX/promoted-facts.jsonl"
"$Q" promoted-facts --bundle "$LARGE_QUERY_FIX" --family source_code --limit 20 \
  | jq -e '
      (.records | length == 20) and
      .total_records == 20 and
      .total_records_relation == "lower_bound" and
      (.warnings | any(test("lower bound")))
    ' >/dev/null

# source full read (107): whole file with line cap
"$Q" source --bundle "$FIXTURE_BUNDLE" --path sample.go --line 1 --full \
  | jq -e '.records[0].payload | (.startLine == 1) and (.totalLines >= (.lines | length))' >/dev/null

# ast-index import (097)
AST_FIX=$(mktemp)
echo '[{"name":"ImportedSym","path":"sample.go","kind":"function","line":4}]' >"$AST_FIX"
"$ROOT/scripts/import-ast-index.sh" "$AST_FIX" "$FIXTURE_BUNDLE"
"$Q" symbol --bundle "$FIXTURE_BUNDLE" --name ImportedSym --limit 3 \
  | jq -e '.records | length >= 1' >/dev/null
rm -f "$AST_FIX"

MULTI_FIX=$(mktemp -d)
LAND="$MULTI_FIX/land"
MULTI_BUNDLE="$MULTI_FIX/bundle"
mkdir -p "$LAND/service-a/src" "$LAND/service-b/src" "$MULTI_BUNDLE/producers/ctags"
printf '{"name":"service-a","scripts":{"test":"node test.js"}}\n' >"$LAND/service-a/package.json"
printf '{"name":"service-b","scripts":{"test":"node test.js"}}\n' >"$LAND/service-b/package.json"
for svc in service-a service-b; do
  for i in 0 1 2 3 4 5 6; do
    printf 'export function name%s() { return "%s-%s"; }\n' "$i" "$svc" "$i"
  done >"$LAND/$svc/src/index.js"
done
(cd "$LAND/service-a" && git init -q && git add package.json)
(cd "$LAND/service-b" && git init -q && git add package.json)
hash8() {
  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s' "$1" | sha256sum | cut -c1-8
  else
    printf '%s' "$1" | shasum -a 256 | cut -c1-8
  fi
}
slug() {
  printf '%s-%s' "$(basename "$1" | tr ' /' '__')" "$(hash8 "$1")"
}
SLUG_A=$(slug "$LAND/service-a")
SLUG_B=$(slug "$LAND/service-b")
mkdir -p "$MULTI_BUNDLE/producers/ctags/$SLUG_A" "$MULTI_BUNDLE/producers/ctags/$SLUG_B"
for s in "$SLUG_A" "$SLUG_B"; do
  jq -n '[range(0;7) | {_type:"tag", name:("name" + tostring), path:"src/index.js", kind:"function", line:(. + 1)}]' \
    >"$MULTI_BUNDLE/producers/ctags/$s/tags.json"
done
"$ROOT/scripts/build-portolan-bundle.sh" "$LAND" "$MULTI_BUNDLE" >/dev/null
FIRST_REPO=$(jq -r '.[0].id' "$MULTI_BUNDLE/repos.json")
"$Q" hotspots --bundle "$MULTI_BUNDLE" --repo "$FIRST_REPO" --limit 10 \
  | jq -e --arg repo "$FIRST_REPO" '.records | length >= 1 and all(.[]; .repo_id == $repo)' >/dev/null
SECOND_REPO=$(jq -r '.[1].id' "$MULTI_BUNDLE/repos.json")
jq -nc --arg from "$FIRST_REPO" --arg to "$SECOND_REPO" \
  '{id:"rel-claim-smoke",type:"depends-on",from_repo:$from,to_repo:$to,summary:("Repo " + $from + " declares dependency on " + $to),detail:{source:"smoke-fixture"},evidence_state:"metadata-visible",producer:"harness-bundle-query-smoke",producer_ref:"relationships.jsonl"}' \
  >>"$MULTI_BUNDLE/relationships.jsonl"
"$Q" claim-check --bundle "$MULTI_BUNDLE" --from "$FIRST_REPO" --to "$SECOND_REPO" --kind depends-on --limit 5 \
  | jq -e '
      .query.family == "claim-check" and
      .records[0].verdict == "supported" and
      (.records[0].bounded_records.supporting | length >= 1) and
      (.records[0].bounded_records.supporting[0].routes.api | contains("/api/claim-check"))
    ' >/dev/null
"$Q" claim-check --bundle "$MULTI_BUNDLE" --from "$FIRST_REPO" --to no-such-repo --kind depends-on --limit 5 \
  | jq -e '
      .records[0].verdict == "cannot_verify" and
      (.warnings | length >= 1)
    ' >/dev/null
"$Q" symbol --bundle "$MULTI_BUNDLE" --repo "$FIRST_REPO" --name name --limit 20 \
  | jq -e --arg repo "$FIRST_REPO" '(.records | length >= 1) and (.records | all(.[]; .repo_id == $repo)) and (([.records[].id] | length) == ([.records[].id] | unique | length))' >/dev/null
"$Q" search --bundle "$MULTI_BUNDLE" --repo "$FIRST_REPO" --q name --limit 5 \
  | jq -e --arg repo "$FIRST_REPO" '.records | type == "array" and all(.[]; .repo_id == $repo)' >/dev/null
"$Q" source --bundle "$MULTI_BUNDLE" --repo "$FIRST_REPO" --path package.json --line 1 \
  | jq -e '.records | length == 1' >/dev/null
rm -rf "$MULTI_FIX"

echo "harness-bundle-query-smoke: ok"
