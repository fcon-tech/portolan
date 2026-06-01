# Feature Specification: Graph Slice Command

**Feature Branch**: `030-graph-slice-command`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: `graph-index.json` gives agents bounded first-read graph entrypoints,
but a second drill-down still requires opening full `graph.json` in the agent
prompt. Product validation on `/home/fall_out_bug/projects/vibe_coding` showed
that full graph can be hundreds of megabytes.

## Requirements

- **FR-001**: Portolan MUST provide a read-only CLI command that extracts a
  bounded graph slice from an existing map bundle.
- **FR-002**: The command MUST support slicing by repository ID, edge kind, and
  finding kind.
- **FR-003**: The command MUST write one JSON artifact to an explicit `--out`
  path and MUST NOT mutate the target repositories or map bundle.
- **FR-004**: The output MUST include slice criteria, graph/finding totals,
  truncation counts, sampled nodes, sampled edges, sampled findings, and rules
  telling agents that the slice is not the full graph.
- **FR-005**: The slice MUST preserve evidence states from the graph and
  findings.
- **FR-006**: Agent docs and Cursor rules MUST point agents from
  `graph-index.json` to this command for the next bounded drill-down.
- **FR-007**: Product hypothesis ledgers MUST record whether the command works
  on the real `/home/fall_out_bug/projects/vibe_coding` bundle.

## Success Criteria

- **SC-001**: Focused tests verify repository, edge-kind, and finding-kind
  slices.
- **SC-002**: CLI help documents `portolan graph slice`.
- **SC-003**: The real 30-repo bundle can produce a bounded slice without
  loading full `graph.json` into the agent prompt.
- **SC-004**: Baseline checks pass.
