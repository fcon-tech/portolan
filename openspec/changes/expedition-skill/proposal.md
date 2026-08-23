## Why

The tools and their delivery make an expedition possible; nothing yet makes
it happen. docs/MANIFEST.md's first-run contract — the Governor writes one
phrase, the agent does everything else — needs a taught method (the skill)
that turns a bare target into a Chart plus Sailing Directions, honestly.

## What Changes

- Add capability `expedition`: the first-run contract as observable
  behavior — one phrase from the Governor, the agent installs the skill and
  the MCP server, asks exactly one approval (network + tool install), and
  delivers Sailing Directions.
- Define the survey method the skill teaches: vessels from manifests and
  entry points, then fairways, then ports of entry and beacons, then
  lights, then dangers — verified with soundings as it is charted.
- Define the Sailing Directions brief format: top findings with anchors and
  trust labels, the Chart's location, the honest unsurveyed list.
- Pin the perimeter: builds and tests allowed, writes only under
  `<target>/.portolan/`, source never mutated.

## Capabilities

### New Capabilities

- `expedition`: how a first run behaves end to end — the one-phrase launch,
  the single approval, the taught survey order with its verify loop, honest
  unsurveyed waters, and the Sailing Directions the Governor receives.

### Modified Capabilities

(none)

## Impact

- Delivered later as the skill content under `skill/` (markdown the
  Cartographer's harness loads) — this change is a behavior contract, not
  code.
- Depends on the toolset delivered by mcp-delivery; the perimeter rules
  restate docs/MANIFEST.md permissions at the expedition level.
- No new dependencies.
