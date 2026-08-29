#!/bin/sh
# Leak gate: no machine home paths in tracked files.
#
# The repo is public (github.com/fcon-tech/portolan). Hosted doc copies are
# scrubbed by scripts/demo-refresh.sh; this gate covers every tracked file.
# Run it before pushing (see AGENTS.md — Verification).
leaked=$(git ls-files -z | xargs -0 grep -lIE '/home/|/Users/' 2>/dev/null)
if [ -n "$leaked" ]; then
  printf 'machine home paths leaked into tracked files:\n%s\n' "$leaked" >&2
  exit 1
fi
