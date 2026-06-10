# Feature Specification: Viewer Demo UX

**Feature Branch**: `codex/090-viewer-demo-ux`

**Created**: 2026-06-10

**Status**: Implemented (smoke + demo evidence in reviews/).

**Input**: Demo-ready orient viewer: search, filters, directory heat tree, source
preview, truncation transparency.

## User Scenarios

### User Story 1 - Demo Navigation (Priority: P1)

An operator opens the viewer on a portolan or bigtop bundle and can search,
filter by kind/severity/repo, and see where pain clusters in the directory tree.

### User Story 2 - Click-to-Source (Priority: P1)

Selecting a hotspot with file paths shows a read-only source snippet from the
local target (path-guarded `/source` endpoint).

### User Story 3 - Honest Truncation (Priority: P2)

When hotspot budget truncated the bundle, the viewer shows how many were omitted.

## Requirements

- **FR-001**: Client-side search over summary, paths, id.
- **FR-002**: Filter chips: kind, severity, repo (from repos.json).
- **FR-003**: Collapsible directory heat tree aggregated from hotspot paths.
- **FR-004**: `/source?path=&line=` with repos.json prefix guard; 403 outside roots.
- **FR-005**: Truncation and gaps banners in header area.
- **FR-006**: Demo runbook and smoke evidence in reviews/.

## Success Criteria

- **SC-001**: harness-orient-smoke passes with search UI and /source path-safety checks.
- **SC-002**: Demo works on portolan bundle (~128 hotspots) and bigtop bundle (200).
