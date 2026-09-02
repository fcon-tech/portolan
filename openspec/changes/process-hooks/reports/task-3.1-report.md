# Task 3.1 report — the hooks section in docs/workflow.md

Change: `process-hooks`, task 3.1. Date: 2026-09-02.

## What was built

One section, "Hooks — guards at the moment of writing", inserted before
"Roles" in `docs/workflow.md`. Pointers only, in the page's existing voice:

- the three hooks by script path (`scripts/hooks/leak-stamp.sh`,
  `scripts/hooks/harbor-markers.sh`, `scripts/hooks/session-brief.ts`) and
  the protocol rule each serves — the leak-gate rule (Verification), the
  installer-owned harbor block in AGENTS.md (the harbor half of J1), and
  the J1 briefing mandate (quiet: speaks only when the queue or the change
  list is non-empty; the decision round stays the Governor's);
- where they live: tracked `.zcode/config.json` and `scripts/hooks/`;
- the soft phase: hooks warn, never block (no exit 2), CI stays the
  done-bar, escalation only on a recorded trigger;
- the two escalation triggers from design D1, stated plainly (H1 → deny if
  a leaked literal reaches a commit despite the warning; H2 → deny if a
  hand edit inside the markers survives to an install and is reverted).

Not restated: hook script logic, the harness guide, payload shapes, the
config JSON itself. Layering claims respected: rules stay owned by
AGENTS.md and the page's sections; the new section only names the
moment-of-writing guards and their owners. Locked terminology used
(Governor, harbor, province, J1); no synonyms introduced.

## Verification

- Every path named in the section exists (checked with `test -e`:
  `.zcode/config.json` and the three hook scripts).
- `scripts/leak-gate.sh` — exit 0.
- `openspec validate --changes --strict` — 1 passed, 0 failed.
- `bun test` unaffected (docs-only change; the section adds no code).

Test-first note (per the docs-task rule): no spec deltas, so the verify
line was restated as checks run before claiming done — named paths exist
(the "red where the work is absent" state cannot occur here because task
2.1 already landed the files; recorded rather than forced), leak-gate
clean, consistency read against the page's existing sections.
