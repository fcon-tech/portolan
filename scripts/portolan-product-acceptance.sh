#!/usr/bin/env bash
# Product acceptance gate for the installable Portolan atlas pack.
# Runs the checks that support "a user can install Portolan into an agent
# harness and build/query a local atlas" without starting long corpus scans by
# default.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
RUN_AGENT_RUNTIME=1
REQUIRE_AGENT_RUNTIME=0
BIGTOP_BUNDLE=""
BIGTOP_STRESS_BUNDLE=""
SECOND_OSS_BUNDLE=""
SECOND_OSS_TARGET=""
NORTHSTAR=0
AGENT_PROMPT_MODE="exact"
AGENT_PROMPT_MODE_SET=0

usage() {
  cat <<'EOF'
usage: portolan-product-acceptance.sh [options]

Options:
  --skip-agent-runtime       Do not run live Cursor/OpenCode runtime lanes.
  --require-agent-runtime    Fail if live Cursor/OpenCode CLIs are unavailable or fail.
                             Codex/Claude lanes are run by
                             scripts/harness-agent-runtime-acceptance.sh when
                             explicitly requested.
  --bigtop-bundle DIR        Also run strict Bigtop corpus acceptance on an existing
                             bundle. This does not start a long Bigtop scan.
  --bigtop-stress-bundle DIR Run degraded Bigtop stress acceptance on an existing
                             bundle. This is explicit stress evidence, not strict
                             full-corpus proof.
  --second-oss-bundle DIR    Also validate a non-Bigtop multi-repo OSS bundle.
                             This proves repeatability on a different stack.
  --second-oss-target DIR    Also run a fresh install/scan/query/handoff proof
                             on a copied external non-Bigtop OSS target. This
                             proves repeatability from source, not only bundle
                             validation. Required by --northstar.
  --northstar                Strict Captain Atlas gate. Requires live agent
                             runtime lanes, --bigtop-bundle, and
                             --second-oss-bundle plus --second-oss-target.
                             Fails rather than reporting these as not_assessed.
  --agent-prompt-mode MODE   exact, guided, or captain for live Cursor/OpenCode
                             runtime lanes (default exact; northstar defaults
                             to captain unless explicitly set).
  -h, --help                 Show this help.

Default behavior:
  - checks public install/help surfaces for product wording regressions;
  - validates shell syntax, Go tests/vet, JSON schemas, viewer/query JS syntax;
  - validates generated Cursor/OpenCode/Codex/Claude install files;
  - validates the public install/scan/query route from a clean source copy;
  - runs a bounded reproducible atlas smoke on a non-Bigtop local fixture;
  - runs an exported multi-repo discovery smoke on a local Bigtop-like fixture;
  - runs a polyglot non-JVM multi-repo smoke on a Node + Go fixture;
  - runs a fresh installed first-run on a copied non-Portolan multi-repo target;
  - verifies full gap retention and explicit degraded evidence for repo caps;
  - attempts live Cursor/OpenCode runtime lanes, recording unavailable/failed lanes as
    degraded/not_assessed unless --require-agent-runtime is used;
  - opens supplied real Bigtop / second-OSS bundles in the atlas viewer and
    captures screenshot/checklist evidence when those bundles are provided;
  - runs a fresh source-to-atlas first-run proof on a copied external second OSS
    target when --second-oss-target is provided;
  - runs the local harness and query smoke checks;
  - checks diff whitespace.
EOF
}

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
    --skip-agent-runtime) RUN_AGENT_RUNTIME=0; shift ;;
    --require-agent-runtime) REQUIRE_AGENT_RUNTIME=1; shift ;;
    --bigtop-bundle) require_opt_value --bigtop-bundle "${2:-}"; BIGTOP_BUNDLE="$2"; shift 2 ;;
    --bigtop-stress-bundle) require_opt_value --bigtop-stress-bundle "${2:-}"; BIGTOP_STRESS_BUNDLE="$2"; shift 2 ;;
    --second-oss-bundle) require_opt_value --second-oss-bundle "${2:-}"; SECOND_OSS_BUNDLE="$2"; shift 2 ;;
    --second-oss-target) require_opt_value --second-oss-target "${2:-}"; SECOND_OSS_TARGET="$2"; shift 2 ;;
    --northstar) NORTHSTAR=1; shift ;;
    --agent-prompt-mode) require_opt_value --agent-prompt-mode "${2:-}"; AGENT_PROMPT_MODE="$2"; AGENT_PROMPT_MODE_SET=1; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ -n "$BIGTOP_BUNDLE" ]]; then
  BIGTOP_BUNDLE=$(cd "$BIGTOP_BUNDLE" && pwd)
fi
if [[ -n "$BIGTOP_STRESS_BUNDLE" ]]; then
  BIGTOP_STRESS_BUNDLE=$(cd "$BIGTOP_STRESS_BUNDLE" && pwd)
fi
if [[ -n "$SECOND_OSS_BUNDLE" ]]; then
  SECOND_OSS_BUNDLE=$(cd "$SECOND_OSS_BUNDLE" && pwd)
fi
if [[ -n "$SECOND_OSS_TARGET" ]]; then
  SECOND_OSS_TARGET=$(cd "$SECOND_OSS_TARGET" && pwd)
fi

case "$AGENT_PROMPT_MODE" in
  exact|guided|captain) ;;
  *) echo "portolan-product-acceptance: FAIL: invalid --agent-prompt-mode: $AGENT_PROMPT_MODE" >&2; exit 2 ;;
esac

if [[ "$NORTHSTAR" -eq 1 ]]; then
  RUN_AGENT_RUNTIME=1
  REQUIRE_AGENT_RUNTIME=1
  if [[ "$AGENT_PROMPT_MODE_SET" -eq 0 ]]; then
    AGENT_PROMPT_MODE="captain"
  fi
  if [[ -z "$BIGTOP_BUNDLE" ]]; then
    echo "portolan-product-acceptance: FAIL: northstar not_assessed: pass --bigtop-bundle DIR for strict full-corpus Bigtop proof" >&2
    exit 1
  fi
  if [[ -z "$SECOND_OSS_BUNDLE" ]]; then
    echo "portolan-product-acceptance: FAIL: northstar not_assessed: pass --second-oss-bundle DIR for repeatability proof on a non-Bigtop OSS ecosystem" >&2
    exit 1
  fi
  if [[ -z "$SECOND_OSS_TARGET" ]]; then
    echo "portolan-product-acceptance: FAIL: northstar not_assessed: pass --second-oss-target DIR for fresh source-to-atlas proof on a non-Bigtop OSS ecosystem" >&2
    exit 1
  fi
  if [[ -f "$SECOND_OSS_BUNDLE/manifest.json" ]]; then
    northstar_second_oss_relationships=$(jq -r '.relationship_count // 0' "$SECOND_OSS_BUNDLE/manifest.json" 2>/dev/null || echo 0)
    if [[ "$northstar_second_oss_relationships" -lt 1 ]]; then
      echo "portolan-product-acceptance: FAIL: northstar requires second OSS relationship drill-down proof; relationship_count=$northstar_second_oss_relationships" >&2
      exit 1
    fi
  fi
fi

cd "$ROOT"

run() {
  local label=$1
  shift
  echo "==> $label" >&2
  "$@"
}

fail() {
  echo "portolan-product-acceptance: FAIL: $*" >&2
  exit 1
}

mark_bundle_full_proof() {
  local bundle tmp_manifest
  bundle=$1
  tmp_manifest=$(mktemp)
  jq '.proof_profile = "full"' "$bundle/manifest.json" >"$tmp_manifest"
  mv "$tmp_manifest" "$bundle/manifest.json"
  jq -n \
    --arg bundle "$bundle" \
    '{
      schema_version:"0.1.0",
      status:"completed",
      exit_code:0,
      target:{root:"synthetic-product-acceptance-target"},
      bundle:{path:$bundle},
      local_first:{target_source_mutation:false},
      viewer:{launch_argv:["portolan-viewer.sh","--bundle",$bundle]}
    }' >"$bundle/receipt.json"
  jq -n \
    --arg bundle "$bundle" \
    '{
      schema_version:"0.1.0",
      scenario:"captain-atlas-first-run",
      verdict:"verified",
      demo_evidence:{viewer_handoff:["portolan-viewer.sh","--bundle",$bundle]}
    }' >"$bundle/captain-atlas-scorecard.json"
}

require_cmd() {
  local cmd=$1
  command -v "$cmd" >/dev/null 2>&1 || fail "$cmd is required for product acceptance"
}

hash_text_8() {
  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s' "$1" | sha256sum | cut -d' ' -f1 | cut -c1-8
  elif command -v shasum >/dev/null 2>&1; then
    printf '%s' "$1" | shasum -a 256 | cut -d' ' -f1 | cut -c1-8
  else
    fail "sha256sum or shasum is required for product acceptance"
  fi
}

repo_slug_for_path() {
  local repo=$1
  printf '%s-%s\n' "$(basename "$repo" | tr ' /' '__')" "$(hash_text_8 "$repo")"
}

choose_free_port() {
  node - <<'NODE'
const net = require('net');
const server = net.createServer();
server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  server.close(() => process.stdout.write(String(port)));
});
NODE
}

run_shell_syntax() {
  local script
  echo "==> shell syntax" >&2
  while IFS= read -r script; do
    bash -n "$script"
  done < <(find "$ROOT/scripts" -maxdepth 1 -type f -name '*.sh' | sort)
}

run_public_surface_checks() {
  local help_file
  local banned_internal
  local banned_public
  local banned_experiment_route
  local banned_release_route
  local banned_viewer
  local banned_source_route
  local banned_checkout_first
  local banned_old_northstar
  banned_internal='install-agent''-harness\.sh'
  banned_public='prototype|прототип|experimental|experiment|scaffold|scaffolding|stub|mock|fake|toy|temporary|placeholder|TODO|FIXME|Demo script|hidden scaffolding|private scaffolding|no-hidden-scaffolding'
  banned_experiment_route='Bigtop-10|bigtop-10|bigtop10|--limit-repos 10|harness-bigtop10-acceptance'
  banned_release_route='go install github\.com/fcon-tech/portolan/cmd/portolan@v0\.1\.0|source-first|source checkout bootstrap|docs/releases/v0\.1\.0\.md|v0\.1\.0 release surface'
  banned_viewer='prototype|прототип|demo cockpit|hidden scaffolding|private scaffolding|no-hidden-scaffolding'
  banned_source_route='\$PORTOLAN_PATH/scripts/portolan-scan\.sh|\$PORTOLAN_PATH/scripts/portolan-bundle-query\.sh|PORTOLAN_PATH/harness|Read PORTOLAN_PATH|scripts/portolan-scan\.sh <target|scripts/portolan-bundle-query\.sh'
  banned_checkout_first='PORTOLAN_PATH=<absolute (path to )?(this )?Portolan checkout>|PORTOLAN_PATH=<absolute local Portolan checkout>|<portolan-checkout>|portolan-checkout|source checkout installer|source checkout Portolan|From a Portolan source checkout|Из source checkout Portolan|Основной путь сейчас — source checkout|set PORTOLAN_PATH|set `PORTOLAN_PATH`|выставь PORTOLAN_PATH|установи PORTOLAN_PATH'
  banned_old_northstar='local evidence maps|evidence maps for agents|builds local evidence maps|Bigtop example'
  require_cmd rg
  help_file=$(mktemp)
  echo "==> public install help" >&2
  "$ROOT/scripts/portolan-install.sh" --help >"$help_file"
  if rg -n -i -e "$banned_internal|prototype|прототип|stub|mock|fake" "$help_file"; then
    rm -f "$help_file"
    echo "public install help exposes internal/prototype wording" >&2
    exit 1
  fi
  rm -f "$help_file"

  echo "==> public product wording" >&2
  if rg -n -i \
    -e "$banned_internal|$banned_public|$banned_old_northstar" \
    "$ROOT/README.md" \
    "$ROOT/docs/agent" \
    "$ROOT/docs/demo.md" \
    "$ROOT/docs/demo-runbook.md" \
    "$ROOT/docs/onboarding.md" \
    "$ROOT/docs/mvp.md" \
    "$ROOT/docs/product-boundary.md" \
    "$ROOT/docs/product-claims.md" \
    "$ROOT/docs/product-maturity.md" \
    "$ROOT/docs/release.md" \
    "$ROOT/docs/releases" \
    "$ROOT/docs/ru/README.md" \
    "$ROOT/docs/site" \
    "$ROOT/harness/SKILL.md" \
    "$ROOT/harness/cursor" \
    "$ROOT/harness/opencode" \
    "$ROOT/harness/codex-claude" \
    "$ROOT/scripts/portolan-install.sh" \
    --glob '!**/node_modules/**'; then
    echo "public surfaces expose prototype/internal wording" >&2
    exit 1
  fi
  if rg -n -i \
    -e "$banned_internal|$banned_viewer" \
    "$ROOT/viewer/src" \
    --glob '!**/node_modules/**'; then
    echo "viewer source exposes prototype/internal wording" >&2
    exit 1
  fi
  echo "==> public source-checkout route wording" >&2
  if rg -n \
    -e "$banned_source_route|$banned_checkout_first" \
    "$ROOT/README.md" \
    "$ROOT/docs/agent" \
    "$ROOT/docs/demo.md" \
    "$ROOT/docs/demo-runbook.md" \
    "$ROOT/docs/onboarding.md" \
    "$ROOT/docs/mvp.md" \
    "$ROOT/docs/product-boundary.md" \
    "$ROOT/docs/product-claims.md" \
    "$ROOT/docs/product-maturity.md" \
    "$ROOT/docs/release.md" \
    "$ROOT/docs/releases" \
    "$ROOT/docs/ru/README.md" \
    "$ROOT/docs/site" \
    "$ROOT/harness/SKILL.md" \
    "$ROOT/harness/cursor" \
    "$ROOT/harness/opencode" \
    "$ROOT/harness/codex-claude" \
    "$ROOT/viewer/src" \
    --glob '!**/node_modules/**'; then
    echo "public surfaces expose old source-checkout scan/query route" >&2
    exit 1
  fi
  echo "==> public release route wording" >&2
  if rg -n \
    -e "$banned_release_route" \
    "$ROOT/README.md" \
    "$ROOT/docs/agent/INSTALL.md" \
    "$ROOT/docs/agent/INSTALL.ru.md" \
    "$ROOT/docs/release.md" \
    "$ROOT/docs/releases" \
    "$ROOT/docs/ru/README.md" \
    "$ROOT/docs/site" \
    --glob '!**/node_modules/**'; then
    echo "public surfaces expose old versioned Go/source-first release route" >&2
    exit 1
  fi
  echo "==> public old experiment route wording" >&2
  if rg -n \
    -e "$banned_experiment_route" \
    "$ROOT/README.md" \
    "$ROOT/docs/agent" \
    "$ROOT/docs/demo.md" \
    "$ROOT/docs/demo-runbook.md" \
    "$ROOT/docs/onboarding.md" \
    "$ROOT/docs/mvp.md" \
    "$ROOT/docs/product-boundary.md" \
    "$ROOT/docs/product-claims.md" \
    "$ROOT/docs/product-maturity.md" \
    "$ROOT/docs/release.md" \
    "$ROOT/docs/releases" \
    "$ROOT/docs/ru/README.md" \
    "$ROOT/docs/site" \
    "$ROOT/harness/SKILL.md" \
    "$ROOT/harness/cursor" \
    "$ROOT/harness/opencode" \
    "$ROOT/harness/codex-claude" \
    "$ROOT/docs/captain-atlas" \
    --glob '!**/node_modules/**'; then
    echo "public surfaces expose old Bigtop-10/limit-repos experiment route" >&2
    exit 1
  fi
  echo "==> public first-run default bundle wording" >&2
  if rg -n \
    -e 'BUNDLE_DIR=<absolute (path to )?(empty )?bundle output directory>' \
    "$ROOT/README.md" \
    "$ROOT/docs/agent/INSTALL-PROMPT.md" \
    "$ROOT/docs/agent/INSTALL-PROMPT.ru.md" \
    "$ROOT/harness/opencode/INSTALL-PROMPT.md" \
    "$ROOT/harness/codex-claude/INSTALL-PROMPT.md" \
    --glob '!**/node_modules/**'; then
    echo "first-run prompts require BUNDLE_DIR instead of defaulting it from TARGET_ROOT" >&2
    exit 1
  fi
  rg -q 'BUNDLE_DIR.*TARGET_ROOT/\.portolan/atlas|BUNDLE_DIR.*\$TARGET_ROOT/\.portolan/atlas' "$ROOT/docs/agent/INSTALL-PROMPT.md" ||
    fail "install prompt must default BUNDLE_DIR under TARGET_ROOT"
  if rg -n \
    -e 'three absolute paths|Install Portolan from PORTOLAN_PATH|PORTOLAN_PATH into TARGET_ROOT' \
    "$ROOT/README.md" \
    "$ROOT/docs/agent/INSTALL-PROMPT.md" \
    --glob '!**/node_modules/**'; then
    echo "captain-facing prompt surfaces require resolved PORTOLAN_PATH instead of PORTOLAN + TARGET_ROOT" >&2
    exit 1
  fi
  rg -q 'portolan-captain-prompt\.sh' "$ROOT/README.md" ||
    fail "README must expose the captain prompt generator"
}

run_captain_prompt_check() {
  local tmp target out out_ru
  tmp=$(mktemp -d)
  target="$tmp/target"
  mkdir -p "$target"
  out="$tmp/prompt.txt"
  out_ru="$tmp/prompt.ru.txt"

  run "captain prompt generator syntax" bash -n "$ROOT/scripts/portolan-captain-prompt.sh"
  "$ROOT/scripts/portolan-captain-prompt.sh" \
    --portolan "https://example.invalid/portolan.git" \
    --target-root "$target" >"$out"
  "$ROOT/scripts/portolan-captain-prompt.sh" \
    --portolan "$ROOT" \
    --target-root "$target" \
    --language ru >"$out_ru"

  rg -q '^PORTOLAN=https://example\.invalid/portolan\.git$' "$out" ||
    fail "captain prompt must expose PORTOLAN as an input"
  rg -q "^TARGET_ROOT=$target$" "$out" ||
    fail "captain prompt must expose TARGET_ROOT as an input"
  rg -q 'BUNDLE_DIR=\$\{TARGET_ROOT\}/\.portolan/atlas' "$out" ||
    fail "captain prompt must default bundle under TARGET_ROOT"
  rg -q 'ask for explicit approval before fetching exactly that URL' "$out" ||
    fail "captain prompt must require approval before URL fetch"
  rg -q 'portolan-install\.sh.*--harness all --bundle-dir' "$out" ||
    fail "captain prompt must install target-local wrappers"
  rg -q 'After install, use only "\$TARGET_ROOT/\.portolan/bin"' "$out" ||
    fail "captain prompt must switch to target-local wrappers after install"
  rg -q 'Read the installed harness guide if present' "$out" ||
    fail "captain prompt must tell agents to read installed harness guides"
  rg -q 'portolan-query-eval\.sh.*--run' "$out" ||
    fail "captain prompt must generate Q&A/drill-down evidence"
  rg -q 'portolan-captain-handoff\.sh' "$out" ||
    fail "captain prompt must generate captain handoff"
  rg -q 'portolan-bundle-query\.sh.*repos --bundle' "$out" ||
    fail "captain prompt must use bounded bundle queries"
  rg -q 'portolan-bundle-query\.sh.*selected-code --bundle' "$out" ||
    fail "captain prompt must prove selected-code drill-down"
  rg -q 'unknown/cannot_verify/not_assessed' "$out" ||
    fail "captain prompt must preserve degraded states"
  rg -q '^PORTOLAN=' "$out_ru" ||
    fail "Russian captain prompt must expose PORTOLAN"
  rg -q '^TARGET_ROOT=' "$out_ru" ||
    fail "Russian captain prompt must expose TARGET_ROOT"
  rg -q 'установленный harness guide' "$out_ru" ||
    fail "Russian captain prompt must tell agents to read installed harness guides"
  rg -q 'portolan-bundle-query\.sh.*selected-code --bundle' "$out_ru" ||
    fail "Russian captain prompt must prove selected-code drill-down"
  if rg -n \
    -e 'PORTOLAN_PATH=<|BUNDLE_DIR=<|three absolute paths|Install Portolan from PORTOLAN_PATH|set PORTOLAN_PATH|set `PORTOLAN_PATH`|выставь PORTOLAN_PATH|установи PORTOLAN_PATH' \
    "$out" "$out_ru"; then
    fail "captain prompt output exposes old required PORTOLAN_PATH/BUNDLE_DIR placeholders"
  fi
}

run_captain_atlas_checks() {
  echo "==> captain-atlas docs" >&2
  local required=(
    "$ROOT/docs/captain-atlas/README.md"
    "$ROOT/docs/captain-atlas/00-product-contract.md"
    "$ROOT/docs/captain-atlas/01-cursor-composer-first-run.md"
    "$ROOT/docs/captain-atlas/02-atlas-app-shell.md"
    "$ROOT/docs/captain-atlas/03-landscape-intelligence-producers.md"
    "$ROOT/docs/captain-atlas/04-agent-qna-drilldown.md"
    "$ROOT/docs/captain-atlas/05-packaging-qol-security.md"
    "$ROOT/docs/captain-atlas/06-oss-kill-gates.md"
  )
  local path
  for path in "${required[@]}"; do
    [[ -f "$path" ]] || fail "missing captain-atlas package: $path"
  done
  local oss_scorecard="$ROOT/docs/captain-atlas/oss-kill-gates-scorecard.json"
  [[ -f "$oss_scorecard" ]] || fail "missing OSS kill-gates scorecard: $oss_scorecard"
  jq -e '
    .scenario == "captain-atlas-oss-kill-gates" and
    (.rows | type == "array") and
    (.rows | length >= 12) and
    ([.rows[].id] as $ids |
      (["understand-anything","codegraph-class","repomix-class","serena-class","sourcegraph-cody-class","backstage-class","graph-layout-class","semgrep","jscpd","syft-cyclonedx","ctags","semantic-index-class"] - $ids) == []
    ) and
    (.rows | all(
      (.id | length > 0) and
      (.capability | length > 0) and
      (.candidate | length > 0) and
      (.status | IN("run","inspected","partially_inspected","not_assessed")) and
      (.fit | length > 0) and
      (.license | length > 0) and
      (.local_first | length > 0) and
      (.privacy | length > 0) and
      (.integration_cost | length > 0) and
      (.recommendation | IN("kill","pack","build")) and
      (.portolan_boundary | length > 0)
    )) and
    (.rows | map(select(.recommendation == "build" and (.status != "run" and .status != "inspected"))) | length == 0) and
    (.rows | any(.recommendation == "pack")) and
    (.rows | any(.status == "not_assessed"))
  ' "$oss_scorecard" >/dev/null ||
    fail "OSS kill-gates scorecard is missing required capability decisions or evidence states"
  local removed_path
  local removed_paths=(
    "$ROOT/.specify"
    "$ROOT/docs/specs"
    "$ROOT/docs/product-backlog.md"
    "$ROOT/docs/speckit-workflow.md"
    "$ROOT/.agents/skills/portolan-spec-delivery/SKILL.md"
  )
  for removed_path in "${removed_paths[@]}"; do
    [[ ! -e "$removed_path" ]] || fail "removed planning artifact is present: $removed_path"
  done
  if find "$ROOT/.agents/skills" -maxdepth 1 -type d -name 'speckit-*' 2>/dev/null | grep -q .; then
    fail "removed Speckit skill directories are present under .agents/skills"
  fi
  rg -q '^## Package Ownership$' "$ROOT/docs/captain-atlas/README.md" ||
    fail "captain-atlas index must define package ownership"
  for path in "${required[@]:1}"; do
    rg -q '^## Implementation Slice$' "$path" ||
      fail "captain-atlas package lacks implementation slice: $path"
    rg -q '^- Owned surfaces:' "$path" ||
      fail "captain-atlas package lacks owned surfaces: $path"
    rg -q '^- First vertical slice:' "$path" ||
      fail "captain-atlas package lacks first vertical slice: $path"
    rg -q '^- Verify:' "$path" ||
      fail "captain-atlas package lacks verification line: $path"
  done
  local removed_product_patterns
  removed_product_patterns='Spec''Kit|spec''kit|product-''backlog|docs/''specs|\.''specify'
  if rg -n -i "$removed_product_patterns" \
    "$ROOT/AGENTS.md" \
    "$ROOT/README.md" \
    "$ROOT/CONTRIBUTING.md" \
    "$ROOT/docs/captain-atlas" \
    "$ROOT/docs/agent" \
    "$ROOT/docs/ru" \
    "$ROOT/docs/onboarding.md" \
    "$ROOT/docs/product-claims.md" \
    "$ROOT/harness" \
    "$ROOT/viewer/scripts" \
    "$ROOT/viewer/src" \
    "$ROOT/scripts" \
    --glob '!portolan-product-acceptance.sh' \
    --glob '!**/node_modules/**'; then
    fail "active product docs still reference removed spec/backlog machinery"
  fi
  local old_numbered_spec_patterns
  old_numbered_spec_patterns='\bspec [0-9]{2,3}\b'
  if rg -n -i -e "$old_numbered_spec_patterns" \
    "$ROOT/AGENTS.md" \
    "$ROOT/README.md" \
    "$ROOT/CONTRIBUTING.md" \
    "$ROOT/docs/captain-atlas" \
    "$ROOT/docs/agent" \
    "$ROOT/docs/ru" \
    "$ROOT/docs/onboarding.md" \
    "$ROOT/docs/product-claims.md" \
    "$ROOT/harness" \
    "$ROOT/viewer/scripts" \
    "$ROOT/viewer/src" \
    "$ROOT/scripts" \
    --glob '!portolan-product-acceptance.sh' \
    --glob '!**/node_modules/**'; then
    fail "active runtime/public surfaces still reference old numbered specs"
  fi
}

run_test_corpora_archive_checks() {
  echo "==> test-corpora legacy archive boundaries" >&2
  local legacy_files
  legacy_files=$(rg -l 'context prepare|portolan map' "$ROOT/docs/test-corpora" 2>/dev/null || true)
  if [[ -n "$legacy_files" ]]; then
    while IFS= read -r path; do
      [[ -z "$path" ]] && continue
      case "$path" in
        "$ROOT/docs/test-corpora/apache-bigtop/examples/"*)
          ;;
        *)
          fail "legacy context/map route appears outside the archival Bigtop examples: $path"
          ;;
      esac
    done <<<"$legacy_files"
    rg -q -i 'archival excerpts' "$ROOT/docs/test-corpora/apache-bigtop/examples/README.md" ||
      fail "Bigtop legacy examples must be labeled archival"
    rg -q -i 'not current acceptance proof' "$ROOT/docs/test-corpora/apache-bigtop/examples/README.md" ||
      fail "Bigtop legacy examples must say they are not current acceptance proof"
  fi
}

run_go_checks() {
  run "go test ./..." go test ./...
  run "go vet ./..." go vet ./...
}

run_schema_checks() {
  run "json schema syntax" jq empty \
    "$ROOT"/schema/*.json \
    "$ROOT"/harness/contracts/*.schema.json
}

run_viewer_checks() {
  run "viewer/query JS syntax" node --check "$ROOT/viewer/scripts/bundle-query.js"
  run "viewer/query CLI syntax" node --check "$ROOT/viewer/scripts/bundle-query-cli.js"
  run "viewer/query MCP syntax" node --check "$ROOT/viewer/scripts/bundle-query-mcp.js"
  run "viewer/query eval syntax" node --check "$ROOT/viewer/scripts/query-eval.js"
  run "viewer serve syntax" node --check "$ROOT/viewer/scripts/serve.js"
  run "viewer app syntax" node --check "$ROOT/viewer/src/app.js"
  echo "==> viewer static build" >&2
  (cd "$ROOT/viewer" && node scripts/build-static.js)
  run "viewer first-paint smoke" "$ROOT/scripts/harness-viewer-first-paint-smoke.sh"
}

run_harness_checks() {
  run "agent install smoke" "$ROOT/scripts/harness-agent-install-smoke.sh"
  if [[ "$RUN_AGENT_RUNTIME" -eq 1 ]]; then
    local runtime_args=(
      --harness cursor,opencode
      --prompt-mode "$AGENT_PROMPT_MODE"
    )
    if [[ "$AGENT_PROMPT_MODE" == "captain" ]]; then
      # Headless OpenCode cannot ask the operator to approve the local Portolan
      # source checkout read. Acceptance still verifies no network fetch, no
      # target source mutation, and no post-install source-checkout scan/query.
      runtime_args+=(--opencode-dangerously-skip-permissions)
    fi
    if [[ "$NORTHSTAR" -eq 1 ]]; then
      runtime_args+=(--fixture polyglot-service-landscape)
    fi
    if [[ "$REQUIRE_AGENT_RUNTIME" -eq 1 ]]; then
      run "agent runtime acceptance (required)" \
        "$ROOT/scripts/harness-agent-runtime-acceptance.sh" \
          --require cursor,opencode \
          "${runtime_args[@]}"
    else
      echo "==> agent runtime acceptance" >&2
      if ! "$ROOT/scripts/harness-agent-runtime-acceptance.sh" \
          "${runtime_args[@]}"; then
        echo "agent runtime acceptance: degraded/not_assessed (rerun with --require-agent-runtime to fail on live Cursor/OpenCode lane failures)" >&2
      fi
    fi
  else
    echo "==> agent runtime acceptance skipped" >&2
  fi
  run "harness portolan smoke" "$ROOT/scripts/harness-portolan-smoke.sh"
  local repro_dir
  repro_dir=$(mktemp -d)
  run "reproducible atlas smoke" \
    "$ROOT/scripts/harness-reproducible-atlas-smoke.sh" \
    "$ROOT/internal/testfixtures/portolan-bundle/target" \
    "$repro_dir/repro-bundle"
  rm -rf "$repro_dir"
}

run_clean_copy_install_check() {
  echo "==> clean source-copy install smoke" >&2
  local tmp copy target port pid viewer_log scan_log
  tmp=$(mktemp -d)
  copy="$tmp/portolan-copy"
  target="$tmp/target"
  port=$(choose_free_port)
  pid=""
  viewer_log="$tmp/viewer.log"
  scan_log="$tmp/scan.log"
  mkdir -p "$copy" "$target"

  tar \
    --exclude='./.git' \
    --exclude='./.portolan' \
    --exclude='./viewer/node_modules' \
    --exclude='./viewer/dist' \
    -cf - . | tar -C "$copy" -xf -

  git -C "$target" init -q
  printf '# Portolan Install Target\n\nA target outside the Portolan checkout.\n' >"$target/README.md"

  "$copy/scripts/portolan-install.sh" "$target" \
    --harness all \
    --portolan-path "$copy" >/dev/null
  test -x "$target/.portolan/bin/portolan-scan.sh"
  test -x "$target/.portolan/bin/portolan-bundle-query.sh"
  test -x "$target/.portolan/bin/portolan-query-eval.sh"
  test -x "$target/.portolan/bin/portolan-import-analysis-claims.sh"
  test -x "$target/.portolan/bin/portolan-viewer.sh"
  test -f "$target/CLAUDE.md"
  test -x "$target/.portolan/runtime/portolan/scripts/portolan-scan.sh"
  test -f "$target/.portolan/runtime/portolan/.portolan-runtime.json"
  if rg -q 'PORTOLAN_PATH=|harness/SKILL\.md|harness/recipes' \
    "$target/.cursor/rules/portolan-atlas.mdc" "$target/AGENTS.md" "$target/CLAUDE.md"; then
    fail "installed agent instructions expose source-checkout guidance"
  fi
  if rg -q -F "$copy" "$target/.cursor/rules/portolan-atlas.mdc" "$target/AGENTS.md" "$target/CLAUDE.md"; then
    fail "installed agent instructions expose the Portolan source-copy path"
  fi
  if rg -q -F "$copy" "$target/.portolan/bin"; then
    fail "installed command wrappers depend on the source-copy path"
  fi
  mv "$copy" "$tmp/portolan-copy-removed"

  "$target/.portolan/bin/portolan-scan.sh" \
    --doctor \
    "$target" \
    "$target/.portolan/atlas" \
    --skip-install \
    --no-viewer \
    --producers config,ctags >/dev/null
  [[ ! -e "$target/.portolan/atlas" ]] ||
    fail "doctor created the bundle directory"
  "$target/.portolan/bin/portolan-scan.sh" \
    --dry-run \
    "$target" \
    "$target/.portolan/atlas" \
    --skip-install \
    --no-viewer \
    --producers config,ctags >/dev/null
  [[ ! -e "$target/.portolan/atlas" ]] ||
    fail "dry-run created the bundle directory"
  "$target/.portolan/bin/portolan-scan.sh" \
    --status \
    "$target" \
    "$target/.portolan/atlas" |
    jq -e '.exists == false and .compatibility == "missing" and .local_first.read_only == true' >/dev/null
  [[ ! -e "$target/.portolan/atlas" ]] ||
    fail "status created the bundle directory"
  if "$target/.portolan/bin/portolan-scan.sh" \
    --clean \
    "$target" \
    "$target" >/dev/null 2>&1; then
    fail "clean accepted unsafe target root"
  fi

  "$target/.portolan/bin/portolan-scan.sh" "$target" "$target/.portolan/atlas" \
    --yes \
    --skip-install \
    --no-viewer \
    --core-only \
    --producers config,ctags \
    --shard-timeout 30 \
    --hotspot-budget 50 >"$scan_log" 2>&1 &
  pid=$!
  local saw_running=0
  for _ in $(seq 1 50); do
    if "$target/.portolan/bin/portolan-scan.sh" \
      --status \
      "$target" \
      "$target/.portolan/atlas" |
      jq -e '.compatibility == "running" and .progress.exists == true and (.progress.phase | length > 0) and .local_first.read_only == true' >/dev/null; then
      saw_running=1
      break
    fi
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.1
  done
  if ! wait "$pid"; then
    pid=""
    sed 's/^/scan-wrapper: /' "$scan_log" >&2
    fail "installed scan wrapper failed"
  fi
  pid=""
  [[ "$saw_running" -eq 1 ]] ||
    fail "installed scan wrapper never exposed live running status"

  jq -e '.repo_count == 1 and .core_only == true' \
    "$target/.portolan/atlas/manifest.json" >/dev/null
  jq -e \
    --arg target "$target" \
    --arg bundle "$target/.portolan/atlas" \
    '.status == "completed" and .target.root == $target and .bundle.path == $bundle and .local_first.target_source_mutation == false' \
    "$target/.portolan/atlas/receipt.json" >/dev/null
  jq -e \
    --arg target "$target" \
    --arg bundle "$target/.portolan/atlas" \
    '.scenario == "captain-atlas-first-run" and
     .verdict == "verified" and
     .target.root == $target and
     .target.repo_count == 1 and
     .demo_evidence.bundle_path == $bundle and
     (.first_useful_captain_insight.summary | length > 0) and
     (.captain_next.open.status == "verified") and
     (.next_actions | type == "array") and
     (.acceptance_assertions.first_run_handoff.status == "verified") and
     (.acceptance_assertions.first_user_visible_value.status == "verified") and
     (.acceptance_assertions.failures_have_next_actions.status == "verified") and
     (.acceptance_assertions.local_first_safety.status == "verified") and
     (.bdd_scenarios | any(.name == "receipt_records_run" and .verdict == "verified")) and
     (.bdd_scenarios | any(.name == "agent_qna_eval_recorded" and .verdict == "not_assessed")) and
     (.dimensions | any(.name == "agent_autonomy" and .verdict == "not_assessed")) and
     (.dimensions | any(.name == "install_reliability" and .verdict == "verified")) and
     (.kill_pack_build.recommendation == "pack-and-navigate")' \
    "$target/.portolan/atlas/captain-atlas-scorecard.json" >/dev/null
  "$target/.portolan/bin/portolan-scan.sh" \
    --status \
    "$target" \
    "$target/.portolan/atlas" |
    jq -e \
      --arg target "$target" \
      --arg bundle "$target/.portolan/atlas" \
      '.exists == true and
       .compatibility == "fresh" and
       .reusable == true and
       .target == $target and
       .bundle == $bundle and
       .progress.status == "completed" and
       .receipt.status == "completed" and
       .gaps.count == 3 and
       (.producer_states | length >= 1) and
       .manifest.summary.repo_count == 1 and
       .manifest.summary.repo_discovered_total == 1 and
       .manifest.summary.gaps_total == 3 and
       .manifest.summary.hotspot_count >= 0 and
       .manifest.summary.hotspots_total >= .manifest.summary.hotspot_count' >/dev/null
  "$target/.portolan/bin/portolan-bundle-query.sh" repos \
    --bundle "$target/.portolan/atlas" \
    --limit 5 | jq -e '.records | length == 1' >/dev/null
  "$target/.portolan/bin/portolan-bundle-query.sh" gaps \
    --bundle "$target/.portolan/atlas" \
    --limit 20 | jq -e '
      .total_records >= 4 and
      (.records | any(.id == "gap-deps")) and
      (.records | any((.id // "") | startswith("gap-promotion-health-")))
    ' >/dev/null
  local claims_file
  claims_file="$tmp/claims.jsonl"
  printf '%s\n' \
    '{"id":"acceptance-claim","claim_tier":"speculative","statement":"Acceptance smoke claim.","subject":"landscape","cited_refs":[],"agent":"portolan-product-acceptance","evidence_state":"claim-only"}' \
    >"$claims_file"
  "$target/.portolan/bin/portolan-import-analysis-claims.sh" \
    "$target/.portolan/atlas" \
    "$claims_file" >/dev/null
  jq -e '.accepted_count == 1 and .rejected_count == 0' \
    "$target/.portolan/atlas/claims-import-report.json" >/dev/null
  "$target/.portolan/bin/portolan-query-eval.sh" --run "$target/.portolan/atlas" >/dev/null
  jq -e '
    .scenario == "captain-agent-qna-drilldown" and
    .verdict == "verified" and
    .answer_count == 7 and
    .requirements.captain_questions == 5 and
    .requirements.selected_code_questions == 2 and
    .requirements.raw_large_outputs_read == false and
    .requirements.bounded_query_only == true and
    ([.answers[] | select(.id | startswith("captain-"))] | length == 5) and
    ([.answers[] | select(.id | startswith("selected-"))] | length == 2) and
    (.answers | all(.verdict == "verified" or .verdict == "verified_with_warnings")) and
    (.answers | map(select((.id | startswith("selected-")) and (.verdict == "verified" or .verdict == "verified_with_warnings"))) | length == 2) and
    (.answers | all(.bounded_queries | all(.command | contains("portolan-bundle-query.sh")))) and
    (.answers | any((.citations | length) > 0)) and
    (.answers | any((.routes | length) > 0))
  ' "$target/.portolan/atlas/captain-qna-eval.json" >/dev/null
  jq -e --arg query_bin "$target/.portolan/bin/portolan-bundle-query.sh" '
    .demo_evidence.qna_eval_status == "present" and
    (.bdd_scenarios | any(.name == "agent_qna_eval_recorded" and .verdict == "verified"))
  ' "$target/.portolan/atlas/captain-atlas-scorecard.json" >/dev/null
  "$target/.portolan/bin/portolan-captain-handoff.sh" "$target/.portolan/atlas" >/dev/null
  jq --arg query_bin "$target/.portolan/bin/portolan-bundle-query.sh" -e '
    .schema_version == "0.1.0" and
    .scenario == "captain-atlas-handoff" and
    .verdict == "not_assessed" and
    .statuses.scan == "completed" and
    .statuses.scorecard == "verified" and
    .statuses.qna_eval == "verified" and
    .statuses.drill_down == "verified" and
    .statuses.selected_code_drill_down == "verified" and
    .statuses.relationship_drill_down == "not_assessed" and
    (.query_handoff | length >= 5) and
    (.query_handoff | all(.[]; startswith("\u0027" + $query_bin + "\u0027"))) and
    (.viewer_handoff | index("--bundle") != null) and
    (.evidence.receipt | endswith("receipt.json")) and
    (.evidence.scorecard | endswith("captain-atlas-scorecard.json")) and
    (.evidence.qna_eval | endswith("captain-qna-eval.json")) and
    .evidence.query_health.required_queries_ok == true
  ' "$target/.portolan/atlas/captain-handoff.json" >/dev/null
  rg -q 'Portolan Captain Handoff' "$target/.portolan/atlas/captain-handoff.md"
  rg -q 'Query Handoff' "$target/.portolan/atlas/captain-handoff.md"
  node - "$target/.portolan/atlas" <<'NODE'
const bundle = process.argv[2];
const bundleQuery = require('./viewer/scripts/bundle-query');
const handoff = require('./viewer/scripts/captain-handoff');

const originalDispatch = bundleQuery.dispatch;
bundleQuery.dispatch = (bundlePath, family, opts) => {
  if (family === 'repos') {
    throw new Error('forced repos failure');
  }
  return originalDispatch(bundlePath, family, opts);
};

const report = handoff.buildHandoff(bundle);
if (report.verdict !== 'not_assessed') {
  console.error(`expected not_assessed when a required query fails, got ${report.verdict}`);
  process.exit(1);
}
if (report.evidence?.query_health?.required_queries_ok !== false) {
  console.error('expected required_queries_ok=false');
  process.exit(1);
}
if (!(report.evidence?.query_warnings || []).some((warning) => warning.includes('forced repos failure'))) {
  console.error('expected forced required query warning');
  process.exit(1);
}

const fallbackMarkdown = handoff.renderMarkdown({
  verdict: 'not_assessed',
  bundle_path: '/tmp/portolan fallback $(touch /tmp/portolan-fallback-pwn)',
  target: { root: '/tmp/target root $(touch /tmp/portolan-target-pwn)' },
  counts: { repos: 0, relationships: 0, hotspots: 0, gaps: 0, qna_answers: 0 },
  first_useful_captain_insight: {},
  statuses: {},
  viewer_handoff: [],
  query_handoff: [],
  next_actions: [],
  evidence: {},
});
if (fallbackMarkdown.includes('portolan-viewer.sh --bundle /tmp/portolan fallback $(')) {
  console.error('expected fallback viewer command to be shell-quoted');
  process.exit(1);
}
NODE

  "$target/.portolan/bin/portolan-viewer.sh" \
    --bundle "$target/.portolan/atlas" \
    --port "$port" >"$viewer_log" 2>&1 &
  pid=$!
  sleep 1
  if ! curl -sf "http://127.0.0.1:$port/" | grep -q '<title>Portolan Atlas</title>'; then
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
    sed 's/^/viewer-wrapper: /' "$viewer_log" >&2
    fail "installed viewer wrapper did not serve the viewer HTML"
  fi
  if ! curl -sf "http://127.0.0.1:$port/bundle/manifest.json" |
    jq -e '.repo_count == 1 and .core_only == true' >/dev/null; then
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
    sed 's/^/viewer-wrapper: /' "$viewer_log" >&2
    fail "installed viewer wrapper did not serve the expected manifest"
  fi
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
  pid=""

  "$target/.portolan/bin/portolan-scan.sh" \
    --clean \
    "$target" \
    "$target/.portolan/atlas" |
    jq -e '.removed == true and .local_first.target_source_mutation == false' >/dev/null
  [[ ! -e "$target/.portolan/atlas" ]] ||
    fail "clean did not remove generated bundle"
  [[ -f "$target/README.md" ]] ||
    fail "clean removed target source"

  rm -rf "$tmp"
}

run_exported_multirepo_fixture_check() {
  echo "==> exported multi-repo fixture discovery" >&2
  local tmp bundle doctor_out fixture
  tmp=$(mktemp -d)
  bundle="$tmp/bigtop-fixture-bundle"
  doctor_out="$tmp/doctor.txt"
  fixture="$ROOT/internal/testfixtures/apache-bigtop-landscape"

  "$ROOT/scripts/portolan-scan.sh" \
    --doctor \
    "$fixture" \
    "$bundle" \
    --skip-install \
    --no-viewer \
    --core-only \
    --producers config,ctags >"$doctor_out"
  rg -q 'shape: 2 repo\(s\)' "$doctor_out" ||
    fail "doctor did not recognize the exported multi-repo fixture"
  rg -q 'multi-repo exported corpus discovered under target' "$doctor_out" ||
    fail "doctor did not explain exported corpus discovery"

  "$ROOT/scripts/portolan-scan.sh" "$fixture" "$bundle" \
    --yes \
    --skip-install \
    --no-viewer \
    --producers config,ctags \
    --shard-timeout 30 \
    --hotspot-budget 80 >/dev/null

  jq -e '.repo_count == 2 and .relationship_count >= 2 and .hotspot_count >= 1 and .core_only == false and .kind_counts.config >= 1' \
    "$bundle/manifest.json" >/dev/null
  jq -e '
    .scenario == "captain-atlas-first-run" and
    .verdict == "verified" and
    .target.repo_count == 2 and
    .coverage.relationship_count >= 2 and
    (.first_useful_captain_insight.summary | length > 0) and
    (.captain_next.inspect_first.route | length > 0) and
    (.acceptance_assertions.first_run_handoff.status == "verified") and
    (.acceptance_assertions.local_first_safety.status == "verified") and
    (.dimensions | any(.name == "scale" and .verdict == "verified")) and
    (.dimensions | any(.name == "portability" and .verdict == "not_assessed"))
  ' "$bundle/captain-atlas-scorecard.json" >/dev/null
  jq -e 'map(.name) | (index("apache-bigtop-repo") != null) and (index("apache-hadoop") != null)' \
    "$bundle/repos.json" >/dev/null
  jq -e '.identity.repo_count == 2' \
    "$bundle/landscape-card.json" >/dev/null
  jq -s -e '
    map(.type) as $types |
    ($types | index("depends-on") != null) and
    ($types | index("uses-image") != null)
  ' "$bundle/relationships.jsonl" >/dev/null
  jq -e 'select(.kind == "config" and (.paths | any(endswith("docker-compose.yml"))))' \
    "$bundle/hotspots.jsonl" >/dev/null
  if jq -e 'select(.kind == "debt-candidate" and (.paths | any(endswith("package.json"))))' \
    "$bundle/hotspots-full.jsonl" >/dev/null; then
    fail "manifest files leaked into symbol-density risk ranking"
  fi

  rm -rf "$tmp"
}

run_polyglot_multirepo_fixture_check() {
  echo "==> polyglot non-JVM fixture discovery" >&2
  local tmp bundle doctor_out fixture
  tmp=$(mktemp -d)
  bundle="$tmp/polyglot-bundle"
  doctor_out="$tmp/doctor.txt"
  fixture="$ROOT/internal/testfixtures/polyglot-service-landscape"

  "$ROOT/scripts/portolan-scan.sh" \
    --doctor \
    "$fixture" \
    "$bundle" \
    --skip-install \
    --no-viewer \
    --core-only \
    --producers config,ctags >"$doctor_out"
  rg -q 'shape: 2 repo\(s\)' "$doctor_out" ||
    fail "doctor did not recognize the polyglot multi-repo fixture"
  rg -q 'multi-repo exported corpus discovered under target' "$doctor_out" ||
    fail "doctor did not explain polyglot exported corpus discovery"

  "$ROOT/scripts/portolan-scan.sh" "$fixture" "$bundle" \
    --yes \
    --skip-install \
    --no-viewer \
    --producers config,ctags \
    --shard-timeout 30 \
    --hotspot-budget 80 >/dev/null

  jq -e '.repo_count == 2 and .relationship_count >= 2 and .hotspot_count >= 1 and .core_only == false and .kind_counts.config >= 1' \
    "$bundle/manifest.json" >/dev/null
  jq -e '
    .scenario == "captain-atlas-first-run" and
    .verdict == "verified" and
    .target.repo_count == 2 and
    .coverage.relationship_count >= 2 and
    (.first_useful_captain_insight.summary | length > 0) and
    (.captain_next.inspect_first.route | length > 0) and
    (.acceptance_assertions.first_run_handoff.status == "verified") and
    (.acceptance_assertions.local_first_safety.status == "verified") and
    (.dimensions | any(.name == "scale" and .verdict == "verified")) and
    (.kill_pack_build.recommendation == "pack-and-navigate")
  ' "$bundle/captain-atlas-scorecard.json" >/dev/null
  jq -e 'map(.name) | (index("api-node") != null) and (index("worker-go") != null)' \
    "$bundle/repos.json" >/dev/null
  jq -e '
    [.repos[] | (.purpose.manifests // [])[] | .type] as $types |
    ($types | index("npm") != null) and
    ($types | index("gomod") != null)
  ' "$bundle/repo-profiles.json" >/dev/null
  jq -e '.coverage.repo_count == 2 and .coverage.component_count == 2' \
    "$bundle/atlas-facts.json" >/dev/null
  jq -s -e '
    map(.type) as $types |
    ($types | index("depends-on") != null) and
    ($types | index("uses-image") != null)
  ' "$bundle/relationships.jsonl" >/dev/null
  jq -e 'select(.kind == "config" and (.paths | any(endswith("docker-compose.yml"))))' \
    "$bundle/hotspots.jsonl" >/dev/null
  if jq -e 'select(.kind == "debt-candidate" and ((.paths // []) | any(test("(package.json|go.mod)$"))))' \
    "$bundle/hotspots-full.jsonl" >/dev/null; then
    fail "polyglot manifest files leaked into symbol-density risk ranking"
  fi

  rm -rf "$tmp"
}

run_fresh_multirepo_first_run_check() {
  echo "==> fresh installed multi-repo first-run" >&2
  local tmp target bundle port pid viewer_log doctor_out api_repo worker_repo selected_api selected_worker rels_json
  tmp=$(mktemp -d)
  target="$tmp/polyglot-target"
  bundle="$target/.portolan/atlas"
  viewer_log="$tmp/viewer.log"
  doctor_out="$tmp/doctor.txt"
  pid=""
  cp -a "$ROOT/internal/testfixtures/polyglot-service-landscape" "$target"

  "$ROOT/scripts/portolan-install.sh" "$target" \
    --harness all \
    --portolan-path "$ROOT" >/dev/null
  test -x "$target/.portolan/bin/portolan-scan.sh"
  test -x "$target/.portolan/bin/portolan-bundle-query.sh"
  test -x "$target/.portolan/bin/portolan-query-eval.sh"
  test -x "$target/.portolan/bin/portolan-captain-handoff.sh"
  test -x "$target/.portolan/bin/portolan-viewer.sh"

  "$target/.portolan/bin/portolan-scan.sh" \
    --doctor \
    "$target" \
    "$bundle" \
    --skip-install \
    --no-viewer \
    --producers config,ctags >"$doctor_out"
  rg -q 'shape: 2 repo\(s\)' "$doctor_out" ||
    fail "fresh multi-repo first-run doctor did not see two repos"
  rg -q 'multi-repo exported corpus discovered under target' "$doctor_out" ||
    fail "fresh multi-repo first-run doctor did not explain exported multi-repo discovery"

  "$target/.portolan/bin/portolan-scan.sh" "$target" "$bundle" \
    --yes \
    --skip-install \
    --no-viewer \
    --producers config,ctags \
    --shard-timeout 30 \
    --hotspot-budget 80 >/dev/null

  jq -e \
    --arg target "$target" \
    '.target_root == $target and
     .repo_count == 2 and
     .repo_discovered_total == 2 and
     .repo_limit_applied == 0 and
     .relationship_count >= 2 and
     .core_only == false' \
    "$bundle/manifest.json" >/dev/null
  jq -e \
    --arg target "$target" \
    --arg bundle "$bundle" \
    '.status == "completed" and
     .target.root == $target and
     .bundle.path == $bundle and
     .local_first.target_source_mutation == false and
     (.viewer.launch_argv | index("--bundle") != null)' \
    "$bundle/receipt.json" >/dev/null
  jq -e '
    .scenario == "captain-atlas-first-run" and
    .verdict == "verified" and
    .target.repo_count == 2 and
    .coverage.relationship_count >= 2 and
    (.dimensions | any(.name == "scale" and .verdict == "verified")) and
    (.acceptance_assertions.first_run_handoff.status == "verified") and
    (.acceptance_assertions.local_first_safety.status == "verified")
  ' "$bundle/captain-atlas-scorecard.json" >/dev/null

  "$target/.portolan/bin/portolan-query-eval.sh" --run "$bundle" >/dev/null
  jq -e '
    .scenario == "captain-agent-qna-drilldown" and
    .verdict == "verified" and
    (.answers | map(select((.id | startswith("selected-")) and .verdict == "verified")) | length == 2)
  ' "$bundle/captain-qna-eval.json" >/dev/null
  "$target/.portolan/bin/portolan-captain-handoff.sh" "$bundle" >/dev/null
  jq --arg query_bin "$target/.portolan/bin/portolan-bundle-query.sh" -e '
    .scenario == "captain-atlas-handoff" and
    .verdict == "verified" and
    .counts.repos == 2 and
	    .counts.relationships >= 2 and
	    .statuses.qna_eval == "verified" and
	    .statuses.drill_down == "verified" and
	    .statuses.selected_code_drill_down == "verified" and
	    .statuses.relationship_drill_down == "verified" and
	    (.query_handoff | all(.[]; startswith("\u0027" + $query_bin + "\u0027")))
	  ' "$bundle/captain-handoff.json" >/dev/null

  api_repo=$(jq -r '.[] | select(.name == "api-node") | .id' "$bundle/repos.json")
  worker_repo=$(jq -r '.[] | select(.name == "worker-go") | .id' "$bundle/repos.json")
  [[ -n "$api_repo" && -n "$worker_repo" && "$api_repo" != "$worker_repo" ]] ||
    fail "fresh multi-repo first-run did not preserve distinct api/worker repo ids"

  selected_api=$("$target/.portolan/bin/portolan-bundle-query.sh" selected-code \
    --bundle "$bundle" \
    --repo "$api_repo" \
    --path src/server.js \
    --line 1 \
    --limit 5)
  selected_worker=$("$target/.portolan/bin/portolan-bundle-query.sh" selected-code \
    --bundle "$bundle" \
    --repo "$worker_repo" \
    --path cmd/worker/main.go \
    --line 1 \
    --limit 5)
  jq -e --arg repo "$api_repo" '
    .query.family == "selected-code" and
    .records[0].status == "observed" and
    .records[0].selection.repo_id == $repo and
    (.records[0].routes.atlas | contains("view=atlas")) and
    (.records[0].routes.source | contains("/source?repo=" + $repo)) and
    (.records[0].bounded_records.repo | length == 1) and
    (.records[0].bounded_records.component | length == 1) and
    (.records[0].bounded_records.source | length >= 1) and
    (.records[0].bounded_records.relationships | length >= 1) and
    (.records[0].bounded_records.gaps | length >= 1)
  ' <<<"$selected_api" >/dev/null
  jq -e --arg repo "$worker_repo" '
    .query.family == "selected-code" and
    .records[0].status == "observed" and
    .records[0].selection.repo_id == $repo and
    (.records[0].routes.atlas | contains("view=atlas")) and
    (.records[0].routes.source | contains("/source?repo=" + $repo)) and
    (.records[0].bounded_records.repo | length == 1) and
    (.records[0].bounded_records.component | length == 1) and
    (.records[0].bounded_records.source | length >= 1) and
    (.records[0].bounded_records.relationships | length >= 1) and
    (.records[0].bounded_records.gaps | length >= 1)
  ' <<<"$selected_worker" >/dev/null

  rels_json=$("$target/.portolan/bin/portolan-bundle-query.sh" relationships \
    --bundle "$bundle" \
    --repo "$api_repo" \
    --limit 20)
  jq -e --arg api "$api_repo" --arg worker "$worker_repo" '
    .total_records >= 2 and
    (.records | any(.from_repo == $api and .to_repo == $worker and (.routes.from_atlas | contains($api)) and (.routes.to_atlas | contains($worker))))
  ' <<<"$rels_json" >/dev/null

  port=$(choose_free_port)
  "$target/.portolan/bin/portolan-viewer.sh" \
    --bundle "$bundle" \
    --port "$port" >"$viewer_log" 2>&1 &
  pid=$!
  for _ in $(seq 1 80); do
    if curl -sf "http://127.0.0.1:$port/" >/dev/null 2>&1; then
      break
    fi
    kill -0 "$pid" 2>/dev/null || {
      sed 's/^/viewer-wrapper: /' "$viewer_log" >&2
      fail "fresh multi-repo viewer exited before readiness"
    }
    sleep 0.1
  done
  curl -sf "http://127.0.0.1:$port/" | grep -q '<title>Portolan Atlas</title>' ||
    fail "fresh multi-repo viewer did not serve atlas HTML"
  curl -sf "http://127.0.0.1:$port/bundle/manifest.json" |
    jq -e '.repo_count == 2 and .relationship_count >= 2' >/dev/null ||
    fail "fresh multi-repo viewer did not serve expected manifest"
  curl -sf "http://127.0.0.1:$port/bundle/captain-handoff.json" |
    jq -e '.scenario == "captain-atlas-handoff" and .verdict == "verified" and .counts.repos == 2 and .statuses.relationship_drill_down == "verified"' >/dev/null ||
    fail "fresh multi-repo viewer did not serve verified captain handoff"
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
  pid=""

  rm -rf "$tmp"
}

run_nested_git_container_check() {
  echo "==> nested git container discovery" >&2
  local tmp target bundle doctor_out
  tmp=$(mktemp -d)
  target="$tmp/enterprise-root"
  bundle="$tmp/nested-git-bundle"
  doctor_out="$tmp/doctor.txt"
  mkdir -p "$target/repos/service-a" "$target/repos/service-b"
  git -C "$target" init -q
  for service in service-a service-b; do
    git -C "$target/repos/$service" init -q
    printf '{"name":"%s"}\n' "$service" >"$target/repos/$service/package.json"
    mkdir -p "$target/repos/$service/src"
    printf 'export function run() { return "%s"; }\n' "$service" >"$target/repos/$service/src/index.js"
  done

  "$ROOT/scripts/portolan-scan.sh" \
    --doctor \
    "$target" \
    "$bundle" \
    --skip-install \
    --no-viewer \
    --core-only \
    --producers config,ctags >"$doctor_out"
  rg -q 'shape: 2 repo\(s\)' "$doctor_out" ||
    fail "doctor collapsed nested git repos into the parent root"

  "$ROOT/scripts/portolan-scan.sh" "$target" "$bundle" \
    --yes \
    --skip-install \
    --no-viewer \
    --producers config,ctags \
    --shard-timeout 30 \
    --hotspot-budget 80 >/dev/null
  jq -e '.repo_count == 2 and .repo_discovered_total == 2' \
    "$bundle/manifest.json" >/dev/null
  jq -e 'map(.name) | (index("service-a") != null) and (index("service-b") != null)' \
    "$bundle/repos.json" >/dev/null
  jq -e '.target.repo_count == 2 and .verdict == "verified"' \
    "$bundle/captain-atlas-scorecard.json" >/dev/null

  rm -rf "$tmp"
}

run_gap_retention_and_cap_check() {
  echo "==> gap retention and repo-cap degradation" >&2
  local tmp target bundle
  tmp=$(mktemp -d)
  target="$tmp/target"
  bundle="$tmp/bundle"
  mkdir -p "$target/repos" "$bundle/producers/jscpd"

  local i
  for i in $(seq -w 1 25); do
    mkdir -p "$target/repos/repo-$i"
    printf '{"name":"repo-%s"}\n' "$i" >"$target/repos/repo-$i/package.json"
  done

  PORTOLAN_GAP_BUDGET=20 "$ROOT/scripts/build-portolan-bundle.sh" \
    "$target" \
    "$bundle" >/dev/null
  jq -e '.repo_count == 25 and .gap_count == 20 and .gap_budget == 20 and .gaps_truncated == 1 and .gaps_total > .gap_count' \
    "$bundle/manifest.json" >/dev/null
  test -f "$bundle/gaps-full.jsonl" ||
    fail "gaps-full.jsonl was not written for over-budget gaps"
  local full_count
  full_count=$(wc -l <"$bundle/gaps-full.jsonl" | tr -d ' ')
  jq -e --argjson full_count "$full_count" '.gaps_total == $full_count' \
    "$bundle/manifest.json" >/dev/null
  local strict_out
  strict_out="$tmp/strict-bigtop.txt"
  mark_bundle_full_proof "$bundle"
  if "$ROOT/scripts/harness-bigtop-acceptance.sh" "$bundle" >"$strict_out" 2>&1; then
    fail "strict Bigtop harness accepted a gap-truncated bundle"
  fi
  rg -q 'gaps are truncated; strict full Bigtop acceptance is not assessed' "$strict_out" ||
    fail "strict Bigtop harness did not explain gap truncation as degraded evidence"

  rm -rf "$bundle"
  PORTOLAN_LIMIT_REPOS=2 "$ROOT/scripts/build-portolan-bundle.sh" \
    "$target" \
    "$bundle" >/dev/null
  jq -e '.repo_count == 2 and .repo_discovered_total == 25 and .repo_limit_applied == 1' \
    "$bundle/manifest.json" >/dev/null
  jq -e '
    select(.id == "gap-repository-inventory-limit" and
      .surface == "repository-inventory" and
      .status == "cannot_verify" and
      (.summary | test("non_exhaustive")) and
      (.summary | test("2 of 25")))
  ' "$bundle/gaps-full.jsonl" >/dev/null
  strict_out="$tmp/strict-bigtop-cap.txt"
  mark_bundle_full_proof "$bundle"
  if "$ROOT/scripts/harness-bigtop-acceptance.sh" "$bundle" >"$strict_out" 2>&1; then
    fail "strict Bigtop harness accepted a repo-capped bundle"
  fi
  rg -q 'repository inventory is non-exhaustive' "$strict_out" ||
    fail "strict Bigtop harness did not explain repo cap as degraded evidence"

  local coverage_target coverage_bundle coverage_repo coverage_slug
  coverage_target="$tmp/coverage-target"
  coverage_bundle="$tmp/coverage-bundle"
  coverage_repo="$coverage_target/repos/repo-a"
  mkdir -p "$coverage_repo/src" "$coverage_bundle/producers/jscpd"
  printf '{"name":"repo-a"}\n' >"$coverage_repo/package.json"
  printf 'export function a() { return 1; }\n' >"$coverage_repo/src/a.js"
  coverage_repo=$(cd "$coverage_repo" && pwd)
  coverage_slug=$(repo_slug_for_path "$coverage_repo")
  mkdir -p "$coverage_bundle/producers/jscpd/$coverage_slug/src"
  printf '{"duplicates":[]}\n' >"$coverage_bundle/producers/jscpd/$coverage_slug/src/jscpd-report.json"
  jq -n \
    --arg repo "$coverage_repo" \
    --arg slug "$coverage_slug" \
    '{schema_version:"0.1.0",repo_path:$repo,repo_slug:$slug,status:"non_exhaustive",coverage_mode:"stratified",file_count:5,segment_total:4,segment_limit:2,selected_segment_count:2,report_count:1,truncated_segments:true}' \
    >"$coverage_bundle/producers/jscpd/$coverage_slug/_coverage.json"
  "$ROOT/scripts/build-portolan-bundle.sh" "$coverage_target" "$coverage_bundle" >/dev/null
  jq -e '
    select(
      ((.id // "") | startswith("gap-duplication-stratified-")) and
      .status == "cannot_verify" and
      (.summary | test("selected 2 of 4"))
    )
  ' "$coverage_bundle/gaps-full.jsonl" >/dev/null ||
    fail "stratified per-repo jscpd coverage did not become an explicit cannot_verify gap"

  local cross_target cross_bundle cross_root
  cross_target="$tmp/cross-target"
  cross_bundle="$tmp/cross-bundle"
  cross_root="$cross_bundle/producers/jscpd-cross"
  mkdir -p "$cross_target/repos/repo-a" "$cross_target/repos/repo-b" "$cross_root"
  printf '{"name":"repo-a"}\n' >"$cross_target/repos/repo-a/package.json"
  printf '{"name":"repo-b"}\n' >"$cross_target/repos/repo-b/package.json"
  jq -n \
    '{schema_version:"0.1.0",completed_at:"2026-06-22T00:00:00Z",coverage_mode:"stratified",pairs_total:1,pairs_ok:1,pairs_failed:0,clone_pairs:0,files_per_repo_limit:1500,truncated_repo_count:2,pair_limit_applied:0,resolution_limit:"synthetic stratified coverage"}' \
    >"$cross_root/_scan.json"
  "$ROOT/scripts/build-portolan-bundle.sh" "$cross_target" "$cross_bundle" >/dev/null
  jq -e '.cross_repo_duplication.status == "stratified" and .cross_repo_duplication.truncated_repo_count == 2' \
    "$cross_bundle/manifest.json" >/dev/null ||
    fail "stratified cross-repo jscpd coverage did not reach manifest"
  jq -e '
    select(.id == "gap-cross-repo-dup-stratified" and .status == "cannot_verify")
  ' "$cross_bundle/gaps-full.jsonl" >/dev/null ||
    fail "stratified cross-repo jscpd coverage did not become an explicit cannot_verify gap"

  rm -rf "$tmp"
}

run_cli_surface_checks() {
  local help_out err_out
  help_out=$(mktemp)
  err_out=$(mktemp)
  run "portolan-scan help" "$ROOT/scripts/portolan-scan.sh" --help >"$help_out"
  rg -q -- '--proof-profile NAME' "$help_out" ||
    fail "portolan-scan help must expose --proof-profile"
  if "$ROOT/scripts/portolan-scan.sh" "$ROOT/internal/testfixtures/portolan-bundle/target" "$(mktemp -d)" \
    --proof-profile nope --skip-install --no-viewer >"$err_out" 2>&1; then
    rm -f "$help_out" "$err_out"
    fail "portolan-scan accepted invalid --proof-profile"
  fi
  rg -q 'invalid --proof-profile' "$err_out" ||
    fail "invalid proof-profile error is not explicit"
  if "$ROOT/scripts/portolan-scan.sh" "$ROOT/internal/testfixtures/portolan-bundle/target" "$(mktemp -d)" \
    --proof-profile full --limit-repos 1 --skip-install --no-viewer >"$err_out" 2>&1; then
    rm -f "$help_out" "$err_out"
    fail "portolan-scan accepted --proof-profile full with --limit-repos"
  fi
  rg -q -- '--proof-profile full cannot be combined with --limit-repos' "$err_out" ||
    fail "full proof profile + repo cap rejection is not explicit"
  rm -f "$help_out" "$err_out"
}

verify_captain_handoff() {
  local label=$1 bundle=$2 require_relationship_drilldown=${3:-1}
  [[ -f "$bundle/receipt.json" ]] || fail "$label receipt.json missing; cannot verify captain handoff"
  [[ -f "$bundle/captain-atlas-scorecard.json" ]] ||
    fail "$label captain-atlas-scorecard.json missing; cannot verify captain handoff"
  [[ -f "$bundle/captain-qna-eval.json" ]] || fail "$label captain-qna-eval.json missing"
  [[ -f "$bundle/captain-handoff.json" ]] || fail "$label captain-handoff.json missing"
  [[ -f "$bundle/captain-handoff.md" ]] || fail "$label captain-handoff.md missing"
  if [[ "$require_relationship_drilldown" -eq 1 ]]; then
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
	      (.viewer_handoff | length >= 1)
	    ' "$bundle/captain-handoff.json" >/dev/null ||
	      fail "$label captain handoff is not verified for selected-code and relationship drill-down"
	    local relationship_query
	    relationship_query=$("$ROOT/scripts/portolan-bundle-query.sh" relationships --bundle "$bundle" --limit 20)
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
	      fail "$label relationship query does not expose a navigable direct endpoint or cohort route"
  else
    jq -e '
    .scenario == "captain-atlas-handoff" and
    .statuses.qna_eval == "verified" and
    .statuses.drill_down == "verified" and
    .statuses.selected_code_drill_down == "verified" and
    (.query_handoff | length >= 5) and
    (.viewer_handoff | length >= 1)
    ' "$bundle/captain-handoff.json" >/dev/null ||
      fail "$label captain handoff is not verified for selected-code drill-down"
  fi
  rg -q 'Portolan Captain Handoff' "$bundle/captain-handoff.md" ||
    fail "$label captain handoff markdown missing title"
}

run_optional_bigtop_check() {
  if [[ -n "$BIGTOP_BUNDLE" ]]; then
    run "strict Bigtop corpus acceptance" "$ROOT/scripts/harness-bigtop-acceptance.sh" "$BIGTOP_BUNDLE"
    verify_captain_handoff "Bigtop corpus" "$BIGTOP_BUNDLE" 1
  else
    echo "==> full Bigtop corpus acceptance not_assessed (pass --bigtop-bundle DIR)" >&2
  fi
  if [[ -n "$BIGTOP_STRESS_BUNDLE" ]]; then
    run "Bigtop corpus stress acceptance" "$ROOT/scripts/harness-bigtop-acceptance.sh" --allow-degraded "$BIGTOP_STRESS_BUNDLE"
  else
    echo "==> degraded Bigtop stress acceptance not_assessed (pass --bigtop-stress-bundle DIR)" >&2
  fi
}

run_optional_second_oss_check() {
  if [[ -z "$SECOND_OSS_BUNDLE" ]]; then
    echo "==> second OSS ecosystem acceptance not_assessed (pass --second-oss-bundle DIR)" >&2
    return 0
  fi

  echo "==> second OSS ecosystem acceptance" >&2
  local bundle target_root repo_count repo_discovered_total repo_limit_applied gap_count gaps_total
  bundle="$SECOND_OSS_BUNDLE"
  [[ -d "$bundle" ]] || fail "second OSS bundle directory missing: $bundle"
  [[ -f "$bundle/manifest.json" ]] || fail "second OSS manifest.json missing"
  [[ -f "$bundle/repos.json" ]] || fail "second OSS repos.json missing"
  [[ -f "$bundle/repo-profiles.json" ]] || fail "second OSS repo-profiles.json missing"
  [[ -f "$bundle/atlas-facts.json" ]] || fail "second OSS atlas-facts.json missing"
  [[ -f "$bundle/landscape-card.json" ]] || fail "second OSS landscape-card.json missing"
  [[ -f "$bundle/captain-atlas-scorecard.json" ]] || fail "second OSS captain-atlas-scorecard.json missing"

  target_root=$(jq -r '.target_root // empty' "$bundle/manifest.json")
  [[ -n "$target_root" ]] || fail "second OSS manifest target_root missing"
  case "$target_root" in
    "$ROOT"/internal/testfixtures/*)
      fail "second OSS bundle points at internal testfixture, not a real external corpus: $target_root"
      ;;
  esac
  if printf '%s\n' "$target_root" | grep -Eiq 'bigtop'; then
    fail "second OSS bundle target appears to be Bigtop: $target_root"
  fi

  repo_count=$(jq -r '.repo_count // 0' "$bundle/manifest.json")
  repo_discovered_total=$(jq -r '.repo_discovered_total // .repo_count // 0' "$bundle/manifest.json")
  repo_limit_applied=$(jq -r '.repo_limit_applied // 0' "$bundle/manifest.json")
  gap_count=$(jq -r '.gap_count // 0' "$bundle/manifest.json")
  gaps_total=$(jq -r '.gaps_total // .gap_count // 0' "$bundle/manifest.json")
  [[ "$repo_count" -ge 2 ]] || fail "second OSS corpus must be multi-repo, got repo_count=$repo_count"
  [[ "$(jq 'length' "$bundle/repos.json")" -eq "$repo_count" ]] ||
    fail "second OSS repos.json length differs from manifest repo_count"
  [[ "$repo_discovered_total" -eq "$repo_count" ]] ||
    fail "second OSS repository inventory is non-exhaustive: repo_count=$repo_count discovered=$repo_discovered_total"
  [[ "$repo_limit_applied" -eq 0 ]] ||
    fail "second OSS repository cap applied"
  [[ "$gaps_total" -ge "$gap_count" ]] ||
    fail "second OSS manifest gaps_total is smaller than gap_count"
  if [[ "$NORTHSTAR" -eq 1 ]]; then
    local relationship_count
    relationship_count=$(jq -r '.relationship_count // 0' "$bundle/manifest.json")
    [[ "$relationship_count" -ge 1 ]] ||
      fail "northstar requires second OSS relationship drill-down proof; relationship_count=$relationship_count"
  fi

  jq -e \
    '.scenario == "captain-atlas-first-run" and
     .verdict == "verified" and
     .target.repo_count >= 2 and
     (.dimensions | any(.name == "install_reliability" and .verdict == "verified")) and
     (.dimensions | any(.name == "atlas_usefulness" and .verdict == "verified")) and
     (.kill_pack_build.recommendation == "pack-and-navigate")' \
    "$bundle/captain-atlas-scorecard.json" >/dev/null ||
    fail "second OSS scorecard does not verify captain-atlas bundle usefulness"
  if [[ "$NORTHSTAR" -eq 1 ]]; then
    verify_captain_handoff "second OSS corpus" "$bundle" 1
  else
    verify_captain_handoff "second OSS corpus" "$bundle" 0
  fi

  "$ROOT/scripts/validate-atlas-schemas.sh" "$bundle" >/dev/null
  "$ROOT/scripts/portolan-bundle-query.sh" repos --bundle "$bundle" --limit 5 |
    jq -e '.records | length >= 2' >/dev/null ||
    fail "second OSS repos query did not return multiple repos"
  "$ROOT/scripts/portolan-bundle-query.sh" gaps --bundle "$bundle" --limit 20 |
    jq -e '.query.family == "gaps" and .total_records >= 0' >/dev/null ||
    fail "second OSS gaps query failed"
  "$ROOT/scripts/portolan-bundle-query.sh" relationships --bundle "$bundle" --limit 20 |
    jq -e '.query.family == "relationships"' >/dev/null ||
    fail "second OSS relationships query failed"
}

run_optional_fresh_second_oss_first_run_check() {
  if [[ -z "$SECOND_OSS_TARGET" ]]; then
    echo "==> fresh second OSS first-run acceptance not_assessed (pass --second-oss-target DIR)" >&2
    return 0
  fi

  local tmp bundle out
  tmp=$(mktemp -d)
  bundle="$tmp/fresh-second-oss-bundle"
  out="$tmp/fresh-second-oss-out"
  mkdir -p "$bundle" "$out"
  run "fresh second OSS first-run acceptance" \
    "$ROOT/scripts/harness-real-second-oss-first-run.sh" \
    --target-root "$SECOND_OSS_TARGET" \
    --bundle-dir "$bundle" \
    --out-dir "$out" \
    --viewer-smoke
}

run_optional_viewer_corpus_check() {
  if [[ -z "$BIGTOP_BUNDLE" && -z "$SECOND_OSS_BUNDLE" ]]; then
    echo "==> real corpus viewer acceptance not_assessed (pass --bigtop-bundle DIR and/or --second-oss-bundle DIR)" >&2
    return 0
  fi

  local args output_dir
  args=()
  output_dir=$(mktemp -d)
  if [[ -n "$BIGTOP_BUNDLE" ]]; then
    args+=(--bigtop-bundle "$BIGTOP_BUNDLE")
  fi
  if [[ -n "$SECOND_OSS_BUNDLE" ]]; then
    args+=(--second-oss-bundle "$SECOND_OSS_BUNDLE")
  fi
  if [[ "$NORTHSTAR" -eq 1 && -n "$SECOND_OSS_BUNDLE" ]]; then
    args+=(--require-second-oss-relationships)
  fi
  run "real corpus viewer acceptance" \
    "$ROOT/scripts/harness-viewer-corpus-smoke.sh" \
    "${args[@]}" \
    --output-dir "$output_dir"
}

run_diff_check() {
  run "git diff --check" git -C "$ROOT" diff --check
  run "git diff --cached --check" git -C "$ROOT" diff --cached --check
}

run_shell_syntax
run_public_surface_checks
run_captain_prompt_check
run_captain_atlas_checks
run_test_corpora_archive_checks
run_go_checks
run_schema_checks
run_viewer_checks
run_clean_copy_install_check
run_exported_multirepo_fixture_check
run_polyglot_multirepo_fixture_check
run_fresh_multirepo_first_run_check
run_nested_git_container_check
run_gap_retention_and_cap_check
run_harness_checks
run_cli_surface_checks
run_optional_bigtop_check
run_optional_second_oss_check
run_optional_fresh_second_oss_first_run_check
run_optional_viewer_corpus_check
run_diff_check

echo "portolan-product-acceptance: ok"
