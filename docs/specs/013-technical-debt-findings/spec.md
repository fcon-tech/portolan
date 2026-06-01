# Feature Specification: Technical Debt Findings

**Feature Branch**: `013-technical-debt-findings`
**Created**: 2026-05-20
**Status**: Implemented for rule-light debt candidates derived from observed
relationship, duplication, configuration, and unresolved-evidence signals.
**Input**: Product backlog P2-013: turn relationship, duplication,
configuration, importer, and black-box evidence into technical-debt findings
without readiness verdicts.

## User Scenarios & Testing

### User Story 1 - Produce Concrete Debt Findings (Priority: P1)

An agent can report specific debt findings such as duplicated logic, unknown
owners, stale generated files, config drift, dependency version drift, or orphan
modules.

**Independent Test**: A fixture emits at least one `technical_debt` finding with
evidence pointers and no unsupported recommendation.

### User Story 2 - Separate Evidence From Interpretation (Priority: P1)

A reviewer can see why a debt finding exists and which evidence supports it.

**Independent Test**: Each finding includes evidence state, source pointers,
confidence, and risk text.

### User Story 3 - Avoid Readiness Or Modernization Verdicts (Priority: P2)

The output helps prioritize review without saying the system is ready, failed,
modernized, or degraded.

**Independent Test**: Generated findings contain no readiness/pass/fail verdict
fields.

## Requirements

- **FR-001**: System MUST emit technical-debt findings as JSON Lines compatible
  with the map artifact contract.
- **FR-002**: Every finding MUST cite local evidence or use `unknown`,
  `cannot_verify`, or `not_assessed`.
- **FR-003**: System MUST support severity levels without treating severity as a
  readiness verdict.
- **FR-004**: System MUST avoid automatic rewrite plans.
- **FR-005**: System MUST make debt rule inputs transparent and testable.
- **FR-006**: System MUST NOT use readiness, pass/fail, modernization, or
  merge-gate language in technical-debt summaries.
- **FR-007**: System MUST preserve `not_assessed`, `unknown`, and
  `cannot_verify` as unresolved evidence states rather than hiding them behind
  observed debt findings.

## Existing Open Source

- Use existing scanner/importer/native outputs where possible: relationships,
  duplication, configuration, SBOM, jscpd, Semgrep, and black-box evidence.
- Keep richer rule packs and semantic modernization analysis outside this slice
  until concrete OSS outputs justify them.
- Avoid building a broad modernization engine.

## Success Criteria

- **SC-001**: Fixture output contains relationship-backed, duplication-backed,
  config-backed, and unresolved-evidence debt findings.
- **SC-002**: Findings are useful to agents without requiring prose scraping.
- **SC-003**: Generated debt summaries contain no readiness/pass/fail,
  modernization verdict, or automatic rewrite recommendation.
- **SC-004**: Bigtop smoke gaps drive the next debt rules.

## Assumptions

- Relationship, duplication, and configuration surfaces now provide enough local
  evidence for non-verdict debt candidate aggregation.
