# Feature Specification: Runtime Topology Evidence

**Feature Branch**: `codex/054-bigtop-architecture-proof`

**Created**: 2026-06-01

**Status**: Draft; depends on real local evidence boundaries from spec 054

**Input**: User description: "Continue after PR #31 until runtime topology is
verified, not inferred from dependency, catalog, or static producer outputs."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import Runtime-Visible Observations (Priority: P1)

A maintainer can supply local runtime-visible observations for a landscape and
Portolan can mark runtime relationships as observed only when those inputs
actually exist.

**Why this priority**: Runtime topology is currently `not_assessed`; static
dependency, symbol, or catalog evidence must not be promoted to runtime truth.

**Independent Test**: Provide a local runtime observation artifact for a small
fixture and a Bigtop-like stress subset, generate a map bundle, and verify that
only runtime-backed relationships receive `runtime-visible` evidence.

**Acceptance Scenarios**:

1. **Given** local runtime observations describe service or process
   communication, **When** Portolan imports them, **Then** runtime relationships
   cite the observation source and evidence state.
2. **Given** no runtime observation is supplied, **When** dependency or catalog
   evidence exists, **Then** runtime topology remains `not_assessed`.

---

### User Story 2 - Preserve Static/Runtime Boundaries (Priority: P2)

An agent can see which claims come from runtime observations and which remain
static, declared, metadata-only, or unknown.

**Why this priority**: Enterprise architecture claims often fail by confusing
declared topology with observed behavior.

**Independent Test**: Generate a mixed bundle with static dependency evidence,
catalog/model evidence, and runtime observations for only part of the landscape;
verify the answer contract prevents cross-family promotion.

**Acceptance Scenarios**:

1. **Given** catalog evidence names a service relation but no runtime event
   confirms it, **When** an agent reads the bundle, **Then** the relation is not
   reported as runtime-visible.
2. **Given** runtime observations cover only a subset of repositories, **When**
   coverage is summarized, **Then** uncovered repositories remain
   `not_assessed`.

---

### User Story 3 - Stress Runtime Questions With Cursor (Priority: P3)

Cursor + Composer 2.5 can answer runtime topology questions only to the extent
that Portolan supplies runtime-visible local evidence.

**Why this priority**: The user explicitly asked for runtime topology to be
verified, not merely planned.

**Independent Test**: Run Cursor against a fresh bundle with runtime-visible
and non-runtime evidence mixed, then review whether it correctly separates
observed runtime topology from static hints.

**Acceptance Scenarios**:

1. **Given** runtime-visible evidence exists for one subsystem, **When** Cursor
   answers a topology question, **Then** it cites runtime sources for that
   subsystem.
2. **Given** another subsystem lacks runtime observations, **When** Cursor
   answers, **Then** it reports the area as `not_assessed` or `unknown`.

### Edge Cases

- Runtime observations are stale or generated from the wrong root.
- Runtime observations include private hostnames, URLs, or credentials.
- Runtime observations disagree with static catalog or dependency evidence.
- Observations are sampled and do not cover all services.
- Runtime data cannot be collected for Bigtop without starting services.
- A local runtime source requires mutation, network, or credentials.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Portolan MUST accept runtime topology only from explicit local
  runtime-visible observations.
- **FR-002**: Portolan MUST keep dependency, symbol, API/catalog, and
  deployment/model evidence separate from runtime-visible evidence.
- **FR-003**: Runtime records MUST carry source, freshness, target scope,
  observation method, and privacy/redaction status.
- **FR-004**: Missing or unsafe runtime observations MUST remain `not_assessed`,
  `blocked`, `cannot_verify`, or `unknown`.
- **FR-005**: Runtime topology outputs MUST not expose credentials, raw private
  payloads, or sensitive hostnames in committed fixtures.
- **FR-006**: Cursor stress review MUST classify overclaims as product defects
  or answer-contract defects before any runtime proof is accepted.

### Key Entities

- **Runtime Observation**: A local artifact that records observed behavior such
  as process, request, trace, log, container, or service communication.
- **Runtime Relationship**: A graph relationship backed by runtime-visible
  evidence.
- **Runtime Coverage**: The scoped set of systems and time ranges covered by
  runtime observations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A test fixture proves runtime-visible relationships are emitted
  only from runtime observation inputs.
- **SC-002**: A stress run records whether Bigtop runtime topology is verified,
  blocked, or `not_assessed` with reasons.
- **SC-003**: Cursor answers at least one runtime question with correct
  evidence-state separation.
- **SC-004**: Static dependency/catalog evidence is never counted as runtime
  topology coverage.

## Assumptions

- Starting or mutating Bigtop services is not approved by default.
- Runtime evidence may be synthetic fixture evidence before full Bigtop runtime
  evidence is available, but synthetic evidence cannot prove Bigtop topology.
- Full runtime topology may remain blocked or `not_assessed` if no safe local
  runtime observation source exists.
