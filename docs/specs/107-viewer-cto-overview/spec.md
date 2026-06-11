# Feature Specification: Viewer CTO Overview & Repo Drill-Down (107)

**Status**: Ready for implementation

**Input**: CTO answers «что за репо, как связаны, какого tier'а знание» inside the viewer, без внешних docs.

## Requirements

- **FR-001**: Repos tab: repo cards grid (name, purpose line from profile/claim with tier badge, language, activity, maturity, findings by severity). Click → drill-down.
- **FR-002**: Drill-down ladder: tier A (profile, full README plain-text via path-guarded API, entrypoints/services, relationships, top findings via repo filter) → tier B/C/D claims with badges and expandable cited_refs (ref click → evidence). Ranked Findings stays tier A only.
- **FR-003**: Relationships view: edges list with type, evidence_state, producer_ref; click-through to evidence.
- **FR-004**: Overview: findings-by-repo aggregation; landscape-subject claims block (badged).
- **FR-005**: bundle-query families `repos`, `relationships` + `repo` filter on hotspots; `/api/*` parity; MCP mirrors.
