## Why

The night policy auto-launches bounded repairs and nothing else — by design.
But that leaves gap and new-land proposals actionable only "in session with
the Cartographer": there is no way to launch one specific proposal by the
Governor's explicit choice. The queue is machine-proposed; the will to run
a particular one should be one command, not a chat session. (Dogfood
today: three gap proposals standing, none launchable outside a session.)

## What Changes

- New harbor CLI subcommand: `run --target <t> --fingerprint <fp>
  --launcher "<cmd>" [--launcher-timeout <duration>] [--format chat|json]`.
- `run` finds the named fingerprint in the freshly computed queue and
  launches exactly that proposal through the external launcher — **any
  kind** (repair, gap, new-land): the Governor's explicit choice overrides
  the night policy bounds; the policy itself is unchanged.
- History semantics mirror the watch (accept-then-append-failure): the
  launch is accepted `by: governor` before spawning; a launch failure
  appends `launch-failed` (the latest word), so the proposal stays queued.
- A launcher is REQUIRED (a report-only run is a contradiction); an unknown
  fingerprint fails loudly, hinting at `propose`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `harbor`: adds requirements (ADDED deltas — no standing harbor requirement
  changes text): the manual single-proposal run, its any-kind override, its
  governor attribution, and its loud failure paths.

## Impact

- Code: new `core/src/harbor/run.ts` (reuses launchExpedition + history),
  `renderRunChat`, `GOVERNOR` attribution constant, `appendLaunchFailure`
  gains an attribution option (default unchanged), CLI subcommand. The
  night policy, proposals, and the watch are untouched.
