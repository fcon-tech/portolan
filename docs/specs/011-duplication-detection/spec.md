# Feature Specification: Duplication Detection

**Feature Branch**: `011-duplication-detection`
**Created**: 2026-05-20
**Status**: Revised. Native exact duplicate detection was removed because it
duplicated mature OSS scanner responsibilities. Duplication findings now depend
on selected local duplication tool output, such as jscpd/CPD-style JSON, and
remain `not_assessed` when no supported output is present.
**Input**: Product backlog P2-011: report duplicate code, duplicated config,
and repeated wrappers as evidence-backed finding clusters.

## User Scenarios & Testing

### User Story 1 - Report Duplicate Code Clusters (Priority: P1)

An agent can see likely copy/paste or near-duplicate code clusters when a
supported local duplication tool output is supplied.

**Independent Test**: A fixture without selected duplication tool output emits
a `duplication` finding with `not_assessed`; supported jscpd/CPD-style output
is represented as metadata evidence.

### User Story 2 - Report Duplicated Configuration (Priority: P1)

A reviewer can see repeated or drifting config blocks across environments when
a supported local duplication/config tool output is supplied.

**Independent Test**: Without supported local duplication output, config
duplication remains `not_assessed` rather than inferred by native Portolan code.

### User Story 3 - Keep Similarity As Evidence, Not Verdict (Priority: P2)

Duplication findings explain the evidence and risk without declaring mandatory
refactoring.

**Independent Test**: Output uses neutral finding language and no rewrite
recommendation unless evidence supports it.

## Requirements

- **FR-001**: System MUST emit duplication findings only from selected local
  duplication tool output or as explicit `not_assessed` placeholders.
- **FR-002**: System MUST NOT implement native source/config clone detection
  when mature OSS duplication tools can provide the evidence.
- **FR-003**: System MUST not include raw private code snippets in committed
  fixtures.
- **FR-004**: System MUST not turn duplication into an automatic rewrite plan.
- **FR-005**: System MUST keep unsupported duplication coverage, skipped large
  files, and unreadable candidate files as `not_assessed` or `cannot_verify`
  rather than silently claiming clean coverage.
- **FR-006**: Portolan MUST preserve native OSS tool boundaries: agents may use
  native CLI, skill, or MCP surfaces to produce output, while Portolan imports
  and normalizes the saved local output.
- **FR-007**: Portolan MUST not execute external duplication tools, fetch
  dependencies, mutate target repositories, or write outside the selected map
  output directory.

## Existing Open Source

- jscpd remains the preferred OSS detector for copy/paste and near-clone
  analysis. Portolan discovers jscpd-style outputs and emits bounded native
  CLI/skill/MCP recipes through `oss-plan.json` when output is missing.
- Native exact source/config duplicate detection was rejected because it
  reproduced scanner behavior without enough product value.
- Future dependency addition still requires license, maintenance, privacy, and
  output-stability review.

## Success Criteria

- **SC-001**: Without supported local duplication output, map output contains a
  duplication `not_assessed` finding.
- **SC-002**: When supported duplication output is selected, findings include
  evidence state, source pointers when available, confidence, and severity.
- **SC-003**: A fixture with no supported duplicate clusters retains a
  `duplication` `not_assessed` finding rather than claiming no duplication.
- **SC-004**: Bigtop stress work uses native OSS duplication tooling output
  rather than Portolan's own clone detector.

## Assumptions

- Duplication without selected local tool output is unknown/not assessed, not a
  negative result.
