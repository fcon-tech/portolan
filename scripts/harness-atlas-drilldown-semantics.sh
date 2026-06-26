#!/usr/bin/env bash
# Atlas Drill-Down Decision Semantics acceptance harness (captain-atlas 16).
#
# Goal: prove every primary click in the generated Bigtop HTML answers a
# decision question (what it is / why it matters / evidence / unknown / next
# action) and never falls through to a generic Apache Bigtop/repository dossier.
#
# What this harness proves (machine):
#   - the generated Bigtop + portolan-self review HTML contains the new
#     reader-facing surfaces (relationship detail, stage detail, evidence
#     detail, C4 honest-empty, 3-axis Run Log);
#   - "Fleet" is not a primary top-nav label;
#   - relationship/stage/evidence/chip click targets exist in the renderer;
#   - BEHAVIOR-LEVEL: each click lands on a typed detail view (not a generic
#     dossier) — verified by the node:test mock-DOM suite, which exercises the
#     actual click→view path the shipped atlas.html uses;
#   - the existing 13 (navigation-index) and 15 (reading-experience) contracts
#     still pass.
#
# What this harness does NOT claim (human-review boundary):
#   - that a human can answer the CTO decision-bar questions from the HTML;
#   - that the reading quality clears the doc-16 "every click answers a
#     decision" bar for a cold reviewer.
#   Those remain human-review gates; the summary states this explicitly.
#
# usage: scripts/harness-atlas-drilldown-semantics.sh
#   [--bigtop <path>]  Bigtop landscape target (default: $BIGTOP_LANDSCAPE env or known dataset)
#   [--self <path>]    portolan-self target (default: repo root)
#   [--no-13]          skip the 13 navigation-index preservation check
#   [--no-15]          skip the 15 reading-experience preservation check
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
CORE="$ROOT/portolan-core"
BIGTOP="${BIGTOP_LANDSCAPE:-/home/fall_out_bug/work/datasets/bigtop-landscape}"
SELF="$ROOT"
RUN_13=1
RUN_15=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bigtop) BIGTOP="$2"; shift 2 ;;
    --self) SELF="$2"; shift 2 ;;
    --no-13) RUN_13=0; shift ;;
    --no-15) RUN_15=0; shift ;;
    -h|--help)
      echo "usage: $0 [--bigtop <path>] [--self <path>] [--no-13] [--no-15]"
      exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

fail() { echo "harness-atlas-drilldown-semantics: FAIL: $*" >&2; exit 1; }

BIGTOP_REVIEW="/tmp/portolan-review-nav-bigtop"
SELF_REVIEW="/tmp/portolan-review-nav-self"
BIGTOP_MAP="$ROOT/docs/site/atlas/system-map.demo.json"
SELF_MAP="$ROOT/internal/testfixtures/portolan-bundle/portolan-smoke/system-map.json"

PASS=0
FAIL=0
ok()   { echo "  ✓ $1"; PASS=$((PASS+1)); }
bad()  { echo "  ✗ $1"; FAIL=$((FAIL+1)); }

assert_contains() {
  local file="$1" needle="$2" label="$3"
  if grep -q -F "$needle" "$file" 2>/dev/null; then ok "$label"; else bad "$label (missing: $needle)"; fi
}
assert_absent() {
  local file="$1" needle="$2" label="$3"
  if grep -q -F "$needle" "$file" 2>/dev/null; then bad "$label (unexpected: $needle)"; else ok "$label"; fi
}

echo "=== Atlas Drill-Down Decision Semantics — surface + behavior verification ==="
echo "(does NOT claim human CTO-decision verdict — see summary)"

# ---------------------------------------------------------------------------
# Section 1: generate + export Bigtop review HTML
# ---------------------------------------------------------------------------
echo ""
echo "--- target: Bigtop ($BIGTOP) ---"
if [[ ! -d "$BIGTOP" ]]; then fail "Bigtop target dir absent: $BIGTOP"; fi
rm -rf "$BIGTOP_REVIEW"; mkdir -p "$BIGTOP_REVIEW"
if ! node "$CORE/scripts/build-atlas-navigation-index.mjs" --target "$BIGTOP" --out "$BIGTOP_REVIEW" >/dev/null 2>&1; then
  fail "Bigtop nav-index generation failed"
fi
BIGTOP_HTML="$BIGTOP_REVIEW/atlas.html"
if ! node "$CORE/scripts/export-shell.mjs" \
     --system-map "$BIGTOP_MAP" --out "$BIGTOP_HTML" \
     --nav-bundle "$BIGTOP_REVIEW" --target-root "$BIGTOP" \
     --title "Portolan Atlas — Bigtop" >/dev/null 2>&1; then
  fail "Bigtop atlas export failed"
fi
ok "Bigtop review HTML exported"
echo "  → $BIGTOP_HTML"

# Surface assertions (grep on renderer JS literals + inlined data). These prove
# the code paths are shipped. The real click-behavior verification is the
# node:test suite below.
echo ""
echo "  reader-facing labels + drill-down surfaces (Bigtop):"
assert_contains "$BIGTOP_HTML" 'System Routes'      'reader label: System Routes'
assert_contains "$BIGTOP_HTML" 'Structure Map'       'reader label: Structure Map'
assert_contains "$BIGTOP_HTML" 'Mapped Areas'        'reader label: Mapped Areas'
assert_contains "$BIGTOP_HTML" 'Hazards'             'reader label: Hazards'
assert_contains "$BIGTOP_HTML" 'Next Checks'         'reader label: Next Checks'
assert_contains "$BIGTOP_HTML" 'Run Log'             'reader label: Run Log'
# Fleet must NOT be a primary tab label.
assert_absent  "$BIGTOP_HTML" "label: 'Fleet'"      'Fleet is not a primary tab'

echo ""
echo "  drill-down detail surfaces (Bigtop):"
assert_contains "$BIGTOP_HTML" 'RELATIONSHIP DETAIL'    'relationship detail renderer'
assert_contains "$BIGTOP_HTML" 'STAGE DETAIL'           'stage detail renderer'
assert_contains "$BIGTOP_HTML" 'EVIDENCE DETAIL'        'evidence detail renderer'
assert_contains "$BIGTOP_HTML" 'relationship/'          'relationship route branch'
assert_contains "$BIGTOP_HTML" 'stage-target'           'stage target on diagram nodes'
assert_contains "$BIGTOP_HTML" 'data-portolan-section-intro' 'section explanation markers'
assert_contains "$BIGTOP_HTML" 'container-honest-empty' 'C4 honest-empty Container'
assert_contains "$BIGTOP_HTML" 'code-out-of-scope'      'C4 Code out of scope'
assert_contains "$BIGTOP_HTML" 'evidence-usability'     '3-axis evidence usability in Run Log'
assert_contains "$BIGTOP_HTML" 'ARTIFACT VALIDATION'    'artifact axis label'
assert_contains "$BIGTOP_HTML" 'EVIDENCE USABILITY'     'evidence axis label'
assert_contains "$BIGTOP_HTML" 'RUNTIME ASSESSMENT'     'runtime axis label'

# ---------------------------------------------------------------------------
# Section 2: generate + export portolan-self review HTML (secondary)
# ---------------------------------------------------------------------------
echo ""
echo "--- target: portolan-self ($SELF) ---"
if [[ ! -d "$SELF" ]]; then fail "self target dir absent: $SELF"; fi
rm -rf "$SELF_REVIEW"; mkdir -p "$SELF_REVIEW"
if ! node "$CORE/scripts/build-atlas-navigation-index.mjs" --target "$SELF" --out "$SELF_REVIEW" >/dev/null 2>&1; then
  fail "self nav-index generation failed"
fi
SELF_HTML="$SELF_REVIEW/atlas.html"
if ! node "$CORE/scripts/export-shell.mjs" \
     --system-map "$SELF_MAP" --out "$SELF_HTML" \
     --nav-bundle "$SELF_REVIEW" --target-root "$SELF" \
     --title "Portolan Atlas — portolan-self" >/dev/null 2>&1; then
  fail "self atlas export failed"
fi
ok "portolan-self review HTML exported"
echo "  → $SELF_HTML"
assert_contains "$SELF_HTML" 'Structure Map'   'self Structure Map label'
assert_contains "$SELF_HTML" 'RELATIONSHIP DETAIL' 'self relationship detail renderer'
assert_absent  "$SELF_HTML" "label: 'Fleet'"   'self: Fleet not a primary tab'

# ---------------------------------------------------------------------------
# Section 3: BEHAVIOR-LEVEL verification via node:test mock-DOM suite.
# This is the real drill-down contract: each click lands on a typed detail,
# not a generic dossier. (captain-atlas 16 hard-fail guard.)
# ---------------------------------------------------------------------------
echo ""
echo "--- behavior-level verification (node:test mock-DOM) ---"
if node --test "$CORE/test/unit/shell-navigation.test.js" \
          "$CORE/test/unit/atlas-detail.test.js" \
          "$CORE/test/unit/atlas-evidence-usability.test.js" >/tmp/drilldown-behavior.log 2>&1; then
  ok "behavior suite: clicks route to typed details (relationship/stage/evidence/component)"
  ok "behavior suite: C4 honest-empty, no fabrication from repo names"
  ok "behavior suite: Run Log separates 3 evidence axes"
  ok "behavior suite: Fleet is not a primary label; reader labels present"
else
  bad "behavior suite FAILED — a click does not land on a typed detail"
  echo "  (see /tmp/drilldown-behavior.log)" >&2
fi

# ---------------------------------------------------------------------------
# Section 4: preserve the 13 + 15 contracts
# ---------------------------------------------------------------------------
echo ""
echo "--- preserve prior contracts ---"
if [[ "$RUN_13" -eq 1 ]]; then
  if bash "$ROOT/scripts/harness-atlas-navigation-index.sh" --no-e2e >/dev/null 2>&1; then
    ok "13 navigation-index harness passes"
  else
    bad "13 navigation-index harness FAILED (regression)"
  fi
else
  echo "  ⊘ 13 skipped (--no-13)"
fi
if [[ "$RUN_15" -eq 1 ]]; then
  if bash "$ROOT/scripts/harness-atlas-reading-experience.sh" >/dev/null 2>&1; then
    ok "15 reading-experience harness passes"
  else
    bad "15 reading-experience harness FAILED (regression)"
  fi
else
  echo "  ⊘ 15 skipped (--no-15)"
fi

# ---------------------------------------------------------------------------
# Section 5: summary (with explicit human-review boundary)
# ---------------------------------------------------------------------------
echo ""
echo "=== SUMMARY ==="
echo "  checks: $PASS passed, $FAIL failed"
echo "  Bigtop review HTML:       $BIGTOP_HTML"
echo "  portolan-self review HTML: $SELF_HTML"
echo ""
echo "  HUMAN-REVIEW BOUNDARY: this harness proves the drill-down surfaces exist"
echo "  and that each click routes to a typed detail (behavior-verified). It does"
echo "  NOT claim a human reviewer can answer the CTO decision-bar questions from"
echo "  the Bigtop HTML, nor that the reading quality clears the 'every click"
echo "  answers a decision' bar for a cold reviewer. If a human clicks a"
echo "  relationship/probe/evidence chip/stage/map object and lands on a generic"
echo "  Apache Bigtop dossier without the clicked object being explained, the"
echo "  implementation FAILED regardless of these checks."

if [[ "$FAIL" -gt 0 ]]; then
  fail "$FAIL check(s) failed"
fi
echo ""
echo "PASS — drill-down semantics surfaces present + click behavior verified; human CTO-decision gate remains."
