# Feature Specification: Bundle Query Surface (095)

**Status**: Implemented

**Input**: Read-only query over Portolan harness bundles for agent-first Q&A at question time (no pre-built answer packs).

## Requirements

- **FR-001**: `portolan-bundle-query.sh` MUST support families: hotspots, gaps, landscape, search, symbol, source, evidence-index.
- **FR-002**: Viewer `serve.js` MUST expose matching `/api/*` endpoints on localhost only.
- **FR-003**: Query output MUST include schema_version, bounded records, truncation, stable `portolan://` references, evidence_state.
- **FR-004**: No LLM calls, no network by default, no target mutation.
- **FR-005**: SKILL and `harness/guardrails/bundle-query.md` MUST document query-at-answer-time workflow.
