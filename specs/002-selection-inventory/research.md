# Research: Selection And Inventory Input

## JSON Selection First

Decision: Keep JSON as the only selection format for this slice.

Rationale: The existing scan path already consumes JSON, Go has reliable
standard-library JSON support, and committed fixtures can be validated by `jq`.

Alternatives considered: YAML was rejected for now because it adds a dependency
and a second syntax before the inventory model is proven.

## Selection Validation Scope

Decision: `selection validate` checks schema shape, IDs, supported kinds, local
path strings, and URL rejection without reading target contents.

Rationale: This keeps validation deterministic and separate from evidence
collection. Missing or unreadable target contents belong to scan evidence states,
not inventory validity.

Alternatives considered: File-existence validation was rejected because it would
turn validation into an environment-specific partial scan.

## Existing Open Source

Decision: Use established JSON Schema conventions for the committed contract,
but keep runtime validation in Go standard library code for this slice.

Rationale: JSON Schema is the right external contract shape, but adding a
validator dependency now would increase integration cost without solving a
current UX problem. Fixture tests can assert the user-facing behavior.

Alternatives considered: Native JSON Schema runtime validation via third-party
libraries is deferred until schema complexity or external adapter needs justify
license and maintenance review.
