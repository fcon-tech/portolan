# Implementation Plan: Relationship Evidence Taxonomy

**Branch**: `037-relationship-evidence-taxonomy` | **Date**: 2026-05-27 |
**Spec**: `specs/037-relationship-evidence-taxonomy/spec.md`

**Input**: Feature specification from
`specs/037-relationship-evidence-taxonomy/spec.md`

## Summary

Make Portolan's relationship claims understandable at product level by
publishing a plain-language taxonomy for relationship kinds and evidence
strength, then surface that taxonomy in the generated agent answer contract.
The slice does not add new relationship scanners; it prevents existing reports
and agent guidance from treating static, declared, runtime, and claim-only
relationships as interchangeable.

## Decision Gate

- Simpler/Faster: Document the taxonomy and add it to the existing generated
  `answer-contract.md` instead of adding a new command, schema version, or
  scanner.
- Blocking Edge Cases: Existing graph outputs already emit relationship edges
  and findings, so changing schema shape would create compatibility risk. The
  user-facing risk is overclaiming runtime topology from source or metadata,
  which requires stronger wording and tests rather than new detection logic.
- Existing Open Source: Relationship evidence can be imported from established
  local tools and formats such as Backstage, OpenAPI, AsyncAPI, Structurizr,
  OpenTelemetry exports, and SBOM/tool outputs when present. No new dependency
  is justified for this slice because it is a taxonomy/reporting contract, not
  a producer adapter.

## Technical Context

**Language/Version**: Go 1.x for generated context pack output; markdown for
taxonomy and product docs.

**Primary Dependencies**: Existing standard library code and current Portolan
packages. No new dependency.

**Storage**: Repository docs and generated markdown output only.

**Testing**: Focused Go tests for generated `answer-contract.md`, plus
baseline `go test ./...`, `jq empty schema/*.json`, and `git diff --check`.

**Target Platform**: Local CLI on the developer machine.

**Project Type**: CLI-first local evidence toolbox with generated agent-facing
context artifacts.

**Performance Goals**: No material runtime cost. Generated contract text
remains small enough for agents to read before large graph artifacts.

**Constraints**: No network calls, daemon behavior, credential access, target
repository mutation, schema incompatibility, or claims beyond local evidence.

**Scale/Scope**: One product taxonomy, one generated answer-contract section,
and supporting documentation/tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Local-first/read-only: PASS. The slice edits repo docs and generated text
  only; runtime context preparation remains local and read-only.
- Evidence state honesty: PASS. The purpose is to preserve `source-visible`,
  `metadata-visible`, `runtime-visible`, `claim-only`, `unknown`,
  `cannot_verify`, and `not_assessed` distinctions in relationship claims.
- Complement, do not replace: PASS. The taxonomy names where mature local
  outputs fit and does not build replacement scanners.
- SpecKit before implementation: PASS. `spec.md`, this `plan.md`, supporting
  artifacts, and `tasks.md` precede implementation.
- Test-first for behavior: PASS. Generated contract behavior has a focused Go
  test before implementation edits.

## Project Structure

### Documentation (this feature)

```text
specs/037-relationship-evidence-taxonomy/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- relationship-taxonomy.md
|-- reviews/
|   `-- <review-and-disposition-artifacts>.md
`-- tasks.md
```

### Source Code (repository root)

```text
docs/evidence-model.md
docs/relationship-detection.md
internal/contextprep/contextprep.go
internal/app/app_test.go
docs/product-backlog.md
specs/037-relationship-evidence-taxonomy/
```

**Structure Decision**: Keep relationship detection implementation unchanged.
The product behavior is the reporting contract exposed through docs and the
generated context pack.

## Phase 0: Research

Research resolves:

- relationship kind names and what stakeholder questions they can answer;
- how evidence states map to relationship claims;
- why mature local tool outputs remain imported evidence rather than a new
  native scanner in this slice.

## Phase 1: Design And Contracts

Design outputs:

- `data-model.md`: relationship claim, relationship kind, evidence type,
  stakeholder question, and limitation entities.
- `contracts/relationship-taxonomy.md`: required taxonomy wording and
  generated answer-contract requirements.
- `quickstart.md`: local commands to verify the generated contract and baseline
  checks.

## Post-Design Constitution Check

- Local-first/read-only: PASS. No generated guidance asks agents to contact
  networks or mutate targets.
- Evidence state honesty: PASS. Runtime topology remains `not_assessed` unless
  runtime-visible evidence is supplied.
- Complement, do not replace: PASS. Backstage/OpenAPI/AsyncAPI/Structurizr and
  telemetry remain imported/local evidence candidates.
- SpecKit before implementation: PASS. Planning artifacts exist before tasks.
- Test-first for behavior: PASS. Tasks start with a focused generated-contract
  test.

## Complexity Tracking

No constitution violations.
