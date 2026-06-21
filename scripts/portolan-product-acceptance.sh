#!/usr/bin/env bash
# Product acceptance gate for the installable Portolan atlas pack.
# Runs the checks that support "a user can install Portolan into Cursor/OpenCode
# and build/query a local atlas" without starting long corpus scans by default.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
RUN_AGENT_RUNTIME=1
REQUIRE_AGENT_RUNTIME=0
BIGTOP_BUNDLE=""

usage() {
  cat <<'EOF'
usage: portolan-product-acceptance.sh [options]

Options:
  --skip-agent-runtime       Do not run live Cursor/OpenCode runtime lanes.
  --require-agent-runtime    Fail if Cursor/OpenCode CLIs are unavailable or fail.
  --bigtop-bundle DIR        Also run strict bigtop-10 acceptance on an existing
                             bundle. This does not start a long Bigtop scan.
  -h, --help                 Show this help.

Default behavior:
  - checks public install/help surfaces for product wording regressions;
  - validates shell syntax, Go tests/vet, JSON schemas, viewer/query JS syntax;
  - validates generated Cursor/OpenCode install files;
  - validates the public install/scan/query route from a clean source copy;
  - runs a bounded reproducible atlas smoke on a non-Bigtop local fixture;
  - runs live Cursor/OpenCode lanes when the CLIs are available, recording
    unavailable lanes as not_assessed unless --require-agent-runtime is used;
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
    -h|--help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ -n "$BIGTOP_BUNDLE" ]]; then
  BIGTOP_BUNDLE=$(cd "$BIGTOP_BUNDLE" && pwd)
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

require_cmd() {
  local cmd=$1
  command -v "$cmd" >/dev/null 2>&1 || fail "$cmd is required for product acceptance"
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
  local banned_viewer
  banned_internal='install-agent''-harness\.sh'
  banned_public='prototype|прототип|experimental|experiment|scaffold|scaffolding|stub|mock|fake|toy|temporary|placeholder|TODO|FIXME|Demo script|hidden scaffolding|private scaffolding|no-hidden-scaffolding'
  banned_viewer='prototype|прототип|demo cockpit|hidden scaffolding|private scaffolding|no-hidden-scaffolding'
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
    -e "$banned_internal|$banned_public" \
    "$ROOT/README.md" \
    "$ROOT/docs/agent" \
    "$ROOT/docs/onboarding.md" \
    "$ROOT/docs/ru/README.md" \
    "$ROOT/harness/SKILL.md" \
    "$ROOT/harness/cursor" \
    "$ROOT/harness/opencode" \
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
  run "viewer serve syntax" node --check "$ROOT/viewer/scripts/serve.js"
  run "viewer app syntax" node --check "$ROOT/viewer/src/app.js"
  echo "==> viewer static build" >&2
  (cd "$ROOT/viewer" && node scripts/build-static.js)
}

run_harness_checks() {
  run "agent install smoke" "$ROOT/scripts/harness-agent-install-smoke.sh"
  if [[ "$RUN_AGENT_RUNTIME" -eq 1 ]]; then
    if [[ "$REQUIRE_AGENT_RUNTIME" -eq 1 ]]; then
      run "agent runtime acceptance (required)" \
        "$ROOT/scripts/harness-agent-runtime-acceptance.sh" --require all
    else
      run "agent runtime acceptance" "$ROOT/scripts/harness-agent-runtime-acceptance.sh"
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
  local tmp copy target port pid viewer_log
  tmp=$(mktemp -d)
  copy="$tmp/portolan-copy"
  target="$tmp/target"
  port=4182
  pid=""
  viewer_log="$tmp/viewer.log"
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
  test -x "$target/.portolan/bin/portolan-viewer.sh"

  "$target/.portolan/bin/portolan-scan.sh" "$target" "$target/.portolan/atlas" \
    --yes \
    --skip-install \
    --no-viewer \
    --core-only \
    --producers config,ctags \
    --shard-timeout 30 \
    --hotspot-budget 50 >/dev/null

  jq -e '.repo_count == 1 and .core_only == true' \
    "$target/.portolan/atlas/manifest.json" >/dev/null
  "$target/.portolan/bin/portolan-bundle-query.sh" repos \
    --bundle "$target/.portolan/atlas" \
    --limit 5 | jq -e '.records | length == 1' >/dev/null
  "$target/.portolan/bin/portolan-bundle-query.sh" gaps \
    --bundle "$target/.portolan/atlas" \
    --limit 5 | jq -e '.records | length == 3' >/dev/null

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

  rm -rf "$tmp"
}

run_cli_surface_checks() {
  run "portolan-scan help" "$ROOT/scripts/portolan-scan.sh" --help >/dev/null
}

run_optional_bigtop_check() {
  if [[ -n "$BIGTOP_BUNDLE" ]]; then
    run "bigtop-10 strict acceptance" "$ROOT/scripts/harness-bigtop10-acceptance.sh" "$BIGTOP_BUNDLE"
  else
    echo "==> bigtop-10 strict acceptance not_assessed (pass --bigtop-bundle DIR)" >&2
  fi
}

run_diff_check() {
  run "git diff --check" git -C "$ROOT" diff --check
  run "git diff --cached --check" git -C "$ROOT" diff --cached --check
}

run_shell_syntax
run_public_surface_checks
run_go_checks
run_schema_checks
run_viewer_checks
run_clean_copy_install_check
run_harness_checks
run_cli_surface_checks
run_optional_bigtop_check
run_diff_check

echo "portolan-product-acceptance: ok"
