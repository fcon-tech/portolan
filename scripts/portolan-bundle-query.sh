#!/usr/bin/env bash
# Read-only query surface over a Portolan harness bundle.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
exec node "$ROOT/portolan-core/scripts/bundle-query-cli.mjs" "$@"
