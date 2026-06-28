#!/usr/bin/env bash
# Smoke test for bundle-query MCP server.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
FIXTURE_TARGET="$ROOT/internal/testfixtures/portolan-bundle/target"
FIXTURE_BUNDLE=$(mktemp -d)
trap 'rm -rf "$FIXTURE_BUNDLE"' EXIT

if [[ ! -d "$ROOT/portolan-core/node_modules/@modelcontextprotocol/sdk" ]]; then
  npm --prefix "$ROOT/portolan-core" install >/dev/null 2>&1
fi

mkdir -p "$FIXTURE_BUNDLE/producers"
cp -a "$ROOT/internal/testfixtures/portolan-bundle/producers/." "$FIXTURE_BUNDLE/producers/"
"$ROOT/scripts/build-portolan-bundle.sh" "$FIXTURE_TARGET" "$FIXTURE_BUNDLE"

node "$ROOT/portolan-core/scripts/bundle-query-mcp-smoke-client.js" "$FIXTURE_BUNDLE" \
  | grep -q 'bundle-query-mcp-smoke-client: ok'

# --list-tools base + claims + repos/relationships + atlas query
PORTOLAN_BUNDLE_DIR="$FIXTURE_BUNDLE" "$ROOT/scripts/portolan-bundle-query-mcp.sh" --list-tools \
  | jq -e '
      length >= 15 and
      any(.[]; .name == "portolan_query_claim_check") and
      any(.[]; .name == "portolan_query_promotion_health") and
      any(.[]; .name == "portolan_query_promoted_facts") and
      any(.[]; .name == "portolan_query_raw_artifacts") and
      any(.[]; .name == "portolan_query_classified_sources")
    ' >/dev/null

# claims family: missing claims.jsonl must warn, not fail
"$ROOT/scripts/portolan-bundle-query.sh" claims --bundle "$FIXTURE_BUNDLE" \
  | jq -e '.records == [] and (.warnings | length) >= 1' >/dev/null

echo "harness-bundle-query-mcp-smoke: ok"
