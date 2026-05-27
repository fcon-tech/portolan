# Feature Specification: Bounded jscpd Profile

**Feature Branch**: `039-bounded-jscpd-profile`

**Created**: 2026-05-27

**Status**: Ready-for-review PR; GitHub checks not_assessed

**Input**: Follow-up from product claim gate and OSS producer acceptance:
validate near-clone evidence only through a bounded, local `jscpd` producer
profile instead of repeating the failed unbounded full-landscape run.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bound Near-Clone Producer Execution (Priority: P1)

A consultant or agent can run the OSS producer workflow for `jscpd` with
documented local limits and receive a clear result: verified output, failed,
blocked, or not assessed.

**Why this priority**: The current product claim boundary says near-clone
duplication remains unproven because the previous full `jscpd` run was
unbounded and interrupted.

**Independent Test**: Run the documented bounded profile against the fixed local
Bigtop target or a representative fixture and verify that the producer ledger
records a bounded result without treating partial output as success.

**Acceptance Scenarios**:

1. **Given** a local target and an approved output directory, **When** the
   bounded `jscpd` profile runs, **Then** output is written only under the
   selected output directory and includes enough metadata to know the command,
   target, limits, and result state.
2. **Given** `jscpd` produces usable JSON within the profile limits, **When**
   the result is recorded, **Then** near-clone evidence is marked verified only
   for that bounded target and profile.
3. **Given** `jscpd` times out, exceeds the profile limits, is unavailable, or
   emits unusable output, **When** the result is recorded, **Then** the ledger
   keeps the state as failed, blocked, or not_assessed with the reason.

### User Story 2 - Preserve Product Claim Honesty (Priority: P1)

A product owner can update product claims only to the scope proven by bounded
`jscpd` evidence.

**Why this priority**: The purpose is claim validation, not adding another
scanner surface that quietly upgrades unproven duplication claims.

**Independent Test**: Inspect the updated producer ledger, product claim
boundary, and client-safe limitations and verify that near-clone language is
accepted, narrowed, failed, or left not_assessed based on the bounded evidence.

**Acceptance Scenarios**:

1. **Given** a verified bounded `jscpd` output, **When** product claims are
   updated, **Then** the safe wording names the exact bounded target/profile and
   does not generalize to all landscapes.
2. **Given** no usable bounded `jscpd` output exists, **When** product claims
   are updated, **Then** near-clone duplication remains failed, blocked, or
   not_assessed rather than becoming a positive claim.

### Edge Cases

- `jscpd` is not installed or reports a different output format.
- The target contains generated files that dominate clone output.
- The bounded run produces partial output before timeout.
- The output file is malformed JSON or too large for the importer path.
- A fixture passes but the fixed Bigtop target fails or remains blocked.
- The run writes outside the selected output directory.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The feature MUST define a bounded local `jscpd` producer profile
  with explicit target, output path, timeout, include/exclude, and size limits.
- **FR-002**: The feature MUST record each bounded producer attempt as verified,
  failed, blocked, or not_assessed with the command shape and reason.
- **FR-003**: The feature MUST NOT mark near-clone duplication verified from
  interrupted, partial, missing, malformed, or out-of-bounds output.
- **FR-004**: The feature MUST keep all producer output under an explicitly
  selected output directory.
- **FR-005**: The feature MUST update the product claim boundary only with the
  scope supported by bounded `jscpd` evidence.
- **FR-006**: The feature MUST preserve existing exact-duplicate claims
  separately from `jscpd` near-clone claims.
- **FR-007**: The feature MUST run local verification and record review
  disposition before PR readiness.

### Key Entities

- **Bounded Producer Profile**: The approved local execution shape for `jscpd`,
  including target, limits, exclusions, timeout, and output location.
- **Producer Attempt**: One run or skipped run of the bounded profile with
  state, evidence, and reason.
- **Near-Clone Claim**: The product claim about duplication beyond exact native
  duplicate clusters.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every bounded `jscpd` attempt has one explicit state: verified,
  failed, blocked, or not_assessed.
- **SC-002**: Zero near-clone product claims are accepted without a verified
  bounded `jscpd` output.
- **SC-003**: The selected output directory contains all produced `jscpd`
  artifacts; no target repository mutation is required.
- **SC-004**: The product claim boundary and producer ledger agree on whether
  near-clone duplication is verified, narrowed, failed, blocked, or not_assessed.
- **SC-005**: Repository baseline checks pass or any failure is recorded with a
  blocker before PR readiness.

## Assumptions

- `jscpd` remains the OSS tool for near-clone evidence; Portolan will not build
  a native near-clone detector in this slice.
- The fixed Bigtop landscape remains the primary stress target when available,
  but fixture validation may be used to test parser and ledger behavior.
- Network-backed setup, cloning, or credential use remains out of scope.

## Validation Result

Local implementation on 2026-05-27 updated `oss-plan.json` generation so the
`jscpd` producer command is bounded by file size, file lines, ignored
generated/build/dependency/output directories, symlink avoidance, local
`.gitignore` handling, and explicit output paths.

A bounded smoke run against the Portolan repository produced
`/tmp/portolan-039-jscpd/jscpd-report.json` with 63 duplicate groups, and
rerunning `portolan context prepare --force` preserved that file as
metadata-visible jscpd evidence. This validates the bounded profile and
ingestion path for the Portolan repository smoke target only; Bigtop near-clone
evidence remains unproven until a bounded Bigtop run is executed and recorded.
