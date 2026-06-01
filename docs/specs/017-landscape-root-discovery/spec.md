# Feature Specification: Landscape Root Discovery

**Feature Branch**: `017-landscape-root-discovery`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: Product correction: a generated `selection.json` is not a realistic
blind-acceptance input. A user should be able to give an agent a Portolan path,
a normal local ecosystem directory, and an output directory. Portolan must then
discover the local landscape from that target root without target-specific
scaffolding or a prebuilt selection file.

## User Scenarios & Testing

### User Story 1 - Map A Directory Of Repositories (Priority: P1)

A user gives an agent one local target directory that contains multiple cloned
repositories. The agent can run Portolan on that directory and receive one
evidence-backed artifact bundle that represents every visible local repository
without being handed a generated selection file.

**Why this priority**: If the operator must provide `selection.json`, blind
acceptance is still a prepared demo. Real users will usually have a directory of
repositories, not a Portolan-specific inventory contract.

**Independent Test**: Run Portolan against a fixture or local directory with at
least four child Git repositories and no selection file. The command writes
`run.json`, `coverage.json`, `graph.json`, `findings.jsonl`, and `map.md`; every
discovered repository appears as a distinct source-visible input.

**Acceptance Scenarios**:

1. **Given** a target directory containing several child Git repositories,
   **When** an agent runs the documented map workflow with only the target root
   and output directory, **Then** Portolan discovers and maps every direct local
   repository without requiring `--selection`.
2. **Given** the target directory contains a `repos/` subdirectory with cloned
   repositories, **When** Portolan maps the target root, **Then** it treats
   `repos/*` repositories as landscape members rather than collapsing the parent
   directory into a fake single repository.
3. **Given** the target directory also contains non-repository files or
   directories, **When** Portolan writes coverage, **Then** it reports skipped or
   unsupported inputs explicitly without pretending they were source-visible
   repositories.

### User Story 2 - Keep Completeness Honest Without A Manifest (Priority: P1)

A reviewer can tell the difference between "all locally visible repositories
were mapped" and "the external ecosystem is complete".

**Why this priority**: A directory of local checkouts does not prove the full
ecosystem is present. Portolan must not turn local discovery into a false
coverage claim.

**Independent Test**: Map a local ecosystem directory that has no corpus
manifest. The resulting packet states local repository coverage and marks
external completeness as `unknown` or `not_assessed`.

**Acceptance Scenarios**:

1. **Given** no manifest or declared inventory is supplied, **When** Portolan
   maps a landscape root, **Then** it reports local discovery coverage only and
   does not claim 100% ecosystem completeness.
2. **Given** a known corpus manifest is supplied or discovered through an
   approved local contract in a later slice, **When** Portolan compares local
   repositories with that manifest, **Then** missing required entries remain
   `unknown`, `cannot_verify`, or blocked according to the manifest policy.

### User Story 3 - Preserve The Selection Contract As Advanced Input (Priority: P2)

Advanced users and fixtures can still provide explicit selections, but blind
operator acceptance does not depend on that shortcut.

**Why this priority**: Explicit selections are useful for tests, curated
enterprise inventories, and imported tool outputs. They should not be confused
with the first-run user experience.

**Independent Test**: Existing `map --selection` fixtures continue to pass, while
the blind acceptance docs use target-root discovery as the default path.

**Acceptance Scenarios**:

1. **Given** a valid explicit selection, **When** Portolan runs with
   `--selection`, **Then** existing landscape mapping behavior remains
   unchanged.
2. **Given** a blind acceptance prompt, **When** the evaluator reviews it,
   **Then** it contains only Portolan path, target root, output path, and
   boundaries; it does not hand the agent a selection path.

### Edge Cases

- The target root itself is a Git repository and also contains nested Git
  repositories.
- The target root is not a Git repository but has direct child repositories.
- Repositories are nested one level deeper under a conventional `repos/`
  directory.
- A child path is a symlink, unreadable, empty, or not a Git repository.
- The output directory is inside the target root.
- The target root is very large or is a high-level directory such as
  `/home/user/projects`.
- Existing generated Portolan artifacts are present from an earlier run.
- A generated or hand-authored selection file exists in the directory but is not
  part of the blind prompt.
- The target has repo-like child directories or a curated `selection.json`, but
  the child directories are not Git checkouts. Portolan must not mark them
  source-visible repositories, but the packet should explain the mismatch so
  Cursor does not treat "0 discovered repositories" as a complete absence of
  local project structure.
- Multiple repositories have the same basename or ambiguous identity.
- The agent cannot execute shell commands and can only inspect files.

## Requirements

### Functional Requirements

- **FR-001**: System MUST support mapping a local landscape target root without
  requiring a pre-existing `selection.json`.
- **FR-002**: System MUST discover local Git repositories that are direct
  children of the target root or direct children of a conventional `repos/`
  subdirectory.
- **FR-003**: System MUST preserve distinct repository identities for every
  discovered repository and MUST NOT collapse a multi-repository landscape into
  one parent-directory node.
- **FR-004**: System MUST keep existing `map --selection` behavior working for
  explicit curated inventories.
- **FR-005**: System MUST not fetch remotes, clone repositories, read
  credentials, start daemons, or mutate target repositories during discovery.
- **FR-006**: System MUST write the normal map artifact bundle:
  `run.json`, `coverage.json`, `graph.json`, `findings.jsonl`, and `map.md`.
- **FR-007**: Coverage MUST distinguish locally discovered repository coverage
  from external ecosystem completeness.
- **FR-008**: If no manifest or inventory is supplied, external completeness
  MUST be reported as `unknown` or `not_assessed`, not as complete.
- **FR-009**: Symlinked, unreadable, missing, or non-repository child paths MUST
  be represented as skipped, `cannot_verify`, or `not_assessed` rather than
  source-visible.
- **FR-010**: Blind acceptance documentation MUST use target-root input only and
  MUST treat an explicitly supplied selection path as a degraded or non-blind
  run.
- **FR-011**: The Bigtop acceptance path MUST be able to run from the local
  ecosystem root `/home/fall_out_bug/projects/bigtop-landscape` without giving
  the agent `/home/fall_out_bug/projects/bigtop-landscape/selection.json`.
- **FR-012**: Discovery MUST have a bounded search policy so users do not
  accidentally scan arbitrary large directory trees.
- **FR-013**: If no Git repositories are discovered but local curated inputs or
  repo-like child directories exist, discovery MUST record a gap that explains
  the evidence mismatch instead of silently returning an empty landscape.

### Key Entities

- **Landscape Root**: A local directory that may contain multiple repositories
  and supporting files.
- **Discovered Repository**: A local Git repository found under the bounded
  discovery policy.
- **Generated Inventory**: Internal run-time representation of discovered
  repositories. It may be written as an artifact, but it is not required as user
  input.
- **Discovery Coverage**: Evidence of what Portolan found, skipped, could not
  verify, or did not assess.
- **External Completeness**: A stronger claim that the local set represents a
  complete ecosystem or corpus; unavailable without a manifest or explicit
  inventory.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A multi-repository fixture with no selection file maps
  successfully from target root and emits all five map artifacts.
- **SC-002**: The Bigtop local ecosystem root maps without passing
  `selection.json` to the agent or CLI.
- **SC-003**: Coverage includes every discovered child Git repository exactly
  once with stable ids and source-visible evidence.
- **SC-004**: The generated packet clearly states that external completeness is
  `unknown` or `not_assessed` unless a manifest comparison is part of the run.
- **SC-005**: Existing `map --selection` tests and full-corpus gate tests keep
  passing.
- **SC-006**: Blind acceptance prompts and ledgers no longer require or suggest
  `Landscape: <selection.json>` as an operator input.

## Assumptions

- A first implementation can use a bounded filesystem convention: target root
  direct child repositories plus `repos/*` direct child repositories.
- Deep recursive repository discovery is out of scope until there is a safety
  policy for large trees and vendored checkouts.
- Exact release-ref parity remains metadata-bound and is out of scope for this
  discovery slice.
- Explicit selections remain valid for fixtures and curated enterprise
  inventories, but they are not valid proof of blind agent acceptance.
