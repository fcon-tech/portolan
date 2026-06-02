# Feature Specification: Bigtop Ctags Cross-Language Imports

**Feature Branch**: `codex/071-bigtop-ctags-cross-language-imports`

**Created**: 2026-06-02

**Status**: Ready-for-review PR after refreshed checks pass and draft is removed

**Input**: Spec 070 verified Java/Go package import references but explicitly
excluded C/C++ includes, Python imports, shell loaded scripts, and related
ctags-supported reference roles. This slice extracts those remaining
ctags-supported roles for the same selected Bigtop scope without adding new
indexers or mutating targets.

## User Scenarios & Testing

### User Story 1 - Extract Cross-Language Reference Roles (Priority: P1)

A maintainer can inspect real ctags reference-role output for C/C++, Python,
and shell surfaces in the selected Bigtop scope.

**Independent Test**: Universal Ctags runs read-only over the selected target
paths and emits nonzero reference-role records for C/C++ headers, Python imports
and namespaces, or shell loaded scripts.

### User Story 2 - Preserve Full C6 Boundary (Priority: P1)

A maintainer can distinguish these cross-language references from full
symbol/reference and call graph evidence.

**Independent Test**: The ledger records this as bounded source-visible
reference evidence while keeping full symbol/reference graph and call graph as
`cannot_verify`.

## Requirements

- **FR-001**: The feature MUST reuse the selected target scope from spec 059.
- **FR-002**: The feature MUST use installed Universal Ctags 6.2.1 and MUST NOT
  install new indexers.
- **FR-003**: The feature MUST run ctags with reference extras enabled for
  C, C++, Python, and shell surfaces.
- **FR-004**: The feature MUST record command, exit code, stderr, version, role
  support, hashes, sizes, and summary counts.
- **FR-005**: The feature MUST classify the output as bounded source-visible
  cross-language reference-role evidence, not full C6.
- **FR-006**: The feature MUST NOT claim method/class refs, call graph, runtime
  topology, or enterprise code-intelligence parity.
- **FR-007**: The feature MUST NOT build Bigtop repositories, start services,
  contact Kubernetes, mutate target repositories, or add network-dependent
  tooling.
- **FR-008**: Cursor stress and independent review MUST preserve the full C6
  boundary.

## Success Criteria

- **SC-001**: Universal Ctags exits `0`.
- **SC-002**: The output contains nonzero reference-role records outside the
  Java/Go import-reference slice.
- **SC-003**: Summary counts include total tags, reference-role records,
  languages, kinds, roles, unique reference files, per-repo counts, and top
  reference names.
- **SC-004**: The ledger states C6 is stronger but still partial.
- **SC-005**: Local baseline checks pass before PR readiness.

## Out Of Scope

- Installing SCIP, CodeQL, JDTLS, LSIF, srcML, or other full indexers.
- Building Maven/Gradle/C/C++ targets.
- Producing method/class reference edges.
- Producing call graph evidence.
- Runtime topology capture.
- Portolan importer implementation.

## Assumptions

- Spec 059 selected target paths remain available at
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-059-symbol-reference-producer/tool-outputs/selected-target-paths.txt`.
- Raw producer outputs remain external under the Bigtop landscape stress root.
