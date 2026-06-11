#!/usr/bin/env bash
# Smoke test for bundle-query MCP server (spec 098).
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
FIXTURE_TARGET="$ROOT/internal/testfixtures/portolan-bundle/target"
FIXTURE_BUNDLE=$(mktemp -d)
trap 'rm -rf "$FIXTURE_BUNDLE"' EXIT

mkdir -p "$FIXTURE_BUNDLE/producers"
cp -a "$ROOT/internal/testfixtures/portolan-bundle/producers/." "$FIXTURE_BUNDLE/producers/"
"$ROOT/scripts/build-portolan-bundle.sh" "$FIXTURE_TARGET" "$FIXTURE_BUNDLE"

node "$ROOT/viewer/scripts/bundle-query-mcp-smoke-client.js" "$FIXTURE_BUNDLE" \
  | grep -q 'bundle-query-mcp-smoke-client: ok'

# --list-tools (spec 098 base + claims 106 + repos/relationships 107)
PORTOLAN_BUNDLE_DIR="$FIXTURE_BUNDLE" node "$ROOT/viewer/scripts/bundle-query-mcp.js" --list-tools \
  | jq -e 'length == 10' >/dev/null

# claims family: missing claims.jsonl must warn, not fail
node "$ROOT/viewer/scripts/bundle-query-cli.js" claims --bundle "$FIXTURE_BUNDLE" \
  | jq -e '.records == [] and (.warnings | length) >= 1' >/dev/null

echo "harness-bundle-query-mcp-smoke: ok"
