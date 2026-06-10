# Feature Specification: Orient Bundle Contract

**Feature Branch**: `codex/088-orient-bundle-contract`

**Created**: 2026-06-10

**Status**: Active implementation.

## User Scenarios

### User Story 1 - Single Orient Directory (Priority: P1)

Harness recipes and `scripts/build-orient-bundle.sh` produce one `orient/`
directory that both the viewer and agents consume.

**Independent Test**: Fixture producers → bundle validates against
`harness/contracts/orient-bundle.schema.json`.

## Bundle layout

```text
orient/
  manifest.json
  hotspots.jsonl
  repos.json
  gaps.jsonl
  producers/
  graph-slice.json   # optional
```

## Hotspot record

Required fields: `id`, `kind`, `severity`, `summary`, `paths`, `evidence_state`,
`producer`, `producer_ref`, `rank`.

Kinds: `duplication`, `static-finding`, `config`, `dep-hub`, `debt-candidate`.

## Requirements

- **FR-001**: No LLM summary as evidence; `producer_ref` required for observed hotspots.
- **FR-002**: `gaps.jsonl` budget: top 20 by default.
- **FR-003**: `scripts/orient-export-from-map.sh` maps legacy `portolan map` output to orient layout.

## Success Criteria

- **SC-001**: `jq empty harness/contracts/orient-bundle.schema.json`
- **SC-002**: Smoke fixture bundle loads in viewer.
