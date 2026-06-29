#!/usr/bin/env bash
# CTO stress gates for a prepared Apache Bigtop corpus bundle. Not default CI.
# The strict gate fails on degraded producer coverage. Use --allow-degraded
# only for an explicit stress pass where degraded evidence is the expected
# product truth, not proof of exhaustive coverage.
# Usage: harness-bigtop-acceptance.sh [--allow-degraded] <bundle-dir>
set -euo pipefail

fail() { echo "harness-bigtop-acceptance: FAIL: $1" >&2; exit 1; }
warn() { echo "harness-bigtop-acceptance: note: $*" >&2; }

ROOT=$(cd "$(dirname "$0")/.." && pwd)

require_navigable_relationship_query() {
  local relationship_query
  relationship_query=$("$ROOT/scripts/portolan-bundle-query.sh" relationships --bundle "$BUNDLE" --limit 20)
  jq -e '
    (.total_records >= 1) and
    (.records | any(
      (
        ((((.from_repo // "") | length) > 0) and (((.to_repo // "") | length) > 0)) or
        (((.repos // []) | length) >= 2)
      ) and
      (
        (((.routes.graph // "") | length) > 0) or
        (((.routes.api // "") | length) > 0) or
        (((.routes.atlas // "") | length) > 0)
      )
    ))
  ' <<<"$relationship_query" >/dev/null ||
    fail "relationship query does not expose a navigable direct endpoint or cohort route"
}

ALLOW_DEGRADED=0
REQUIRE_SYSTEM_MAP=0
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --allow-degraded) ALLOW_DEGRADED=1; shift ;;
    --require-system-map) REQUIRE_SYSTEM_MAP=1; shift ;;
    --) shift; break ;;
    -*) echo "unknown option: $1" >&2; exit 2 ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done
set -- "${POSITIONAL[@]}"

BUNDLE=${1:-}
[[ -n "$BUNDLE" && -d "$BUNDLE" ]] || {
  echo "usage: $0 [--allow-degraded] [--require-system-map] <bundle-dir>" >&2
  exit 2
}

command -v jq >/dev/null || fail "jq required"

[[ -f "$BUNDLE/manifest.json" ]] || fail "manifest.json missing"
[[ -f "$BUNDLE/repos.json" ]] || fail "repos.json missing"

# System-map gate: when required, the bundle must carry a valid normalized
# system map and no surface-only target may leak as a default-map component.
if [[ "$REQUIRE_SYSTEM_MAP" -eq 1 ]]; then
  SM="$BUNDLE/system-map.json"
  [[ -f "$SM" ]] || fail "--require-system-map set but system-map.json missing"
  "$ROOT/scripts/validate-system-map-schema.sh" "$SM" >/dev/null ||
    fail "system-map.json failed schema + semantic validation"
  leaked=$(jq -r '[.objects.components[] | select(.id | test("support-matrix|mailing-list|bigtop-ci|binary-repo|docker-image"))] | length' "$SM")
  [[ "$leaked" == "0" ]] ||
    fail "--require-system-map: $leaked surface-only target(s) leaked as default-map components"
  warn "--require-system-map: system map valid ($SM)"
fi
if [[ "$ALLOW_DEGRADED" -ne 1 ]]; then
  [[ -f "$BUNDLE/receipt.json" ]] || fail "receipt.json missing; strict proof must include scan operability evidence"
  [[ -f "$BUNDLE/captain-atlas-scorecard.json" ]] || fail "captain-atlas-scorecard.json missing; strict proof must include product scorecard"
  jq -e '
    .status == "completed" and
    .exit_code == 0 and
    (.local_first.target_source_mutation == false) and
    ((.viewer.launch_argv // []) | index("--bundle") != null)
  ' "$BUNDLE/receipt.json" >/dev/null ||
    fail "receipt does not prove completed local-first scan with viewer handoff"
  jq -e '
    .scenario == "captain-atlas-first-run" and
    .verdict == "verified" and
    ((.demo_evidence.viewer_handoff // []) | index("--bundle") != null)
  ' "$BUNDLE/captain-atlas-scorecard.json" >/dev/null ||
    fail "scorecard does not verify captain-atlas first-run handoff"
fi
jq -e '
  has("repo_discovered_total") and
  has("repo_limit_applied") and
  has("gaps_total") and
  has("gaps_truncated")
' "$BUNDLE/manifest.json" >/dev/null ||
  fail "manifest missing corpus completeness fields: repo_discovered_total, repo_limit_applied, gaps_total, gaps_truncated"
repo_count=$(jq -r '.repo_count // empty' "$BUNDLE/manifest.json" 2>/dev/null || true)
if [[ -z "$repo_count" ]]; then
  repo_count=$(jq 'length' "$BUNDLE/repos.json")
fi
repos_json_count=$(jq 'length' "$BUNDLE/repos.json")
[[ "$repo_count" -eq "$repos_json_count" ]] || fail "manifest repo_count=$repo_count differs from repos.json length=$repos_json_count"
[[ "$repo_count" -ge 2 ]] || fail "expected a multi-repo Bigtop corpus, got $repo_count repos"
repo_discovered_total=$(jq -r '.repo_discovered_total' "$BUNDLE/manifest.json")
repo_limit_applied=$(jq -r '.repo_limit_applied' "$BUNDLE/manifest.json")
proof_profile=$(jq -r '.proof_profile // "bounded"' "$BUNDLE/manifest.json")
if [[ "$ALLOW_DEGRADED" -ne 1 && "$proof_profile" != "full" ]]; then
  fail "strict full Bigtop acceptance requires manifest.proof_profile=full; got $proof_profile"
fi
[[ "$repo_discovered_total" -eq "$repo_count" ]] ||
  fail "repository inventory is non-exhaustive: repo_count=$repo_count discovered=$repo_discovered_total"
[[ "$repo_limit_applied" -eq 0 ]] ||
  fail "repository cap applied; strict full Bigtop acceptance is not assessed"
if [[ -f "$BUNDLE/landscape-card.json" ]]; then
  card_repo_count=$(jq -r '.identity.repo_count // empty' "$BUNDLE/landscape-card.json" 2>/dev/null || true)
  [[ "$card_repo_count" == "$repo_count" ]] || fail "landscape-card identity.repo_count=$card_repo_count differs from manifest repo_count=$repo_count"
fi

GAPS="$BUNDLE/gaps.jsonl"
[[ -f "$GAPS" ]] || fail "gaps.jsonl missing"
[[ -f "$BUNDLE/gaps-full.jsonl" ]] || fail "gaps-full.jsonl missing"
gaps_truncated=$(jq -r '.gaps_truncated' "$BUNDLE/manifest.json")
gaps_total=$(jq -r '.gaps_total' "$BUNDLE/manifest.json")
gap_count=$(jq -r '.gap_count // 0' "$BUNDLE/manifest.json")
gaps_full_count=$(wc -l <"$BUNDLE/gaps-full.jsonl" | tr -d '[:space:]')
[[ "$gaps_total" -eq "$gaps_full_count" ]] ||
  fail "manifest gaps_total=$gaps_total differs from gaps-full.jsonl lines=$gaps_full_count"
if [[ "$gaps_truncated" -ne 0 ]]; then
  fail "gaps are truncated; strict full Bigtop acceptance is not assessed (shown=$gap_count total=$gaps_total)"
fi
[[ "$gap_count" -eq "$gaps_total" ]] ||
  fail "manifest gap_count=$gap_count differs from gaps_total=$gaps_total without truncation"

if [[ "$ALLOW_DEGRADED" -ne 1 ]]; then
  [[ -f "$BUNDLE/captain-qna-eval.json" ]] || fail "captain-qna-eval.json missing; strict proof must include agent Q&A/drill-down evidence"
  [[ -f "$BUNDLE/captain-handoff.json" ]] || fail "captain-handoff.json missing; strict proof must include captain handoff"
  [[ -f "$BUNDLE/captain-handoff.md" ]] || fail "captain-handoff.md missing; strict proof must include human captain handoff"
  jq -e '
    .scenario == "captain-agent-qna-drilldown" and
    .verdict == "verified" and
    .answer_count == 7 and
    .requirements.captain_questions == 5 and
    .requirements.selected_code_questions == 2 and
    (.answers | map(select(.id | startswith("selected-"))) | length) == 2 and
    (.answers | map(select((.id | startswith("selected-")) and .verdict == "verified")) | length) == 2
  ' "$BUNDLE/captain-qna-eval.json" >/dev/null ||
    fail "captain Q&A eval does not verify captain questions and selected-code drill-down"
  jq -e '
    .scenario == "captain-atlas-handoff" and
    .verdict == "verified" and
    .statuses.qna_eval == "verified" and
	    .statuses.drill_down == "verified" and
	    .statuses.selected_code_drill_down == "verified" and
	    .statuses.relationship_drill_down == "verified" and
	    (.counts.relationships >= 1) and
	    (.counts.relationship_drilldown_records >= 1) and
	    (.evidence.query_health.relationship_drill_down_ok == true) and
	    (.query_handoff | length >= 5) and
	    ((.viewer_handoff // []) | index("--bundle") != null)
	  ' "$BUNDLE/captain-handoff.json" >/dev/null ||
	    fail "captain handoff does not verify Q&A, selected-code, relationship drill-down, query handoff, and viewer handoff"
	  require_navigable_relationship_query
	  grep -q 'Portolan Captain Handoff' "$BUNDLE/captain-handoff.md" ||
	    fail "captain handoff markdown missing title"
fi

# Per-repo jscpd: no failed shards or missing reports. Stratified coverage is
# acceptable only when it is recorded as a duplication coverage gap.
degraded_count=0
if grep -qE '"id":"shard-jscpd-' "$GAPS" 2>/dev/null; then
  fail "shard-jscpd gaps present ($(grep -c '"id":"shard-jscpd-' "$GAPS" || echo 0))"
fi
hard_dup_gaps=$(jq -r '
  select((.id // "") | startswith("gap-duplication-")) |
  select((((.id // "") | startswith("gap-duplication-stratified-")) | not) and (((.id // "") | startswith("gap-duplication-coverage-metadata-")) | not)) |
  .id
' "$GAPS" 2>/dev/null | wc -l | tr -d '[:space:]')
[[ "$hard_dup_gaps" -eq 0 ]] || fail "hard per-repo duplication gaps present ($hard_dup_gaps)"
coverage_metadata_gaps=$(jq -r '
  select((.id // "") | startswith("gap-duplication-coverage-metadata-")) |
  .id
' "$GAPS" 2>/dev/null | wc -l | tr -d '[:space:]')
[[ "$coverage_metadata_gaps" -eq 0 ]] ||
  fail "duplication coverage metadata missing for $coverage_metadata_gaps repo(s); jscpd coverage cannot be stratified"
if [[ "$ALLOW_DEGRADED" -ne 1 ]]; then
  missing_required_producer_gaps=$(jq -r '
    select(.id == "gap-deps" or .id == "gap-static") | .id
  ' "$GAPS" 2>/dev/null | wc -l | tr -d '[:space:]')
  [[ "$missing_required_producer_gaps" -eq 0 ]] ||
    fail "required dependency/static producer evidence is not assessed ($missing_required_producer_gaps gap record(s))"
fi
stratified_dup_gaps=$(jq -r '
  select(((.id // "") | startswith("gap-duplication-stratified-")) or ((.id // "") | startswith("gap-duplication-coverage-metadata-"))) |
  .id
' "$GAPS" 2>/dev/null | wc -l | tr -d '[:space:]')
if [[ "$stratified_dup_gaps" -gt 0 ]]; then
  degraded_count=$((degraded_count + stratified_dup_gaps))
  warn "per-repo duplication coverage is degraded for $stratified_dup_gaps repo(s)"
fi

# ctags / symbols
if grep -qE '"id":"(shard-ctags-|gap-ctags)"' "$GAPS" 2>/dev/null; then
  fail "ctags/symbol gaps present"
fi
# Cross-repo duplication: relationships or manifest complete with zero clones;
# stratified/unknown coverage must be explicit in gaps and manifest.
cross_edges=0
if [[ -f "$BUNDLE/relationships.jsonl" ]]; then
  if grep -q '"type":"cross-repo-duplication"' "$BUNDLE/relationships.jsonl" 2>/dev/null; then
    cross_edges=$(grep -c '"type":"cross-repo-duplication"' "$BUNDLE/relationships.jsonl")
  fi
fi
manifest_status=$(jq -r '.cross_repo_duplication.status // "missing"' "$BUNDLE/manifest.json")
clone_pairs=$(jq -r '.cross_repo_duplication.clone_pairs // -1' "$BUNDLE/manifest.json")
cross_gap_count=$(jq -r 'select((.id // "") | startswith("gap-cross-repo-dup")) | .id' "$GAPS" 2>/dev/null | wc -l | tr -d '[:space:]')
if [[ "$cross_edges" -eq 0 ]]; then
  case "$manifest_status" in
    complete)
      [[ "$cross_gap_count" -eq 0 ]] || fail "manifest says complete but cross-repo duplication gaps are present"
      [[ "$clone_pairs" -ge 0 ]] || fail "manifest missing clone_pairs for proven-zero cross dup"
      ;;
    stratified|unknown)
      [[ "$cross_gap_count" -gt 0 ]] || fail "cross-repo duplication is $manifest_status but no degraded coverage gap is recorded"
      degraded_count=$((degraded_count + cross_gap_count))
      warn "cross-repo duplication coverage is $manifest_status; absence of clone pairs is not exhaustive proof"
      ;;
    *)
      fail "no cross-repo dup edges and manifest cross_repo_duplication.status=$manifest_status"
      ;;
  esac
fi

# Landscape structure accounting (bigtop-deep-landscape-demo honesty contract).
# Structural edges (typed `references` — code-level calls/references resolved
# from a symbol-index export) are what make the landscape read as connected
# code, not a repo list of shared dependencies. Until the scip-producer slice
# runs on Bigtop, structural edges are expected to be absent: this is a visible,
# NON-fatal warning (the honesty rule degrades gracefully). It becomes a hard
# "not a repo list" gate once structural edges flow.
if [[ -f "$BUNDLE/relationships.jsonl" ]]; then
  total_rels=$(wc -l <"$BUNDLE/relationships.jsonl" | tr -d '[:space:]')
  # Producers serialize edges under two field names: shell producers use `type`
  # (e.g. scan-cross-repo.sh), Go producers use `kind` (internal/graph,
  # internal/importer). Check both so a Go-emitted `references` edge is counted.
  structural_rels=$(jq -r 'select(((.type // .kind // "")) == "references") | .id' "$BUNDLE/relationships.jsonl" 2>/dev/null | wc -l | tr -d '[:space:]')
  if [[ "$structural_rels" -eq 0 && "$total_rels" -gt 0 ]]; then
    warn "landscape is dependency-only: 0 structural (references) edges across $total_rels relationship(s); the Fleet map reads as shared-dependency clusters, not connected code (awaiting scip-producer)"
  elif [[ "$structural_rels" -gt 0 ]]; then
    echo "harness-bigtop-acceptance: note: landscape has $structural_rels structural edge(s) across $total_rels relationship(s): connected-structure condition met"
  fi
fi

# Symbol query smoke (bundle-query)
if [[ -x "$ROOT/scripts/validate-atlas-schemas.sh" ]]; then
  "$ROOT/scripts/validate-atlas-schemas.sh" "$BUNDLE"
fi
if [[ -x "$ROOT/scripts/portolan-bundle-query.sh" ]]; then
  [[ -s "$BUNDLE/symbol-index.jsonl" ]] || fail "symbol-index.jsonl missing or empty"
  symbol_rows=$(wc -l <"$BUNDLE/symbol-index.jsonl" | tr -d '[:space:]')
  [[ "$symbol_rows" -ge 1000000 ]] || fail "expected a full-scale Bigtop symbol-index, got $symbol_rows rows"
  jq -e --argjson rows "$symbol_rows" '
    select(
      .id == "promotion-health-symbol-index-pollution"
      and .status == "polluted_by_non_source"
      and .denominator == $rows
      and .observed_count > ($rows * 0.5)
    )
  ' "$BUNDLE/promotion-health.jsonl" >/dev/null || fail "symbol-index pollution health missing or below threshold"
  jq -e --argjson rows "$symbol_rows" '
    select(
      .id == "promotion-health-symbol-index-fixtures"
      and .status == "dominated_by_fixture_data"
      and .denominator == $rows
      and .observed_count > ($rows * 0.35)
    )
  ' "$BUNDLE/promotion-health.jsonl" >/dev/null || fail "symbol-index fixture/test dominance health missing or below threshold"
  promoted_fact_count=$(jq -r '.promoted_fact_count // 0' "$BUNDLE/promotion-summary.json" 2>/dev/null || echo 0)
  if [[ "$promoted_fact_count" -lt "$symbol_rows" ]]; then
    jq -e --argjson rows "$symbol_rows" '
      select(
        .id == "promotion-health-symbol-index-promoted-facts-truncated"
        and .status == "non_exhaustive"
        and .denominator == $rows
      )
    ' "$BUNDLE/promotion-health.jsonl" >/dev/null || fail "symbol-index promoted-fact truncation health missing"
  fi
  jq -e '
    select(
      .id == "promotion-health-oversized-family-symbol_index"
      and .status == "oversized"
    )
  ' "$BUNDLE/promotion-health.jsonl" >/dev/null || fail "symbol-index oversized-family health missing"
  promotion_blockers=$(jq -r '
    select((.status // "") as $s |
      ["cannot_verify","not_integrated","partial","non_exhaustive","stale","inventory_mismatch"] | index($s)
    ) | .id
  ' "$BUNDLE/promotion-health.jsonl" 2>/dev/null | wc -l | tr -d '[:space:]')
  promotion_findings=$(jq -r '
    select((.status // "") as $s |
      ["not_assessed","polluted_by_non_source","dominated_by_fixture_data","oversized","raw_available_only"] | index($s)
    ) | .id
  ' "$BUNDLE/promotion-health.jsonl" 2>/dev/null | wc -l | tr -d '[:space:]')
  if [[ "$promotion_blockers" -gt 0 ]]; then
    degraded_count=$((degraded_count + promotion_blockers))
    warn "promotion/source coverage has $promotion_blockers blocker health row(s)"
  fi
  if [[ "$promotion_findings" -gt 0 ]]; then
    warn "promotion/source diagnostics reported $promotion_findings finding row(s)"
  fi
  first_symbol=$(awk 'length($0) > 0 { print; exit }' "$BUNDLE/symbol-index.jsonl" | jq -r '.name // empty')
  [[ -n "$first_symbol" ]] || fail "symbol-index has no queryable symbol names"
  sym_out=$("$ROOT/scripts/portolan-bundle-query.sh" symbol --bundle "$BUNDLE" --name "$first_symbol" --limit 3 2>/dev/null || true)
  sym_n=$(printf '%s\n' "$sym_out" | jq '.records | length' 2>/dev/null || echo 0)
  [[ "$sym_n" -ge 1 ]] || fail "bundle-query symbol returned 0 records for '$first_symbol'"
fi

if [[ "$degraded_count" -gt 0 && "$ALLOW_DEGRADED" -ne 1 ]]; then
  fail "strict full Bigtop acceptance is not assessed: $degraded_count degraded coverage/health row(s); rerun with --allow-degraded only for an explicit stress pass"
fi

if [[ "$degraded_count" -gt 0 ]]; then
  echo "harness-bigtop-acceptance: degraded-ok (repos=$repo_count cross_edges=$cross_edges manifest_cross=$manifest_status degraded=$degraded_count)"
else
  echo "harness-bigtop-acceptance: ok (repos=$repo_count cross_edges=$cross_edges manifest_cross=$manifest_status degraded=0)"
fi
