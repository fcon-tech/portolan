# Contract: Scope Coverage Records

`coverage.json` remains the scope validation contract for map bundles.

## Required States

Coverage record `status` values include:

- `visible`
- `represented`
- `missing`
- `extra`
- `cannot_verify`
- `unknown`
- `not_assessed`
- `blocked`

## No Inventory

When `portolan map --root <target> --out <out>` runs without a selection or
manifest, `coverage.json` must contain:

```json
{
  "id": "external-completeness",
  "kind": "external-completeness",
  "status": "unknown",
  "evidence_state": "unknown"
}
```

## Inventory Comparison

When `portolan map --selection selection.json --out <out>` uses a local
`corpus_manifest`, coverage records must distinguish:

- expected repository visible locally: `status: "visible"`;
- expected required repository absent locally: `status: "blocked"` when full
  corpus is required, otherwise `status: "missing"`;
- selected local repository absent from manifest: `status: "extra"`;
- non-source manifest item represented by metadata: `status: "represented"`.

## Summary

`summary.json.coverage` must expose all statuses through `by_status` and include
weak records for `missing`, `extra`, `unknown`, `cannot_verify`,
`not_assessed`, and `blocked`.
