# Spec Delta — engineering-standards

## ADDED Requirements

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
- AND the wrapper itself contains no sharding, parsing, or indexing logic

#### Scenario: Existing shell collector logic migrates when touched
- GIVEN a shell wrapper currently holds collector business logic
- WHEN that wrapper is modified for any reason
- THEN the collector logic moves into the Go core as part of that change
- AND the wrapper becomes a thin driver
