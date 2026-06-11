#!/usr/bin/env bash
# Scaffold for query eval rubric (spec 100): prints Lane B query commands per question.
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <bundle-dir>" >&2
  echo "See docs/specs/095-bundle-query-surface/reviews/query-eval-rubric.md" >&2
  exit 2
fi

BUNDLE=$(cd "$1" && pwd)
ROOT=$(cd "$(dirname "$0")/.." && pwd)
Q="$ROOT/scripts/portolan-bundle-query.sh"

cat <<EOF
# Query eval scaffold — bundle: $BUNDLE
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

EOF
