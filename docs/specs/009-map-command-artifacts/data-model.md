# Data Model: Map Command And Artifact Bundle

## Run Metadata

`run.json`:

```json
{
  "schema_version": "0.1.0",
  "generated_by": "portolan map",
  "root": "/workspace/repo",
  "out": "/workspace/repo/.portolan/run",
  "artifacts": {
    "graph": "graph.json",
    "findings": "findings.jsonl",
    "packet": "map.md"
  },
  "surfaces": {
    "relationships": "not_assessed",
    "duplication": "not_assessed",
    "configuration": "not_assessed",
    "technical_debt": "not_assessed"
  },
  "warnings": []
}
```

## Finding

One JSON object per line in `findings.jsonl`:

```json
{
  "id": "REL-001",
  "kind": "relationship",
  "severity": "info",
  "status": "verified",
  "state": "source-visible",
  "summary": "api imports internal/storage",
  "evidence": [
    {
      "source": "internal/api/server.go",
      "detail": "import internal/storage"
    }
  ],
  "confidence": "high"
}
```

Allowed `kind` values:

- `relationship`
- `duplication`
- `configuration`
- `technical_debt`
- `unknown`
- `cannot_verify`
- `not_assessed`

Allowed `severity` values:

- `info`
- `minor`
- `major`
- `critical`

Allowed `status` values:

- `verified`
- `not_assessed`
- `assumed`
- `blocked`
- `failed`

Evidence state must use the graph evidence states.
