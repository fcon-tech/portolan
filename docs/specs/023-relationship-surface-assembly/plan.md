# Implementation Plan: Relationship Surface Assembly

## Decision Gate

- Simpler/Faster: read local files and count shallow structural signals. Do not
  add YAML parsers or OpenAPI/AsyncAPI/Structurizr dependencies.
- Blocking Edge Cases: YAML variants, JSON contracts with remote refs, large
  specs, multi-document catalogs, and architecture DSL syntax variance.
- Existing Open Source: Backstage, OpenAPI, AsyncAPI, and Structurizr remain
  producer formats. This slice only records local summary evidence.

## Technical Approach

- Extend context preparation summaries for:
  - Backstage `catalog-info.yaml|yml|json`: count entity-like `kind` records.
  - OpenAPI JSON/YAML: count paths when visible.
  - AsyncAPI JSON/YAML: count channels when visible.
  - Structurizr DSL: count `softwareSystem`/`container` declarations.
- Preserve `metadata-visible` for shallow summaries.
- Preserve `cannot_verify` for malformed JSON candidates.
- Keep relation inference out of scope.

## Verification

Run:

```bash
go test ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan context prepare --root internal/testfixtures/landscape-map --out /tmp/portolan-context --profile cursor --force
```

