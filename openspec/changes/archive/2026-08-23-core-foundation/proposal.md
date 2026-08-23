## Why

Portolan v3 exists as a manifest but not as code. Every other work package
(probe tools, soundings, MCP delivery, the expedition skill, the sea trial)
depends on one thing existing first: the Chart contract and its on-disk
store. This change lays that foundation.

## What Changes

- Add the Chart ontology: vessels, fairways, ports of entry, beacons,
  lights, dangers, anchors, and the trust vocabulary, as a JSON Schema.
- Add a validator that rejects chart entries without anchors or trust
  labels.
- Add the chart store: read/write of `.portolan/chart/` (markdown sheets +
  `index.jsonl`) with atomic writes and `pending correction` detection from
  per-unit tree signatures.
- Add the TypeScript/Bun package scaffold (`core/`).

## Capabilities

### New Capabilities

- `chart`: the Chart artifact contract — location, sheets, machine index,
  mandatory anchors and trust labels, staleness (`pending correction`),
  Notices to Mariners, atomic writes.

### Modified Capabilities

(none — first change)

## Impact

- New code under `core/` (schema, validator, chart store, staleness).
- All later changes (`probe-tools`, `soundings`, `mcp-delivery`,
  `expedition-skill`, `sea-trial`) build on these types and the store.
- Dependencies added: `ajv` only.
