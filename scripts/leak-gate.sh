#!/bin/sh
# Leak gate: no machine home paths in tracked files.
#
# The repo is public (github.com/fcon-tech/portolan). Hosted doc copies are
# scrubbed by scripts/demo-refresh.sh; this gate covers every tracked file.
# Run it before pushing (see AGENTS.md — Verification). The signatures are
# assembled so this file carries no literal for itself to flag.
home_sig="/$(printf %s ho)me/"
users_sig="/$(printf %s Use)rs/"
# The username is a leak signature too (scripts/demo-refresh.sh already
# treats it as one): a tracked file carrying $USER outside those prefixes
# must fail the same gate. Patterns live in a temp file so the literal
# never appears on this script's own command line.
patterns=$(mktemp)
trap 'rm -f "$patterns"' EXIT
printf '%s\n%s\n' "$home_sig" "$users_sig" > "$patterns"
if [ -n "${USER:-}" ]; then printf '%s\n' "$USER" >> "$patterns"; fi
leaked=$(git ls-files -z | xargs -0 grep -lI -f "$patterns" 2>/dev/null)
if [ -n "$leaked" ]; then
  printf 'machine home paths leaked into tracked files:\n%s\n' "$leaked" >&2
  exit 1
fi
