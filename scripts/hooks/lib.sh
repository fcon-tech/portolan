#!/bin/sh
# Shared glue for the process-hooks hook scripts (design D4: deterministic
# glue only). Sourced by leak-stamp.sh and harbor-markers.sh.

# hook_file_path <payload>: print the touched file's path from a tool-event
# hook payload; print nothing when nothing usable is found. The live payload
# shape was never observed (task 1.1 spike: not_assessed), so the
# guide-documented keys are probed defensively — jq first when present,
# then a grep/sed fallback (jq is absent on the machine this repo develops
# on, so the fallback is the exercised path).
hook_file_path() {
  _payload=$1
  _path=''
  if command -v jq >/dev/null 2>&1; then
    _path=$(printf '%s' "$_payload" | jq -r '.tool_input.file_path // .file_path // .tool_input.path // empty' 2>/dev/null)
    [ "$_path" = 'null' ] && _path=''
  fi
  if [ -z "$_path" ]; then
    # Same key set as the jq branch; the fallback returns whichever key
    # appears first in payload position (jq's precedence is not
    # reproduced — a soft miss at worst). Only \" unescaping: a bare
    # backslash strip would mangle doubled backslashes.
    _path=$(printf '%s' "$_payload" \
      | grep -o -e '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' -e '"path"[[:space:]]*:[[:space:]]*"[^"]*"' \
      | head -n 1 \
      | sed 's/^\("[a-z_]*"\)[[:space:]]*:[[:space:]]*"//; s/"$//; s/\\"/"/g')
  fi
  [ -n "$_path" ] && printf '%s\n' "$_path"
  return 0
}
