#!/usr/bin/env bash
# Scaffold for query eval rubric (spec 100/101): prints Lane B query commands per question.
set -euo pipefail

SELF=0
RUN=0
POSITIONAL=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --self) SELF=1; shift ;;
    --run) RUN=1; shift ;;
    -h|--help)
      cat <<'EOF'
usage: run-query-eval.sh [--self] [--run] <bundle-dir>

  --self   Use /tmp/portolan-self (real-target eval preset, spec 101)
  --run    Execute Lane B commands and print JSON summaries (for eval artifact)
EOF
      exit 0
      ;;
    --) shift; POSITIONAL+=("$@"); break ;;
    -*) echo "unknown option: $1" >&2; exit 2 ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

if [[ $SELF -eq 1 ]]; then
  POSITIONAL=("/tmp/portolan-self")
fi

if [[ ${#POSITIONAL[@]} -lt 1 ]]; then
  echo "usage: $0 [--self] [--run] <bundle-dir>" >&2
  echo "See docs/specs/095-bundle-query-surface/reviews/query-eval-rubric.md" >&2
  exit 2
fi

BUNDLE=$(cd "${POSITIONAL[0]}" && pwd)
ROOT=$(cd "$(dirname "$0")/.." && pwd)
Q="$ROOT/scripts/portolan-bundle-query.sh"

cat <<EOF
# Query eval run — bundle: $BUNDLE
# Lane B: run each command; cite hotspot:id / gap:id / path:line from JSON output.

Q1 worst duplication:
  $Q hotspots --bundle "$BUNDLE" --kind duplication --limit 5

Q2 config/deploy surfaces:
  $Q hotspots --bundle "$BUNDLE" --kind config --limit 20

Q3 not assessed:
  $Q gaps --bundle "$BUNDLE" --limit 30

Q4 symbol-dense file:
  $Q hotspots --bundle "$BUNDLE" --kind debt-candidate --limit 5

Q5 text in code index (example: package):
  $Q search --bundle "$BUNDLE" --q package --limit 10

Q6 symbol definition (example: Run):
  $Q symbol --bundle "$BUNDLE" --name Run --limit 5

Q7 source at top finding:
  $Q hotspots --bundle "$BUNDLE" --limit 1
  # then: $Q source --bundle "$BUNDLE" --path <path> --line <line>

Q8 dependency hubs:
  $Q hotspots --bundle "$BUNDLE" --kind dep-hub --limit 10

Q9 static smells:
  $Q hotspots --bundle "$BUNDLE" --kind static-finding --limit 10

Q10 reduce unknowns:
  $Q gaps --bundle "$BUNDLE" --limit 20
  $Q landscape --bundle "$BUNDLE" --section next_steps

# CTO questions (spec 108): multi-repo landscape understanding.

C1 what repos and what do they do:
  $Q repos --bundle "$BUNDLE" --limit 20

C2 how are repos connected:
  $Q relationships --bundle "$BUNDLE" --limit 30

C3 duplication across repo boundaries:
  $Q relationships --bundle "$BUNDLE" --type cross-repo-duplication --limit 10
  $Q hotspots --bundle "$BUNDLE" --kind duplication --limit 10

C4 riskiest repo (scope findings to one repo):
  $Q hotspots --bundle "$BUNDLE" --repo <repo-id> --limit 10

C5 agent analysis with tiers (after import-analysis-claims.sh):
  $Q claims --bundle "$BUNDLE" --limit 20
  $Q claims --bundle "$BUNDLE" --tier speculative --limit 10

C6 atlas facts for viewer/agent drill-down:
  $Q atlas --bundle "$BUNDLE" --section components --limit 10
  $Q atlas --bundle "$BUNDLE" --section edges --limit 20

EOF

if [[ "$RUN" -eq 0 ]]; then
  exit 0
fi

run_q() {
  local label=$1
  shift
  echo "--- $label ---"
  local tmp err status
  tmp=$(mktemp)
  err=$(mktemp)
  status=0
  "$@" >"$tmp" 2>"$err" || status=$?
  head -c 8000 "$tmp" || true
  if [[ -s "$err" ]]; then
    echo
    echo "stderr:"
    head -c 2000 "$err" || true
  fi
  if [[ "$status" -ne 0 ]]; then
    echo
    echo "command_exit=$status"
  fi
  rm -f "$tmp" "$err"
  echo
}

run_q "Q1 duplication" "$Q" hotspots --bundle "$BUNDLE" --kind duplication --limit 5
run_q "Q2 config" "$Q" hotspots --bundle "$BUNDLE" --kind config --limit 20
run_q "Q3 gaps" "$Q" gaps --bundle "$BUNDLE" --limit 30
run_q "Q4 debt-candidate" "$Q" hotspots --bundle "$BUNDLE" --kind debt-candidate --limit 5
run_q "Q5 search package" "$Q" search --bundle "$BUNDLE" --q package --limit 10
run_q "Q6 symbol Run" "$Q" symbol --bundle "$BUNDLE" --name Run --limit 5
run_q "Q7 top hotspot" "$Q" hotspots --bundle "$BUNDLE" --limit 1
run_q "Q8 dep-hub" "$Q" hotspots --bundle "$BUNDLE" --kind dep-hub --limit 10
run_q "Q9 static-finding" "$Q" hotspots --bundle "$BUNDLE" --kind static-finding --limit 10
run_q "Q10 gaps+next_steps" "$Q" gaps --bundle "$BUNDLE" --limit 20
run_q "Q10 landscape" "$Q" landscape --bundle "$BUNDLE" --section next_steps
run_q "C1 repos" "$Q" repos --bundle "$BUNDLE" --limit 20
run_q "C2 relationships" "$Q" relationships --bundle "$BUNDLE" --limit 30
run_q "C3 cross-repo-dup" "$Q" relationships --bundle "$BUNDLE" --type cross-repo-duplication --limit 10
FIRST_REPO=$(jq -r '.[0].id // empty' "$BUNDLE/repos.json" 2>/dev/null || true)
if [[ -n "$FIRST_REPO" ]]; then
  run_q "C4 hotspots repo=$FIRST_REPO" "$Q" hotspots --bundle "$BUNDLE" --repo "$FIRST_REPO" --limit 10
fi
run_q "C5 claims" "$Q" claims --bundle "$BUNDLE" --limit 20
run_q "C6 atlas components" "$Q" atlas --bundle "$BUNDLE" --section components --limit 10
run_q "C6 atlas edges" "$Q" atlas --bundle "$BUNDLE" --section edges --limit 20
