# Feature Specification: Portolan Scope Pruning

**Feature Branch**: `019-portolan-scope-pruning`

**Created**: 2026-05-26

**Status**: Implemented for docs/help pruning

**Input**: Product correction: Portolan drifted toward prepared landscapes,
Bigtop-specific choreography, and raw inventory artifacts. The product must be
cut back to a reusable agent augmentation layer.

## Requirements

- **FR-001**: Documentation MUST stop presenting prepared `selection.json` as
  the default first-run path for Cursor or blind acceptance.
- **FR-002**: Bigtop-specific helpers MUST be classified as corpus fixtures or
  acceptance support, not primary product workflow.
- **FR-003**: CLI help and agent docs MUST distinguish context preparation,
  curated selection mapping, and low-level scan/import commands.
- **FR-004**: Any deprecated or secondary command MUST remain available until a
  migration path exists.
- **FR-005**: Portolan MUST not claim to be a service catalog, observability
  system, modernization platform, or standalone CTO report generator.

## Implementation Notes

First implementation should update docs/help and remove misleading guidance
before deleting commands. Command removal requires a separate compatibility
decision.
