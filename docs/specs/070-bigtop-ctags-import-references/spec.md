# Feature Specification: Bigtop Ctags Import References

**Feature Branch**: `codex/070-bigtop-ctags-import-references`

**Created**: 2026-06-02

**Status**: Local implementation complete; PR readiness in progress

**Input**: Spec 069 showed C6 remains partial because prior Universal Ctags
evidence proved broad definitions but not references or call graph. The local
Universal Ctags 6.2.1 binary supports Java and Go package import reference
roles. This slice extracts those roles for the same selected Bigtop scope used
by spec 059.

## User Scenarios & Testing

### User Story 1 - Extract Bounded Import References (Priority: P1)

A maintainer can inspect real ctags import-reference output for the selected
Bigtop scope instead of relying on definitions-only evidence.

**Independent Test**: Universal Ctags runs read-only over the selected target
paths and emits JSONL records containing `roles: "imported"`.

### User Story 2 - Preserve Full Def/Ref Boundary (Priority: P1)

A maintainer can distinguish package import references from full
symbol/reference and call graph evidence.

**Independent Test**: The ledger classifies import references as bounded
`source-visible` reference evidence and keeps full symbol/reference graph and
call graph as `cannot_verify`.

### User Story 3 - Stress Cursor Claim Discipline (Priority: P2)

Cursor plus Portolan can use the new import-reference evidence without
upgrading the enterprise architecture claim.

**Independent Test**: Cursor Composer 2.5 stress records whether C6 improves
while preserving C4 runtime topology and C9 enterprise parity as
`cannot_verify`.

## Requirements

- **FR-001**: The feature MUST reuse the selected target scope from spec 059.
- **FR-002**: The feature MUST use installed Universal Ctags 6.2.1 and MUST NOT
  install new indexers.
- **FR-003**: The feature MUST run ctags with reference extras enabled and
  record command, exit code, stderr, version, role support, hashes, sizes, and
  summary counts.
- **FR-004**: The feature MUST classify `roles: "imported"` package records as
  bounded Java/Go source-visible import-reference evidence.
- **FR-005**: The feature MUST NOT claim method/class references, call graph, or
  enterprise code-intelligence parity from package import roles.
- **FR-006**: The feature MUST NOT build Bigtop repositories, start services,
  contact Kubernetes, mutate target repositories, or add network-dependent
  tooling.
- **FR-007**: Cursor stress and independent review MUST preserve the full C6
  boundary.

## Success Criteria

- **SC-001**: Universal Ctags exits `0`.
- **SC-002**: The output contains nonzero `roles: "imported"` records.
- **SC-003**: Summary counts include total tags, imported references, languages,
  kind counts, unique importing files, per-repo counts, and top imported
  packages.
- **SC-004**: The ledger states C6 is stronger than definitions-only but still
  partial.
- **SC-005**: Local baseline checks pass before PR readiness.

## Out Of Scope

- Installing SCIP, CodeQL, JDTLS, LSIF, srcML, or other full indexers.
- Building Maven/Gradle targets.
- Producing method/class reference edges.
- Producing call graph evidence.
- Runtime topology capture.
- Portolan importer implementation.
- C/C++ includes, Python imports, shell sourcing, Scala/Kotlin/Groovy imports,
  or language surfaces not emitted by this ctags configuration.

## Assumptions

- Spec 059 selected target paths remain available at
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-059-symbol-reference-producer/tool-outputs/selected-target-paths.txt`.
- Raw producer outputs remain external under the Bigtop landscape stress root.
