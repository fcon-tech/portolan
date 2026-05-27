# Implementation Plan: Product Claim Gate

**Branch**: `038-product-claim-gate` | **Date**: 2026-05-27 |
**Spec**: `specs/038-product-claim-gate/spec.md`

**Input**: Feature specification from
`specs/038-product-claim-gate/spec.md`

## Summary

Create a spec-local product claim gate that turns current Portolan product
claims into an auditable ledger and a client-safe answer. The first
implementation is documentation and evidence normalization: no new CLI command,
network access, daemon, credentials, or target mutation. Claims are accepted,
narrowed, rejected, blocked, failed, or marked `not_assessed` from existing
validation artifacts only.

## Decision Gate

- Simpler/Faster: Use a spec-local markdown/jsonl claim ledger and generated
  answer artifact instead of adding a new Go command or workflow engine.
- Blocking Edge Cases: Claims may be true for headless Cursor but not UI
  Cursor/Composer; true for a fixture but not a real target; based on internal
  implementation rather than validation; or dependent on OSS producer evidence
  that is absent, failed, or too narrow.
- Existing Open Source: Evaluation and evidence-management tools exist, but
  none fit the local-first, small-slice need better than a plain ledger over the
  existing SpecKit review artifacts. Adding a dependency would increase process
  and license surface without improving the first claim gate.

## Technical Context

**Language/Version**: Go 1.x for existing Portolan verification commands;
markdown/json/jsonl for this product-validation slice.

**Primary Dependencies**: Existing repo artifacts only:
`docs/product-backlog.md`, `docs/mvp.md`, `docs/product-boundary.md`,
`specs/034-cursor-comparison-validation/`, `specs/035-oss-producer-acceptance/`,
`specs/036-scope-completeness-validation/`, and
`specs/037-relationship-evidence-taxonomy/`.

**Storage**: Spec-local files under `specs/038-product-claim-gate/`; no runtime
state outside an explicit operator-selected output path.

**Testing**: Artifact and contract inspection plus baseline repository checks:
`go test -count=1 ./...`, `jq empty schema/*.json`, and `git diff --check`.
If implementation discovers a CLI/schema gap, add focused Go tests before code
changes.

**Target Platform**: Local developer machine running the Portolan repository.

**Project Type**: CLI-first local evidence toolbox plus spec-local product
claim validation workflow.

**Performance Goals**: Human review should start from a compact ledger and
client-safe answer rather than loading full graph outputs or unrelated review
artifacts.

**Constraints**: Preserve local-first/read-only defaults; no network calls, no
daemon, no credentials, no target repository mutation, no committed private raw
source or customer-sensitive outputs, and no accepted product claim without
validation evidence.

**Scale/Scope**: Current product claims from MVP, product boundary, backlog,
and validation specs 034-037; output one claim ledger and one client-safe
answer for the current validation cycle.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Local-first/read-only: PASS. The planned artifacts read existing local
  documents and write only under the selected spec directory.
- Evidence state honesty: PASS. The ledger keeps `not_assessed`, `blocked`,
  `failed`, and narrowed states explicit.
- Complement, do not replace: PASS. The slice gates product language over
  existing Portolan outputs; it does not replace Cursor, enterprise scanners,
  or validation tools.
- SpecKit before implementation: PASS. This plan, research, data model,
  contract, quickstart, and tasks precede any implementation edits.
- Test-first for behavior: PASS with scope note. The first slice is artifact
  and documentation behavior; any Go behavior change requires focused tests
  first.

## Project Structure

### Documentation (this feature)

```text
specs/038-product-claim-gate/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- product-claim-ledger.md
|-- reviews/
|   `-- <status-review-and-dispositions>.md
`-- tasks.md
```

### Source Code (repository root)

```text
docs/product-backlog.md
docs/mvp.md
docs/product-boundary.md
specs/034-cursor-comparison-validation/
specs/035-oss-producer-acceptance/
specs/036-scope-completeness-validation/
specs/037-relationship-evidence-taxonomy/
specs/038-product-claim-gate/
```

**Structure Decision**: Keep this as a spec-local claim-gating workflow for the
first slice. Do not add source packages unless artifact generation proves a
manual ledger is too error-prone.

## Phase 0: Research

Research resolves:

- claim ledger format and statuses;
- evidence source hierarchy;
- client-safe answer generation boundary;
- backlog update rules when claims are rejected, narrowed, blocked, or
  unassessed;
- why no new dependency or CLI command is justified now.

## Phase 1: Design And Contracts

Design outputs:

- `data-model.md`: product claim, evidence link, claim decision,
  limitation, and client-safe answer.
- `contracts/product-claim-ledger.md`: required ledger sections and JSONL
  record shape.
- `quickstart.md`: local review steps for collecting claims, classifying them,
  generating the answer, and verifying the artifact.

## Post-Design Constitution Check

- Local-first/read-only: PASS. The contract forbids target mutation and external
  collection.
- Evidence state honesty: PASS. `not_assessed`, `blocked`, and `failed` remain
  first-class outcomes.
- Complement, do not replace: PASS. The ledger references existing validation
  artifacts instead of introducing a new evaluator.
- SpecKit before implementation: PASS. Plan, research, data model, contract,
  quickstart, and tasks are available before implementation.
- Test-first for behavior: PASS with scope note. No Go behavior change is
  planned in the first implementation.

## Complexity Tracking

No constitution violations.
