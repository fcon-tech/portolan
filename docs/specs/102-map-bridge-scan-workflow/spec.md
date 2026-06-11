# Feature Specification: Map-Bridge Scan Workflow (102)

**Status**: Implemented via PR #70

**Input**: Optional `--with-map-bridge` on `portolan-scan.sh` to populate Graph hints without manual steps.

## Requirements

- **FR-001**: Flag `--with-map-bridge` (default off) runs `portolan map` + `build-map-bridge.sh` after bundle build.
- **FR-002**: Map failure records gap in bundle; scan exits 0.
- **FR-003**: SKILL + demo-runbook document optional path.
- **FR-004**: Optional smoke script for fixture target.
