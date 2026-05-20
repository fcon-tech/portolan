# Data Model: Black-Box Profile

## Selection Extension

Black-box profiles extend the selection document with explicit black-box
targets. The exact schema is implemented in the feature slice, but fixtures
should follow this shape:

```json
{
  "schema_version": "0.1.0",
  "black_boxes": [
    {
      "id": "payments-api",
      "kind": "service",
      "label": "Payments API",
      "metadata": [
        {
          "id": "payments-catalog",
          "path": "testdata/black-box-profile/metadata/payments.json"
        }
      ],
      "runtime": [
        {
          "id": "payments-runtime",
          "path": "testdata/black-box-profile/runtime/payments.json"
        }
      ],
      "claims": [
        {
          "id": "payments-claims",
          "path": "testdata/black-box-profile/claims/payments.json"
        }
      ],
      "expected": ["owner", "dependencies", "runtime-endpoints"]
    }
  ]
}
```

Rules:

- `black_boxes[].id` must be unique across selection ids.
- `black_boxes[].kind` is limited to graph-compatible kinds such as `service`
  or `runtime`.
- Black-box targets must not include a repository path or source-root path in
  this slice.
- All input paths must be local filesystem paths.
- `expected[]` names fields that should become `unknown` when no selected input
  provides evidence.
- Metadata and runtime URLs are attribution only; Portolan must not fetch them.

## Metadata Input

Initial metadata fixture subset:

```json
{
  "schema_version": "0.1.0",
  "service": {
    "id": "payments-api",
    "label": "Payments API",
    "owner": "payments-team",
    "declared_dependencies": ["ledger-api"]
  },
  "source": "service-catalog-export"
}
```

Rules:

- Metadata-derived service facts use `metadata-visible`.
- Declared dependencies from metadata use `metadata-visible`.
- Repository URLs inside metadata remain metadata facts and do not imply source
  inspection.

## Runtime Observation Input

Initial runtime fixture subset:

```json
{
  "schema_version": "0.1.0",
  "observations": [
    {
      "service": "payments-api",
      "endpoint": "https://payments.internal/health",
      "observed_at": "2026-05-20T10:00:00Z"
    }
  ],
  "source": "runtime-export"
}
```

Rules:

- Runtime-derived facts use `runtime-visible`.
- Runtime input is local exported evidence, not a live query.
- Malformed runtime input becomes `cannot_verify` with a reason.

## Claim Input

Claim input follows the existing claim-file intent from the local evidence graph
slice. Black-box claim-derived facts use `claim-only`.

Rules:

- Claims must not be upgraded to metadata-visible or runtime-visible.
- If observed evidence later supports the same relationship, it must remain
  auditable as observed evidence rather than overwriting the original claim.

## Graph Output

Black-box scan output follows `schema/evidence-graph.schema.json`.

Initial node kinds:

- `service`
- `runtime`
- `team`
- `claim`
- `unknown`

Initial edge kinds:

- `owns`
- `depends-on`
- `observes`
- `claims`
- `unknown`

Evidence rules:

- Black-box-derived facts must not use `source-visible`.
- Missing expected fields become `unknown` with `reason`.
- Malformed or unreadable selected inputs become `cannot_verify` with `reason`.
