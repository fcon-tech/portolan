# Feature Specification: Viewer Landscape UX

**Feature Branch**: `codex/093-viewer-landscape-ux`

**Created**: 2026-06-10

**Status**: Active implementation

**Input**: Improve Portolan viewer for human demo use: honest product naming, clearer
entry path, folder tree as first-class navigation, per-hotspot rationale. Not a graph
map — ranked scanner findings + folder clustering only.

**Out of scope**: `map.md` / navigation guide / landscape report (separate future spec).

## User Scenarios

### User Story 1 - Understand what Portolan shows (Priority: P1)

A human opens the viewer and immediately sees that rows are tool-backed hotspots,
not an AI architecture graph, and how to start (views + folder tree or ranked list).

### User Story 2 - Navigate by folder (Priority: P1)

Hotspots cluster in a visible folder tree (not buried in collapsed details) with
severity bars and counts; selecting a file hotspot opens detail.

### User Story 3 - Know why a hotspot exists (Priority: P1)

Each hotspot shows tool, rationale, and limits; detail panel expands evidence.

## Requirements

- **FR-001**: Product UI uses **Portolan** naming; remove user-facing **orient** jargon.
- **FR-002**: Three-column layout: folder tree | ranked list | detail (+ source).
- **FR-003**: View presets (top 15, code pain, config, deps) with explainer; kind chips
  sync with view vs custom filter state.
- **FR-004**: Expandable guide: what counts as a hotspot, tools, limits.
- **FR-005**: harness-orient-smoke DOM markers updated for new layout (`folder-panel`, `Portolan` title).

## Success Criteria

- **SC-001**: harness-orient-smoke passes on fixture bundle.
- **SC-002**: Operator can explain viewer purpose without reading external docs.
