#!/usr/bin/env bash
# Atlas Navigation Index acceptance harness (captain-atlas 13).
#
# Primary gate: STANDALONE generation + validation for both required targets
# (Bigtop landscape + portolan-self). This must pass regardless of the
# /portolan:map e2e prerequisites.
#
# Secondary (integration): /portolan:map end-to-end. If intake/system-map
# prerequisites are absent, this step is recorded as BLOCKED (with the missing
# path as evidence) and the harness STILL PASSES when standalone gen+validate
# pass. It is never reported green when actually blocked.
#
# usage: scripts/harness-atlas-navigation-index.sh
#   [--bigtop <path>]  Bigtop landscape target (default: $BIGTOP_LANDSCAPE env or the known dataset path)
#   [--self <path>]    portolan-self target (default: repo root)
#   [--no-e2e]         skip the /portolan:map integration step
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
CORE="$ROOT/portolan-core"
BIGTOP="${BIGTOP_LANDSCAPE:-/home/fall_out_bug/work/datasets/bigtop-landscape}"
SELF="$ROOT"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bigtop) BIGTOP="$2"; shift 2 ;;
    --self) SELF="$2"; shift 2 ;;
    --no-e2e) NO_E2E=1; shift ;;
    -h|--help)
      echo "usage: $0 [--bigtop <path>] [--self <path>] [--no-e2e]"
      exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

fail() { echo "harness-atlas-navigation-index: FAIL: $*" >&2; exit 1; }

STANDALONE_PASS=0
STANDALONE_FAIL=0
E2E_STATUS="skipped"
E2E_EVIDENCE=""

standalone_ok() { echo "  ✓ $1"; STANDALONE_PASS=$((STANDALONE_PASS+1)); }
standalone_fail() { echo "  ✗ $1"; STANDALONE_FAIL=$((STANDALONE_FAIL+1)); }

# ---------------------------------------------------------------------------
# Section 1: STANDALONE generation + validation (the primary gate)
# ---------------------------------------------------------------------------
echo "=== Atlas Navigation Index — standalone generation + validation ==="

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

for pair in "bigtop:$BIGTOP" "portolan-self:$SELF"; do
  label="${pair%%:*}"
  target="${pair#*:}"
  out="$TMP/$label"
  echo ""
  echo "--- target: $label ($target) ---"
  if [[ ! -d "$target" ]]; then
    standalone_fail "$label: target dir absent ($target) — cannot generate"
    continue
  fi
  # generate
  if node "$CORE/scripts/build-atlas-navigation-index.mjs" --target "$target" --out "$out" >/dev/null 2>&1; then
    standalone_ok "$label: generated"
  else
    standalone_fail "$label: generation failed"
    continue
  fi
  # validate (machine_status verified)
  if node "$CORE/scripts/validate-atlas-navigation-index.mjs" --bundle "$out" >/dev/null 2>&1; then
    standalone_ok "$label: validated (machine_status verified)"
  else
    standalone_fail "$label: validation failed"
  fi
  # spec jq parse checks (every JSONL line parses)
  parse_ok=1
  for f in navigation-index.jsonl coverage-matrix.jsonl atlas-findings.jsonl unknown-probes.jsonl evidence.jsonl; do
    if [[ -f "$out/$f" ]]; then
      while IFS= read -r line; do
        [[ -z "$line" ]] || echo "$line" | jq -e . >/dev/null 2>&1 || { parse_ok=0; break; }
      done < "$out/$f"
    fi
  done
  if [[ $parse_ok -eq 1 ]]; then standalone_ok "$label: all JSONL lines parse"; else standalone_fail "$label: JSONL parse error"; fi
  # receipt-validation.json parses
  jq empty "$out/receipt-validation.json" >/dev/null 2>&1 && standalone_ok "$label: receipt-validation.json parses" || standalone_fail "$label: receipt-validation.json parse error"
done

# ---------------------------------------------------------------------------
# Section 1b: combined multi-corpus acceptance bundle
# ---------------------------------------------------------------------------
echo ""
echo "--- combined multi-corpus acceptance bundle (literal AND pass-condition) ---"
COMBINED_OUT="$TMP/combined"
if [[ -d "$TMP/bigtop" && -d "$TMP/portolan-self" ]]; then
  if node "$CORE/scripts/build-atlas-navigation-index.mjs" --combine \
       --bigtop "$BIGTOP" --self "$SELF" --out "$COMBINED_OUT" >/dev/null 2>&1; then
    standalone_ok "combined bundle generated"
    # the combined bundle must pass the literal AND frontier pass-condition
    if node "$CORE/scripts/validate-atlas-navigation-index.mjs" --bundle "$COMBINED_OUT" >/dev/null 2>&1; then
      standalone_ok "combined bundle validated (literal AND pass-condition met)"
    else
      standalone_fail "combined bundle validation failed"
    fi
  else
    standalone_fail "combined bundle generation failed"
  fi
fi

# ---------------------------------------------------------------------------
# Section 2: query surface smoke (follow-up-agent handoff)
# ---------------------------------------------------------------------------
echo ""
echo "--- query surface smoke (portolan-self) ---"
SELF_OUT="$TMP/portolan-self"
if [[ -d "$SELF_OUT" ]]; then
  for op in list-routes list-findings list-probes receipt; do
    if node "$CORE/scripts/query-atlas-navigation.mjs" --bundle "$SELF_OUT" "$op" >/dev/null 2>&1; then
      standalone_ok "query $op"
    else
      standalone_fail "query $op"
    fi
  done
  # route + coverage-by-subject need an id
  ROUTE_ID=$(jq -r 'select(.records[0]) | .records[0].route_id' <(node "$CORE/scripts/query-atlas-navigation.mjs" --bundle "$SELF_OUT" list-routes 2>/dev/null) 2>/dev/null || true)
  if [[ -n "$ROUTE_ID" ]]; then
    node "$CORE/scripts/query-atlas-navigation.mjs" --bundle "$SELF_OUT" route --id "$ROUTE_ID" >/dev/null 2>&1 && standalone_ok "query route --id" || standalone_fail "query route --id"
  fi
fi

# ---------------------------------------------------------------------------
# Section 3: /portolan:map integration (BLOCKED if prereqs missing, not green)
# ---------------------------------------------------------------------------
echo ""
echo "=== /portolan:map integration (acceptance, not sole proof) ==="
if [[ -n "${NO_E2E:-}" ]]; then
  E2E_STATUS="skipped"
  E2E_EVIDENCE="--no-e2e flag"
  echo "  ⊘ skipped (--no-e2e)"
else
  INTAKE_FILE="$SELF/.portolan/intake.json"
  SNAPSHOT_FILE="$SELF/.portolan/system-map.json"
  if [[ ! -f "$INTAKE_FILE" ]]; then
    E2E_STATUS="blocked"
    E2E_EVIDENCE="missing prerequisite: $INTAKE_FILE"
    echo "  ⊘ blocked: $E2E_EVIDENCE"
  elif [[ ! -f "$SNAPSHOT_FILE" ]] && [[ ! -d "$SELF/.portolan/bundle" ]]; then
    E2E_STATUS="blocked"
    E2E_EVIDENCE="missing prerequisite: $SNAPSHOT_FILE (and no bundle/ to build it)"
    echo "  ⊘ blocked: $E2E_EVIDENCE"
  else
    # run /portolan:map; this builds the snapshot + nav bundle + atlas.html
    if node "$CORE/scripts/portolan-map.mjs" --target "$SELF" >/dev/null 2>&1; then
      ATLAS_HTML="$SELF/.portolan/atlas.html"
      if [[ -f "$ATLAS_HTML" ]] && grep -q "__NAV_ATLAS" "$ATLAS_HTML"; then
        E2E_STATUS="verified"
        E2E_EVIDENCE="atlas.html contains __NAV_ATLAS"
        echo "  ✓ /portolan:map produced atlas.html with nav surfaces"
      else
        E2E_STATUS="failed"
        E2E_EVIDENCE="atlas.html missing or lacks __NAV_ATLAS"
        echo "  ✗ $E2E_EVIDENCE"
      fi
    else
      E2E_STATUS="failed"
      E2E_EVIDENCE="/portolan:map exited non-zero"
      echo "  ✗ $E2E_EVIDENCE"
    fi
  fi
fi

# ---------------------------------------------------------------------------
# Section 4: summary (standalone separated from e2e)
# ---------------------------------------------------------------------------
echo ""
echo "=== SUMMARY ==="
echo "  standalone: $STANDALONE_PASS passed, $STANDALONE_FAIL failed"
echo "  /portolan:map e2e: $E2E_STATUS${E2E_EVIDENCE:+ ($E2E_EVIDENCE)}"

# Primary gate: standalone must be fully green. e2e may be blocked (not failed).
if [[ $STANDALONE_FAIL -gt 0 ]]; then
  fail "standalone generation/validation failed ($STANDALONE_FAIL check(s))"
fi
if [[ "$E2E_STATUS" == "failed" ]]; then
  fail "/portolan:map e2e failed (not merely blocked): $E2E_EVIDENCE"
fi
echo ""
echo "PASS — standalone gen+validate green; e2e=$E2E_STATUS (blocked is acceptable)"
