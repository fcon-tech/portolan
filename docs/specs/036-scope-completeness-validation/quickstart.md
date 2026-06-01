# Quickstart: Scope Completeness Validation

Run from the Portolan repository root.

## Without Inventory

```bash
go run ./cmd/portolan map --root /path/to/local/estate --out /tmp/portolan-scope --force
jq '.records[] | select(.id=="external-completeness")' /tmp/portolan-scope/coverage.json
```

Expected result: external completeness is `unknown`.

## With Local Inventory

Create or reuse a selection that references a local corpus manifest:

```json
{
  "schema_version": "0.1.0",
  "corpus_manifest": "manifest.json",
  "require_full_corpus": false,
  "targets": [
    {"id": "api", "kind": "repository", "path": "repos/api"},
    {"id": "extra-tooling", "kind": "repository", "path": "repos/extra-tooling"}
  ]
}
```

Run:

```bash
go run ./cmd/portolan map --selection selection.json --out /tmp/portolan-scope-inventory --force
jq '.summary, .records[] | select(.status=="extra" or .status=="missing" or .status=="blocked")' /tmp/portolan-scope-inventory/coverage.json
```

Expected result: local repositories absent from the manifest are `extra`;
expected required repositories absent from local scope are `missing` or
`blocked` depending on `require_full_corpus`.
