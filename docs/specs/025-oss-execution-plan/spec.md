# Feature Specification: OSS Execution Plan

**Feature Branch**: `025-oss-execution-plan`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: Blind Cursor acceptance proved that OSS assembly is not sufficient
when `tool-registry.json` is empty. Agents need a safe, local-first plan for
producing OSS tool outputs and then re-running Portolan context preparation.

## Requirements

- **FR-001**: `portolan context prepare` MUST emit an OSS execution plan
  artifact in addition to `agent-brief.md`, `query-plan.md`, `repos.json`,
  `tool-registry.json`, and `gaps.jsonl`.
- **FR-002**: The plan MUST record local availability for supported producer
  tools without running scanners by default.
- **FR-003**: The plan MUST include safe command recipes only for local,
  read-only producer runs that write under the selected context output
  directory.
- **FR-004**: If an OSS output family is already present in
  `tool-registry.json`, the plan MUST prefer using the existing output before
  suggesting a refresh run.
- **FR-005**: Semgrep execution recipes MUST require a local config file; the
  plan MUST NOT suggest registry or network-backed Semgrep config by default.
- **FR-006**: Missing producer binaries MUST be represented as `not_assessed`;
  the plan MUST NOT include install, fetch, package-manager, or network
  commands.
- **FR-007**: The generated agent brief/query plan MUST direct Cursor and other
  agents to read the OSS plan before claiming duplication, dependency,
  configuration, or structural finding absence.

## Success Criteria

- **SC-001**: A context pack includes a parseable `oss-plan.json`.
- **SC-002**: With fake local producer binaries on `PATH`, the plan records
  available jscpd and Syft recipes that write only under the context output
  directory.
- **SC-003**: Without a local Semgrep config, the plan records Semgrep as
  not assessed and does not suggest `--config auto`.
- **SC-004**: Existing jscpd/CycloneDX outputs are recognized as inputs already
  present instead of being treated as absent.
