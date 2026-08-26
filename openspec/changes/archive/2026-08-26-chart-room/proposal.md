## Why

The Governor reads a province through markdown sheets and prose. A technical
leader entering unfamiliar waters needs the whole province at a glance — what
it is made of, where the entries are, where the dangers lie, and which parts
of the chart cannot be trusted. The spike (`experiments/map-spike`, verified
on the Bigtop chart and accepted by the Governor on 2026-08-25 iteration)
proved the rendering: an archipelago map plus a layered graph in one
self-contained HTML file. This change productizes it inside the contract
boundaries — as an export byproduct, never a core deliverable.

## What Changes

- New capability `chart-room`: a one-file HTML export of the Chart, written
  to `<target>/.portolan/chart-room.html` on demand.
- Two representations of one truth: the **nautical archipelago map**
  (islands sized by code volume, fairway lanes styled by trust, Chart No. 1
  danger symbols, ports of entry, bathymetric trust bands) and the
  **engineering layered graph** (dependency ranks, dependents above
  foundations). One toggle swaps representation and lexicon; data, dossier,
  and impact-set clicks are identical.
- New MCP tool `chart.render` and a CLI
  (`bun core/src/chartroom/cli.ts render --target <t>`) over one core
  function; both fail loudly when no chart exists.
- The export is deterministic (same chart → byte-identical file) and
  dependency-free (hand-rolled SVG in the page; no runtime deps added).
- Glossary gains **Chart room** (the room where charts are read).

## Capabilities

### New Capabilities

- `chart-room`: the byproduct export contract — what it renders, from what
  inputs, where it writes, its honesty rules (trust legend always visible,
  unsurveyed never hidden), determinism, and its two entry points.

### Modified Capabilities

(none — the chart store, sheets, and Notices are untouched; the Chart Room
only reads them)

## Impact

- Code: new `core/src/chartroom/` (render, template, CLI) + one registry
  entry in `core/src/server/registry.ts`. No existing behavior changes.
- Contract: `docs/MANIFEST.md` glossary gains one term; the non-goal
  ("no HTML atlas as a core deliverable; at most a byproduct") is unchanged
  and now has its bounded expression.
- The spike directory `experiments/map-spike/` is removed once the core
  implementation lands and the Bigtop artifact is re-verified from core.
