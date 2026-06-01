# Implementation Plan: Cursor Comparison Validation

**Branch**: `034-cursor-comparison-validation` | **Date**: 2026-05-26 |
**Spec**: `docs/specs/034-cursor-comparison-validation/spec.md`

**Input**: Feature specification from
`docs/specs/034-cursor-comparison-validation/spec.md`

## Summary

Define a repeatable local validation workflow that compares Cursor-alone and
Cursor-plus-Portolan on the same Apache Bigtop local landscape. The work is a
SpecKit validation slice: it produces prompts, a comparison ledger contract,
and run instructions under the spec directory; it does not add a daemon,
network access, target mutation, credentials, or a new coding harness.

## Decision Gate

- Simpler/Faster: Use markdown/jsonl ledgers plus existing `portolan context
  prepare`, `portolan map --root`, and `portolan graph slice` commands instead
  of building an evaluation harness.
- Blocking Edge Cases: Agent nondeterminism, unavailable Cursor Agent/UI
  lanes, stale local Bigtop checkout, large `graph.json`, and private prompt or
  output contents require an audit trail and explicit `blocked`,
  `not_assessed`, and `unknown` states.
- Existing Open Source: No new OSS evaluator dependency is justified. The
  feature composes existing Portolan artifacts and the local Cursor Agent
  surface; external evaluation frameworks would add process without improving
  the first validation result.

## Technical Context

**Language/Version**: Go 1.x for existing Portolan CLI; markdown/json/jsonl for
this validation slice.

**Primary Dependencies**: Existing local CLI commands only: `portolan context
prepare`, `portolan map --root`, and `portolan graph slice`.

**Storage**: Spec-local files under `docs/specs/034-cursor-comparison-validation/`;
runtime validation outputs should be written to `/tmp` or another explicit
operator-selected output directory.

**Testing**: Documentation and contract checks for this plan; later tasks
should run `go test ./...`, `jq empty schema/*.json`, `git diff --check`, and
the quickstart commands if local target and Cursor Agent are available.

**Target Platform**: Local developer machine with the Portolan repository,
local `/home/fall_out_bug/projects/bigtop-landscape`, and optional Cursor Agent
CLI/UI surface.

**Project Type**: CLI-first local evidence toolbox plus spec-local validation
workflow.

**Performance Goals**: Agent prompts must start from bounded artifacts:
context pack, `summary.json`, `graph-index.json`, and targeted slices only when
needed. Full `graph.json` is not a first-pass agent input.

**Constraints**: No network calls, no target repository mutation, no daemon, no
credential collection, and no committed private raw source or customer-sensitive
payloads.

**Scale/Scope**: One fixed Bigtop target, two evaluation lanes, five fixed CTO
questions, per-question scores, unsupported-claim counts, and one final
accepted/narrowed/rejected/blocked decision.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Local-first/read-only: PASS. The workflow uses existing local commands and
  writes generated artifacts to explicit output directories.
- Evidence state honesty: PASS. The ledger contract preserves `unknown`,
  `not_assessed`, and blocked lane states instead of converting them into
  success/failure.
- Complement, do not replace: PASS. The workflow compares agent behavior using
  existing Portolan outputs; it does not build a replacement scanner or coding
  harness.
- SpecKit before implementation: PASS. `spec.md` exists and this plan creates
  the required planning artifacts before `tasks.md`.
- Test-first for behavior: PASS with scope note. This slice is primarily
  validation workflow and documentation; any future CLI behavior change must add
  focused Go tests before implementation.

## Project Structure

### Documentation (this feature)

```text
docs/specs/034-cursor-comparison-validation/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- comparison-ledger.md
|-- reviews/
|   `-- <comparison-ledger-and-dispositions>.md
`-- tasks.md
```

### Source Code (repository root)

```text
cmd/portolan/
internal/contextprep/
internal/maprun/
internal/graphslice/
schema/
docs/product-backlog.md
docs/specs/034-cursor-comparison-validation/
```

**Structure Decision**: Keep this as a spec-local validation workflow. Do not
add new source packages unless task generation identifies a real missing CLI or
schema behavior.

## Phase 0: Research

Research resolves the plan choices in `research.md`:

- fixed target and lane boundaries;
- bounded artifact inputs for Cursor-plus-Portolan;
- final claim classification thresholds;
- ledger audit trail and privacy constraints;
- why not to add an evaluator dependency yet.

## Phase 1: Design And Contracts

Design outputs:

- `data-model.md`: comparison target, evaluation lane, question set, score,
  comparison ledger, and product claim decision.
- `contracts/comparison-ledger.md`: required ledger sections and JSONL record
  shapes for reproducible scoring.
- `quickstart.md`: local commands to prepare Portolan artifacts, run both
  lanes, score five questions, and classify the claim.

## Post-Design Constitution Check

- Local-first/read-only: PASS. Contracts require local artifact paths and
  forbid target mutation.
- Evidence state honesty: PASS. Ledger states explicitly include `unknown`,
  `not_assessed`, `blocked`, and `failed`.
- Complement, do not replace: PASS. The comparison uses Cursor and Portolan
  outputs; no replacement analyzer is introduced.
- SpecKit before implementation: PASS. Plan, research, data model, contract,
  and quickstart are generated before tasks.
- Test-first for behavior: PASS with scope note. No behavior change is planned
  in this phase.

## Complexity Tracking

No constitution violations.
