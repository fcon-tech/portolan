## Why

The Governor may hold more than one charted province (the Bigtop landscape
and the dogfood province already exist). Each province's Chart Room is
self-contained, but nothing assembles the fleet: to compare waters a
Governor must open directories and count sheets by hand.

## What Changes

- A **fleet review** export: one self-contained HTML page listing the
  charted provinces the Governor names explicitly on the command line —
  per-province vessel/fairway/danger counts, trust shares, top hub, and a
  `file://` link to that province's Chart Room.
- CLI: `bun core/src/chartroom/cli.ts review --target <t1> [--target <t2>…]`.
  The page is written into the first named target at
  `<t1>/.portolan/fleet-review.html` ("the reviewing harbor"); targets are
  read-only inputs.
- Glossary gains **Fleet review** (the assembled view of several provinces).
- No MCP tool: the MCP server is bound to one province by contract, so it
  cannot honestly speak for a fleet; the review stays a CLI export.

## Capabilities

### New Capabilities

- `fleet-review`: the multi-province index-page contract — explicit target
  list, single written file inside the first target's perimeter,
  deterministic output, loud failure for any non-charted target, no
  fabrication beyond index arithmetic.

### Modified Capabilities

(none)

## Impact

- Code: new `core/src/chartroom/review.ts` + template; one new CLI
  subcommand. No existing behavior changes; storage untouched.
