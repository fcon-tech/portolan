#!/usr/bin/env bash
# Strict CTO acceptance gates for bigtop-10 bundle (spec 108 P9.1). Not default CI.
# Usage: harness-bigtop10-acceptance.sh <bundle-dir>
set -euo pipefail

fail() { echo "harness-bigtop10-acceptance: FAIL: $1" >&2; exit 1; }
warn() { echo "harness-bigtop10-acceptance: note: $*" >&2; }

BUNDLE=${1:-}
[[ -n "$BUNDLE" && -d "$BUNDLE" ]] || {
  echo "usage: $0 <bundle-dir>" >&2
  exit 2
}

command -v jq >/dev/null || fail "jq required"

[[ -f "$BUNDLE/manifest.json" ]] || fail "manifest.json missing"
[[ -f "$BUNDLE/repos.json" ]] || fail "repos.json missing"
repo_count=$(jq -r '.repo_count // empty' "$BUNDLE/manifest.json" 2>/dev/null || true)
if [[ -z "$repo_count" ]]; then
  repo_count=$(jq 'length' "$BUNDLE/repos.json")
fi
[[ "$repo_count" -eq 10 ]] || warn "expected 10 repos, got $repo_count"

GAPS="$BUNDLE/gaps.jsonl"
[[ -f "$GAPS" ]] || fail "gaps.jsonl missing"

# Per-repo jscpd: no shard-jscpd-* gaps
if grep -qE '"id":"shard-jscpd-' "$GAPS" 2>/dev/null; then
  fail "shard-jscpd gaps present ($(grep -c '"id":"shard-jscpd-' "$GAPS" || echo 0))"
fi
if grep -qE '"id":"gap-duplication-' "$GAPS" 2>/dev/null; then
  fail "per-repo gap-duplication gaps present"
fi

# ctags / symbols
if grep -qE '"id":"(shard-ctags-|gap-ctags)"' "$GAPS" 2>/dev/null; then
  fail "ctags/symbol gaps present"
fi
if grep -q '"id":"gap-cross-repo-dup"' "$GAPS" 2>/dev/null; then
  fail "gap-cross-repo-dup present (strict bar requires complete pairwise scan)"
fi

# Cross-repo duplication tier-A: relationships or manifest complete with zero clones
cross_edges=0
if [[ -f "$BUNDLE/relationships.jsonl" ]]; then
  if grep -q '"type":"cross-repo-duplication"' "$BUNDLE/relationships.jsonl" 2>/dev/null; then
    cross_edges=$(grep -c '"type":"cross-repo-duplication"' "$BUNDLE/relationships.jsonl")
  fi
fi
manifest_status=$(jq -r '.cross_repo_duplication.status // "missing"' "$BUNDLE/manifest.json")
clone_pairs=$(jq -r '.cross_repo_duplication.clone_pairs // -1' "$BUNDLE/manifest.json")
if [[ "$cross_edges" -eq 0 ]]; then
  if [[ "$manifest_status" != "complete" ]]; then
    fail "no cross-repo dup edges and manifest cross_repo_duplication.status=$manifest_status"
  fi
  [[ "$clone_pairs" -ge 0 ]] || fail "manifest missing clone_pairs for proven-zero cross dup"
fi

# Symbol query smoke (bundle-query)
ROOT=$(cd "$(dirname "$0")/.." && pwd)
if [[ -x "$ROOT/scripts/portolan-bundle-query.sh" ]]; then
  [[ -s "$BUNDLE/symbol-index.jsonl" ]] || fail "symbol-index.jsonl missing or empty"
  first_symbol=$(awk 'length($0) > 0 { print; exit }' "$BUNDLE/symbol-index.jsonl" | jq -r '.name // empty')
  [[ -n "$first_symbol" ]] || fail "symbol-index has no queryable symbol names"
  sym_out=$("$ROOT/scripts/portolan-bundle-query.sh" symbol --bundle "$BUNDLE" --name "$first_symbol" --limit 3 2>/dev/null || true)
  sym_n=$(printf '%s\n' "$sym_out" | jq '.records | length' 2>/dev/null || echo 0)
  [[ "$sym_n" -ge 1 ]] || fail "bundle-query symbol returned 0 records for '$first_symbol'"
fi

echo "harness-bigtop10-acceptance: ok (repos=$repo_count cross_edges=$cross_edges manifest_cross=$manifest_status)"
