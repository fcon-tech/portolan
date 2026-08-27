## Why

The dossier answers everything but only after a click, and only in the side
panel away from the water. The Governor wants every island to carry "a
little piece of the atlas": the moment you point at it, the island should
raise its own plate — identity, scale, connections, behavior honesty,
pending correction, and what changed it — right there on the chart.

## What Changes

- Hovering any island raises an **atlas plate**: an anchored nautical inset
  (parchment card, double border) composed solely of facts already embedded
  in the export:
  - title (display name + id) with a trust ribbon along the left edge;
  - scale line: file volume and source-path count;
  - counters row: fairways in / out, ports of entry, beacons, lights,
    risks — as text counters beside mini glyphs reused from the map marks;
  - behavior line: measured behavior cited, or the honest "runtime
    unsurveyed";
  - pending-correction strip when `stale`;
  - newest Notice to Mariners touching this vessel (action + key), when
    one stands;
  - derived role tag: Hub (fan-in ≥ 5), Gateway (fan-in ≥ 3 and fan-out
    ≥ 3), Leaf (no outbound fairways), Derelict (unreachable from any port
    of entry).
- The plate flips sides to stay inside the neatline and never covers its
  own island; it vanishes on leave. Clicking keeps today's dossier +
  impact set unchanged. Engineering mode swaps lexicon, not content.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `chart-room`: adds requirements (ADDED deltas): the hover atlas plate's
  composition, anchoring/flipping, honesty sources, and dismissal.

## Impact

- Code: `template.html` only (a plate builder over already-embedded data +
  hover wiring). No new embedded bytes; determinism holds.
