# Quickstart: Local Evidence Graph MVP

This quickstart describes the target behavior for the first implementation
slice.

## Prepare Fixture

```bash
mkdir -p /tmp/portolan-demo/repo
printf '# Demo\n' >/tmp/portolan-demo/repo/README.md
cat >/tmp/portolan-demo/claims.json <<'JSON'
{
  "claims": [
    {
      "id": "claim-api-db",
      "subject": "api",
      "predicate": "depends-on",
      "object": "database",
      "source": "architecture-interview"
    }
  ]
}
JSON
cat >/tmp/portolan-demo/selection.json <<'JSON'
{
  "schema_version": "0.1.0",
  "targets": [
    {
      "id": "demo-repo",
      "kind": "repository",
      "path": "/tmp/portolan-demo/repo"
    }
  ],
  "claims": [
    {
      "id": "demo-claims",
      "path": "/tmp/portolan-demo/claims.json"
    }
  ]
}
JSON
```

## Run

```bash
go run ./cmd/portolan scan --selection /tmp/portolan-demo/selection.json --out /tmp/portolan-demo/graph.json
jq empty /tmp/portolan-demo/graph.json
```

## Expected Outcome

- The graph contains a repository node with `source-visible` evidence.
- Claim-derived facts remain `claim-only`.
- No network access is required.
- The selected repository is not modified.
