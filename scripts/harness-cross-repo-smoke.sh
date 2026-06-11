#!/usr/bin/env bash
# Smoke for P9 multi-repo surfaces (specs 104/105/106):
# - builds a temp 2-repo landscape (git-initialized, no commits needed)
# - synthesizes syft + jscpd-cross producer outputs (no external tools)
# - asserts repo profiles, relationship edges, cross-repo dup hotspots,
#   and claims import (valid + rejected broken-ref).
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

fail() { echo "harness-cross-repo-smoke: FAIL: $1" >&2; exit 1; }

LAND="$WORK/landscape"
BUNDLE="$WORK/bundle"
mkdir -p "$LAND/repo-a/cmd/server" "$LAND/repo-b" "$BUNDLE/producers/syft" "$BUNDLE/producers/jscpd-cross"

# --- repo-a: go service ---
cat >"$LAND/repo-a/go.mod" <<'EOF'
module example.com/repo-a

go 1.22
EOF
cat >"$LAND/repo-a/README.md" <<'EOF'
# Repo A

Shared billing service.
EOF
cat >"$LAND/repo-a/cmd/server/main.go" <<'EOF'
package main

func main() {}
EOF
printf 'FROM alpine:3.19\nEXPOSE 8080\nCMD ["/server"]\n' >"$LAND/repo-a/Dockerfile"

# --- repo-b: consumer with npm manifest + compose referencing repo-a image ---
cat >"$LAND/repo-b/go.mod" <<'EOF'
module example.com/repo-b

go 1.22

require example.com/repo-a v0.1.0
EOF
cat >"$LAND/repo-b/package.json" <<'EOF'
{
  "name": "repo-b",
  "description": "Billing console UI",
  "dependencies": { "lodash": "^4.17.21" },
  "scripts": { "start": "node index.js" }
}
EOF
cat >"$LAND/repo-b/docker-compose.yml" <<'EOF'
services:
  console:
    image: repo-a:latest
    ports:
      - "8080:8080"
EOF

(cd "$LAND/repo-a" && git init -q && git add -A)
(cd "$LAND/repo-b" && git init -q && git add -A)

slug() {
  printf '%s-%s' "$(basename "$1" | tr ' /' '__')" "$(printf '%s' "$1" | sha256sum | cut -c1-8)"
}
SLUG_A=$(slug "$LAND/repo-a")
SLUG_B=$(slug "$LAND/repo-b")

# --- synthesized syft SBOMs sharing one component ---
for s in "$SLUG_A" "$SLUG_B"; do
  cat >"$BUNDLE/producers/syft/${s}-cyclonedx.json" <<EOF
{
  "components": [
    {"name": "lodash", "version": "4.17.21", "bom-ref": "pkg:npm/lodash@4.17.21"},
    {"name": "only-${s}", "version": "1.0.0", "bom-ref": "pkg:generic/only-${s}@1.0.0"}
  ]
}
EOF
done

# --- synthesized jscpd-cross report: one cross-repo pair + one intra pair ---
cat >"$BUNDLE/producers/jscpd-cross/jscpd-report.json" <<EOF
{
  "duplicates": [
    {
      "firstFile": {"name": "$LAND/repo-a/cmd/server/main.go"},
      "secondFile": {"name": "$LAND/repo-b/go.mod"},
      "lines": 12
    },
    {
      "firstFile": {"name": "$LAND/repo-a/go.mod"},
      "secondFile": {"name": "$LAND/repo-a/README.md"},
      "lines": 7
    }
  ]
}
EOF

"$ROOT/scripts/build-portolan-bundle.sh" "$LAND" "$BUNDLE" >/dev/null

# --- repos.json: slug ids, 2 repos ---
[[ "$(jq 'length' "$BUNDLE/repos.json")" -eq 2 ]] || fail "expected 2 repos"
jq -e --arg a "$SLUG_A" --arg b "$SLUG_B" \
  'map(.id) | (index($a) != null) and (index($b) != null)' "$BUNDLE/repos.json" >/dev/null ||
  fail "repos.json ids are not path-hash slugs"

# --- repo profiles ---
[[ -f "$BUNDLE/repo-profiles.json" ]] || fail "repo-profiles.json missing"
jq -e --arg b "$SLUG_B" '
  .repos[] | select(.id == $b) |
  (.purpose.manifests | map(select(.type == "npm"))[0].description == "Billing console UI") and
  (.module_ids | index("repo-b") != null) and
  (.declared_deps | index("example.com/repo-a") != null)
' "$BUNDLE/repo-profiles.json" >/dev/null || fail "repo-b profile incomplete"
jq -e --arg a "$SLUG_A" '
  .repos[] | select(.id == $a) |
  (.purpose.readme_title == "Repo A") and
  (.purpose.entrypoints | index("go:cmd/server") != null) and
  (.maturity.has_docker == true)
' "$BUNDLE/repo-profiles.json" >/dev/null || fail "repo-a profile incomplete"

# --- relationships ---
[[ -f "$BUNDLE/relationships.jsonl" ]] || fail "relationships.jsonl missing"
rels=$(cat "$BUNDLE/relationships.jsonl")
echo "$rels" | jq -se --arg a "$SLUG_A" --arg b "$SLUG_B" '
  map(select(.type == "depends-on" and .from_repo == $b and .to_repo == $a)) | length >= 1
' >/dev/null || fail "missing depends-on edge repo-b -> repo-a"
echo "$rels" | jq -se '
  map(select(.type == "shared-dependency" and (.detail.component == "lodash"))) | length == 1
' >/dev/null || fail "missing shared-dependency lodash edge"
echo "$rels" | jq -se '
  map(select(.type == "shared-dependency")) | all(.repos | length >= 2)
' >/dev/null || fail "shared-dependency with <2 repos leaked"
echo "$rels" | jq -se --arg a "$SLUG_A" --arg b "$SLUG_B" '
  map(select(.type == "cross-repo-duplication")) | length == 1 and
  (.[0].from_repo != .[0].to_repo)
' >/dev/null || fail "expected exactly one cross-repo-duplication pair edge"
echo "$rels" | jq -se --arg b "$SLUG_B" '
  map(select(.type == "uses-image" and .from_repo == $b)) | length >= 1
' >/dev/null || fail "missing uses-image edge from compose"

# --- cross-repo dup hotspot: cross pair in, intra pair out ---
grep -q '"id":"xdup-' "$BUNDLE/hotspots.jsonl" || fail "cross-repo dup hotspot missing"
[[ "$(grep -c '"id":"xdup-' "$BUNDLE/hotspots-full.jsonl")" -eq 1 ]] ||
  fail "intra-repo pair from cross pass must not become xdup hotspot"
jq -es 'map(select(.id | startswith("xdup-"))) | .[0].severity == "high"' \
  "$BUNDLE/hotspots.jsonl" >/dev/null || fail "cross-repo dup severity must be high"

# --- manifest counters ---
jq -e '.repo_count == 2 and .relationship_count >= 4' "$BUNDLE/manifest.json" >/dev/null ||
  fail "manifest repo_count/relationship_count wrong"

# --- claims import (spec 106) ---
if [[ -x "$ROOT/scripts/import-analysis-claims.sh" ]]; then
  hot_id=$(head -1 "$BUNDLE/hotspots.jsonl" | jq -r '.id')
  rel_id=$(head -1 "$BUNDLE/relationships.jsonl" | jq -r '.id')
  cat >"$WORK/claims.jsonl" <<EOF
{"id":"claim-ok-1","claim_tier":"analytical","statement":"Billing logic is duplicated across repo-a and repo-b.","subject":"landscape","cited_refs":["hotspot:${hot_id}","relationship:${rel_id}"],"agent":"smoke-agent"}
{"id":"claim-ok-2","claim_tier":"speculative","statement":"Console may be split from repo-a historically.","subject":"repo:${SLUG_B}","cited_refs":[],"agent":"smoke-agent"}
{"id":"claim-bad-1","claim_tier":"analytical","statement":"Bogus claim citing nothing real.","subject":"landscape","cited_refs":["hotspot:does-not-exist"],"agent":"smoke-agent"}
{"id":"claim-bad-2","claim_tier":"synthetic","statement":"Synthetic claim without any refs.","subject":"landscape","cited_refs":[],"agent":"smoke-agent"}
EOF
  "$ROOT/scripts/import-analysis-claims.sh" "$BUNDLE" "$WORK/claims.jsonl" >/dev/null || true
  [[ -f "$BUNDLE/claims.jsonl" ]] || fail "claims.jsonl missing after import"
  [[ "$(wc -l <"$BUNDLE/claims.jsonl" | tr -d ' ')" -eq 2 ]] || fail "expected exactly 2 accepted claims"
  jq -es 'all(.evidence_state == "claim-only")' "$BUNDLE/claims.jsonl" >/dev/null ||
    fail "claims must stay claim-only"
  jq -e '.rejected | length == 2' "$BUNDLE/claims-import-report.json" >/dev/null ||
    fail "expected 2 rejected claims in import report"
  jq -e '.rejected[] | select(.id == "claim-bad-1") | .reason | test("hotspot:does-not-exist")' \
    "$BUNDLE/claims-import-report.json" >/dev/null || fail "broken ref must be named in rejection reason"
fi

echo "harness-cross-repo-smoke: ok"
