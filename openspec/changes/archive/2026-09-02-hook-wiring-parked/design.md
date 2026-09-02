## Context

The workspace hook trust review — the client gate that decides whether
project-scope hooks from `.zcode/config.json` may run — renders its review
screen but the items are not actionable; confirmed in a fresh session for
a remote workspace (Governor, 2026-09-02). The hooks are therefore dead
weight: a dead prompt every session, zero enforcement. See proposal.md —
Why.

## Goals / Non-Goals

**Goals:**

- No dead prompts; no half-live wiring. The repo stays honest about what
  is and is not running.
- The guards remain restorable: scripts, tests, and the docs section stay;
  the wiring is one file in the `process-hooks` archive.

**Non-Goals:**

- No user-scope workaround — rejected by the Governor ("хуки тогда будут
  где попало"): hooks belong to the province's repo scope or nowhere.
- No change to the hook scripts, tests, or their soft-phase semantics.

## Decisions

- **D1 — Park the wiring, keep the guards.** Delete the tracked
  `.zcode/config.json`; keep `scripts/hooks/` and the workflow section.
  Alternatives rejected: keeping the file with `enabled: false` (unverified
  behavior on top of an already-broken review; still noise); leaving it as
  is (a dead prompt every session); user-scope wiring (rejected by the
  Governor).

- **D2 — The restore path is recorded where the wiring lived.** The
  workflow section names the parked state and points at the `process-hooks`
  archive for the exact wiring to recreate. Trust-digest semantics (per
  the client's own store: any config change re-triggers review) mean the
  restore is one commit plus one approval once the client works.

## Risks / Trade-offs

- [The guards are simply absent until the client is fixed] → true, and
  honestly stated; the leak-gate discipline falls back to the battery and
  CI, exactly as before `process-hooks`. No safety regression.
- [Docs drift: the workflow section could describe hooks as running when
  they are parked] → the section states the parked state in its lead; the
  verify-stage review checks the claim matches reality.

## Deferrals

- **Deferred: restoring the wiring.** Trigger, stated honestly: it cannot
  self-fire — with the config deleted, the trust-review prompt never
  reappears, so no session loop will surface the client fix. The trigger
  fires on a deliberate retest (recreate the wiring on a scratch checkout;
  if the review items are actionable in a fresh remote session, restore
  and approve). No watcher mechanism is built for this — the parked
  paragraph in `docs/workflow.md` (read at session start) is the only
  persistent reminder; anything more would be ceremony.
- **Suspended: the `process-hooks` D1 escalation triggers** (H1/H2
  soft→deny) — their observation conditions cannot occur while hooks never
  run. Revisit jointly with the restore deferral; restoring reinstates
  both.

## Verify-stage record (task 2.2)

- **Whole-change review** (code-reviewer, 2026-09-02): Spec PASS, Quality
  APPROVED; its one Minor (unticked 1.1) fixed.
- **Socratic pass** (Mode B, 2026-09-02): verdict SIMPLIFY-FIRST, three
  edits, all applied: the proposal's lineage claim corrected (the park
  goes further than D3's manual-install fallback rather than executing
  it); the restore path now names its real targets (the wiring spec in
  the archive's task-2.1 report and the deleted file in git history —
  the archive holds no wiring file); the design's unanchored
  client-forensics sentences trimmed to the observed fact.
- **Battery** (task 2.1): green on the final tree — see
  `reports/task-2.1-report.md`.

## Open Questions

- None.
