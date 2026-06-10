#!/usr/bin/env bash
# Deprecated wrapper — use scripts/portolan-scan.sh
echo "deprecated: use scripts/portolan-scan.sh" >&2
exec "$(cd "$(dirname "$0")" && pwd)/portolan-scan.sh" "$@"
