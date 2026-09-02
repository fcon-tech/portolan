#!/bin/sh
# Leak gate: no machine home paths in tracked files.
#
# The repo is public (github.com/fcon-tech/portolan). Hosted doc copies are
# scrubbed by scripts/demo-refresh.sh; this gate covers every tracked file.
# Run it before pushing (see AGENTS.md — Verification). The signatures are
# assembled so this file carries no literal for itself to flag.
home_sig="/$(printf %s ho)me/"
users_sig="/$(printf %s Use)rs/"
# --print-patterns: write the signatures to stdout and exit without
# scanning. This file is the single home of the signature list (one
# assemble step, two consumers: this gate's scan and the H1 leak-stamp
# hook, which greps the one touched file instead of copying the list).
print_sigs() {
  printf '%s\n' "$home_sig"
  printf '%s\n' "$users_sig"
  if [ -n "${USER:-}" ]; then printf '/%s/\n' "$USER"; fi
}
if [ "${1:-}" = "--print-patterns" ]; then
  print_sigs
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
print_sigs > "$patterns"
leaked=$(git ls-files -z | xargs -0 grep -lIF -f "$patterns" 2>/dev/null)
if [ -n "$leaked" ]; then
  printf 'machine home paths leaked into tracked files:\n%s\n' "$leaked" >&2
  exit 1
fi
