# Feature Specification: Duplication Detection

**Feature Branch**: `011-duplication-detection`
**Created**: 2026-05-20
**Status**: Implemented for exact source/config file clusters; near-clone
detection remains OSS-tool-backed and `not_assessed` when no jscpd-style output
is present.
**Input**: Product backlog P2-011: report duplicate code, duplicated config,
and repeated wrappers as evidence-backed finding clusters.

## User Scenarios & Testing

### User Story 1 - Report Duplicate Code Clusters (Priority: P1)

An agent can see likely copy/paste or near-duplicate code clusters without
reading the whole repository manually.

**Independent Test**: A fixture with repeated retry logic emits one
`duplication` finding with file/source pointers.

### User Story 2 - Report Duplicated Configuration (Priority: P1)

A reviewer can see repeated or drifting config blocks across environments.

**Independent Test**: A fixture with staging/prod config drift emits a
duplication/config finding with source-visible evidence.

### User Story 3 - Keep Similarity As Evidence, Not Verdict (Priority: P2)

Duplication findings explain the evidence and risk without declaring mandatory
refactoring.

**Independent Test**: Output uses neutral finding language and no rewrite
recommendation unless evidence supports it.

## Requirements

- **FR-001**: System MUST emit duplication findings with file-level evidence.
- **FR-002**: System MUST distinguish exact source-file duplication and exact
  config duplication in native map runs.
- **FR-003**: System MUST not include raw private code snippets in committed
  fixtures.
- **FR-004**: System MUST not turn duplication into an automatic rewrite plan.
- **FR-005**: System MUST keep unsupported near-clone detection, skipped large
  files, and unreadable candidate files as `not_assessed` or `cannot_verify`
  rather than silently claiming clean coverage.
- **FR-006**: Native exact-duplicate detection MUST skip Portolan output,
  VCS/vendor/dependency/build directories, lockfiles, binary files, and
  generated artifacts that would produce noisy or private-heavy signals.
- **FR-007**: Native exact-duplicate detection MUST not execute external tools,
  fetch dependencies, mutate target repositories, or write outside the selected
  map output directory.

## Existing Open Source

- jscpd remains the preferred OSS detector for copy/paste and near-clone
  analysis. Portolan already discovers jscpd-style outputs and emits safe local
  producer recipes through `oss-plan.json`.
- Native detection is intentionally limited to exact source/config file
  duplicates so agents get a deterministic baseline without adding a dependency
  or replacing jscpd.
- Future dependency addition still requires license, maintenance, privacy, and
  output-stability review.

## Success Criteria

- **SC-001**: Fixture emits at least one duplicate-code finding and one
  duplicated-config finding.
- **SC-002**: Findings include evidence state, source pointers, confidence, and
  severity.
- **SC-003**: A fixture with no supported duplicate clusters retains a
  `duplication` `not_assessed` finding rather than claiming no duplication.
- **SC-004**: Bigtop smoke can compare native exact clusters with jscpd-style
  OSS output to decide whether richer scanner execution is justified.

## Assumptions

- Exact duplicate source/config files are useful as a first agent-facing signal,
  but insufficient for architectural conclusions about copy/paste logic.
