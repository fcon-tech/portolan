#!/usr/bin/env bash
# Optional map-bridge path on fixture target. Slow-ish; not part of default harness smoke.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
FIXTURE_TARGET="$ROOT/internal/testfixtures/portolan-bundle/target"
BUNDLE=$(mktemp -d)

trap 'rm -rf "$BUNDLE"' EXIT

"$ROOT/scripts/portolan-scan.sh" "$FIXTURE_TARGET" "$BUNDLE" \
  --no-viewer --yes --skip-install --producers config,ctags --with-map-bridge

if [[ -d "$BUNDLE/map-bridge" ]] && [[ -f "$BUNDLE/map-bridge/summary.json" ]]; then
  jq empty "$BUNDLE/map-bridge/summary.json"
  echo "map-bridge smoke: sidecar present"
  exit 0
fi

if grep -q 'gap-map-bridge' "$BUNDLE/gaps.jsonl" 2>/dev/null; then
  echo "map-bridge smoke: map failed honestly (gap recorded)"
  exit 0
fi

echo "expected map-bridge sidecar or gap-map-bridge in gaps.jsonl" >&2
exit 1
