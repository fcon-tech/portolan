# Feature Specification: Black-Box Profile

**Feature Branch**: `005-black-box-profile`
**Created**: 2026-05-20
**Status**: Implemented
**Input**: Product backlog P1-005: represent black-box systems through metadata, runtime observations, and claims.

## User Scenarios & Testing

### User Story 1 - Represent A System Without Source (Priority: P1)

A platform lead can declare a system whose source code is unavailable and
still receive an evidence graph node for that system. The graph shows whether
the system is known from metadata, runtime observations, or claims, and it never
pretends that source code was inspected.

**Why this priority**: Portolan is useful for real landscapes only if black-box
systems remain visible without being upgraded into source-observed facts.

**Independent Test**: A fixture black-box system produces nodes with `metadata-visible`, `runtime-visible`, or `claim-only` evidence, but never `source-visible`.

**Acceptance Scenarios**:

1. **Given** a selection file with a black-box service and local metadata file,
   **When** `portolan scan --selection selection.json --out graph.json` runs,
   **Then** the graph contains a `service` node with `metadata-visible`
   evidence and source attribution to the metadata file.
2. **Given** the same service also has a local runtime observation file,
   **When** scan runs, **Then** runtime-derived observations use
   `runtime-visible` evidence and do not overwrite metadata evidence.
3. **Given** a black-box declaration contains no repository path, **When** scan
   runs, **Then** no fact for that system is emitted as `source-visible`.

### User Story 2 - Preserve Unknowns (Priority: P1)

A reviewer can see which relationships remain unknown instead of inferred from
weak metadata or runtime hints.

**Why this priority**: Unknown dependencies and ownership gaps are part of the
product value. Hiding them would make black-box profiles misleading.

**Independent Test**: A fixture with runtime evidence for a service but no dependency data records dependencies as `unknown`.

**Acceptance Scenarios**:

1. **Given** a black-box profile expects dependency evidence, **When** no
   metadata, runtime, or claim input provides dependencies, **Then** the graph
   records an `unknown` dependency placeholder with a reason.
2. **Given** a runtime file is present but malformed, **When** scan runs,
   **Then** the graph records `cannot_verify` for that runtime input and
   continues with other valid inputs.
3. **Given** a claim file names a dependency with no supporting observation,
   **When** scan runs, **Then** that relationship remains `claim-only`.

### User Story 3 - Explain What Black-Box Evidence Can Prove (Priority: P2)

A CTO or reviewer can read a packet generated from the graph and understand the
limits of black-box evidence without interpreting it as source analysis.

**Why this priority**: The human packet is a decision aid; it must not turn weak
evidence into a confident consulting narrative.

**Independent Test**: A packet rendered from a black-box graph says the system
was represented from metadata/runtime/claims and does not use source-analysis
language for it.

**Acceptance Scenarios**:

1. **Given** a graph with only black-box evidence, **When** packet rendering
   runs, **Then** the packet groups black-box facts by evidence state.
2. **Given** a graph contains `unknown` or `cannot_verify` black-box facts,
   **When** packet rendering runs, **Then** those facts stay visible in the
   packet with graph ids or reasons.
3. **Given** a black-box system later gains a repository target in a different
   selection, **When** scan runs, **Then** source evidence is represented as a
   separate observed fact rather than silently upgrading the black-box facts.

## Edge Cases

- A metadata file names a repository URL: record the URL as metadata only; do
  not fetch it or emit `source-visible`.
- A runtime observation references a service that is not declared as a
  black-box target: emit `cannot_verify` for the orphan observation unless a
  later merge policy explicitly allows creating implicit services.
- Multiple inputs describe the same relationship with different states: preserve
  the stronger observed evidence and the weaker claim as separate evidence
  records or deterministic duplicate facts until multi-evidence support exists.
- A black-box target has no usable metadata, runtime, or claim input: emit an
  `unknown` node with a reason instead of omitting the system.
- A selected black-box input path is missing: record `cannot_verify` for that
  input and continue if the rest of the selection can be scanned.
- A profile asks for live telemetry, service discovery, credentials, or network
  calls: reject it in this slice.
- A packet renderer sees a graph produced before this slice: it must still
  render normally and only add black-box wording when the graph facts support it.

## Requirements

### Functional Requirements

- **FR-001**: System MUST support black-box target declarations in local
  selection files.
- **FR-002**: System MUST prevent black-box-derived facts from using
  `source-visible`.
- **FR-003**: System MUST distinguish metadata, runtime, and claim evidence for
  black-box systems.
- **FR-004**: System MUST record explicit `unknown` facts for expected but
  missing black-box fields when a profile requires them.
- **FR-005**: System MUST record `cannot_verify` with a reason when a selected
  black-box input is present but unreadable, malformed, or not attributable.
- **FR-006**: System MUST document what each black-box profile can and cannot
  prove.
- **FR-007**: System MUST NOT make network calls, query live telemetry, collect
  credentials, or mutate target systems while processing black-box profiles.
- **FR-008**: System MUST keep black-box output compatible with
  `schema/evidence-graph.schema.json`.
- **FR-009**: System MUST keep packet summaries from implying source analysis
  happened for black-box-only facts.
- **FR-010**: System MUST keep black-box handling file-based by default:
  metadata, runtime observations, and claims arrive as local files.

### Key Entities

- **Black-Box Target**: A selected service or runtime system with no source path
  available to Portolan.
- **Metadata Input**: Local file describing catalog, owner, declared
  dependency, lifecycle, or environment information.
- **Runtime Observation Input**: Local file containing exported runtime or
  telemetry observations without live queries.
- **Claim Input**: Local human or tool assertion that remains lower authority
  until observed evidence supports it.
- **Expected Evidence Field**: A profile field such as owner, dependencies, or
  runtime endpoint that should be represented as `unknown` when absent.

## Success Criteria

- **SC-001**: Black-box fixture output contains no `source-visible` facts for
  black-box-derived nodes or edges.
- **SC-002**: Missing dependency evidence remains `unknown` or `cannot_verify`
  with a reason.
- **SC-003**: Packet summaries do not imply black-box source analysis happened.
- **SC-004**: Fixture coverage includes `metadata-visible`,
  `runtime-visible`, `claim-only`, `unknown`, and `cannot_verify`.
- **SC-005**: `go run ./cmd/portolan scan --selection
  testdata/black-box-profile/selection.json --out <graph.json> --force`
  exits 0 and writes parseable JSON.

## Assumptions

- Initial black-box profile is manually selected.
- Runtime observations arrive as files, not live telemetry queries.
- Black-box target output initially uses existing graph node kinds such as
  `service`, `runtime`, `claim`, and `unknown`; adding a dedicated graph node
  kind is out of scope unless the evidence graph schema is revised in the
  implementation slice.
- Multi-evidence-per-fact merging is out of scope for this slice. Duplicate
  facts may be represented deterministically until a later graph merge model
  exists.
