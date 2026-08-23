## Why

The Chart holds assertions; soundings keep them honest. docs/MANIFEST.md
assigns `sound.edge` / `sound.anchor` the verification role — deterministic
checks that an asserted fairway or anchor actually exists — and the sea
trial's automatic-fail rule for fabricated anchors depends on them. No
change yet defines their observable contracts.

## What Changes

- Add the `sound.anchor` contract: verify an anchor resolves — file exists,
  line range valid, cited content present; manifest keys and receipt ids
  resolve.
- Add the `sound.edge` contract: verify an asserted fairway through
  deterministic means — manifest declaration and/or source-reference search.
- Define the shared verdict shape: `confirmed`, `refuted`, or `unconfirmed`,
  always with anchored evidence.
- Pin two invariants: soundings are deterministic (no model judgment), and a
  sounding never upgrades a chart entry's trust — that write belongs to the
  Cartographer.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `tools`: adds the sounding contracts (`sound.anchor`, `sound.edge`) as new
  concerns — spec delta uses `## ADDED Requirements` per the openspec rules
  (new concerns, no existing behavior changed; the living spec is created by
  the `probe-tools` change).

## Impact

- Implementation lands later beside the probe tools under `core/`, reusing
  the manifests reader and search from `probe-tools`; no new external
  binaries.
- Read-only against the Chart: soundings consume chart assertions and return
  verdicts; the sea-trial gate runner (later change) consumes `refuted`
  verdicts for its fabricated-anchor rule.
- No new third-party dependencies.
