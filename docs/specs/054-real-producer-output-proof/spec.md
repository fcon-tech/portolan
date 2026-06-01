# Feature Specification: Real Producer Output Proof

**Feature Branch**: `codex/054-bigtop-architecture-proof`

**Created**: 2026-06-01

**Status**: Merged via PR #32 as a narrowed proof; fresh Bigtop context/map
artifacts surface Docker Compose, Helm, and protoc outputs as bounded
`metadata-visible` evidence, and Cursor Composer 2.5 uses those producer-run
IDs without runtime overclaiming; GitHub checks and squash merge are verified;
symbol/reference, full API/catalog/model coverage, runtime topology, and
human/enterprise-intelligence parity remain `not_assessed`

**Input**: User description: "After merging PR #31, slice specs and continue
stress tests until Portolan verifies real symbol/API/catalog/model/runtime
producer outputs beyond Syft/CycloneDX, especially on Apache Bigtop with
Cursor."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acquire Real Local Producer Outputs (Priority: P1)

A maintainer can run or collect real local producer outputs for Apache Bigtop
that cover symbol/reference, API/catalog, deployment/model, or static analysis
families beyond the existing Syft/CycloneDX dependency evidence.

**Why this priority**: Portolan cannot prove Bigtop architecture understanding
while symbol/API/catalog/model families remain only recommended or
`not_assessed`.

**Independent Test**: On `/home/fall_out_bug/projects/bigtop-landscape`, create
a fresh stress run that includes at least two non-Syft/CycloneDX local producer
outputs, records their generation source, and feeds them into Portolan without
network access, credentials, daemon behavior, or target mutation.

**Acceptance Scenarios**:

1. **Given** a fresh Bigtop landscape checkout and no reused stale producer
   artifacts, **When** a supported local producer output is added, **Then**
   Portolan records its path, family, freshness, target scope, and evidence
   state.
2. **Given** a candidate producer cannot run locally or cannot produce a safe
   artifact, **When** the stress run records the attempt, **Then** the family is
   marked `blocked`, `failed`, or `not_assessed` with reason, not silently
   omitted.

---

### User Story 2 - Normalize Outputs Without Owning Scanners (Priority: P2)

An agent can consume the acquired producer outputs through Portolan context and
map artifacts without Portolan becoming a language-specific scanner or tool
execution harness.

**Why this priority**: The product boundary requires composition of existing
tools before building native scanners.

**Independent Test**: Generate a context pack and map bundle that include the
new outputs and verify that they improve coverage for their evidence families
while unsupported semantic/runtime claims remain weak.

**Acceptance Scenarios**:

1. **Given** a symbol/reference or API/catalog output is present, **When** the
   context pack is generated, **Then** it names the covered repositories and the
   remaining unsupported families separately.
2. **Given** producer evidence covers only part of Bigtop, **When** the map or
   context coverage is read, **Then** Portolan does not extend that evidence to
   the whole landscape.

---

### User Story 3 - Stress Cursor With Real Outputs (Priority: P3)

Cursor + Composer 2.5 can use the real producer outputs through Portolan to
answer bounded architecture questions better than with Syft/CycloneDX alone.

**Why this priority**: The requested product proof is not local artifact
generation alone; it is whether Cursor can navigate and reason better with
Portolan evidence.

**Independent Test**: Run headless Cursor + Composer 2.5 against a fresh
Portolan bundle containing the new outputs and compare its answer quality
against the prior Syft/CycloneDX-only stress record.

**Acceptance Scenarios**:

1. **Given** the new producer outputs are present, **When** Cursor answers a
   Bigtop architecture question, **Then** it cites those outputs for supported
   claims and leaves unsupported runtime/semantic claims as `not_assessed`.
2. **Given** Cursor overclaims beyond the producer evidence, **When** the run is
   reviewed, **Then** the issue is recorded as a product gap or answer-contract
   gap before any verification claim is made.

### Edge Cases

- A candidate tool is installed but cannot process the full Bigtop landscape.
- A producer output is too large for direct agent context.
- A producer output covers a subset of repositories or languages.
- A producer emits local paths, URLs, package names, or symbols that require
  redaction before public use.
- A producer requires network, credentials, daemon behavior, or target mutation.
- Two producer outputs disagree about ownership, relationship, or API/catalog
  evidence.
- Cursor uses a recommendation record as if it were observed evidence.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The feature MUST acquire or explicitly disposition real local
  producer outputs beyond Syft/CycloneDX for at least two evidence families.
- **FR-002**: Each producer attempt MUST record command/source, target root,
  output path, freshness, local-only posture, and whether the output is
  verified, failed, blocked, or `not_assessed`.
- **FR-003**: Portolan MUST import or surface acquired outputs through existing
  context/map contracts before claiming improved evidence coverage.
- **FR-004**: Portolan MUST NOT add a new language-specific scanner, network
  dependency, daemon, credential requirement, or target mutation without a
  separate approved design.
- **FR-005**: Coverage from each producer MUST remain scoped to the repositories,
  directories, languages, and evidence family actually covered.
- **FR-006**: Missing, stale, partial, malformed, or unsafe outputs MUST remain
  `failed`, `blocked`, `cannot_verify`, or `not_assessed`.
- **FR-007**: Cursor stress evidence MUST distinguish improved navigation from
  verified architecture understanding.
- **FR-008**: Public or committed excerpts MUST not include private paths,
  credentials, customer names, hostnames, or raw sensitive source snippets.

### Key Entities

- **Producer Run**: A local attempt to generate or collect a producer output.
- **Producer Output**: A local artifact supplied to Portolan for one evidence
  family.
- **Evidence Family Coverage**: The scoped coverage state created by one output
  for one repository or landscape segment.
- **Cursor Stress Verdict**: A reviewed answer-quality result from Cursor +
  Composer 2.5 on a fresh Portolan bundle.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least two non-Syft/CycloneDX producer families are verified,
  failed, blocked, or `not_assessed` with durable evidence.
- **SC-002**: At least one fresh Portolan context/map bundle includes the new
  producer-output evidence or explicit blocked records.
- **SC-003**: Cursor + Composer 2.5 produces a reviewed answer using the fresh
  bundle and does not treat missing runtime topology as verified.
- **SC-004**: The stress record identifies whether the new outputs changed
  answer quality compared with the Syft/CycloneDX-only baseline.
- **SC-005**: No new Portolan-owned per-language scanner or producer execution
  wrapper is introduced.

## Assumptions

- Apache Bigtop stress target remains
  `/home/fall_out_bug/projects/bigtop-landscape`.
- Headless Cursor Agent with `composer-2.5` remains the first Cursor lane.
- Existing Portolan import/adapter contracts should be reused where possible.
- This spec proves producer-output acquisition and use, not complete runtime
  topology or full human-equivalent architecture understanding.
