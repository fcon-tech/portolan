## Why

The `process-hooks` wiring (tracked `.zcode/config.json`) is inert in
practice: the client's workspace hook trust review renders but its items
are not actionable — confirmed for remote workspaces in a fresh session
(Governor, 2026-09-02). Every session therefore gets a dead
pending-review prompt and no hooks. The Governor decided to park the
wiring until the client ships a working review; hooks stay repo-scoped by
principle — a user-scope workaround was offered and rejected ("хуки
тогда будут где попало").

## What Changes

- Remove the tracked `.zcode/config.json` (the single artifact the trust
  gate evaluates). The hook scripts, their tests, and the workflow
  section stay — the guards are parked, not deleted.
- `docs/workflow.md` hooks section: the wiring line and honesty note are
  replaced by the parked state — why (the client's trust review is broken
  for remote workspaces), and the restore path (recreate the wiring from
  the `process-hooks` archive when the client works, then approve once).
- In the spirit of `process-hooks` design D3's fallback, taken further:
  the wiring is removed rather than manually installed — scripts and docs
  stay, the park is the recorded disposition.

## Capabilities

### New Capabilities

- (none — development-process tooling, no served behavior)

### Modified Capabilities

- (none; `skip_specs: true` is set in `.openspec.yaml`)

## Impact

- `.zcode/config.json` (deleted), `docs/workflow.md` (one section
  rewritten), `CHANGELOG.md` + `core/package.json` (merge-time rule).
  No product code, no spec deltas, no adapters.
