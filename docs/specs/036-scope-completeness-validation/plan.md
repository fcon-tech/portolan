# Implementation Plan: Scope Completeness Validation

**Branch**: `036-scope-completeness-validation` | **Date**: 2026-05-27 |
**Spec**: `docs/specs/036-scope-completeness-validation/spec.md`

## Summary

Make Portolan's existing coverage ledger distinguish local repository scope from
complete inherited-estate coverage. The implementation extends the current
selection plus corpus-manifest path so a user-supplied local inventory can prove
represented, missing, and extra items without adding network access, target
mutation, a daemon, or a new scanner.

## Decision Gate

- Simpler/Faster: Extend existing `selection.corpus_manifest`,
  `coverage.json`, `summary.json`, and `map.md` behavior instead of adding a new
  command or inventory format.
- Blocking Edge Cases: Missing expected repositories, selected repositories not
  present in the inventory, symlinked or unreadable paths, and repo-like
  non-Git directories must stay explicit as `missing`, `extra`,
  `cannot_verify`, `unknown`, or `not_assessed`.
- Existing Open Source: No OSS dependency is justified. This is deterministic
  local JSON comparison over existing Portolan artifacts; scanner libraries do
  not improve the inventory classification contract.

## Technical Context

**Language/Version**: Go 1.x.

**Primary Dependencies**: Standard library and existing internal packages.

**Storage**: Existing map bundle artifacts under the operator-selected
`--out` directory.

**Testing**: Focused Go tests for coverage classification and app-level map
bundle output, then `go test ./...`, `jq empty schema/*.json`, and
`git diff --check`.

**Target Platform**: Local CLI.

**Project Type**: Single Go CLI with internal packages.

**Performance Goals**: Inventory comparison is linear over selected targets and
manifest targets.

**Constraints**: Preserve local-first/read-only behavior. Do not fetch remote
inventories, clone repositories, mutate targets, or infer completeness from
repository count.

## Constitution Check

- Local-first/read-only: PASS. The feature reads local selection and manifest
  files and writes only to the selected output directory.
- Evidence state honesty: PASS. Missing, extra, unknown, and cannot-verify
  states remain first-class.
- Complement, do not replace: PASS. This composes existing local inventory and
  corpus-manifest artifacts.
- SpecKit before implementation: PASS. This plan and `tasks.md` precede code
  changes.
- Test-first for behavior: PASS. Tasks start with focused tests.

## Project Structure

```text
internal/coverage/
internal/app/
internal/maprun/
schema/coverage.schema.json
docs/agent-toolbox/
docs/mvp.md
docs/product-backlog.md
docs/specs/036-scope-completeness-validation/
```

## Phase 0: Research

See `research.md`.

## Phase 1: Design And Contracts

Design outputs:

- `data-model.md`: visible repository, expected inventory item, scope gap, and
  completeness decision.
- `contracts/scope-coverage.md`: expected `coverage.json` records and summary
  behavior.
- `quickstart.md`: local commands for validation with and without inventory.

## Post-Design Constitution Check

- Local-first/read-only: PASS.
- Evidence state honesty: PASS.
- Complement, do not replace: PASS.
- SpecKit before implementation: PASS.
- Test-first for behavior: PASS.

## Complexity Tracking

No constitution violations.
