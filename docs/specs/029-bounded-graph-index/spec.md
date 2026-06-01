# Feature Specification: Bounded Graph Index

**Feature Branch**: `029-bounded-graph-index`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: Product validation on `/home/fall_out_bug/projects/vibe_coding`
proved that `summary.json` lets agents avoid loading a raw 681 MB `graph.json`,
but the map bundle still lacks a bounded graph entrypoint when an agent needs
sample graph IDs, edge refs, or high-degree nodes.

## Requirements

- **FR-001**: `portolan map` MUST emit `graph-index.json` in every map bundle.
- **FR-002**: `graph-index.json` MUST be bounded by design and MUST NOT embed
  the full graph.
- **FR-003**: The index MUST include graph counts, artifact byte sizes,
  node-kind samples, edge-kind samples, finding-kind samples, and high-degree
  node references.
- **FR-004**: Samples MUST preserve local evidence states and artifact
  references; missing or unsupported surfaces MUST remain `unknown`,
  `cannot_verify`, or `not_assessed`.
- **FR-005**: Agent-facing docs and Cursor rules MUST tell agents to read
  `summary.json` and `graph-index.json` before opening `graph.json`.
- **FR-006**: Product hypothesis ledgers MUST record whether the real
  `/home/fall_out_bug/projects/vibe_coding` run produces an agent-sized graph
  index.

## Success Criteria

- **SC-001**: Existing map bundle tests verify `graph-index.json` exists.
- **SC-002**: A focused test verifies the index has bounded samples and graph
  artifact sizes.
- **SC-003**: A real `/home/fall_out_bug/projects/vibe_coding` map run produces
  `graph-index.json` without loading full graph in the acceptance prompt.
- **SC-004**: Baseline checks pass.
