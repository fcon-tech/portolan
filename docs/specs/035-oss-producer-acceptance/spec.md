# Feature Specification: OSS Producer Acceptance

**Feature Branch**: `035-oss-producer-acceptance`

**Created**: 2026-05-26

**Status**: Merged with partial producer acceptance

**Input**: User description: "The OSS track is not validated until real OSS
producer outputs are generated and used on a large target."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prove Local OSS Evidence Changes Answers (Priority: P1)

An evaluator generates local OSS evidence for a real target and verifies
whether that evidence improves answers about duplication, component identity,
configuration, or relationships.

**Why this priority**: Adapter contracts and planned commands do not prove that
OSS composition works.

**Independent Test**: Generate local OSS outputs, rerun the Portolan-assisted
workflow, and compare the before/after conclusions.

**Acceptance Scenarios**:

1. **Given** a target without OSS outputs, **When** local OSS outputs are
   generated and included, **Then** the answer identifies which conclusions
   changed because of the new evidence.
2. **Given** a producer cannot be run safely, **When** the acceptance is
   recorded, **Then** it is marked blocked or `not_assessed` with a reason.
3. **Given** output contains unsafe private content, **When** it is evaluated,
   **Then** unsafe evidence is excluded from product claims.

### Edge Cases

- A producer is unavailable on the machine.
- A producer is too slow for the target.
- A producer output is malformed or too large.
- A producer finds nothing useful; this is a valid result, not a failure by
  itself.
- License, privacy, or network behavior prevents using a producer.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The acceptance MUST identify the OSS producer family being tested
  and the user question it supports.
- **FR-002**: The acceptance MUST record producer availability, safety decision,
  execution result, output location, and output summary.
- **FR-003**: The acceptance MUST compare agent conclusions before and after
  the OSS output is available.
- **FR-004**: The acceptance MUST classify each producer as verified,
  not_assessed, blocked, failed, or unsafe.
- **FR-005**: The acceptance MUST preserve privacy boundaries and must not
  commit secret values or private source snippets.
- **FR-006**: The acceptance MUST update the product hypothesis ledger with the
  evidence impact or the reason no impact was proven.

### Key Entities

- **OSS Producer**: A local tool or exported source of evidence.
- **Producer Run**: One attempt to generate local evidence, including safety and
  result.
- **Evidence Impact**: The difference between conclusions before and after OSS
  output is available.
- **Safety Decision**: Whether the producer can run locally without violating
  privacy, license, runtime, or mutation boundaries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least one local OSS producer is verified on a real target or is
  explicitly blocked with evidence.
- **SC-002**: 100% of tested producer outputs have recorded safety status and
  output disposition.
- **SC-003**: The acceptance records whether the OSS output changed at least one
  stakeholder answer; if not, the OSS value claim is narrowed or rejected.
- **SC-004**: No committed acceptance artifact contains secret values or raw
  private source snippets.

## Assumptions

- The first producers to evaluate are the ones most directly tied to duplicate
  and component questions.
- Producer execution requires explicit local safety review before use.
- A blocked producer is acceptable evidence against readiness.

## Validation Result

Local producer setup and Bigtop acceptance were attempted on 2026-05-26.
`syft` was installed and produced a CycloneDX 1.6 SBOM with 18,769 components
and 5,357 dependency records under the selected context output directory.
`portolan context prepare --force` now preserves those producer outputs and
records the CycloneDX family as `input_present` / `metadata-visible`.

`jscpd` was installed and started against the full Bigtop landscape, but the
default generated-file-heavy invocation produced unbounded clone stdout and was
interrupted before JSON output was written. Semgrep remains `not_assessed`
because no local Semgrep config was present and network-backed configs are out
of the default safety boundary.

The OSS composition value claim is accepted for Syft/CycloneDX component
identity evidence only. Near-clone duplication and Semgrep-backed semantic
findings remain unproven.
