# Quickstart: Relationship Detection

This quickstart describes the target behavior for the first relationship
detection slice.

## Run The Fixture

```bash
go run ./cmd/portolan map --root testdata/relationship-detection/repo --out /tmp/portolan-relationships-run --force
jq empty /tmp/portolan-relationships-run/run.json /tmp/portolan-relationships-run/graph.json
while IFS= read -r line; do jq empty <<<"$line"; done </tmp/portolan-relationships-run/findings.jsonl
```

## Expected Outcome

- `graph.json` contains `imports` edges from Go source files to imported package
  nodes with `source-visible` evidence.
- `graph.json` contains `depends-on` edges from the module to `go.mod`
  dependencies with `metadata-visible` evidence.
- `findings.jsonl` contains an observed `relationships` finding instead of the
  old relationship-not-assessed placeholder when relationships are found.
- Unsupported detector families, such as duplication, configuration, and
  technical debt, remain `not_assessed`.
- No network access, daemon, credentials, or target repository mutation is
  required.
