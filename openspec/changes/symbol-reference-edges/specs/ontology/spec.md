# Spec Delta — ontology

## ADDED Requirements

### Requirement: Reference edges derived from symbol-index role data
A `references` edge SHALL be emitted for each symbol-index symbol whose role is
`reference`, pointing at the node for its `definition`-role counterpart when both
are present in an imported export. A reference whose definition resolves outside
the expedition perimeter SHALL produce an external node per the existing
out-of-perimeter rule, not be dropped. A reference with no resolvable definition
MUST NOT yield a guessed edge; it SHALL be recorded as an unknown.

#### Scenario: Reference resolves to an in-perimeter definition
- GIVEN an imported export contains a `reference`-role symbol and its
  `definition`-role counterpart
- WHEN the core imports the export
- THEN a `references` edge connects the reference node to the definition node
- AND the edge is typed `references`, never `unknown`

#### Scenario: Out-of-perimeter reference becomes an external node
- GIVEN a reference resolves to a definition outside the named roots
- WHEN the core imports the export
- THEN the target is recorded as an external node flagged external
- AND it is not crawled

#### Scenario: Unresolved reference is recorded as unknown, never guessed
- GIVEN a reference has no matching definition in the export
- WHEN the core imports the export
- THEN no `references` edge is invented for it
- AND an `unknowns` record is present

### Requirement: Reference edge evidence is bounded by import
A `references` edge derived from a symbol-index export SHALL carry evidence state
`metadata-visible` at most; it MUST NOT be promoted to `source-visible` unless
the core independently reads the source range. The completeness of the reference
set SHALL be `not_assessed` and MUST be surfaced, not hidden; imported
references MUST NOT be presented as a complete call graph.

#### Scenario: Import-derived reference edge is metadata-visible
- GIVEN a reference edge is produced from a symbol-index export
- WHEN its evidence is recorded
- THEN the state is `metadata-visible`
- AND it is not `source-visible` unless the range was independently read

#### Scenario: Reference completeness is not_assessed and surfaced
- GIVEN the atlas renders reference edges from an import
- WHEN the admiral or agent reads the coverage
- THEN the reference coverage is shown as `not_assessed`
- AND it is not hidden and not claimed as a complete call graph
