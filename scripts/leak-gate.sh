#!/bin/sh
# Leak gate: no machine home paths in tracked files.
#
# The repo is public (github.com/fcon-tech/portolan). Hosted doc copies are
# scrubbed by scripts/demo-refresh.sh; this gate covers every tracked file.
# Run it before pushing (see AGENTS.md — Verification). The signatures are
# assembled so this file carries no literal for itself to flag.
home_sig="/$(printf %s ho)me/"
users_sig="/$(printf %s Use)rs/"
# --print-patterns <file>: write the signatures to <file> (one per line) and
# exit without scanning. This file is the single home of the signature list;
# the H1 leak-stamp hook (scripts/hooks/leak-stamp.sh) reuses it for the one
# touched file instead of copying the list anywhere.
if [ "${1:-}" = "--print-patterns" ]; then
  if [ -z "${2:-}" ]; then
    printf 'usage: leak-gate.sh --print-patterns <file>\n' >&2
    exit 64
  fi
  {
    printf '%s\n' "$home_sig"
    printf '%s\n' "$users_sig"
    if [ -n "${USER:-}" ]; then printf '/%s/\n' "$USER"; fi
  } > "$2"
  exit 0
fi
# The username is a leak signature too (scripts/demo-refresh.sh already
# treats it as one): a tracked file carrying $USER as a PATH SEGMENT —
# /mnt/data/<user>/... — must fail the same gate. The segment delimiters
# keep a common word ("runner" in CI, "test" in fixtures) from matching
# prose, and -F treats every pattern as a literal. Patterns live in a temp
# file so the literals never appear on this script's own command line.
patterns=$(mktemp)
trap 'rm -f "$patterns"' EXIT
printf '%s\n%s\n' "$home_sig" "$users_sig" > "$patterns"
if [ -n "${USER:-}" ]; then printf '/%s/\n' "$USER" >> "$patterns"; fi
leaked=$(git ls-files -z | xargs -0 grep -lIF -f "$patterns" 2>/dev/null)
if [ -n "$leaked" ]; then
  printf 'machine home paths leaked into tracked files:\n%s\n' "$leaked" >&2
  exit 1
fi
