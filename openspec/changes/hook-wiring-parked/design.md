## Context

The workspace hook trust review — the client gate that decides whether
project-scope hooks from `.zcode/config.json` may run — renders its review
screen but the items are not actionable; confirmed in a fresh session for
a remote workspace (Governor, 2026-09-02). The hooks are therefore dead
weight: a dead prompt every session, zero enforcement. The client build's
own server code shows the review decision for remote sessions requires a
`workspaceIdentity` the UI does not currently complete. The shipped
client guides do not document the gate at all (stale). See proposal.md —
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

- **Deferred: restoring the wiring.** Trigger: the client ships a working
  workspace hook trust review (items actionable in a remote session).
  Then: recreate `.zcode/config.json` from the `process-hooks` archive,
  approve once, and flip the workflow section's parked note to observed
  state. Recorded as this change's follow-up.

## Open Questions

- None.
