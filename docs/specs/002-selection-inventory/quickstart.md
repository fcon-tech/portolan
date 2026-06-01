# Quickstart: Selection And Inventory Input

## Prepare Fixture

```bash
mkdir -p /tmp/portolan-selection
cat >/tmp/portolan-selection/selection.json <<'JSON'
{
  "schema_version": "0.1.0",
  "targets": [
    {
      "id": "repo-main",
      "kind": "repository",
      "path": "/tmp/portolan-selection/repo"
    }
  ],
  "metadata": [
    {
      "id": "metadata-main",
      "path": "/tmp/portolan-selection/catalog.json"
    }
  ],
  "runtime": [
    {
      "id": "runtime-main",
      "path": "/tmp/portolan-selection/runtime.json"
    }
  ],
  "claims": [
    {
      "id": "claims-main",
      "path": "/tmp/portolan-selection/claims.json"
    }
  ]
}
JSON
```

The referenced paths do not need to exist for validation.

## Validate

```bash
go run ./cmd/portolan selection validate --selection /tmp/portolan-selection/selection.json
```

## Expected Outcome

- The command exits `0`.
- The command does not read the referenced target contents.
- The command does not make network calls.
- The command does not write or mutate files.
