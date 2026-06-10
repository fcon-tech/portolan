#!/usr/bin/env bash
# Deprecated wrapper — use scripts/build-portolan-bundle.sh
echo "deprecated: use scripts/build-portolan-bundle.sh" >&2
exec "$(cd "$(dirname "$0")" && pwd)/build-portolan-bundle.sh" "$@"
