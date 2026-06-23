#!/usr/bin/env bash
# Query eval rubric and deterministic captain Q&A acceptance artifact.
set -euo pipefail

SELF=0
RUN=0
OUT=""
POSITIONAL=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --self) SELF=1; shift ;;
    --run) RUN=1; shift ;;
    --out) OUT=${2:-}; shift 2 ;;
    -h|--help)
      cat <<'EOF'
usage: run-query-eval.sh [--self] [--run] [--out FILE] <bundle-dir>

  --self   Use /tmp/portolan-self (real-target eval preset)
  --run    Write deterministic captain Q&A JSON artifact from bounded queries
  --out    Output file for --run (default: <bundle-dir>/captain-qna-eval.json)
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
  echo "See docs/captain-atlas/04-agent-qna-drilldown.md" >&2
  exit 2
fi

BUNDLE=$(cd "${POSITIONAL[0]}" && pwd)
ROOT=$(cd "$(dirname "$0")/.." && pwd)
Q="$ROOT/scripts/portolan-bundle-query.sh"

if [[ "$RUN" -eq 1 ]]; then
  if [[ -z "$OUT" ]]; then
    OUT="$BUNDLE/captain-qna-eval.json"
  fi
  node "$ROOT/viewer/scripts/query-eval.js" --out "$OUT" "$BUNDLE"
  echo "query-eval: wrote $OUT"
	  jq -e '
	    .scenario == "captain-agent-qna-drilldown" and
	    .verdict == "verified" and
	    .answer_count == 7 and
	    .requirements.captain_questions == 5 and
	    .requirements.selected_code_questions == 2 and
	    .requirements.raw_large_outputs_read == false and
	    .requirements.bounded_query_only == true and
	    (.answers | length == 7) and
	    (.answers | map(select(.bounded_queries | length > 0)) | length >= 6) and
	    (.answers | all(.verdict == "verified" or .verdict == "verified_with_warnings")) and
	    (.answers | map(select((.id | startswith("selected-")) and (.verdict == "verified" or .verdict == "verified_with_warnings"))) | length) == 2
	  ' "$OUT" >/dev/null
  SCORECARD="$BUNDLE/captain-atlas-scorecard.json"
  if [[ -f "$SCORECARD" && "$OUT" == "$BUNDLE/captain-qna-eval.json" ]]; then
    tmp=$(mktemp)
    jq \
      --arg qna_path "$OUT" \
      '.demo_evidence.qna_eval_path = $qna_path |
       .demo_evidence.qna_eval_status = "present" |
       (.dimensions[]? | select(.name == "drill_down") | .verdict) = "verified" |
       (.dimensions[]? | select(.name == "drill_down") | .note) = "Bounded Q&A and selected-code drill-down eval produced captain-qna-eval.json." |
       (.bdd_scenarios[]? | select(.name == "agent_qna_eval_recorded") | .verdict) = "verified" |
       (.bdd_scenarios[]? | select(.name == "agent_qna_eval_recorded") | .evidence) = $qna_path' \
      "$SCORECARD" >"$tmp"
    mv "$tmp" "$SCORECARD"
    echo "query-eval: updated $SCORECARD"
  fi
  exit 0
fi

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

# CTO questions: multi-repo landscape understanding.

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
