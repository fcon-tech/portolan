# Feature Specification: Harness-First Product

**Feature Branch**: `codex/087-harness-first-product`

**Created**: 2026-06-10

**Status**: Active implementation slice for the Portolan harness pivot.

**Input**: Product pivot — Portolan is a harness supplement (rules, recipes,
guardrails, OSS assembly) with a Portolan map viewer, not primarily a Go module.
B2B evidence guardrails are a cherry on top, not the hero value.

## User Scenarios & Testing

### User Story 1 - Find Pain In The Codebase (Priority: P1)

An engineer or agent asks where duplication, static smells, dependency hubs, or
config risks are visible locally and receives a ranked hotspot list plus an
interactive Portolan map.

**Why this priority**: This is the primary user job. Evidence discipline supports
the answer; it does not replace the answer.

**Independent Test**: A fixture target with jscpd and Semgrep outputs produces
an Portolan bundle and the viewer shows at least one duplication and one
static-finding hotspot with file paths.

**Acceptance Scenarios**:

1. **Given** local producer outputs exist, **When** the harness workflow runs,
   **Then** `<bundle-dir>/hotspots.jsonl` lists ranked pain points with `producer_ref`.
2. **Given** jscpd output is missing, **When** the Portolan bundle is built,
   **Then** duplication remains `not_assessed` and the viewer shows a gap badge,
   not synthetic clone clusters.

---

### User Story 2 - Harness-Independent Agent Workflow (Priority: P1)

An agent in Cursor, OpenCode, Codex, or Claude can follow one portable skill to
run OSS recipes, build the Portolan bundle, and open the local viewer without
bootstrapping the Go CLI.

**Independent Test**: `harness/SKILL.md` completes on a fixture repo using only
documented recipes and `scripts/build-portolan-bundle.sh`.

---

### User Story 3 - Guardrails As Secondary Value (Priority: P2)

Every hotspot and viewer node cites `evidence_state` and `producer_ref`. Unknown
surfaces stay visible but do not block the primary navigation experience.

**Independent Test**: `harness/guardrails/citation-rules.md` fits on one screen;
viewer badges match evidence states.

## Requirements

- **FR-001**: The primary product path MUST be harness install → OSS recipes →
  Portolan bundle → local viewer.
- **FR-002**: The hero product claim MUST be navigation to code pain (duplication,
  static findings, deps/config hotspots), not evidence discipline alone.
- **FR-003**: Portable harness artifacts MUST work across Cursor, OpenCode, and
  Codex/Claude without IDE-specific truth sources.
- **FR-004**: B2B guardrails (citations, unknowns, claim boundaries) MUST be
  secondary surfaces in `harness/guardrails/` and viewer badges.
- **FR-005**: The Go CLI MUST remain frozen for new features until the Go decision
  gate in `docs/adr/001-go-cli-fate.md` resolves its role.
- **FR-006**: Viewer nodes MUST come from imported producer evidence or Portolan
  normalization only; LLM-authored graphs MUST NOT be `source-visible`.

## Success Criteria

- **SC-001**: README and product claims list harness-first quick start before
  optional Go legacy path.
- **SC-002**: Constitution v1.1.0 records harness-first delivery and local viewer
  boundary.
- **SC-003**: Go freeze policy is published and referenced from `AGENTS.md`.

## Assumptions

- Specs 084–088 implement the harness pivot slices.
- Legacy `context prepare` and `map` remain optional bridges until the Go gate.
