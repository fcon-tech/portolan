# Implementation Plan: Cursor Agent Skill Set

## Decision Gate

- Simpler/Faster: update `docs/agent/cursor-rules/portolan-map.mdc` and the portable
  `agent/` entrypoint after `context prepare` exists.
- Blocking Edge Cases: Cursor rule syntax, non-Cursor harness compatibility,
  and old `map --selection` examples.
- Existing Open Source: use existing Cursor rules and portable Markdown skills;
  no plugin dependency is needed for the first slice.

## Verification

Run doc checks and a Cursor/Composer acceptance lane when available. If Cursor
is unavailable, record `not_assessed`.

