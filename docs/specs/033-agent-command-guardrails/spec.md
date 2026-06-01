# Feature Specification: Agent Command Guardrails

**Feature Branch**: `033-agent-command-guardrails`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: Fresh H10 headless Cursor Agent acceptance used
`evidence-index.jsonl` correctly but invented a non-existent
`portolan context --manifest` command for the next local step.

## Requirements

- **FR-001**: Generated answer contracts MUST tell agents to suggest only
  commands that exist in the contract or in `oss-plan.json`.
- **FR-002**: Generated query plans MUST explicitly forbid inventing Portolan
  subcommands or flags.
- **FR-003**: External ecosystem completeness MUST remain `unknown` unless a
  local selection, corpus manifest, or user-supplied inventory exists.
- **FR-004**: Cursor rules and portable skills MUST warn against generic
  manifest commands such as `portolan context --manifest`.
- **FR-005**: The fix MUST preserve the existing local-first, read-only command
  set and must not add a new manifest parser or scanner.

## Success Criteria

- Context pack tests assert that `answer-contract.md` includes allowed next
  commands and the explicit non-existent-command warning.
- Agent docs describe the correct selection-backed fallback for external
  completeness.
- Baseline checks pass.
