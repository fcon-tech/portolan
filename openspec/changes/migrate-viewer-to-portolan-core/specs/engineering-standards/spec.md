# Spec Delta — engineering-standards

## ADDED Requirements

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
