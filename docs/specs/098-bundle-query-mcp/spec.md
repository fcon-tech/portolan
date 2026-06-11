# Feature Specification: Bundle Query MCP (098)

**Status**: Implemented

**Input**: stdio MCP server exposing read-only Portolan bundle-query tools for agent harnesses (Cursor, Codex) without shell.

## Requirements

- **FR-001**: MCP server MUST expose tools 1:1 with bundle-query families: hotspots, gaps, landscape, search, symbol, source, evidence-index.
- **FR-002**: Bundle path via `PORTOLAN_BUNDLE_DIR` env or `--bundle` argv; read-only, no network.
- **FR-003**: Tool results MUST be JSON matching `bundle-query-result.schema.json`.
- **FR-004**: No answer/suggest-question tools; guardrails in `harness/guardrails/bundle-query.md` apply.
- **FR-005**: SKILL + recipe document Cursor `mcp.json` wiring; smoke in harness-portolan-smoke.

## Dependencies

- `@modelcontextprotocol/sdk` in `viewer/package.json` (stdio only, local bundle path).
