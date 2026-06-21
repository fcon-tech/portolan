#!/usr/bin/env bash
# Public installer entrypoint for the Portolan Cursor/OpenCode atlas pack.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
export PORTOLAN_INSTALL_PROG="portolan-install.sh"
exec "$ROOT/scripts/install-agent-harness.sh" "$@"
