#!/usr/bin/env bash
# Smoke test for portolan-bundle-query (spec 095).
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

test -f "$FIXTURE_BUNDLE/search-index.jsonl"
"$Q" search --bundle "$FIXTURE_BUNDLE" --q "func" --limit 5 \
  | jq -e '.records | length >= 1' >/dev/null

test -f "$FIXTURE_BUNDLE/symbol-index.jsonl"
"$Q" symbol --bundle "$FIXTURE_BUNDLE" --name Run --limit 5 \
  | jq -e '.records | length >= 1' >/dev/null

jq empty "$ROOT/harness/contracts/bundle-query-result.schema.json"

# HTTP parity via serve.js
cd "$ROOT/viewer"
node scripts/build-static.js
PORT=4179
node scripts/serve.js --bundle "$FIXTURE_BUNDLE" --port "$PORT" &
PID=$!
trap 'kill "${PID:-}" 2>/dev/null || true; rm -rf "$FIXTURE_BUNDLE" "${MULTI_FIX:-}"' EXIT
sleep 1

BASE="http://127.0.0.1:$PORT"
curl -sf "$BASE/api/hotspots?kind=duplication&limit=3" | jq -e '.records | length >= 1' >/dev/null
curl -sf "$BASE/api/search?q=package&limit=3" | jq -e '.records | type == "array"' >/dev/null

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
curl -sf "$BASE/api/repos?limit=3" | jq -e '.records | length >= 1' >/dev/null
curl -sf "$BASE/api/relationships?limit=3" | jq -e '.records | type == "array"' >/dev/null

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
mkdir -p "$LAND/service-a" "$LAND/service-b" "$MULTI_BUNDLE/producers/ctags"
printf '{"name":"service-a","scripts":{"test":"node test.js"}}\n' >"$LAND/service-a/package.json"
printf '{"name":"service-b","scripts":{"test":"node test.js"}}\n' >"$LAND/service-b/package.json"
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
  jq -n '[range(0;7) | {_type:"tag", name:("name" + tostring), path:"package.json", kind:"property", line:(. + 1)}]' \
    >"$MULTI_BUNDLE/producers/ctags/$s/tags.json"
done
"$ROOT/scripts/build-portolan-bundle.sh" "$LAND" "$MULTI_BUNDLE" >/dev/null
FIRST_REPO=$(jq -r '.[0].id' "$MULTI_BUNDLE/repos.json")
"$Q" hotspots --bundle "$MULTI_BUNDLE" --repo "$FIRST_REPO" --limit 10 \
  | jq -e --arg repo "$FIRST_REPO" '.records | length >= 1 and all(.[]; .repo_id == $repo)' >/dev/null
"$Q" symbol --bundle "$MULTI_BUNDLE" --repo "$FIRST_REPO" --name name --limit 20 \
  | jq -e --arg repo "$FIRST_REPO" '(.records | length >= 1) and (.records | all(.[]; .repo_id == $repo)) and (([.records[].id] | length) == ([.records[].id] | unique | length))' >/dev/null
"$Q" search --bundle "$MULTI_BUNDLE" --repo "$FIRST_REPO" --q name --limit 5 \
  | jq -e --arg repo "$FIRST_REPO" '.records | type == "array" and all(.[]; .repo_id == $repo)' >/dev/null
"$Q" source --bundle "$MULTI_BUNDLE" --repo "$FIRST_REPO" --path package.json --line 1 \
  | jq -e '.records | length == 1' >/dev/null
rm -rf "$MULTI_FIX"

echo "harness-bundle-query-smoke: ok"
