#!/bin/sh
# H2 harbor-marker reminder (process-hooks 2.1, design D1/D4; serves the
# installer-owned harbor block — design D7 of process-fabric).
#
# PreToolUse (matcher Edit|Write), soft: when the tool targets AGENTS.md,
# print one additionalContext reminder that the block between
# portolan:harbor:begin and portolan:harbor:end is installer-owned and is
# rewritten wholesale by adapters/opencode/install.ts on every install.
#
# Soft phase: everything else is silent; always exit 0. Never exits 2.
set -u
payload=$(cat)
. "$(dirname "$0")/lib.sh"
path=$(hook_file_path "$payload")
[ -n "$path" ] || exit 0
case $path in
  */AGENTS.md|AGENTS.md)
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"AGENTS.md edit: the block between portolan:harbor:begin and portolan:harbor:end is installer-owned - adapters/opencode/install.ts rewrites it wholesale on install. Keep edits outside the markers; edits inside are reverted on the next install (design D7 of process-fabric)."}}\n'
    ;;
esac
exit 0
