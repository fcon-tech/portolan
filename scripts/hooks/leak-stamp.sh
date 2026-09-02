#!/bin/sh
# H1 leak-stamp (process-hooks 2.1, design D1/D4; serves the leak-gate rule).
#
# PostToolUse (matcher Edit|Write), soft: scan the ONE touched file for the
# leak-gate signatures; on a hit print one additionalContext warning naming
# file:line. The signature list has one home — scripts/leak-gate.sh
# (--print-patterns); this script never copies it.
#
# Soft phase: every non-hit and every failure path is SILENT and exits 0.
# Never exits 2; CI stays the final bar.
set -u
root=${ZCODE_PROJECT_DIR:-}
[ -n "$root" ] && [ -f "$root/scripts/leak-gate.sh" ] || exit 0

payload=$(cat)
. "$(dirname "$0")/lib.sh"
path=$(hook_file_path "$payload")
[ -n "$path" ] || exit 0
case $path in
  /*) ;;
  *) path=$root/$path ;;
esac
[ -f "$path" ] || exit 0

patterns=$(sh "$root/scripts/leak-gate.sh" --print-patterns) || exit 0
[ -n "$patterns" ] || exit 0
hits=$(printf '%s\n' "$patterns" | grep -nIF -f - -- "$path") || exit 0
[ -n "$hits" ] || exit 0
lines=$(printf '%s\n' "$hits" | cut -d: -f1 | paste -sd, -)
path_esc=$(printf '%s' "$path" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"leak-gate hit: %s (line(s) %s) carries a machine home path signature. Tracked files must stay clean of them (leak-gate rule) - fix before commit. Soft warning; CI stays the final bar."}}\n' "$path_esc" "$lines"
exit 0
