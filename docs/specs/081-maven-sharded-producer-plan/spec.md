# Feature Specification: Maven Sharded Producer Plan

**Feature Branch**: `codex/081-maven-sharded-producer-plan`

**Created**: 2026-06-02

**Status**: Ready-for-review PR #59; local baseline, fresh Bigtop context
smoke, Cursor Composer 2.5 stress, three assessed non-GPT review lanes, and
GitHub checks verified; merge approval `not_assessed`

**Input**: Cursor Composer 2.5 stress on a fresh Bigtop context found that
spec 078 improved JVM/build-tool navigation but left the Maven next action
only partially adequate: `oss-plan.json` emitted one sample `pom.xml` command,
not a multi-repository rollout plan. For a large inherited JVM landscape this
keeps the operator guessing which repositories are covered.

## User Scenarios & Testing

### User Story 1 - Repository-Sharded Maven Next Actions (Priority: P1)

A Portolan operator preparing context for a multi-repo Maven landscape sees one
approval-gated Maven/CycloneDX command per repository with visible Maven
manifests, bounded to the current context `tool-outputs` directory.

**Why this priority**: The original Bigtop risk is Java/Scala/Maven
inter-repo relationship evidence remaining `not_assessed`. A single sample
command is too weak as navigation support for a multi-repo estate.

**Independent Test**: A fixture with two Maven repositories produces two
`maven-cyclonedx` commands, both approval-required, both writing under
`context/tool-outputs/maven-cyclonedx/`.

**Acceptance Scenarios**:

1. **Given** two repositories each contain `pom.xml`, **When** context is
   prepared, **Then** the Maven plan emits two commands, one per repository.
2. **Given** Maven commands are emitted, **When** an agent reads the plan,
   **Then** every command requires user approval and keeps dependency evidence
   `not_assessed` until local output exists.
3. **Given** a very large landscape, **When** the command list would be
   excessive, **Then** Portolan caps the command count and records that cap in
   the plan reason rather than emitting an unbounded recipe list.

### User Story 2 - No Maven Execution Or Parser Creep (Priority: P1)

An agent can use the sharded commands as native producer-output next actions
without assuming Portolan parsed Maven semantics or executed Maven.

**Independent Test**: Fresh Bigtop context plus Cursor Composer 2.5 stress
confirms producer execution, dependency relationships, and inter-repo JVM
coupling remain `not_assessed`.

## Requirements

- **FR-001**: `context prepare` MUST retain Maven manifest surface by
  repository, not only one global Maven sample.
- **FR-002**: `oss-plan.json` MUST emit one Maven/CycloneDX command per
  retained repository when Maven manifests are visible and Maven/wrapper
  execution is available.
- **FR-003**: Maven commands MUST write only under
  `<context>/tool-outputs/maven-cyclonedx/`.
- **FR-004**: Maven commands MUST require user approval and preserve network,
  cache, and target-mutation risks.
- **FR-005**: The Maven plan MUST remain `available_not_run` /
  `not_assessed`; dependency facts MUST NOT become claimable without local
  producer output.
- **FR-006**: The command list MUST be bounded by an explicit cap.
- **FR-007**: The feature MUST NOT run Maven, Gradle, jscpd, Syft, Docker, or
  any native producer during context preparation or verification.

## Success Criteria

- **SC-001**: Focused contextprep tests pass for multiple Maven repositories.
- **SC-002**: Fresh Bigtop context shows repository-sharded Maven commands and
  no `tool-outputs` producer output directory.
- **SC-003**: Cursor Composer 2.5 classifies the Maven next action as specific
  enough while keeping dependency relationships and producer execution
  non-claimable.
- **SC-004**: Baseline checks pass.

## Assumptions

- CycloneDX Maven remains the preferred immediate output family from spec 078.
- Gradle remains commandless unless a safe project-local plugin/init-script
  output boundary is known.
- This slice improves navigation; it does not close JVM relationship evidence.
