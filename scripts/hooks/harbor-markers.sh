#!/bin/sh
# H2 harbor-marker reminder (process-hooks 2.1, design D1/D4; serves the
# Pointer — the marker-delimited AGENTS.md block, owned by the core template
# core/src/pointer since pointer-bridge).
#
# PreToolUse (matcher Edit|Write), soft: when the tool targets AGENTS.md,
# print one additionalContext reminder that the block between
# portolan:harbor:begin and portolan:harbor:end is the Pointer — owned by
# the core template, written at install and at expedition close-out,
# version-checked by the Pointer status in trust.report and
# expeditions.propose — and is rewritten wholesale on every write.
#
# Soft phase: everything else is silent; always exit 0. Never exits 2.
set -u
payload=$(cat)
. "$(dirname "$0")/lib.sh"
path=$(hook_file_path "$payload")
[ -n "$path" ] || exit 0
# Root AGENTS.md only: the Pointer exists at the province root, and a
# nested AGENTS.md (docs/, a subagent dir) must not trigger the reminder.
# With ZCODE_PROJECT_DIR set (the harness injects it) match the exact root
# path; without it, only a bare relative AGENTS.md matches (soft miss on an
# absolute path is fine in a soft phase).
case $path in
  "${ZCODE_PROJECT_DIR:-__no_project_dir__}/AGENTS.md"|AGENTS.md)
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"AGENTS.md edit: the block between portolan:harbor:begin and portolan:harbor:end is the Pointer - owned by the core template (core/src/pointer), written at install and at expedition close-out, version-checked by the Pointer status in trust.report and expeditions.propose. Keep edits outside the markers; edits inside are reverted on the next write (install or close-out)."}}\n'
    ;;
esac
exit 0
