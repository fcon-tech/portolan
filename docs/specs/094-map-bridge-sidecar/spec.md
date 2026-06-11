# Feature Specification: Map Bridge Sidecar (094)

**Status**: Implemented

**Input**: Optional `map-bridge/` sidecar when legacy `portolan map` is run alongside harness bundle.

## Requirements

- **FR-001**: `build-map-bridge.sh` copies bounded map artifacts into `bundle/map-bridge/`.
- **FR-002**: `evidence-index` query family reads `map-bridge/evidence-index.jsonl` when present.
- **FR-003**: Hotspots export via `portolan-export-from-map.sh` remains separate; no overwrite of scan evidence.
