#!/usr/bin/env bash
# Read-only query surface over a Portolan harness bundle (spec 095).
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
exec node "$ROOT/viewer/scripts/bundle-query-cli.js" "$@"
