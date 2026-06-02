# Feature Specification: Build Tool Dependency Producers

**Feature Branch**: `codex/078-build-tool-dependency-producers`

**Created**: 2026-06-02

**Status**: Ready-for-review PR #56

**Input**: The Bigtop stress report and fresh `context prepare` run show that
Portolan lists generic Syft/CycloneDX and jscpd producer options, but does not
give agents a concrete Maven/Gradle dependency-output path even when hundreds
of `pom.xml`, `build.gradle`, and `build.gradle.kts` files are visible. This
keeps Java/Scala/Maven relationship evidence vague and encourages the wrong
answer: writing Portolan language adapters.

## User Scenarios & Testing

### User Story 1 - Build Tool Dependency Next Actions (Priority: P1)

A Portolan operator can prepare context for a JVM-heavy or mixed-language
landscape and see approval-gated native Maven/Gradle dependency producer
recipes when build manifests are visible.

**Why this priority**: The current Bigtop evidence gap is not lack of another
agent report. It is missing local dependency producer evidence for Java/Scala
build systems.

**Independent Test**: Run `portolan context prepare` on a fixture with Maven
and Gradle manifests and verify `oss-plan.json` includes Maven and Gradle
dependency producer plans. Maven commands must declare context tool-output
writes, require approval, and keep evidence `not_assessed`. Gradle must not
synthesize an unsafe command unless a safe output-path-bounded local
configuration is known.

**Acceptance Scenarios**:

1. **Given** a local target contains `pom.xml`, **When** context is prepared,
   **Then** the OSS plan names a Maven/CycloneDX dependency producer option
   with explicit approval, network, mutation, and output boundaries.
2. **Given** a local target contains `build.gradle` or `build.gradle.kts`,
   **When** context is prepared, **Then** the OSS plan names a Gradle/CycloneDX
   dependency producer option and keeps execution `not_assessed` unless a safe
   local plugin/init-script configuration is available.
3. **Given** the build tool executables are absent, **When** context is
   prepared, **Then** the plan still records the producer family as
   `not_available` or `not_assessed`, not as verified support.

### User Story 2 - No Per-Language Scanner Ownership (Priority: P1)

An agent reading the context pack sees that Maven/Gradle options are native
producer-output recipes and not a Portolan-owned JVM parser or scanner.

**Why this priority**: The user explicitly rejected a per-language adapter
strategy. Portolan must stay a normalizer and evidence router.

**Independent Test**: Inspect `answer-contract.md` and `query-plan.md` after
context preparation and verify the guidance says to request or evaluate native
producer output rather than implement PHP/JVM/Scala adapters.

**Acceptance Scenarios**:

1. **Given** Maven/Gradle manifests exist but no local output has been
   produced, **When** an agent reads the contract, **Then** Java/Scala
   dependency relationships remain `not_assessed`.
2. **Given** the OSS plan lists Maven/Gradle recipes, **When** an agent
   considers running them, **Then** the recipe is approval-required and does
   not imply a `portolan produce` command exists.

### User Story 3 - Bigtop Stress Gap Recheck (Priority: P2)

A maintainer can rerun a read-only context/map smoke against Bigtop and verify
the next-action surface is more specific without launching build tools,
Docker, jscpd, Maven, or Gradle.

**Why this priority**: The active goal uses Bigtop/Cursor stress as the product
pressure test. A safe read-only recheck gives evidence that the guidance
actually improved.

**Independent Test**: Run `context prepare` into a fresh `.portolan/stress`
directory and inspect only generated Portolan artifacts. Maven/Gradle execution
remains `not_assessed`.

**Acceptance Scenarios**:

1. **Given** Bigtop has many build manifests, **When** the context pack is
   refreshed, **Then** Maven/Gradle producer plans appear alongside Syft/jscpd
   without executing any producer.
2. **Given** no producer output is supplied, **When** map/query artifacts are
   inspected, **Then** Java/Scala/Maven relationship graph and full
   callgraph/parity claims remain `not_assessed` or `cannot_verify`.

## Edge Cases

- Maven or Gradle wrappers exist but would download plugins or mutate caches.
- System `mvn` or `gradle` exists, but the target uses wrapper scripts.
- A repository has many nested build manifests; the plan must stay bounded and
  avoid generating one command per file.
- Existing CycloneDX/Syft output is already present; the plan should not imply
  another producer must run.
- Build-tool outputs may include private artifact coordinates, repository URLs,
  local paths, or hashes; committed fixtures must remain synthetic.
- Maven/Gradle dependency output is dependency metadata, not runtime topology,
  semantic symbol resolution, or call graph evidence.

## Requirements

- **FR-001**: `context prepare` MUST detect visible Maven and Gradle build
  manifest families across local repositories.
- **FR-002**: `oss-plan.json` MUST include Maven and Gradle dependency producer
  plans when matching manifests are visible and no equivalent dependency output
  is already present.
- **FR-003**: Maven producer commands MUST require user approval and MUST
  declare dependency output under the context tool-output directory. Gradle
  plans MUST NOT emit a command when Portolan cannot prove the Gradle output
  path is bounded to the context tool-output directory.
- **FR-004**: Maven/Gradle producer plans MUST describe network/cache/build
  mutation risks as unapproved until explicitly authorized.
- **FR-005**: Producer plans MUST keep `status` and `evidence_state` as
  `not_assessed`, `not_available`, or `input_present`; they MUST NOT mark
  Maven/Gradle dependency evidence verified before a local output exists.
- **FR-006**: Agent-facing guidance MUST say native producer output is the
  default path for JVM/PHP/mixed-language gaps, not Portolan-owned adapters.
- **FR-007**: The feature MUST NOT run Maven, Gradle, CycloneDX plugins, Syft,
  jscpd, Docker, or network commands during normal context preparation.
- **FR-008**: Fresh Bigtop smoke evidence MUST record that Maven/Gradle plans
  are present and producer execution remains `not_assessed`.

## Key Entities

- **Build Tool Surface**: A bounded count of visible Maven/Gradle manifest
  files by repository.
- **Build Tool Producer Plan**: An `oss-plan.json` entry for native dependency
  evidence generation.
- **Approval Boundary**: The recorded state that commands are suggested
  options and must not be executed without explicit approval.
- **Dependency Evidence Output**: A local CycloneDX/build-tool artifact that
  can later be imported or selected as metadata-visible dependency evidence.

## Success Criteria

- **SC-001**: A fixture with Maven and Gradle manifests produces two
  build-tool dependency plans in `oss-plan.json`: Maven with an approval-gated
  command and Gradle as explicit `not_assessed` native producer guidance when
  safe output-path configuration is not locally known.
- **SC-002**: Fresh Bigtop context contains Maven/Gradle dependency producer
  plans without running Maven, Gradle, or Docker.
- **SC-003**: Answer-contract guidance preserves `not_assessed` for
  Java/Scala/Maven relationship claims until local producer output exists.
- **SC-004**: Local baseline checks pass and no broad runtime, callgraph, or
  enterprise-parity claim is upgraded.

## Assumptions

- CycloneDX is the preferred immediate output shape because current Portolan
  dependency normalization already accepts CycloneDX-style evidence.
- Maven dependency-plugin JSON and Gradle dependency reports remain useful
  future candidates, but this slice avoids adding a new parser unless a later
  spec approves a concrete output contract.
- This slice improves the navigation harness by making next evidence actions
  sharper; it does not complete spec 076 parity validation.
