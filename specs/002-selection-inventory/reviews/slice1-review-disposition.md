# Slice 1 Review Disposition: Selection And Inventory Input

Date: 2026-05-20

## Scope

Implemented the first P0-002 slice:

- selection inventory fixtures;
- `schema/selection.schema.json`;
- `portolan selection validate --selection <file>`;
- metadata and runtime input collections in `internal/selection`;
- CLI help and validation tests;
- P0-001 scan regression coverage;
- README command example.

## Review Evidence

- Local repo-grounded implementation review: assessed.
- `pi` lanes from the pre-implementation review were not usable and are not
  counted as approval for this slice. Coverage remains `not_assessed` for
  external model review.

## Accepted And Fixed

### Major: New Duplicate-ID Error Text Broke P0-001 Scan Tests

Disposition: accepted and fixed.

The first validation refactor collapsed duplicate errors into `duplicate
selection id`, which broke existing tests expecting `duplicate target id` and
`duplicate graph id`. The implementation now preserves old scan-facing error
messages for target and claim collisions while using the new shared validation
path.

### Major: Metadata Must Not Become A Graph Node Kind

Disposition: accepted and fixed in both contract and implementation.

The implementation adds `metadata[]` and `runtime[]` input collections instead
of accepting `metadata` as `targets[].kind`, preserving compatibility with
`schema/evidence-graph.schema.json`.

## Verification

- `go test -count=1 ./...`: passed.
- `jq empty schema/*.json`: passed.
- `go run ./cmd/portolan selection validate --selection testdata/selection-inventory/valid-selection.json`: passed.
- `go run ./cmd/portolan scan --selection testdata/local-evidence-graph/selection.json --out /tmp/portolan-graph.json --force`: passed.
- `jq empty /tmp/portolan-graph.json`: passed.
- `git diff --check`: passed.

## Remaining Gaps

- Runtime JSON Schema validation is still deferred; the schema is a committed
  contract artifact and behavior is enforced by Go tests.
- External model review is `not_assessed` due unusable `pi` lane output.
