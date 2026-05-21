# Data Model: Relationship Detection

## Source File Relationship

Source relationships are derived from local files under the mapped root.

Initial supported source input:

- Go source imports from `*.go` files outside `.portolan` and ignored generated
  output directories.

Graph representation:

- Importer node: existing `source:<path>` node when available.
- Imported package node: `package:<import-path>`.
- Edge: `source:<path>` -> `package:<import-path>`.
- Edge kind: `imports`.
- Evidence state: `source-visible`.
- Evidence source: local Go file path.

Direction rule: relationship edges flow from the local consumer to the imported
or required dependency. If `cmd/example/main.go` imports `example.org/lib`, the
edge is `source:cmd/example/main.go` -> `package:example.org/lib`.

Rules:

- Standard-library and third-party imports are both explicit relationships.
- Parse failures become a relationship finding with `cannot_verify`; they must
  not fail the whole map run when the rest of the root is readable.
- No relationship may be inferred from naming alone.

## Manifest Relationship

Manifest relationships are derived from local dependency manifests.

Initial supported manifest input:

- `go.mod` `require` entries parsed with `golang.org/x/mod/modfile`, including
  single-line and block forms.

Graph representation:

- Module node: `package:<module-path>`.
- Dependency node: `package:<dependency-module-path>`.
- Edge: `package:<module-path>` -> `package:<dependency-module-path>`.
- Edge kind: `depends-on`.
- Evidence state: `metadata-visible`.
- Evidence source: local `go.mod` path.

Rules:

- If the module path cannot be found, dependency edges are `cannot_verify`
  findings rather than guessed from directory names.
- Comments and unsupported `go.mod` directives are ignored for v1.

## Finding Output

`findings.jsonl` relationship records use the existing map finding contract.

Relationship evidence states:

- `source-visible`: parser-backed local source imports.
- `metadata-visible`: parser-backed local manifest dependencies.
- `claim-only`: existing claim file relationships from `scan --selection`.
- `unknown`: existing expected relationship gaps from selected black-box
  inputs.
- `cannot_verify`: unreadable or unparsable relationship inputs.
- `not_assessed`: unsupported relationship families or languages.

Every relationship edge must include non-empty `evidence.state` and
`evidence.source`.

Observed source relationship finding:

- `id`: `finding-relationships-source-imports-observed`
- `kind`: `relationships`
- `severity`: `info`
- `evidence_state`: `source-visible`
- `status`: `observed`
- `confidence`: `1.0` for parser-backed explicit relationships.

Observed manifest relationship finding:

- `id`: `finding-relationships-manifest-dependencies-observed`
- `kind`: `relationships`
- `severity`: `info`
- `evidence_state`: `metadata-visible`
- `status`: `observed`
- `confidence`: `1.0` for parser-backed explicit relationships.

Cannot-verify relationship finding:

- `kind`: `relationships`
- `evidence_state`: `cannot_verify`
- `status`: `cannot_verify`
- `confidence`: `0`
- `summary`: deterministic parse/read reason.

Unsupported relationship families remain `not_assessed`; they must not be
reported as no relationships found.

Current placeholder to replace when map finds observed relationships:

```json
{
  "id": "finding-relationships-not-assessed",
  "kind": "relationships",
  "status": "not_assessed"
}
```

When source or manifest relationships are observed, `findings.jsonl` uses
the observed source and/or manifest findings instead of the generic placeholder.
Unsupported relationship families still produce explicit `not_assessed`
relationship findings and skipped surfaces so downstream agents cannot mistake
Go/go.mod support for complete relationship coverage.

## Existing Selection Relationships

Existing `scan --selection` inputs already emit relationship evidence from:

- claim files as `claim-only` `claims` edges;
- black-box metadata as `metadata-visible` `depends-on` edges;
- missing expected black-box dependencies as `unknown`.

This slice must preserve that behavior with regression coverage. It does not add
new selection schema fields for expected relationships.
