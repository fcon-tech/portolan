# Data Model: Selection And Inventory Input

## Selection

```json
{
  "schema_version": "0.1.0",
  "targets": [
    {
      "id": "repo-main",
      "kind": "repository",
      "path": "testdata/selection-inventory/repo"
    }
  ],
  "metadata": [
    {
      "id": "service-metadata",
      "path": "testdata/selection-inventory/service-catalog.json"
    }
  ],
  "runtime": [
    {
      "id": "runtime-export",
      "path": "testdata/selection-inventory/runtime.json"
    }
  ],
  "claims": [
    {
      "id": "claims-main",
      "path": "testdata/selection-inventory/claims.json"
    }
  ]
}
```

Rules:

- `schema_version` is required and must match the supported selection schema
  version.
- IDs must be unique across `targets[]`, `metadata[]`, `runtime[]`, and
  `claims[]`.
- `targets[].kind` must be one of `repository`, `runtime`, `service`,
  `package`, `team`, or `unknown`.
- `targets[].path`, `metadata[].path`, `runtime[].path`, and `claims[].path`
  must be non-empty local filesystem paths.
- URL-like paths such as `http://`, `https://`, `ssh://`, `git://`, and
  `file://` are rejected in this slice.
- Validation does not read target contents. It validates the selection document,
  not the truth of the selected systems.

## Selection Validation Result

The CLI contract is intentionally small:

- exit `0` and write a concise success message to stdout for valid selections;
- exit non-zero and write deterministic validation errors to stderr for invalid
  selections;
- do not write files, start daemons, call networks, or mutate selected paths.

## Compatibility

P0-001 selections using `targets[]` plus `claims[]` remain accepted. This slice
adds `metadata[]` and `runtime[]` collections without requiring a breaking
migration to a new `inputs[]` array. Metadata files are selected evidence
sources, not evidence graph node kinds.
