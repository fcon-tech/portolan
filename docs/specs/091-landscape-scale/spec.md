# Feature Specification: Landscape Scale

**Feature Branch**: `codex/091-landscape-scale`

**Created**: 2026-06-10

**Status**: Implemented (scale evidence in reviews/scale-findings.md).

**Input**: Full bigtop landscape (18 repos) through portolan-scan without OOM abort;
shard failures as honest gaps; scalable bundle build with kind-aware budget.

## Requirements

- **FR-001**: `--jscpd-memory-mb` and `--shard-timeout` on portolan-scan.sh.
- **FR-002**: Per-shard failures written to `producers/_gaps.jsonl`.
- **FR-003**: Single-pass jq per producer file in build-portolan-bundle.sh.
- **FR-004**: Kind-quota hotspot budget; `hotspots-full.jsonl` for agents.
- **FR-005**: Smoke C on full bigtop with evidence in reviews/.

## Success Criteria

- **SC-001**: Wizard completes all 18 bigtop repos without aborting.
- **SC-002**: Failed shards visible in gaps.jsonl.
- **SC-003**: Bundle includes multiple kinds after budget (not only static-finding).
