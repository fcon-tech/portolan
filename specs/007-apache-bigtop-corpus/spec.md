# Feature Specification: Apache Bigtop Test Corpus

**Feature Branch**: `007-apache-bigtop-corpus`
**Created**: 2026-05-20
**Status**: Local fallback smoke complete; Cursor + Composer operator lane degraded
**Input**: Product decision to start testing against Apache Big Data / Bigtop
immediately after the agent skill pack, so real corpus friction drives the next
Portolan capabilities.

## User Scenarios & Testing

### User Story 1 - Select A Realistic Ecosystem Corpus (Priority: P1)

A Portolan maintainer can point early acceptance planning and fixture work at
one documented OSS ecosystem instead of using disconnected toy repositories.

**Why this priority**: Portolan's product value depends on messy ecosystem
evidence. Tiny fixtures are useful for implementation, but they must not become
a substitute for early product pressure from a realistic corpus.

**Independent Test**: Inspect the committed corpus manifest and verify that it
contains a Bigtop root, current component repositories, retired legacy projects,
and runtime/package metadata targets.

**Acceptance Scenarios**:

1. **Given** the Apache Bigtop corpus manifest, **When** a maintainer reviews
   scope, **Then** the Bigtop root, Bigtop 3.5.0 release BOM, support matrix,
   component repositories, Bigtop internal support packages, retired projects,
   and package/runtime surfaces are visible.
2. **Given** a component appears in the Bigtop release BOM, **When** it is
   represented in the corpus, **Then** its version is metadata-bound to the
   release reference rather than claimed as observed source state.

### User Story 2 - Preserve Legacy And Unknown States (Priority: P1)

A reviewer can see retired Hadoop-era projects and weak evidence without
Portolan presenting them as verified active source facts.

**Why this priority**: The corpus should test the evidence model early enough to
prevent building detectors that only work on toy fixtures.

**Independent Test**: Generate a fixture graph that includes Oozie and Sqoop
with retirement metadata and at least one `unknown` or `cannot_verify` fact.

**Acceptance Scenarios**:

1. **Given** Oozie is in the corpus, **When** lifecycle is rendered, **Then** it
   is represented as retired metadata even if a source repository URL exists.
2. **Given** a runtime surface is declared but not locally observed, **When**
   Portolan emits a graph, **Then** it records `unknown` or `cannot_verify`
   rather than upgrading it to `runtime-visible`.

### User Story 3 - Keep Corpus Preparation Separate From Scan Execution (Priority: P2)

A user can run a default Portolan scan without surprise upstream network access,
even when the selected corpus originated from public OSS references.

**Why this priority**: Portolan is local-first and read-only by default.

**Independent Test**: Run the default scan over a prepared local selection
fixture and verify it only reads local paths.

**Acceptance Scenarios**:

1. **Given** the Bigtop corpus manifest contains upstream URLs, **When** a
   normal scan runs, **Then** those URLs are used only as attribution unless an
   explicit preparation command is added in a later spec.
2. **Given** a local fixture omits a component repository, **When** a dependency
   edge references that component, **Then** Portolan records the missing source
   as `unknown` or `cannot_verify`.

### User Story 4 - Test The Operator Assembly Immediately After Skills (Priority: P1)

An evaluator can use Apache Bigtop to test the first skill-pack workflow around
Portolan: Cursor as the interactive engineering surface, Composer 2.5 as the
agent/model pair, and Portolan as the evidence graph and packet substrate.

**Why this priority**: The skill pack is not proven until an agent can use it on
a messy corpus. Bigtop should expose product gaps before deeper detector work
continues.

**Independent Test**: Run a documented operator session over a prepared Bigtop
fixture and review whether Portolan artifacts separate machine-observed evidence
from agent claims.

**Acceptance Scenarios**:

1. **Given** an operator uses Cursor with Composer 2.5, **When** the Bigtop
   smoke is run after the skill pack, **Then** the output records what Portolan
   can map now and what remains missing.
2. **Given** the agent transcript contains a conclusion that is not backed by a
   local Portolan input, **When** the output is reviewed, **Then** that conclusion
   is represented as `claim-only`, `unknown`, or `cannot_verify`, not as observed
   evidence.

## Edge Cases

- Bigtop release BOM version differs from component repository HEAD.
- Component repository exists but the release source tarball differs from the
  default branch.
- Component is external to Apache but included in Bigtop, for example Alluxio.
- Apache project is incubating or retired, for example Livy, Oozie, or Sqoop.
- Bigtop package, Docker, or CI surface is known from metadata but not observed
  locally.
- A full clone set is too large for routine local tests.
- Agent/model conclusions from Cursor, Composer, or Kimi may be useful review
  context but are not evidence unless tied to a Portolan source, metadata,
  runtime, or claim input.

## Requirements

### Functional Requirements

- **FR-001**: System MUST include a committed Apache Bigtop corpus manifest.
- **FR-002**: Manifest MUST identify official source references used for corpus
  decisions.
- **FR-003**: Manifest MUST distinguish root Bigtop metadata, component source
  repositories, Bigtop internal support packages, retired legacy projects, and
  runtime/package surfaces.
- **FR-004**: Manifest MUST preserve evidence states for each target.
- **FR-005**: Manifest MUST not imply network access during default scan.
- **FR-006**: Corpus documentation MUST describe phased testing from manifest
  validation to local source fixtures and later runtime profiles.
- **FR-007**: Bigtop release BOM component versions MUST be represented as
  metadata facts unless the exact local source checkout is observed.
- **FR-008**: Retired projects MUST keep lifecycle evidence separate from source
  repository visibility.
- **FR-009**: Corpus documentation MUST state that the first acceptance target
  is a Cursor + Composer 2.5 skill-pack smoke followed by larger Bigtop runs.
- **FR-010**: Agent/model transcript content MUST remain lower-authority
  evidence unless supported by local Portolan inputs.
- **FR-011**: The first Bigtop smoke MUST record missing product capabilities as
  backlog gaps before deeper detector implementation proceeds.

### Key Entities

- **Corpus Manifest**: Machine-readable list of targets, layers, references,
  evidence states, and acceptance checks.
- **Source Reference**: Official upstream source used to justify the corpus.
- **Target**: Repository, release, documentation page, binary repository,
  Docker surface, runtime surface, or retired project.
- **Layer**: A curated subset of targets used for staged testing.
- **Acceptance Check**: Requirement that later fixtures or scanners must satisfy
  before the corpus is considered useful.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `jq empty corpora/apache-bigtop/manifest.json` succeeds.
- **SC-002**: `jq empty schema/corpus-manifest.schema.json` succeeds.
- **SC-003**: The manifest contains at least one target in each category:
  repository, release, documentation, binary-repository, docker-image, runtime,
  and retired-project.
- **SC-004**: The corpus includes at least five Bigtop dependency edges through
  `depends_on`.
- **SC-005**: Documentation defines a local-first fixture plan that does not
  require upstream network access during default scan execution.
- **SC-006**: Documentation states how the Bigtop corpus tests the Cursor +
  Composer 2.5 skill-pack workflow without making Portolan depend on that stack.
- **SC-007**: The acceptance plan names concrete gap categories to collect:
  agent workflow failures, missing relationships, missing duplication,
  missing configuration surfaces, missing technical-debt findings, packet
  usefulness gaps, and unsupported agent inferences.

## Assumptions

- Apache Bigtop 3.5.0 is the first pinned release profile.
- Current upstream links are attribution and preparation inputs, not runtime scan
  permissions.
- Full corpus cloning is optional later preparation, not part of the immediate
  skill-pack smoke or default MVP.
- Initial schema validation may be syntax-only until a JSON Schema validator is
  introduced.
- Composer 2.5 is named as the first cheap evaluation stack, not as a Portolan
  runtime dependency.
