# Feature Specification: OSS Agent Context Assembly

**Feature Branch**: `018-oss-agent-context-assembly`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: Product correction: Portolan must augment Cursor and other coding
agents. The next useful product surface is not a raw inventory command; it is a
read-only context preparation step that tells an agent what local repositories,
tool outputs, evidence, and gaps exist before the agent answers CTO-level
questions.

## User Scenarios & Testing

### User Story 1 - Prepare Agent Context From A Local Landscape (Priority: P1)

A CTO or agent points Portolan at a local folder that may contain many
repositories and existing OSS/tool-output files. Portolan writes a compact
agent context pack that Cursor can read before it answers architecture,
duplication, ownership, or service-relationship questions.

**Independent Test**: Run `portolan context prepare --root <fixture> --out
<dir> --profile cursor`. The command writes `agent-brief.md`,
`query-plan.md`, `repos.json`, `tool-registry.json`, `oss-plan.json`, and
`gaps.jsonl` without network access or target mutation.

### User Story 2 - Compose OSS Outputs Before Native Scanners (Priority: P1)

An agent can see which local outputs from jscpd, Syft/CycloneDX, Semgrep,
Backstage, OpenAPI, AsyncAPI, Structurizr, and large-codebase indexes are
available, missing, or not assessed.

**Independent Test**: A fixture containing representative local filenames is
classified into known tool families and missing families are recorded in
`gaps.jsonl` as `not_assessed`, not silently ignored.

### User Story 3 - Preserve Honest Scale Boundaries (Priority: P1)

The pack helps Cursor navigate large and multi-repo systems without loading all
source into one prompt or pretending the folder is a complete ecosystem.

**Independent Test**: When no manifest is supplied, the generated brief states
that external ecosystem completeness is `unknown`.

## Requirements

- **FR-001**: System MUST expose a context-preparation CLI that accepts
  `--root`, `--out`, and `--profile cursor`.
- **FR-002**: System MUST run local-first and read-only; it MUST NOT fetch,
  clone, invoke network services, start daemons, collect credentials, or mutate
  the target root.
- **FR-003**: System MUST discover distinct local Git repositories directly
  under the root and under a conventional `repos/` child directory.
- **FR-004**: System MUST preserve each discovered repository as a distinct
  record; it MUST NOT collapse a multi-repo folder into one fake repository.
- **FR-005**: System MUST detect local candidate outputs for the priority OSS
  families: jscpd, Syft/CycloneDX, Semgrep, Backstage catalog, OpenAPI,
  AsyncAPI, Structurizr, and optional code indexes.
- **FR-006**: System MUST write a Cursor-readable brief and query plan that
  instructs the agent to inspect local evidence before making claims.
- **FR-007**: System MUST write a gap ledger for missing or unsupported
  families using `unknown`, `cannot_verify`, or `not_assessed`.
- **FR-008**: System MUST keep raw private source snippets out of the generated
  pack.

## Key Entities

- **Context Pack**: Output directory containing agent-facing Markdown and
  machine-readable JSON/JSONL indexes.
- **Repository Record**: A discovered local repository root with stable id,
  path, evidence state, and discovery reason.
- **Tool Registry Entry**: A local candidate file or directory associated with
  an OSS/tool family.
- **Gap Record**: A missing, unsupported, or unverifiable evidence family that
  the agent must not infer around.

## Success Criteria

- **SC-001**: Cursor can start from `agent-brief.md` and know which artifacts to
  inspect first.
- **SC-002**: A multi-repo fixture produces multiple repository records.
- **SC-003**: Missing duplication, SBOM, service catalog, API contract, and
  index inputs are represented in `gaps.jsonl`.
- **SC-004**: Existing `portolan map` and `portolan import cyclonedx` behavior
  remains unchanged.
