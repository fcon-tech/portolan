# Data Model: Scope Completeness Validation

## Visible Repository

- `id`: stable repository identifier from selection or root discovery.
- `path`: local filesystem path.
- `status`: `visible` when the local directory is source-visible.
- `evidence_state`: `source-visible` only when the path is locally observable as
  a directory and not rejected by safety checks.

## Expected Inventory Item

- `id`: inventory identifier.
- `kind`: repository, service, package, runtime, team, claim, or unknown.
- `evidence_state`: metadata state from the local manifest.
- `required`: active and external repositories require local source visibility
  when `require_full_corpus` is true.

## Scope Gap

Classifications:

- `missing`: expected item is absent from local selected scope.
- `extra`: local selected repository is absent from the expected inventory.
- `unknown`: repo-like local structure exists without a Git boundary or without
  enough evidence to classify it.
- `cannot_verify`: local evidence exists but cannot be inspected safely.
- `not_assessed`: candidate local input was deliberately not assessed.

## Completeness Decision

- `unknown`: no local inventory or corpus manifest was supplied.
- `represented`: inventory exists and non-source items are represented.
- `visible`: required expected source repositories are visible locally.
- `blocked`: full corpus was required but required source evidence is absent or
  the manifest is invalid.

Completeness is never derived from repository count alone.
