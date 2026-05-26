# Feature Specification: Cursor Agent Skill Set

**Feature Branch**: `020-cursor-agent-skill-set`

**Created**: 2026-05-26

**Status**: Implemented; Cursor Agent blind discovery degraded but verified

**Input**: Product correction: Cursor will not infer how to use Portolan from a
random JSON file. Portolan must ship explicit Cursor-facing rules and portable
agent skills that tell the agent how to prepare context, inspect evidence, and
answer with honest gaps.

## Requirements

- **FR-001**: Cursor rule files MUST delegate to the portable Portolan workflow
  rather than embedding target-specific instructions.
- **FR-002**: The Cursor workflow MUST start from context preparation when
  available.
- **FR-003**: The skill set MUST include response contracts for CTO questions:
  duplicate components, implicit knowledge, service relationships, unknowns,
  and not-assessed surfaces.
- **FR-004**: The workflow MUST preserve local-first/read-only boundaries.
- **FR-005**: The skill set MUST be harness-independent at the portable layer
  and Cursor-specific only at the wrapper layer.

## Success Criteria

- Cursor can be given only Portolan path, target root, and output directory and
  can discover the workflow without a prepared selection file.
  - Status 2026-05-26: verified in degraded Cursor Agent blind runs for Bigtop
    and a non-Bigtop control target.
