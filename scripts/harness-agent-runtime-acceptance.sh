#!/usr/bin/env bash
# Runtime acceptance for installed agent Portolan runtime lanes.
# This is intentionally separate from CI-friendly install smoke: it calls real
# agent CLIs when available and records unavailable lanes as not_assessed unless
# --require is used.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
HARNESS="cursor,opencode"
REQUIRE=""
TIMEOUT_SEC="${PORTOLAN_AGENT_ACCEPTANCE_TIMEOUT:-240}"
OPENCODE_MODEL="${PORTOLAN_OPENCODE_MODEL:-opencode/deepseek-v4-flash-free}"
CODEX_MODEL="${PORTOLAN_CODEX_MODEL:-}"
CLAUDE_MODEL="${PORTOLAN_CLAUDE_MODEL:-}"
OPENCODE_DANGEROUS_SKIP_PERMISSIONS=0
CLAUDE_DANGEROUS_SKIP_PERMISSIONS=0
KEEP_TMP=0
OUT_DIR=""
PREINSTALLED=0
PROMPT_MODE="exact"
FIXTURE=""
SOURCE_TARGET_ROOT=""
TARGET_SHAPE="single"
EXPECT_MIN_REPOS=1
EXPECT_RELATIONSHIP_HANDOFF="not_assessed"
EXPECT_CAPTAIN_HANDOFF="not_assessed"
SELECTED_CODE_PATH="src/index.js"
SELECTED_CODE_LINE=1

usage() {
  cat <<EOF
usage: harness-agent-runtime-acceptance.sh [options]

Options:
  --harness LIST       Comma-separated: cursor,opencode,codex,claude,all
                       (default cursor,opencode)
  --require LIST       Fail if listed runtime lanes are unavailable or fail
                       (cursor,opencode,codex,claude,all)
  --timeout SEC        Per-agent timeout (default ${TIMEOUT_SEC})
  --opencode-model ID  OpenCode model id (default ${OPENCODE_MODEL})
  --codex-model ID     Codex model id (default: Codex CLI default)
  --claude-model ID    Claude model id (default: Claude CLI default)
  --opencode-dangerously-skip-permissions
                       Pass OpenCode's permission-bypass flag. Default is off.
  --claude-dangerously-skip-permissions
                       Pass Claude's permission-bypass flag. Default is off.
  --preinstalled       Legacy compatibility lane: preinstall .portolan before
                       invoking the agent. Default is clean first-run from only
                       PORTOLAN and TARGET_ROOT.
  --prompt-mode MODE   exact, guided, or captain (default exact). exact injects the
                       deterministic command block. guided gives the agent
                       PORTOLAN/TARGET_ROOT and requires it to read
                       docs/agent/INSTALL-PROMPT.md before acting. captain uses
                       scripts/portolan-captain-prompt.sh, the public prompt
                       generator a captain would copy into an agent harness.
  --fixture NAME       Use a built-in target fixture instead of the default
                       minimal single-repo target. Supported: polyglot-service-landscape.
  --target-root DIR    Copy an external target into an isolated temp root before
                       invoking the agent. Use for local read-only rehearsals.
  --selected-code-path PATH
                       Selected-code path expected in bounded drill-down queries.
  --selected-code-line N
                       Selected-code line expected in bounded drill-down queries.
  --out DIR            Directory for lane transcripts (default isolated run dir)
  --keep-tmp           Keep isolated target roots
  -h, --help           Show this help

State labels:
  verified      lane ran, installed harness, built usable atlas, generated Q&A,
                queried repos/gaps/selected-code
  not_assessed  lane CLI was unavailable and was not required
  failed        lane was required or ran but did not satisfy the contract
EOF
}

log() { echo "agent-runtime-acceptance: $*" >&2; }
fail() { echo "agent-runtime-acceptance: FAIL: $*" >&2; exit 1; }

require_opt_value() {
  local flag=$1 val=${2:-}
  if [[ -z "$val" || "$val" == -* ]]; then
    echo "option $flag requires a value" >&2
    usage >&2
    exit 2
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --harness) require_opt_value --harness "${2:-}"; HARNESS="$2"; shift 2 ;;
    --require) require_opt_value --require "${2:-}"; REQUIRE="$2"; shift 2 ;;
    --timeout) require_opt_value --timeout "${2:-}"; TIMEOUT_SEC="$2"; shift 2 ;;
    --opencode-model) require_opt_value --opencode-model "${2:-}"; OPENCODE_MODEL="$2"; shift 2 ;;
    --codex-model) require_opt_value --codex-model "${2:-}"; CODEX_MODEL="$2"; shift 2 ;;
    --claude-model) require_opt_value --claude-model "${2:-}"; CLAUDE_MODEL="$2"; shift 2 ;;
    --opencode-dangerously-skip-permissions) OPENCODE_DANGEROUS_SKIP_PERMISSIONS=1; shift ;;
    --claude-dangerously-skip-permissions) CLAUDE_DANGEROUS_SKIP_PERMISSIONS=1; shift ;;
    --preinstalled) PREINSTALLED=1; shift ;;
    --prompt-mode) require_opt_value --prompt-mode "${2:-}"; PROMPT_MODE="$2"; shift 2 ;;
    --fixture) require_opt_value --fixture "${2:-}"; FIXTURE="$2"; shift 2 ;;
    --target-root) require_opt_value --target-root "${2:-}"; SOURCE_TARGET_ROOT="$2"; shift 2 ;;
    --selected-code-path) require_opt_value --selected-code-path "${2:-}"; SELECTED_CODE_PATH="$2"; shift 2 ;;
    --selected-code-line) require_opt_value --selected-code-line "${2:-}"; SELECTED_CODE_LINE="$2"; shift 2 ;;
    --out) require_opt_value --out "${2:-}"; OUT_DIR="$2"; shift 2 ;;
    --keep-tmp) KEEP_TMP=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if ! [[ "$TIMEOUT_SEC" =~ ^[0-9]+$ ]] || [[ "$TIMEOUT_SEC" -lt 1 ]]; then
  fail "invalid --timeout: $TIMEOUT_SEC"
fi
if ! [[ "$SELECTED_CODE_LINE" =~ ^[0-9]+$ ]] || [[ "$SELECTED_CODE_LINE" -lt 1 ]]; then
  fail "invalid --selected-code-line: $SELECTED_CODE_LINE"
fi
if [[ "$FIXTURE" == */* || "$FIXTURE" == *..* ]]; then
  fail "invalid --fixture: $FIXTURE"
fi
if [[ -n "$FIXTURE" && -n "$SOURCE_TARGET_ROOT" ]]; then
  fail "use either --fixture or --target-root, not both"
fi

case "$PROMPT_MODE" in
  exact|guided|captain) ;;
  *) fail "invalid --prompt-mode: $PROMPT_MODE" ;;
esac

if [[ "$PREINSTALLED" -eq 1 && ( "$PROMPT_MODE" == "guided" || "$PROMPT_MODE" == "captain" ) ]]; then
  fail "--prompt-mode $PROMPT_MODE requires a clean first-run target; remove --preinstalled"
fi

case "$FIXTURE" in
  "")
    ;;
  polyglot-service-landscape)
    SOURCE_TARGET_ROOT="$ROOT/internal/testfixtures/polyglot-service-landscape"
    TARGET_SHAPE="multi"
    EXPECT_MIN_REPOS=2
    EXPECT_RELATIONSHIP_HANDOFF="verified"
    EXPECT_CAPTAIN_HANDOFF="verified"
    SELECTED_CODE_PATH="repos/api-node/src/server.js"
    SELECTED_CODE_LINE=3
    ;;
  *)
    fail "unsupported --fixture: $FIXTURE"
    ;;
esac

if [[ -n "$SOURCE_TARGET_ROOT" ]]; then
  if [[ "$SOURCE_TARGET_ROOT" != /* ]]; then
    SOURCE_TARGET_ROOT="$PWD/$SOURCE_TARGET_ROOT"
  fi
  [[ -d "$SOURCE_TARGET_ROOT" ]] || fail "--target-root does not exist or is not a directory: $SOURCE_TARGET_ROOT"
  TARGET_SHAPE="${TARGET_SHAPE:-multi}"
  if [[ "$TARGET_SHAPE" == "single" ]]; then
    TARGET_SHAPE="external"
  fi
fi

has_item() {
  local list=$1 item=$2
  [[ "$list" == "all" || ",$list," == *",$item,"* ]]
}

require_lane() {
  local item=$1
  [[ -n "$REQUIRE" ]] && has_item "$REQUIRE" "$item"
}

validate_lane_list() {
  local name=$1 list=$2 allow_empty=${3:-0}
  local old_ifs=$IFS item
  if [[ -z "$list" ]]; then
    [[ "$allow_empty" -eq 1 ]] && return 0
    fail "$name cannot be empty"
  fi
  IFS=,
  for item in $list; do
    case "$item" in
      all|cursor|opencode|codex|claude) ;;
      *) IFS=$old_ifs; fail "unknown lane in $name: $item" ;;
    esac
  done
  IFS=$old_ifs
}

validate_lane_list --harness "$HARNESS"
validate_lane_list --require "$REQUIRE" 1
command -v rg >/dev/null 2>&1 || fail "rg is required for transcript assertions"
if [[ -n "$SOURCE_TARGET_ROOT" ]]; then
  command -v sha256sum >/dev/null 2>&1 || fail "sha256sum is required for target read-only manifests"
fi

TMP_PARENT=$(mktemp -d)
if [[ "$KEEP_TMP" -eq 0 ]]; then
  trap 'rm -rf "$TMP_PARENT"' EXIT
else
  log "keeping temp root $TMP_PARENT"
fi

if [[ -z "$OUT_DIR" ]]; then
  OUT_DIR="$TMP_PARENT/transcripts"
elif [[ "$OUT_DIR" != /* ]]; then
  OUT_DIR="$PWD/$OUT_DIR"
fi
mkdir -p "$OUT_DIR"

make_target() {
  local lane=$1
  local target="$TMP_PARENT/${lane}-target"
  if [[ -n "$SOURCE_TARGET_ROOT" ]]; then
    mkdir -p "$target"
    tar \
      --exclude='./.git' \
      --exclude='./.portolan' \
      --exclude='./.cursor' \
      -C "$SOURCE_TARGET_ROOT" \
      -cf - . | tar -C "$target" -xf -
    write_target_baseline "$lane" "$target"
    if [[ "$PREINSTALLED" -eq 1 ]]; then
      "$ROOT/scripts/portolan-install.sh" "$target" \
        --portolan-path "$ROOT" \
        --bundle-dir "$target/.portolan/atlas" \
        --harness "$lane" >/dev/null
      write_target_baseline "$lane" "$target"
    fi
    printf '%s\n' "$target"
    return 0
  fi
  mkdir -p "$target/src"
  git -C "$target" init -q
  printf '# Sample Service\n\nPortolan %s acceptance target.\n' "$lane" >"$target/README.md"
  printf '{"scripts":{"test":"echo ok"},"dependencies":{"express":"latest"}}\n' >"$target/package.json"
  printf 'export function hello(name) { return `hello ${name}`; }\n' >"$target/src/index.js"
  if [[ "$PREINSTALLED" -eq 1 ]]; then
    "$ROOT/scripts/portolan-install.sh" "$target" \
      --portolan-path "$ROOT" \
      --bundle-dir "$target/.portolan/atlas" \
      --harness "$lane" >/dev/null
  fi
  printf '%s\n' "$target"
}

target_hash_manifest() {
  local target=$1
  (
    cd "$target"
    find . \
      -path './.git' -prune -o \
      -path './.cursor' -prune -o \
      -path './.portolan' -prune -o \
      -name 'AGENTS.md' -prune -o \
      -name 'CLAUDE.md' -prune -o \
      -type f -print |
      LC_ALL=C sort |
      while IFS= read -r path; do
        sha256sum "${path#./}"
      done
  )
}

write_target_baseline() {
  local lane=$1 target=$2
  target_hash_manifest "$target" >"$OUT_DIR/${lane}.target-baseline.sha256"
}

prompt_text() {
  local lane=${1:-all}
  local target_root_for_prompt=${2:-'$PWD'}
  local installed_guide="AGENTS.md"
  if [[ "$lane" == "cursor" ]]; then
    installed_guide=".cursor/rules/portolan-atlas.mdc"
  fi
  if [[ "$PREINSTALLED" -eq 1 ]]; then
    cat <<'EOF'
You are in a target workspace that already has Portolan installed in .portolan/bin.

Do not browse the repository broadly. Do not run glob/find/ls over .portolan.
Do not inspect .portolan/runtime. Use only the exact commands below, then answer
with JSON.

Run this single shell block:

```bash
set -euo pipefail
TARGET_ROOT="$PWD"
BUNDLE_DIR="$TARGET_ROOT/.portolan/atlas"
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --doctor "$TARGET_ROOT" "$BUNDLE_DIR"
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "$TARGET_ROOT" "$BUNDLE_DIR" --yes --skip-install --no-viewer
"$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --status "$TARGET_ROOT" "$BUNDLE_DIR" > /tmp/portolan-status.json
jq '{status, repo_count, gap_count, core_only, viewer}' "$BUNDLE_DIR/receipt.json"
jq '{verdict, scenario, demo_evidence, degraded_states}' "$BUNDLE_DIR/captain-atlas-scorecard.json"
"$TARGET_ROOT/.portolan/bin/portolan-query-eval.sh" --run "$BUNDLE_DIR"
jq '{verdict, answer_count, requirements}' "$BUNDLE_DIR/captain-qna-eval.json"
"$TARGET_ROOT/.portolan/bin/portolan-captain-handoff.sh" "$BUNDLE_DIR"
jq '{verdict, statuses, viewer_handoff, query_handoff}' "$BUNDLE_DIR/captain-handoff.json"
sed -n '1,40p' "$BUNDLE_DIR/captain-handoff.md"
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" repos --bundle "$BUNDLE_DIR" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" gaps --bundle "$BUNDLE_DIR" --limit 20
"$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" selected-code --bundle "$BUNDLE_DIR" --path __SELECTED_CODE_PATH__ --line __SELECTED_CODE_LINE__ --limit 5
printf 'viewer_handoff=%s\n' "$TARGET_ROOT/.portolan/bin/portolan-viewer.sh --bundle $BUNDLE_DIR"
jq -n \
  --argjson manifest "$(jq '{repo_count, gap_count, core_only}' "$BUNDLE_DIR/manifest.json")" \
  --arg status_compatibility "$(jq -r '.compatibility' /tmp/portolan-status.json)" \
  --arg receipt_status "$(jq -r '.status' "$BUNDLE_DIR/receipt.json")" \
  --arg scorecard_verdict "$(jq -r '.verdict' "$BUNDLE_DIR/captain-atlas-scorecard.json")" \
  --arg qna_eval_status "$(jq -r '.verdict' "$BUNDLE_DIR/captain-qna-eval.json")" \
  --arg selected_code_status "queried" \
  --arg captain_handoff_status "$(jq -r '.verdict' "$BUNDLE_DIR/captain-handoff.json")" \
  --arg viewer_handoff "$TARGET_ROOT/.portolan/bin/portolan-viewer.sh --bundle $BUNDLE_DIR" \
  '{repo_count: $manifest.repo_count, gap_count: $manifest.gap_count, core_only: $manifest.core_only, status_compatibility: $status_compatibility, receipt_status: $receipt_status, scorecard_verdict: $scorecard_verdict, qna_eval_status: $qna_eval_status, selected_code_status: $selected_code_status, captain_handoff_status: $captain_handoff_status, viewer_handoff: $viewer_handoff, commands_ran: ["doctor","scan","status","query-eval","captain-handoff","repos","gaps","selected-code"]}'
```

Answer only JSON with repo_count, gap_count, core_only, status_compatibility,
receipt_status, scorecard_verdict, qna_eval_status, selected_code_status,
captain_handoff_status, viewer_handoff, and commands_ran. Do not modify source
files.
EOF
    return 0
  fi

  if [[ "$PROMPT_MODE" == "guided" ]]; then
    cat <<EOF
You are in a clean target workspace.

Inputs:

PORTOLAN=$ROOT
TARGET_ROOT=\$PWD

Task:

Build a Portolan captain atlas for TARGET_ROOT. Use the embedded Portolan
first-run guide below as the active guide for this headless acceptance run.
Do not try to read "\$PORTOLAN/docs/agent/INSTALL-PROMPT.md" during this run;
some harnesses block external source-tree reads from a target workspace. Default
the bundle path to "\$TARGET_ROOT/.portolan/atlas" unless that path is unsafe to
create.

Constraints:

- Ask no questions unless PORTOLAN or TARGET_ROOT is missing, the bundle path is
  unsafe, or local OSS tool execution needs explicit operator approval.
- Do not mutate target source files.
- Do not use network or credentials.
- Do not inspect .portolan/runtime after install.
- Do not load raw large JSONL outputs into chat; use installed bundle-query
  commands for bounded facts.

Required outcome:

- Install target-local Portolan wrappers for the "$lane" harness.
- After install, read target-local $installed_guide when it exists; this is the
  active installed harness guide.
- Run doctor, build the atlas, run status, generate Q&A eval, generate captain
  handoff, query repos, query gaps, and query selected-code for
  __SELECTED_CODE_PATH__ line __SELECTED_CODE_LINE__.
- Report the viewer launch command.

Embedded Portolan first-run guide:

- Set BUNDLE_DIR to "\$TARGET_ROOT/.portolan/atlas".
- Install with:
  "\$PORTOLAN/scripts/portolan-install.sh" "\$TARGET_ROOT" --harness "$lane" --bundle-dir "\$BUNDLE_DIR"
- Use only target-local commands under "\$TARGET_ROOT/.portolan/bin" after
  install.
- Run doctor before scan and status after scan.
- Generate and read captain-atlas-scorecard.json, captain-qna-eval.json,
  captain-handoff.json, and captain-handoff.md.
- Query bounded facts with portolan-bundle-query.sh before answering. Do not
  read raw large JSONL files into chat.

Answer only JSON with repo_count, gap_count, core_only, status_compatibility,
receipt_status, scorecard_verdict, qna_eval_status, selected_code_status,
captain_handoff_status, viewer_handoff, commands_ran, prompt_mode,
guide_read, clarifying_questions, and manual_interventions.
EOF
    return 0
  fi

  if [[ "$PROMPT_MODE" == "captain" ]]; then
    "$ROOT/scripts/portolan-captain-prompt.sh" \
      --portolan "$ROOT" \
      --target-root "$target_root_for_prompt"
    cat <<'EOF'

Headless acceptance output contract:

- Run the task above without asking questions because PORTOLAN is already a
  local path and TARGET_ROOT is the current local workspace.
- For the selected-code proof, use __SELECTED_CODE_PATH__ line __SELECTED_CODE_LINE__.
- Answer only JSON with repo_count, gap_count, core_only,
  status_compatibility, receipt_status, scorecard_verdict, qna_eval_status,
  selected_code_status, captain_handoff_status, viewer_handoff, commands_ran,
  prompt_mode, guide_read, clarifying_questions, and manual_interventions.
EOF
    return 0
  fi

  cat <<EOF
You are in a clean target workspace. Portolan is available at:

PORTOLAN=$ROOT
TARGET_ROOT=\$PWD

Do not ask for BUNDLE_DIR. Derive it yourself as:

BUNDLE_DIR="\$TARGET_ROOT/.portolan/atlas"

Do not browse the repository broadly. Do not run glob/find/ls over .portolan.
Do not inspect .portolan/runtime after install. Use only the exact commands
below, then answer with JSON.

Run this single shell block:

\`\`\`bash
set -euo pipefail
PORTOLAN="$ROOT"
TARGET_ROOT="\$PWD"
BUNDLE_DIR="\$TARGET_ROOT/.portolan/atlas"
"\$PORTOLAN/scripts/portolan-install.sh" "\$TARGET_ROOT" --harness "$lane"
"\$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --doctor "\$TARGET_ROOT" "\$BUNDLE_DIR"
"\$TARGET_ROOT/.portolan/bin/portolan-scan.sh" "\$TARGET_ROOT" "\$BUNDLE_DIR" --yes --skip-install --no-viewer
"\$TARGET_ROOT/.portolan/bin/portolan-scan.sh" --status "\$TARGET_ROOT" "\$BUNDLE_DIR" > /tmp/portolan-status.json
jq '{status, repo_count, gap_count, core_only, viewer}' "\$BUNDLE_DIR/receipt.json"
jq '{verdict, scenario, demo_evidence, degraded_states}' "\$BUNDLE_DIR/captain-atlas-scorecard.json"
"\$TARGET_ROOT/.portolan/bin/portolan-query-eval.sh" --run "\$BUNDLE_DIR"
jq '{verdict, answer_count, requirements}' "\$BUNDLE_DIR/captain-qna-eval.json"
"\$TARGET_ROOT/.portolan/bin/portolan-captain-handoff.sh" "\$BUNDLE_DIR"
jq '{verdict, statuses, viewer_handoff, query_handoff}' "\$BUNDLE_DIR/captain-handoff.json"
sed -n '1,40p' "\$BUNDLE_DIR/captain-handoff.md"
"\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" repos --bundle "\$BUNDLE_DIR" --limit 20
"\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" gaps --bundle "\$BUNDLE_DIR" --limit 20
"\$TARGET_ROOT/.portolan/bin/portolan-bundle-query.sh" selected-code --bundle "\$BUNDLE_DIR" --path __SELECTED_CODE_PATH__ --line __SELECTED_CODE_LINE__ --limit 5
printf 'viewer_handoff=%s\n' "\$TARGET_ROOT/.portolan/bin/portolan-viewer.sh --bundle \$BUNDLE_DIR"
jq -n \\
  --argjson manifest "\$(jq '{repo_count, gap_count, core_only}' "\$BUNDLE_DIR/manifest.json")" \\
  --arg status_compatibility "\$(jq -r '.compatibility' /tmp/portolan-status.json)" \\
  --arg receipt_status "\$(jq -r '.status' "\$BUNDLE_DIR/receipt.json")" \\
  --arg scorecard_verdict "\$(jq -r '.verdict' "\$BUNDLE_DIR/captain-atlas-scorecard.json")" \\
  --arg qna_eval_status "\$(jq -r '.verdict' "\$BUNDLE_DIR/captain-qna-eval.json")" \\
  --arg selected_code_status "queried" \\
  --arg captain_handoff_status "\$(jq -r '.verdict' "\$BUNDLE_DIR/captain-handoff.json")" \\
  --arg viewer_handoff "\$TARGET_ROOT/.portolan/bin/portolan-viewer.sh --bundle \$BUNDLE_DIR" \\
  '{repo_count: \$manifest.repo_count, gap_count: \$manifest.gap_count, core_only: \$manifest.core_only, status_compatibility: \$status_compatibility, receipt_status: \$receipt_status, scorecard_verdict: \$scorecard_verdict, qna_eval_status: \$qna_eval_status, selected_code_status: \$selected_code_status, captain_handoff_status: \$captain_handoff_status, viewer_handoff: \$viewer_handoff, commands_ran: ["install","doctor","scan","status","query-eval","captain-handoff","repos","gaps","selected-code"]}'
\`\`\`

Answer only JSON with repo_count, gap_count, core_only, status_compatibility,
receipt_status, scorecard_verdict, qna_eval_status, selected_code_status,
captain_handoff_status, viewer_handoff, and commands_ran. Do not read external
paths except PORTOLAN. Do not modify source files.
EOF
}

render_prompt_text() {
  local lane=$1 target_root_for_prompt=$2 raw
  raw=$(prompt_text "$lane" "$target_root_for_prompt")
  raw=${raw//__SELECTED_CODE_PATH__/$SELECTED_CODE_PATH}
  raw=${raw//__SELECTED_CODE_LINE__/$SELECTED_CODE_LINE}
  printf '%s\n' "$raw"
}

validate_bundle() {
  local lane=$1 target=$2 transcript=$3 prompt_file=$4
  local bundle="$target/.portolan/atlas"
  [[ -f "$bundle/manifest.json" ]] || fail "$lane did not create manifest.json"
  [[ -f "$bundle/repo-profiles.json" ]] || fail "$lane did not create repo-profiles.json"
  [[ -f "$bundle/gaps.jsonl" ]] || fail "$lane did not create gaps.jsonl"
  [[ -f "$bundle/receipt.json" ]] || fail "$lane did not create receipt.json"
  [[ -f "$bundle/captain-atlas-scorecard.json" ]] || fail "$lane did not create captain-atlas-scorecard.json"
  [[ -f "$bundle/captain-qna-eval.json" ]] || fail "$lane did not create captain-qna-eval.json"
  [[ -f "$bundle/captain-handoff.json" ]] || fail "$lane did not create captain-handoff.json"
  [[ -f "$bundle/captain-handoff.md" ]] || fail "$lane did not create captain-handoff.md"

  local repo_count gap_count core_only receipt_status receipt_target_mutation viewer_launch
  local status_json gaps_json selected_code_json query_gap_total
  repo_count=$(jq -r '.repo_count // empty' "$bundle/manifest.json")
  gap_count=$(jq -r '.gap_count // empty' "$bundle/manifest.json")
  core_only=$(jq -r '.core_only // false' "$bundle/manifest.json")
  receipt_status=$(jq -r '.status // empty' "$bundle/receipt.json")
  receipt_target_mutation=$(jq -r 'if .local_first.target_source_mutation == false then "false" else "true" end' "$bundle/receipt.json")
  viewer_launch=$(jq -r '.viewer.launch_argv // [] | join(" ")' "$bundle/receipt.json")
  [[ "$repo_count" =~ ^[0-9]+$ ]] || fail "$lane repo_count=$repo_count is not numeric"
  [[ "$repo_count" -ge "$EXPECT_MIN_REPOS" ]] ||
    fail "$lane repo_count=$repo_count (expected at least $EXPECT_MIN_REPOS)"
  [[ "$gap_count" =~ ^[0-9]+$ ]] || fail "$lane gap_count=$gap_count is not numeric"
  [[ "$core_only" == "false" ]] || fail "$lane core_only=$core_only (expected false)"
  [[ "$receipt_status" == "completed" ]] || fail "$lane receipt_status=$receipt_status (expected completed)"
  [[ "$receipt_target_mutation" == "false" ]] || fail "$lane receipt records target mutation"
  [[ "$viewer_launch" == *"portolan-viewer.sh"* && "$viewer_launch" == *"--bundle"* ]] ||
    fail "$lane receipt missing viewer handoff argv"

  status_json=$("$target/.portolan/bin/portolan-scan.sh" --status "$target" "$bundle")
  jq -e '.compatibility == "fresh" and .reusable == true and .local_first.target_source_mutation == false' \
    <<<"$status_json" >/dev/null || fail "$lane status output does not mark bundle fresh/reusable"
  jq -e \
    --arg target "$target" \
    --arg bundle "$bundle" \
    '.scenario == "captain-atlas-first-run" and
     .verdict == "verified" and
     .target.root == $target and
     .demo_evidence.bundle_path == $bundle and
     .demo_evidence.qna_eval_status == "present" and
     (.bdd_scenarios | any(.name == "agent_qna_eval_recorded" and .verdict == "verified")) and
     (.dimensions | any(.name == "install_reliability" and .verdict == "verified"))' \
    "$bundle/captain-atlas-scorecard.json" >/dev/null ||
    fail "$lane scorecard does not verify first-run bundle"
  jq -e '
    .schema_version == "0.1.0" and
    .verdict == "verified" and
    .answer_count == 7 and
    .requirements.captain_questions == 5 and
    .requirements.selected_code_questions == 2 and
    (.answers | length) == 7 and
    (.answers | all(.verdict == "verified" or .verdict == "verified_with_warnings")) and
    (.answers | map(select(.id | startswith("selected-"))) | length) == 2 and
    (.answers | map(select((.id | startswith("selected-")) and (.verdict == "verified" or .verdict == "verified_with_warnings"))) | length) == 2
  ' "$bundle/captain-qna-eval.json" >/dev/null ||
    fail "$lane Q&A eval artifact does not verify captain questions and selected-code"
  jq -e \
    --arg verdict "$EXPECT_CAPTAIN_HANDOFF" \
    --arg relationship "$EXPECT_RELATIONSHIP_HANDOFF" \
    '
	    .schema_version == "0.1.0" and
	    .scenario == "captain-atlas-handoff" and
	    .verdict == $verdict and
	    .statuses.qna_eval == "verified" and
	    .statuses.selected_code_drill_down == "verified" and
	    .statuses.relationship_drill_down == $relationship and
	    (.query_handoff | length >= 5) and
	    (.viewer_handoff | index("--bundle") != null)
	  ' "$bundle/captain-handoff.json" >/dev/null ||
	    fail "$lane captain handoff artifact does not match selected-code/relationship expectations"
  rg -q 'Portolan Captain Handoff' "$bundle/captain-handoff.md" ||
    fail "$lane captain handoff markdown missing title"
  gaps_json=$("$target/.portolan/bin/portolan-bundle-query.sh" gaps \
    --bundle "$bundle" \
    --limit 20)
  jq -e '.query.family == "gaps" and .total_records >= 1 and (.records | length) >= 1' \
    <<<"$gaps_json" >/dev/null || fail "$lane gaps query did not return visible gaps"
  query_gap_total=$(jq -r '.total_records // 0' <<<"$gaps_json")
  [[ "$query_gap_total" -ge "$gap_count" ]] ||
    fail "$lane gaps query total=$query_gap_total is smaller than manifest gap_count=$gap_count"
  selected_code_json=$("$target/.portolan/bin/portolan-bundle-query.sh" selected-code \
    --bundle "$bundle" \
    --path "$SELECTED_CODE_PATH" \
    --line "$SELECTED_CODE_LINE" \
    --limit 5)
  jq -e \
    --arg path "$SELECTED_CODE_PATH" \
    '
    .query.family == "selected-code" and
    (.records | length) >= 1 and
    (.records[0].status == "observed") and
    (.records[0].selection.input_path == $path) and
    (.records[0].selection.repo_id | length > 0) and
    (.records[0].selection.target_id | length > 0) and
    (.records[0].bounded_records.repo | length >= 1) and
    (.records[0].bounded_records.component | type == "array") and
    (.records[0].bounded_records.source | length >= 1) and
    (.records[0].bounded_records.risks | type == "array") and
    (.records[0].bounded_records.relationships | type == "array") and
    (.records[0].bounded_records.gaps | length >= 1) and
    (.records[0].routes.atlas | contains("view=atlas")) and
    (.records[0].routes.source | contains("/source?")) and
    (.records[0].follow_up_queries | any(.family == "source")) and
    (.records[0].follow_up_queries | any(.family == "relationships")) and
    (.records[0].follow_up_queries | any(.family == "atlas"))
  ' <<<"$selected_code_json" >/dev/null ||
    fail "$lane selected-code query did not return atlas drill-down context"

  if [[ "$PREINSTALLED" -eq 0 ]]; then
    [[ -f "$prompt_file" ]] || fail "$lane prompt file is missing"
    rg -q 'PORTOLAN=' "$prompt_file" || fail "$lane prompt missing PORTOLAN first-run input"
    rg -q 'TARGET_ROOT=' "$prompt_file" || fail "$lane prompt missing TARGET_ROOT first-run input"
    if [[ "$PROMPT_MODE" == "exact" ]]; then
      rg -q 'Do not ask for BUNDLE_DIR' "$prompt_file" || fail "$lane prompt does not require default BUNDLE_DIR"
    elif [[ "$PROMPT_MODE" == "guided" ]]; then
      rg -q 'Embedded Portolan first-run guide' "$prompt_file" ||
        fail "$lane guided prompt missing embedded first-run guide"
      ! rg -q 'Run this single shell block' "$prompt_file" ||
        fail "$lane guided prompt still injects an exact shell block"
      rg -q 'AGENTS\.md|portolan-atlas\.mdc|INSTALL-PROMPT\.md' "$transcript" ||
        fail "$lane guided transcript does not show the agent reading installed or source guide"
    else
      rg -q 'Build a Portolan atlas for the local target' "$prompt_file" ||
        fail "$lane captain prompt missing public captain task"
      rg -q "TARGET_ROOT=$target" "$prompt_file" ||
        fail "$lane captain prompt missing concrete target root"
      rg -q 'BUNDLE_DIR=\$\{TARGET_ROOT\}/\.portolan/atlas' "$prompt_file" ||
        fail "$lane captain prompt missing default bundle under target root"
      rg -q 'ask for explicit approval before fetching exactly that URL' "$prompt_file" ||
        fail "$lane captain prompt missing URL approval guardrail"
      rg -q 'After install, use only "\$TARGET_ROOT/\.portolan/bin"' "$prompt_file" ||
        fail "$lane captain prompt missing target-local wrapper boundary"
      rg -q 'selected-code --bundle "\$BUNDLE_DIR" --path ' "$prompt_file" ||
        fail "$lane captain prompt missing selected-code drill-down proof"
      rg -q 'Headless acceptance output contract' "$prompt_file" ||
        fail "$lane captain prompt missing headless acceptance contract"
      ! rg -q 'Run this single shell block' "$prompt_file" ||
        fail "$lane captain prompt still injects an exact shell block"
      rg -q 'AGENTS\.md|portolan-atlas\.mdc|CLAUDE\.md' "$transcript" ||
        fail "$lane captain transcript does not show the agent reading installed harness guide"
      ! rg -q 'git (clone|fetch)|curl |wget ' "$transcript" ||
        fail "$lane captain local-path run attempted network fetch"
      ! rg -q \
        -e '\$PORTOLAN_PATH/scripts/portolan-(scan|bundle-query)\.sh' \
        -e "$ROOT/scripts/portolan-(scan|bundle-query)\\.sh" \
        "$transcript" ||
        fail "$lane captain transcript uses source checkout scan/query after install"
      ! rg -q '(cat|sed|jq|node).* /(repos\.json|relationships\.jsonl|hotspots\.jsonl|gaps\.jsonl|source-files\.jsonl)' "$transcript" ||
        fail "$lane captain transcript appears to read raw large bundle files"
    fi
    rg -q 'portolan-install\.sh' "$transcript" || fail "$lane transcript missing install command"
  fi
  rg -q 'portolan-scan\.sh' "$transcript" || fail "$lane transcript missing portolan-scan.sh"
  rg -q -- '--doctor' "$transcript" || fail "$lane transcript missing doctor run"
  rg -q -- '--status' "$transcript" || fail "$lane transcript missing status run"
  rg -q 'receipt\.json' "$transcript" || fail "$lane transcript missing receipt read"
  rg -q 'captain-atlas-scorecard\.json' "$transcript" || fail "$lane transcript missing scorecard read"
  rg -q 'portolan-query-eval\.sh.*--run' "$transcript" || fail "$lane transcript missing Q&A eval run"
  rg -q 'captain-qna-eval\.json' "$transcript" || fail "$lane transcript missing Q&A eval read"
  rg -q 'portolan-captain-handoff\.sh' "$transcript" || fail "$lane transcript missing captain handoff run"
  rg -q 'captain-handoff\.md' "$transcript" || fail "$lane transcript missing captain handoff read"
  rg -q 'portolan-bundle-query\.sh.*repos --bundle' "$transcript" || fail "$lane transcript missing repos query"
  rg -q 'portolan-bundle-query\.sh.*gaps --bundle' "$transcript" || fail "$lane transcript missing gaps query"
  rg -q 'portolan-bundle-query\.sh.*selected-code.*--bundle|portolan-bundle-query\.sh.*--bundle.*selected-code' "$transcript" ||
    fail "$lane transcript missing selected-code query"
  rg -q 'portolan-viewer\.sh.*--bundle' "$transcript" || fail "$lane transcript missing viewer handoff"
  validate_target_read_only "$lane" "$target"
  write_autonomy_scorecard "$lane" "$target" "$transcript" "$prompt_file" "$repo_count" "$gap_count"
}

validate_target_read_only() {
  local lane=$1 target=$2 unexpected
  if [[ -f "$OUT_DIR/${lane}.target-baseline.sha256" ]]; then
    local current_manifest
    current_manifest="$OUT_DIR/${lane}.target-current.sha256"
    target_hash_manifest "$target" >"$current_manifest"
    diff -u "$OUT_DIR/${lane}.target-baseline.sha256" "$current_manifest" >/dev/null ||
      fail "$lane modified target source files"
    return 0
  fi

  cmp -s "$target/README.md" \
    <(printf '# Sample Service\n\nPortolan %s acceptance target.\n' "$lane") \
    || fail "$lane modified README.md"
  cmp -s "$target/package.json" \
    <(printf '{"scripts":{"test":"echo ok"},"dependencies":{"express":"latest"}}\n') \
    || fail "$lane modified package.json"
  cmp -s "$target/src/index.js" \
    <(printf 'export function hello(name) { return `hello ${name}`; }\n') \
    || fail "$lane modified src/index.js"

  unexpected=$(
    cd "$target"
    find . \
      -path './.git' -prune -o \
      -path './.cursor' -prune -o \
      -path './.portolan' -prune -o \
      -type f -print |
      sort |
      grep -Ev '^(\./AGENTS\.md|\./CLAUDE\.md|\./README\.md|\./package\.json|\./src/index\.js)$' || true
  )
  [[ -z "$unexpected" ]] || fail "$lane wrote unexpected target files: $unexpected"
}

write_autonomy_scorecard() {
  local lane=$1 target=$2 transcript=$3 prompt_file=$4 repo_count=$5 gap_count=$6
  local scorecard="$OUT_DIR/${lane}-autonomy-scorecard.json"
  local guided_status="not_assessed"
  local exact_status="not_assessed"
  local captain_status="not_assessed"
  local handoff_verdict selected_handoff_status relationship_handoff_status
  if [[ "$PROMPT_MODE" == "guided" ]]; then
    guided_status="verified"
  elif [[ "$PROMPT_MODE" == "captain" ]]; then
    captain_status="verified"
  else
    exact_status="verified"
  fi
  handoff_verdict=$(jq -r '.verdict // "not_assessed"' "$target/.portolan/atlas/captain-handoff.json")
  selected_handoff_status=$(jq -r '.statuses.selected_code_drill_down // "not_assessed"' "$target/.portolan/atlas/captain-handoff.json")
  relationship_handoff_status=$(jq -r '.statuses.relationship_drill_down // "not_assessed"' "$target/.portolan/atlas/captain-handoff.json")
  jq -n \
    --arg schema_version "0.1.0" \
    --arg scenario "agent-runtime-first-run" \
    --arg harness "$lane" \
    --arg prompt_mode "$PROMPT_MODE" \
    --arg target "$target" \
    --arg bundle "$target/.portolan/atlas" \
    --arg prompt_file "$prompt_file" \
    --arg transcript "$transcript" \
    --argjson repo_count "$repo_count" \
    --argjson gap_count "$gap_count" \
    --arg guided_status "$guided_status" \
    --arg exact_status "$exact_status" \
    --arg captain_status "$captain_status" \
    --arg handoff_verdict "$handoff_verdict" \
    --arg selected_handoff_status "$selected_handoff_status" \
    --arg relationship_handoff_status "$relationship_handoff_status" \
    '{
      schema_version: $schema_version,
      scenario: $scenario,
      verdict: "verified",
      harness: $harness,
      prompt_mode: $prompt_mode,
      target: $target,
      bundle: $bundle,
      prompt_file: $prompt_file,
      transcript: $transcript,
      repo_count: $repo_count,
      gap_count: $gap_count,
      captain_handoff_verdict: $handoff_verdict,
      manual_interventions: 0,
      clarifying_questions: {
        status: "not_assessed",
        reason: "headless runtime transcript does not reliably distinguish real clarifying questions from prose"
      },
      assertions: [
        {name: "clean_first_run", verdict: "verified"},
        {name: "target_local_install", verdict: "verified"},
        {name: "target_source_read_only", verdict: "verified"},
        {name: "captain_qna_eval", verdict: "verified"},
        {name: "captain_handoff_file", verdict: "verified"},
        {name: "selected_code_handoff", verdict: $selected_handoff_status},
        {name: "relationship_handoff", verdict: $relationship_handoff_status},
        {name: "selected_code_drilldown", verdict: "verified"},
        {name: "guided_instruction_use", verdict: $guided_status},
        {name: "captain_prompt_use", verdict: $captain_status},
        {name: "exact_command_replay", verdict: $exact_status}
      ]
    }' >"$scorecard"
}

run_cursor_lane() {
  if ! has_item "$HARNESS" cursor; then
    return 0
  fi
  if ! command -v cursor-agent >/dev/null 2>&1; then
    if require_lane cursor || [[ "$REQUIRE" == "all" ]]; then
      fail "cursor-agent unavailable"
    fi
    echo "cursor: not_assessed (cursor-agent unavailable)"
    return 0
  fi
  local target transcript prompt_file prompt rc
  target=$(make_target cursor)
  transcript="$OUT_DIR/cursor.jsonl"
  prompt_file="$OUT_DIR/cursor.prompt.txt"
  prompt=$(render_prompt_text cursor "$target")
  printf '%s\n' "$prompt" >"$prompt_file"
  timeout "$TIMEOUT_SEC" cursor-agent --print --output-format stream-json --force --trust \
    --workspace "$target" "$prompt" >"$transcript" || rc=$?
  rc=${rc:-0}
  [[ "$rc" -eq 0 ]] || fail "cursor-agent exited $rc"
  validate_bundle cursor "$target" "$transcript" "$prompt_file"
  echo "cursor: verified"
}

run_opencode_lane() {
  if ! has_item "$HARNESS" opencode; then
    return 0
  fi
  if ! command -v opencode >/dev/null 2>&1; then
    if require_lane opencode || [[ "$REQUIRE" == "all" ]]; then
      fail "opencode unavailable"
    fi
    echo "opencode: not_assessed (opencode unavailable)"
    return 0
  fi
  local target transcript prompt_file prompt rc
  target=$(make_target opencode)
  transcript="$OUT_DIR/opencode.jsonl"
  prompt_file="$OUT_DIR/opencode.prompt.txt"
  prompt=$(render_prompt_text opencode "$target")
  printf '%s\n' "$prompt" >"$prompt_file"
  local -a cmd=(timeout "$TIMEOUT_SEC" opencode run --dir "$target" --format json -m "$OPENCODE_MODEL")
  if [[ "$OPENCODE_DANGEROUS_SKIP_PERMISSIONS" -eq 1 ]]; then
    cmd+=(--dangerously-skip-permissions)
  fi
  cmd+=("$prompt")
  "${cmd[@]}" >"$transcript" || rc=$?
  rc=${rc:-0}
  [[ "$rc" -eq 0 ]] || fail "opencode exited $rc"
  validate_bundle opencode "$target" "$transcript" "$prompt_file"
  echo "opencode: verified"
}

run_codex_lane() {
  if ! has_item "$HARNESS" codex; then
    return 0
  fi
  if ! command -v codex >/dev/null 2>&1; then
    if require_lane codex || [[ "$REQUIRE" == "all" ]]; then
      fail "codex unavailable"
    fi
    echo "codex: not_assessed (codex unavailable)"
    return 0
  fi
  local target transcript prompt_file prompt rc
  target=$(make_target codex)
  transcript="$OUT_DIR/codex.jsonl"
  prompt_file="$OUT_DIR/codex.prompt.txt"
  prompt=$(render_prompt_text codex "$target")
  printf '%s\n' "$prompt" >"$prompt_file"
  local -a cmd=(timeout "$TIMEOUT_SEC" codex exec --json -C "$target" --add-dir "$ROOT" --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check)
  if [[ -n "$CODEX_MODEL" ]]; then
    cmd+=(--model "$CODEX_MODEL")
  fi
  cmd+=("$prompt")
  "${cmd[@]}" >"$transcript" || rc=$?
  rc=${rc:-0}
  [[ "$rc" -eq 0 ]] || fail "codex exited $rc"
  validate_bundle codex "$target" "$transcript" "$prompt_file"
  echo "codex: verified"
}

run_claude_lane() {
  if ! has_item "$HARNESS" claude; then
    return 0
  fi
  if ! command -v claude >/dev/null 2>&1; then
    if require_lane claude || [[ "$REQUIRE" == "all" ]]; then
      fail "claude unavailable"
    fi
    echo "claude: not_assessed (claude unavailable)"
    return 0
  fi
  local target transcript prompt_file prompt rc
  target=$(make_target claude)
  transcript="$OUT_DIR/claude.jsonl"
  prompt_file="$OUT_DIR/claude.prompt.txt"
  prompt=$(render_prompt_text claude "$target")
  printf '%s\n' "$prompt" >"$prompt_file"
  local -a cmd=(timeout "$TIMEOUT_SEC" claude --print --verbose --output-format stream-json --permission-mode bypassPermissions --add-dir "$ROOT" --no-session-persistence)
  if [[ "$CLAUDE_DANGEROUS_SKIP_PERMISSIONS" -eq 1 ]]; then
    cmd+=(--dangerously-skip-permissions)
  fi
  if [[ -n "$CLAUDE_MODEL" ]]; then
    cmd+=(--model "$CLAUDE_MODEL")
  fi
  cmd+=("$prompt")
  (cd "$target" && "${cmd[@]}") >"$transcript" || rc=$?
  rc=${rc:-0}
  [[ "$rc" -eq 0 ]] || fail "claude exited $rc"
  validate_bundle claude "$target" "$transcript" "$prompt_file"
  echo "claude: verified"
}

run_cursor_lane
run_opencode_lane
run_codex_lane
run_claude_lane

echo "agent-runtime-acceptance: ok"
