# Feature Specification: Viewer Graph & Search Polish (099)

**Status**: Implemented

**Input**: Human navigation polish after query substrate (094–097): graph hints UI, richer search index, demo docs.

## Requirements

- **FR-001**: Viewer tab **Graph hints** when `map-bridge/evidence-index.jsonl` exists; empty state with build-map-bridge recipe.
- **FR-002**: `build-search-index.sh` uses `rg` when available for bounded line indexing; gap when `rg` absent.
- **FR-003**: Overview renders `landscape-report.json` overview text blocks when present.
- **FR-004**: `docs/demo-runbook.md` and README mention search panel + bundle-query/MCP for agents.
