# Feature Specification: Landscape Report Viewer (093)

**Feature Branch**: `codex/093-viewer-landscape-ux`

**Created**: 2026-06-10

**Status**: Active implementation

**Input**: Human-readable landscape report in the viewer, inspired by sdp_lab scout
ProjectCard + Portolan `map.md` sections. Resurrects pruned `052-agent-scan-report-ux`
scope. Scanner findings drill-down (UA navigation pattern), not LLM architecture graph.

**Out of scope**: sdp_lab runtime (`sdp scout`), LLM Q&A, full `portolan map` graph import (spec 094).

## User Scenarios

### User Story 1 - Report in 10 seconds (Priority: P1)

A human opens the viewer and sees a project card (language, scale, maturity) and repo
matrix before diving into individual findings.

### User Story 2 - Findings by section (Priority: P1)

Findings appear grouped like `map.md` (duplication, config, smells, symbol density, deps),
not only a flat ranked list.

### User Story 3 - Gaps visible (Priority: P1)

A dedicated tab lists what the scan did not assess.

### User Story 4 - Findings map (Priority: P2)

Inside the Findings tab, a folder map and inspector support drill-down to source.

### User Story 5 - Drill-down (Priority: P1)

Click a finding → detail panel → read-only source preview.

## Requirements

- **FR-001**: Product UI uses **Portolan** naming; no user-facing **orient** jargon.
- **FR-002**: Default tab = **Overview** (`landscape-card.json` + `landscape-report.json`).
- **FR-003**: Tabs: Overview | Findings | Gaps.
- **FR-004**: Bundle emits `landscape-card.json` and `landscape-report.json`.
- **FR-005**: Findings grouped by kind/section (map.md parity).
- **FR-006**: When scan found more than viewer shows, UI states «найдено Y, показано X» and offers load-all.
- **FR-007**: `portolan-scan.sh` (wrapper on legacy `orient-wizard.sh` name deprecated).
- **FR-008**: Report sections use `evidence_ref`; unknown/gap states stay visible.
- **FR-009**: harness-portolan-smoke checks report DOM markers.

## Success Criteria

- **SC-001**: harness-portolan-smoke passes with fixture bundle including report artifacts.
- **SC-002**: Operator answers target identity, repo count, top issues, and gaps without external docs.
