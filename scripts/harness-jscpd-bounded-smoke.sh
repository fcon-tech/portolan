#!/usr/bin/env bash
# Assert bounded jscpd profile is shared and sub-shard helper exists.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
fail() { echo "harness-jscpd-bounded-smoke: FAIL: $1" >&2; exit 1; }

LIB="$ROOT/scripts/lib/jscpd-bounded.sh"
[[ -f "$LIB" ]] || fail "missing $LIB"
# shellcheck source=lib/jscpd-bounded.sh
. "$LIB"

grep -e '--min-lines 50' "$LIB" >/dev/null || fail "bounded profile missing --min-lines 50"
grep -e '--min-tokens 100' "$LIB" >/dev/null || fail "bounded profile missing --min-tokens 100"
grep -e '--max-size 100kb' "$LIB" >/dev/null || fail "bounded profile missing --max-size"
grep -e '--max-lines 1000' "$LIB" >/dev/null || fail "bounded profile missing --max-lines"

grep -q 'jscpd_subshard_segments' "$ROOT/scripts/portolan-scan.sh" ||
  fail "portolan-scan.sh missing sub-shard helper"
grep -q 'JSCPD_SUBSHARD_FILE_THRESHOLD' "$ROOT/scripts/portolan-scan.sh" ||
  fail "portolan-scan.sh missing sub-shard threshold"

# portolan-scan must source shared lib (no duplicate unbounded min-lines 5).
if grep -e '--min-lines 5' "$ROOT/scripts/portolan-scan.sh" >/dev/null; then
  fail "portolan-scan.sh still uses unbounded --min-lines 5"
fi

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/repo/a" "$WORK/repo/b"
for i in $(seq 1 5); do echo "x=$i" >"$WORK/repo/a/f$i.go"; cp "$WORK/repo/a/f$i.go" "$WORK/repo/b/f$i.go"; done

if command -v jscpd >/dev/null 2>&1; then
  SHARD_TIMEOUT=120 JSCPD_MEMORY_MB=512 jscpd_run_bounded "$WORK/repo" "$WORK/out" || true
  jscpd_dir_has_report "$WORK/out" || fail "bounded jscpd produced no report on tiny fixture"
fi

echo "harness-jscpd-bounded-smoke: ok"
