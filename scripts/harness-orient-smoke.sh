#!/usr/bin/env bash
# Deprecated wrapper — use scripts/harness-portolan-smoke.sh
exec "$(cd "$(dirname "$0")" && pwd)/harness-portolan-smoke.sh" "$@"
