# Feature Specification: Apache Bigtop Test Corpus

**Feature Branch**: `007-apache-bigtop-corpus`
**Created**: 2026-05-20
**Status**: Backlog spec
**Input**: Product decision to start test strategy with Apache Big Data / Bigtop as the first realistic OSS ecosystem corpus.

## User Scenarios & Testing

### User Story 1 - Select A Realistic Ecosystem Corpus (Priority: P1)

A Portolan maintainer can point planning and fixture work at one documented OSS
ecosystem instead of using disconnected toy repositories.

**Why this priority**: Portolan's product value depends on messy ecosystem
evidence. Tiny fixtures cannot prove multi-repo, legacy, and black-box behavior.

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

**Why this priority**: The corpus should test the evidence model, not only the
happy path where every repository is current and cloneable.

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

## Edge Cases

- Bigtop release BOM version differs from component repository HEAD.
- Component repository exists but the release source tarball differs from the
  default branch.
- Component is external to Apache but included in Bigtop, for example Alluxio.
- Apache project is incubating or retired, for example Livy, Oozie, or Sqoop.
- Bigtop package, Docker, or CI surface is known from metadata but not observed
  locally.
- A full clone set is too large for routine local tests.

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

## Assumptions

- Apache Bigtop 3.5.0 is the first pinned release profile.
- Current upstream links are attribution and preparation inputs, not runtime scan
  permissions.
- Full corpus cloning is an optional later preparation step, not part of the
  default MVP.
- Initial schema validation may be syntax-only until a JSON Schema validator is
  introduced.
