# Quickstart: Map Command And Artifact Bundle

## Run

```bash
go run ./cmd/portolan map --root . --out .portolan/run --force
jq empty .portolan/run/run.json
jq empty .portolan/run/graph.json
while IFS= read -r line; do printf '%s\n' "$line" | jq empty; done <.portolan/run/findings.jsonl
```

## Inspect

```bash
sed -n '1,160p' .portolan/run/map.md
```

## Expected Outcome

- `run.json` records what was run and what was not assessed.
- `graph.json` is a valid evidence graph.
- `findings.jsonl` is parseable JSON Lines.
- `map.md` is derived from the graph and findings.
- No network access, daemon behavior, credential reads, or target mutation is
  required.
