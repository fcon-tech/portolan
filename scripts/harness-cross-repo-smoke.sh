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

# --- per-repo jscpd stubs (spec 109 strict per-repo contract) ---
mkdir -p "$BUNDLE/producers/jscpd/$SLUG_A" "$BUNDLE/producers/jscpd/$SLUG_B"
echo '{"duplicates":[]}' >"$BUNDLE/producers/jscpd/$SLUG_A/jscpd-report.json"
echo '{"duplicates":[]}' >"$BUNDLE/producers/jscpd/$SLUG_B/jscpd-report.json"

# --- pairwise jscpd-cross: cross pair only (intra pair excluded from cross pass) ---
PAIR_DIR="$BUNDLE/producers/jscpd-cross/${SLUG_A}--${SLUG_B}"
mkdir -p "$PAIR_DIR"
cat >"$PAIR_DIR/jscpd-report.json" <<EOF
{
  "duplicates": [
    {
      "firstFile": {"name": "$LAND/repo-a/cmd/server/main.go"},
      "secondFile": {"name": "$LAND/repo-b/go.mod"},
      "lines": 12
    }
  ]
}
EOF
cat >"$BUNDLE/producers/jscpd-cross/_scan.json" <<EOF
{"schema_version":"0.1.0","pairs_total":1,"pairs_ok":1,"pairs_failed":0,"clone_pairs":1,"completed_at":"2026-06-11T00:00:00Z"}
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

# --- manifest counters + cross-repo completion metadata (spec 110) ---
jq -e '.repo_count == 2 and .relationship_count >= 4' "$BUNDLE/manifest.json" >/dev/null ||
  fail "manifest repo_count/relationship_count wrong"
jq -e '.cross_repo_duplication.status == "complete" and .cross_repo_duplication.clone_pairs == 1' \
  "$BUNDLE/manifest.json" >/dev/null || fail "manifest cross_repo_duplication metadata missing or wrong"

# --- claims import (spec 106) ---
if [[ -x "$ROOT/scripts/import-analysis-claims.sh" ]]; then
  hot_id=$(head -1 "$BUNDLE/hotspots.jsonl" | jq -r '.id')
  rel_id=$(head -1 "$BUNDLE/relationships.jsonl" | jq -r '.id')
  cat >"$WORK/claims.jsonl" <<EOF
{"id":"claim-ok-1","claim_tier":"analytical","statement":"Billing logic is duplicated across repo-a and repo-b.","subject":"landscape","cited_refs":["hotspot:${hot_id}","relationship:${rel_id}"],"agent":"smoke-agent"}
{"id":"claim-ok-2","claim_tier":"speculative","statement":"Console may be split from repo-a historically.","subject":"repo:${SLUG_B}","cited_refs":[],"agent":"smoke-agent"}
{"id":"claim-bad-1","claim_tier":"analytical","statement":"Bogus claim citing nothing real.","subject":"landscape","cited_refs":["hotspot:does-not-exist"],"agent":"smoke-agent"}
{"id":"claim-bad-2","claim_tier":"synthetic","statement":"Synthetic claim without any refs.","subject":"landscape","cited_refs":[],"agent":"smoke-agent"}
{"id":"claim-bad-3","claim_tier":"analytical","statement":"Empty-string ref must not satisfy the >=1 ref rule.","subject":"landscape","cited_refs":[""],"agent":"smoke-agent"}
{"id":"claim-bad-4","claim_tier":"analytical","statement":"Traversal ref must not escape repo roots.","subject":"landscape","cited_refs":["path:../../../../etc/passwd"],"agent":"smoke-agent"}
{"id":"claim-bad-5","claim_tier":"analytical","statement":"Absolute producer_ref outside the bundle must not resolve.","subject":"landscape","cited_refs":["producer_ref:/etc/passwd"],"agent":"smoke-agent"}
EOF
  "$ROOT/scripts/import-analysis-claims.sh" "$BUNDLE" "$WORK/claims.jsonl" >/dev/null || true
  [[ -f "$BUNDLE/claims.jsonl" ]] || fail "claims.jsonl missing after import"
  [[ "$(wc -l <"$BUNDLE/claims.jsonl" | tr -d ' ')" -eq 2 ]] || fail "expected exactly 2 accepted claims"
  jq -es 'all(.evidence_state == "claim-only")' "$BUNDLE/claims.jsonl" >/dev/null ||
    fail "claims must stay claim-only"
  jq -e '.rejected | length == 5' "$BUNDLE/claims-import-report.json" >/dev/null ||
    fail "expected 5 rejected claims in import report"
  jq -e '.rejected[] | select(.id == "claim-bad-1") | .reason | test("hotspot:does-not-exist")' \
    "$BUNDLE/claims-import-report.json" >/dev/null || fail "broken ref must be named in rejection reason"
  jq -e '.rejected[] | select(.id == "claim-bad-3") | .reason | test("non-empty")' \
    "$BUNDLE/claims-import-report.json" >/dev/null || fail "empty-string ref must be rejected"
  jq -e '.rejected[] | select(.id == "claim-bad-4")' "$BUNDLE/claims-import-report.json" >/dev/null ||
    fail "traversal path ref must be rejected"
  jq -e '.rejected[] | select(.id == "claim-bad-5")' "$BUNDLE/claims-import-report.json" >/dev/null ||
    fail "outside-bundle producer_ref must be rejected"

  # re-import with all rows of the same agent rejected must purge prior claims
  printf '%s\n' '{"id":"claim-bad-6","claim_tier":"analytical","statement":"All-rejected re-import.","subject":"landscape","cited_refs":["hotspot:nope"],"agent":"smoke-agent"}' >"$WORK/claims-reimport.jsonl"
  "$ROOT/scripts/import-analysis-claims.sh" "$BUNDLE" "$WORK/claims-reimport.jsonl" >/dev/null || true
  [[ "$(wc -l <"$BUNDLE/claims.jsonl" | tr -d ' ')" -eq 0 ]] ||
    fail "all-rejected re-import must purge that agent's prior claims"

  # symlinked README must not pull outside content into profiles
  outside="$WORK/outside-secret.txt"
  echo "OUTSIDE-SECRET" >"$outside"
  rm -f "$LAND/repo-b/README.md"; ln -s "$outside" "$LAND/repo-b/README.md"
  "$ROOT/scripts/scan-repo-profiles.sh" "$LAND" "$BUNDLE" >/dev/null 2>&1 || fail "profiles rerun failed"
  jq -e --arg b "$SLUG_B" '.repos[] | select(.id == $b) | .purpose.readme_path == null' \
    "$BUNDLE/repo-profiles.json" >/dev/null || fail "symlinked README escaped repo root into profile"
  grep -q "OUTSIDE-SECRET" "$BUNDLE/repo-profiles.json" && fail "outside content leaked into profiles" || true
fi

echo "harness-cross-repo-smoke: ok"
