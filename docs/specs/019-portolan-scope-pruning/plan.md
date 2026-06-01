# Implementation Plan: Portolan Scope Pruning

## Decision Gate

- Simpler/Faster: update user-facing guidance and help first; do not delete
  commands until tests and migration notes prove it is safe.
- Blocking Edge Cases: existing fixtures, Bigtop acceptance notes, and users
  relying on explicit selections.
- Existing Open Source: not applicable as a dependency; use established
  deprecation patterns with clear compatibility notes.

## Verification

Run doc and CLI help checks plus baseline tests after any behavior change.

