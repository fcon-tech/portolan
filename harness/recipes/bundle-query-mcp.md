# Recipe: Portolan bundle-query MCP

Read-only MCP tools over an existing Portolan scan bundle. No LLM, no network.

## Prerequisites

- Bundle from `scripts/portolan-scan.sh` or `build-portolan-bundle.sh`
- Node.js on PATH; viewer deps: `scripts/npm-wsl.sh ci --prefix viewer` (see `viewer/README.md` for WSL PATH)

## Cursor (`mcp.json`)

```json
{
  "mcpServers": {
    "portolan-bundle-query": {
      "command": "node",
      "args": [
        "/absolute/path/to/portolan/viewer/scripts/bundle-query-mcp.js"
      ],
      "env": {
        "PORTOLAN_BUNDLE_DIR": "/absolute/path/to/your/bundle"
      }
    }
  }
}
```

Or use the wrapper script:

```json
{
  "mcpServers": {
    "portolan-bundle-query": {
      "command": "/absolute/path/to/portolan/scripts/portolan-bundle-query-mcp.sh",
      "env": {
        "PORTOLAN_BUNDLE_DIR": "/absolute/path/to/your/bundle"
      }
    }
  }
}
```

## Tools

| Tool | Purpose |
| --- | --- |
| `portolan_query_hotspots` | Ranked findings |
| `portolan_query_gaps` | not_assessed / cannot_verify |
| `portolan_query_landscape` | Card/report sections |
| `portolan_query_search` | Code index search |
| `portolan_query_symbol` | Symbol lookup |
| `portolan_query_source` | Source snippet |
| `portolan_query_evidence_index` | Map-bridge hints |

## Guardrails

See `harness/guardrails/bundle-query.md`. Portolan does not answer — cite query output.
