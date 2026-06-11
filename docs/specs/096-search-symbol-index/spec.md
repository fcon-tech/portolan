# Feature Specification: Search and Symbol Index (096)

**Status**: Implemented

**Input**: Build-time indexes for query-time retrieval; viewer unified search.

## Requirements

- **FR-001**: `build-search-index.sh` MUST emit bounded `search-index.jsonl`.
- **FR-002**: `build-symbol-index.sh` MUST emit `symbol-index.jsonl` from ctags producer output.
- **FR-003**: `build-portolan-bundle.sh` MUST invoke index builders.
- **FR-004**: Viewer search MUST call `/api/search` for code index hits alongside hotspot filter.
