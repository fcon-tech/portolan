#!/usr/bin/env bash
# Smoke coverage for evidence-promotion atlas semantics.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
FIX=$(mktemp -d)
trap 'rm -rf "$FIX"' EXIT

if grep -E 'build-evidence-promotion-atlas\.sh.*\|\|[[:space:]]*true' "$ROOT/scripts/build-portolan-bundle.sh" >/dev/null; then
  echo "build-portolan-bundle.sh must not swallow evidence-promotion atlas failures" >&2
  exit 1
fi

TARGET="$FIX/target"
BUNDLE="$FIX/bundle"
mkdir -p \
  "$TARGET/src" \
  "$TARGET/docs" \
  "$TARGET/config" \
  "$TARGET/deploy/helm" \
  "$TARGET/.github/workflows" \
  "$TARGET/catalog" \
  "$TARGET/fixtures" \
  "$TARGET/ignored-artifacts" \
  "$BUNDLE/producers/syft" \
  "$BUNDLE/producers/jscpd/repo" \
  "$BUNDLE/producers/semgrep" \
  "$BUNDLE/producers/deployment-model" \
  "$BUNDLE/producers/catalog" \
  "$BUNDLE/producers/runtime" \
  "$BUNDLE/producers/semantic-index" \
  "$BUNDLE/producers/ctags/repo"

cat >"$TARGET/src/app.go" <<'GO'
package main

func Run() {}
GO
cat >"$TARGET/src/worker.go" <<'GO'
package main

func Work() {}
GO
cat >"$TARGET/.gitignore" <<'GITIGNORE'
ignored-artifacts/
GITIGNORE
cat >"$TARGET/ignored-artifacts/ignored.js" <<'JS'
export const ignored = true
JS
cat >"$TARGET/docs/README.md" <<'MD'
# Synthetic fixture
MD
cat >"$TARGET/package.json" <<'JSON'
{"name":"synthetic","dependencies":{"left-pad":"1.3.0"}}
JSON
cat >"$TARGET/config/app.yaml" <<'YAML'
port: 8080
YAML
cat >"$TARGET/config/secret-refs.env" <<'ENV'
API_TOKEN=
ENV
cat >"$TARGET/deploy/helm/values.yaml" <<'YAML'
service:
  port: 8080
YAML
cat >"$TARGET/.github/workflows/ci.yml" <<'YAML'
name: ci
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo ok
YAML
cat >"$TARGET/catalog/openapi.yaml" <<'YAML'
openapi: 3.0.0
info:
  title: Synthetic
  version: 1.0.0
paths: {}
YAML
cat >"$TARGET/fixtures/generated.json" <<'JSON'
{"rows":[1,2,3]}
JSON
(cd "$TARGET" && git init -q && git add .)

cat >"$BUNDLE/producers/syft/cyclonedx.json" <<'JSON'
{"components":[{"name":"left-pad","bom-ref":"pkg:npm/left-pad@1.3.0"}],"dependencies":[{"ref":"pkg:npm/left-pad@1.3.0","dependsOn":[]}]}
JSON
cat >"$BUNDLE/producers/jscpd/repo/jscpd-report.json" <<'JSON'
{"duplicates":[{"firstFile":{"name":"src/app.go","start":1},"secondFile":{"name":"fixtures/generated.json","start":1},"lines":3}]}
JSON
cat >"$BUNDLE/producers/semgrep/results.json" <<'JSON'
{"results":[{"path":"src/app.go","check_id":"synthetic.rule","extra":{"severity":"INFO"},"start":{"line":3}}]}
JSON
cat >"$BUNDLE/producers/deployment-model/compose.json" <<'JSON'
{"services":{"api":{"image":"synthetic:latest"}}}
JSON
cat >"$BUNDLE/producers/catalog/openapi.json" <<'JSON'
{"openapi":"3.0.0","info":{"title":"Synthetic","version":"1.0.0"},"paths":{},"unresolved_relations":["service:missing-api"]}
JSON
cat >"$BUNDLE/producers/catalog/catalog-relations.jsonl" <<'JSONL'
{"id":"catalog-jsonl","unresolved_relations":["component:missing-worker"]}
JSONL
truncate -s 105M "$BUNDLE/producers/semantic-index/large.jsonl"
for i in 1 2 3 4 5 6; do
  truncate -s 90M "$BUNDLE/producers/semantic-index/family-part-$i.jsonl"
done
cat >"$BUNDLE/producers/runtime/observations.jsonl" <<'JSONL'
{"id":"runtime-service-api","service":"api","status":"observed"}
JSONL
cat >"$BUNDLE/producers/semantic-index/scip.jsonl" <<'JSONL'
{"id":"semantic-call-1","fact_kind":"call","path":"src/app.go","producer_ref":"scip.jsonl"}
JSONL
cat >"$BUNDLE/producers/ctags/repo/tags.json" <<'JSON'
[{"_type":"tag","name":"Run","path":"src/app.go","kind":"function","line":3}]
JSON
cat >"$BUNDLE/claims.jsonl" <<'JSONL'
{"id":"claim-1","claim_tier":"analytical","statement":"Synthetic API exists.","subject":"repo:synthetic","cited_refs":["source:src/app.go"],"agent":"fixture","imported_at":"2026-06-22T00:00:00Z"}
JSONL

"$ROOT/scripts/build-portolan-bundle.sh" "$TARGET" "$BUNDLE" >/dev/null
cat >>"$BUNDLE/symbol-index.jsonl" <<'JSONL'
{"repo_id":"synthetic","path":"src/app.go","name":"BadState","kind":"function","line":3,"evidence_state":"invalid-state"}
JSONL
"$ROOT/scripts/build-evidence-promotion-atlas.sh" "$BUNDLE" "$TARGET" >/dev/null
"$ROOT/scripts/validate-evidence-promotion-atlas.sh" "$BUNDLE" --completion >/dev/null

if jq -e 'select(.path | contains("ignored-artifacts"))' "$BUNDLE/classified-sources.jsonl" >/dev/null; then
  echo "ignored file was classified" >&2
  exit 1
fi
if jq -e 'select((.path // "") | contains("ignored-artifacts"))' "$BUNDLE/promoted-facts.jsonl" >/dev/null; then
  echo "ignored file was promoted" >&2
  exit 1
fi
jq -e 'select((.path | endswith("/package.json")) and .source_role == "build_metadata")' \
  "$BUNDLE/classified-sources.jsonl" >/dev/null
jq -e 'select((.path | endswith("/config/secret-refs.env")) and .source_role == "secret_reference_surface")' \
  "$BUNDLE/classified-sources.jsonl" >/dev/null
jq -e 'select(.family == "documentation" and .status == "raw_available_only")' \
  "$BUNDLE/promotion-health.jsonl" >/dev/null
"$ROOT/scripts/portolan-bundle-query.sh" promotion-health --bundle "$BUNDLE" --limit 20 \
  | jq -e '.records | length >= 15 and all(.[]; .stratum == "promotion_health")' >/dev/null
"$ROOT/scripts/portolan-bundle-query.sh" promoted-facts --bundle "$BUNDLE" --limit 20 \
  | jq -e '.records | length >= 1 and all(.[]; .promotion_basis and .resolution_limit)' >/dev/null
"$ROOT/scripts/portolan-bundle-query.sh" promoted-facts --bundle "$BUNDLE" --limit 50 \
  | jq -e '.records[] | select(.family == "source_code" and .fact_kind == "source_role")' >/dev/null
jq -e '
  .schema_version == "0.1.0" and
  .sample_limit >= 20 and
  (.artifacts["promoted-facts.jsonl"].queries["family=source_code"].total >= 1) and
  (.artifacts["promoted-facts.jsonl"].queries["family=source_code"].records | length >= 1) and
  (.artifacts["classified-sources.jsonl"].queries["family=source_code"].total >= 1)
' "$BUNDLE/promotion-query-index.json" >/dev/null
"$ROOT/scripts/portolan-bundle-query.sh" promoted-facts --bundle "$BUNDLE" --family source_code --limit 20 \
  | jq -e '
      (.records | length >= 1) and
      .total_records_relation == "exact" and
      (.warnings | length == 0)
    ' >/dev/null
jq -e 'select(.family == "symbol_index" and .name == "BadState" and .evidence_state == "metadata-visible")' \
  "$BUNDLE/promoted-facts.jsonl" >/dev/null
"$ROOT/scripts/portolan-bundle-query.sh" raw-artifacts --bundle "$BUNDLE" --limit 20 \
  | jq -e '.records | length >= 1 and all(.[]; .payload.expansion_mode)' >/dev/null
jq -e '.promotion_health.statuses.oversized >= 1' "$BUNDLE/manifest.json" >/dev/null
jq -e 'select(.id == "promotion-health-oversized-family-semantic_index" and .status == "oversized" and .observed_count >= 524288000)' \
  "$BUNDLE/promotion-health.jsonl" >/dev/null
jq -e 'select(.family == "catalog_descriptor" and .status == "cannot_verify")' "$BUNDLE/promotion-health.jsonl" >/dev/null
jq -e 'select(.family == "catalog_descriptor" and .status == "cannot_verify" and .producer_ref == "producers/catalog/catalog-relations.jsonl")' \
  "$BUNDLE/promotion-health.jsonl" >/dev/null

tmp_manifest=$(mktemp)
jq '.source_snapshot_at = "2999-01-01T00:00:00.000Z" | .discovered_file_count = 99' \
  "$BUNDLE/manifest.json" >"$tmp_manifest"
mv "$tmp_manifest" "$BUNDLE/manifest.json"
"$ROOT/scripts/build-evidence-promotion-atlas.sh" "$BUNDLE" "$TARGET" >/dev/null
"$ROOT/scripts/validate-evidence-promotion-atlas.sh" "$BUNDLE" --completion >/dev/null
jq -e '.promotion_health.statuses.stale >= 1 and .promotion_health.statuses.inventory_mismatch >= 1' \
  "$BUNDLE/manifest.json" >/dev/null
jq -e 'select(.family == "source_code" and .status == "inventory_mismatch" and .discovered_file_count == 99)' \
  "$BUNDLE/promotion-health.jsonl" >/dev/null

SOURCE_TRUNC="$FIX/source-truncated"
cp -a "$BUNDLE" "$SOURCE_TRUNC"
PORTOLAN_EVIDENCE_SOURCE_CLASSIFICATION_LIMIT=3 \
  "$ROOT/scripts/build-evidence-promotion-atlas.sh" "$SOURCE_TRUNC" "$TARGET" >/dev/null
jq -e 'select(.id | startswith("promotion-health-source-code-inventory-truncated-")) | select(.status == "non_exhaustive")' \
  "$SOURCE_TRUNC/promotion-health.jsonl" >/dev/null

PROMO_TRUNC="$FIX/promotion-truncated"
cp -a "$BUNDLE" "$PROMO_TRUNC"
PORTOLAN_EVIDENCE_PROMOTED_FACT_LIMIT=1 \
  "$ROOT/scripts/build-evidence-promotion-atlas.sh" "$PROMO_TRUNC" "$TARGET" >/dev/null
jq -e 'select(.id == "promotion-health-source-code-promoted-facts-truncated" and .status == "non_exhaustive")' \
  "$PROMO_TRUNC/promotion-health.jsonl" >/dev/null

BAD_CLAIMS="$FIX/bad-claims.jsonl"
cat >"$BAD_CLAIMS" <<'JSONL'
{"id":"claim-bad","claim_tier":"analytical","statement":"Bogus claim.","subject":"landscape","cited_refs":["hotspot:does-not-exist"],"agent":"fixture"}
JSONL
"$ROOT/scripts/import-analysis-claims.sh" "$BUNDLE" "$BAD_CLAIMS" >/dev/null 2>&1 || true
jq -e '.rejected[] | select(.id == "claim-bad") | .reason | test("hotspot:does-not-exist")' \
  "$BUNDLE/claims-import-report.json" >/dev/null

BROKEN="$FIX/broken"
cp -a "$BUNDLE" "$BROKEN"
jq -c 'select(.family != "semantic_index")' "$BUNDLE/promotion-health.jsonl" >"$BROKEN/promotion-health.jsonl"
if "$ROOT/scripts/validate-evidence-promotion-atlas.sh" "$BROKEN" --completion >/dev/null 2>&1; then
  echo "expected completion validation to fail when canonical family health is missing" >&2
  exit 1
fi

BAD_STATUS="$FIX/bad-status"
cp -a "$BUNDLE" "$BAD_STATUS"
jq -c 'if .id == "promotion-health-source_code" then .status = "bogus_status" else . end' \
  "$BUNDLE/promotion-health.jsonl" >"$BAD_STATUS/promotion-health.jsonl"
if "$ROOT/scripts/validate-evidence-promotion-atlas.sh" "$BAD_STATUS" >/dev/null 2>&1; then
  echo "expected validation to fail when health status is invalid" >&2
  exit 1
fi

NOT_INTEGRATED="$FIX/not-integrated"
cp -a "$BUNDLE" "$NOT_INTEGRATED"
jq -c 'if .id == "promotion-health-semantic_index" then .status = "not_integrated" else . end' \
  "$BUNDLE/promotion-health.jsonl" >"$NOT_INTEGRATED/promotion-health.jsonl"
if "$ROOT/scripts/validate-evidence-promotion-atlas.sh" "$NOT_INTEGRATED" --completion >/dev/null 2>&1; then
  echo "expected completion validation to fail when a canonical family is not_integrated" >&2
  exit 1
fi

echo "harness-evidence-promotion-atlas-smoke: ok"
