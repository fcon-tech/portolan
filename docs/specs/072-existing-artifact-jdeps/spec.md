# Feature Specification: Bigtop Existing Artifact Jdeps

**Feature Branch**: `codex/072-existing-artifact-jdeps`

**Created**: 2026-06-02

**Status**: Merged via PR #50

**Input**: Specs 069-071 strengthened Bigtop producer evidence but left full
symbol/reference graph, call graph, runtime topology, and enterprise parity as
`cannot_verify`. A read-only probe found a small set of existing `.jar` and
`.class` artifacts inside the same selected Bigtop target scope. This slice
uses installed `jdeps` against those already-present artifacts without building
targets, installing indexers, or starting runtime services.

## User Scenarios & Testing

### User Story 1 - Inspect Existing JVM Artifact Dependencies (Priority: P1)

A maintainer can inspect real `jdeps` output for compiled JVM artifacts that
already exist inside selected Bigtop target repositories.

**Independent Test**: `jdeps` exits `0` for the discovered artifacts, reports
which artifacts emit dependency rows, and separately records zero-row artifacts.

### User Story 2 - Preserve Full C6 And Runtime Boundaries (Priority: P1)

A maintainer can distinguish bounded compiled-artifact dependency evidence from
full source symbol/reference graph, call graph, runtime topology, or enterprise
code-intelligence parity.

**Independent Test**: The ledger classifies the output as bounded
metadata/source-adjacent compiled-artifact dependency evidence and keeps full
C6, call graph, C4 runtime topology, and C9 enterprise parity as
`cannot_verify`.

## Requirements

- **FR-001**: The feature MUST reuse the 15 selected Bigtop target roots from
  spec 059.
- **FR-002**: The feature MUST only analyze existing `.jar` and `.class`
  artifacts found under those selected roots.
- **FR-003**: The feature MUST use installed `jdeps` and MUST NOT install new
  JVM indexers or dependency tools.
- **FR-004**: The feature MUST NOT run Maven, Gradle, SBT, Ant, Docker,
  Kubernetes, service provisioning, or any build/runtime command.
- **FR-005**: The feature MUST record command, version, exit codes, stderr
  sizes, output sizes, hashes, artifact paths, artifact sizes, per-artifact row
  counts, unresolved `not found` rows, and target module/package summary.
- **FR-006**: The feature MUST classify output as bounded existing-artifact
  dependency evidence, not full source-level symbol/reference graph evidence.
- **FR-007**: The feature MUST NOT claim method/class/type source references,
  cross-reference resolution, call graph, runtime topology, or enterprise
  code-intelligence parity.
- **FR-008**: Cursor stress and independent review MUST preserve the evidence
  boundary and reject overclaiming from tiny/test-resource artifacts.

## Success Criteria

- **SC-001**: Existing artifact discovery reports the artifact set and selected
  roots used.
- **SC-002**: `jdeps` exits `0` for all assessed existing artifacts.
- **SC-003**: At least 8 of the 9 assessed artifacts emit dependency rows, and
  the zero-row artifact is identified rather than counted as dependency
  evidence.
- **SC-004**: The producer ledger records nonzero dependency row counts,
  third-party/test-fixture skew, zero-row artifacts, path validation, and
  unresolved row counts.
- **SC-005**: The ledger states C6 is stronger but still partial.
- **SC-006**: Local baseline checks pass before PR readiness.

## Out Of Scope

- Building Bigtop repositories.
- Starting Bigtop runtime services, Docker containers, or Kubernetes workloads.
- Installing or running SCIP, LSIF, CodeQL, JDTLS, srcML, or other full
  reference/call graph indexers.
- Producing source-level method/class/type reference edges.
- Producing call graph evidence.
- Portolan importer implementation.

## Assumptions

- Spec 059 selected target paths remain available at
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-059-symbol-reference-producer/tool-outputs/selected-target-paths.txt`.
- Raw producer outputs remain external under the Bigtop landscape stress root.
- Existing test/resource jars are legitimate compiled artifacts for bounded
  dependency evidence, but they are not representative proof of Bigtop runtime
  topology or full source graph coverage.
- The assessed row counts are dominated by bundled third-party test/resource
  jars and tiny UDF fixtures, not Bigtop-compiled production artifacts.
