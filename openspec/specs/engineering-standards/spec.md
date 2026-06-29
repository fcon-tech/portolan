# Engineering Standards Specification

## Purpose

Locks in the portolan-core engineering approach: Clean Architecture, the
dependency rule, SOLID, and TDD. These are enforced conventions, not aspirations
— each requirement is backed by an automated check that runs in CI.

Source authority: migrated from established portolan-core practice
(`scripts/check-dependency-rule.js`, the BDD runner, the Clean Architecture
layering).
## Requirements
### Requirement: Clean Architecture layering
portolan-core SHALL be organised in Clean Architecture layers — `domain`,
`use-cases`, `ports`, `adapters` — where dependencies point strictly inward.
The domain layer SHALL be pure: it MUST NOT import use-cases, ports, or
adapters.

#### Scenario: Domain imports only domain
- GIVEN the portolan-core source tree
- WHEN the dependency-rule checker scans domain/*
- THEN every relative import resolves within domain/
- AND the checker reports zero violations

### Requirement: Dependency rule enforced in CI
The dependency rule SHALL be enforced by `portolan-core/scripts/check-dependency-rule.js` and this check MUST run in CI. The rule: adapters → use-cases → domain; ports reference domain types only; use-cases never import adapters; domain imports only domain. A build with an inward-forbidden import SHALL fail.

#### Scenario: Inward-forbidden import fails the build
- GIVEN a domain module imports an adapter
- WHEN the dependency-rule checker runs
- THEN it exits non-zero with a VIOLATION report

#### Scenario: Clean tree passes
- GIVEN the current portolan-core source
- WHEN the dependency-rule checker runs
- THEN it reports "dependency-rule: OK (0 violations)"

### Requirement: Ports are interface-only
The `ports` layer SHALL define interfaces (contracts) only. Ports MAY reference
domain types but MUST NOT contain implementation that depends on adapters or
external infrastructure.

#### Scenario: Port has no adapter dependency
- GIVEN a port module
- WHEN its imports are inspected
- THEN it imports only domain or ports, never adapters

### Requirement: SOLID — single responsibility per module
Each module SHALL have one responsibility: domain modules hold pure business
rules; use-case modules orchestrate one interaction; adapters implement one
port against one mechanism. A module that mixes layers or responsibilities
SHOULD be split.

#### Scenario: Use-case orchestrates one interaction
- GIVEN a use-case module
- WHEN its surface is inspected
- THEN it depends on domain + ports only and orchestrates a single interaction

### Requirement: Test-driven development
Every OpenSpec scenario that has an executable counterpart SHALL be bound to a
real, passing unit test. The BDD runner
(`portolan-core/test/bdd-runner.js`) SHALL verify each feature is anchored to an
OpenSpec living spec, to a feature file, and to a unit test. New behavior MUST
land with its scenario binding.

#### Scenario: BDD runner verifies the full binding chain
- GIVEN the portolan-core test suite
- WHEN the BDD runner executes
- THEN every binding has a feature, a unit test file that exists on disk, a
  feature file that exists on disk, and an OpenSpec spec that exists on disk

### Requirement: Dependency inversion for outward concerns
Outward concerns (filesystem, rendering, navigation) SHALL cross the boundary
through ports, not direct imports. Adapters SHALL implement ports; use-cases
SHALL depend on ports, never on concrete adapters.

#### Scenario: Use-case depends on a port, not an adapter
- GIVEN a use-case that needs the filesystem
- WHEN it is implemented
- THEN it depends on the atlas-store / nav-source port
- AND an adapter provides the concrete filesystem implementation

### Requirement: Bundle processing lives in Clean Architecture layers
All system-map normalization, bundle query, evidence-promotion, captain-handoff, and evidence-promotion-atlas logic SHALL live inside the `portolan-core` Clean Architecture layers (`domain`, `use-cases`, `ports`, `adapters`). The project MUST NOT maintain a parallel imperative JavaScript stack outside these layers for atlas business rules. Filesystem I/O over bundle artifacts SHALL cross the layer boundary only through a port implemented by an adapter; use-cases MUST depend on the port, never on `fs` directly.

#### Scenario: No imperative atlas stack outside the layers
- **WHEN** the repository is inspected after the migration
- **THEN** no directory outside `portolan-core/src/` and `portolan-core/scripts/` contains atlas normalization, bundle-query family, handoff, query-eval, or evidence-promotion business logic
- **AND** the `viewer/` directory does not exist

#### Scenario: Bundle reads cross via a port
- **WHEN** a use-case needs a bundle artifact (JSON or JSONL)
- **THEN** it obtains it through the `bundle-artifact-reader` port (or equivalent)
- **AND** no `require('fs')` or `import 'node:fs'` appears in `src/use-cases/` or `src/domain/`

#### Scenario: Domain normalization is pure
- **WHEN** the system-map compose function is unit-tested
- **THEN** it accepts already-parsed artifacts and returns a map with zero filesystem access
- **AND** the test passes without creating or reading any bundle directory

### Requirement: CLI and bash wrappers are thin drivers
Every shell wrapper in `scripts/*.sh` and every CLI entry point in `portolan-core/scripts/*.mjs` SHALL be a thin driver: it parses arguments, invokes a use-case (or a composition of use-cases), and writes the result. It MUST NOT contain atlas business rules or bundle-specific transformation logic. This keeps the dependency rule meaningful and the business logic unit-testable without spinning up the whole pipeline.

#### Scenario: Wrapper delegates to a use-case
- **WHEN** a migrated wrapper such as `scripts/build-system-map.sh` is invoked
- **THEN** it delegates to a `portolan-core/scripts/*.mjs` driver
- **AND** that driver calls a `src/use-cases/` function for its behavior
- **AND** the driver itself contains no system-map construction logic

#### Scenario: Orphaned viewer tests run in CI
- **WHEN** the `portolan-core` unit-test step runs in CI
- **THEN** the tests ported from `viewer/test/` (ids, classify, c4, validator, query-system-map) execute against the migrated `src/` modules
- **AND** a regression in any ported module fails the CI step

### Requirement: portolan-core is the reading layer, not the collector
portolan-core (the JS Clean-Architecture layers) SHALL be the human-atlas
reading layer that consumes a snapshot produced by the Go deterministic core.
Collector behaviour (scanning repositories, executing OSS producers, parsing
producer output, sharding, indexing, symbol/reference resolution) SHALL live in
the Go core (`internal/`, `cmd/portolan`) and MUST NOT migrate into portolan-core
JS. The Go core produces the snapshot; the JS reading layer consumes it. This
refines the existing "Bundle processing lives in Clean Architecture layers"
requirement, which governs reading-side normalisation, not collection.

#### Scenario: portolan-core contains no collector logic
- GIVEN the `portolan-core/src` tree is inspected
- WHEN its modules are classified
- THEN none of them scan repositories, execute OSS producers, parse raw producer
  output, or resolve symbol references
- AND all such behaviour is located under `internal/` (Go)

#### Scenario: Reading-side normalisation stays in the JS layers
- GIVEN the JS reading layer consumes a snapshot
- WHEN it composes the system-map and renders the atlas
- THEN that normalisation and presentation logic lives in the portolan-core
  Clean-Architecture layers as already required
- AND it obtains snapshot data through a port, never by running a collector

### Requirement: Collector wrappers delegate to the Go core
A collector wrapper SHALL be a thin driver that invokes the Go core
(`cmd/portolan`) and MUST NOT contain collector business logic such as sharding,
producer-output parsing, normalisation, or indexing. Reading-side wrappers
continue to delegate to `portolan-core` JS use-cases as already required. When an
existing shell collector wrapper is touched, its collector logic SHALL migrate
into the Go core.

#### Scenario: A collector wrapper delegates to cmd/portolan
- GIVEN a wrapper such as a scan entry point is invoked
- WHEN it runs
- THEN it delegates collection to `cmd/portolan`

