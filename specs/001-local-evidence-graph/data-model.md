# Data Model: Local Evidence Graph MVP

## Selection

```json
{
  "schema_version": "0.1.0",
  "targets": [
    {
      "id": "repo-main",
      "kind": "repository",
      "path": "testdata/local-evidence-graph/repo"
    }
  ],
  "claims": [
    {
      "id": "claims-main",
      "path": "testdata/local-evidence-graph/claims.json"
    }
  ]
}
```

Rules:

- `schema_version` is required.
- `targets[].id` must be unique.
- `targets[].path` must be local and relative to the invocation directory or an
  absolute local path.
- Scanner paths are evaluated through canonical filesystem paths. Lexical
  variants such as `../` must not bypass selected-root boundaries, and symlinks
  that resolve outside a selected root are recorded as `cannot_verify`.
- `claims[].path` is optional evidence; malformed claims produce
  `cannot_verify` for that source.

## Evidence Graph

The graph follows `schema/evidence-graph.schema.json`.

Initial node kinds:

- `repository`
- `service`
- `package`
- `runtime`
- `team`
- `claim`
- `unknown`

Initial edge kinds:

- `owns`
- `depends-on`
- `exposes`
- `imports`
- `observes`
- `claims`
- `unknown`

## Evidence

Every node and edge has:

- `state`
- `source`
- optional `observed_at`
- optional `reason`

The scanner must not emit a node or edge without evidence.
