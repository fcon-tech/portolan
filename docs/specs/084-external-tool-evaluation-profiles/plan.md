# Implementation Plan: External Tool Evaluation Profiles

**Branch**: `codex/084-external-tool-evaluation-profiles`

**Date**: 2026-06-05

**Spec**: `docs/specs/084-external-tool-evaluation-profiles/spec.md`

**Input**: Feature specification from
`docs/specs/084-external-tool-evaluation-profiles/spec.md`

## Summary

Create dated external-tool evaluation profiles for CodeGraph,
Understand-Anything, and ast-index so agents can distinguish producer
candidates, UX inspirations, adoption blockers, and evidence limitations without
treating candidate tools as observed Portolan evidence. The implementation is a
documentation and context-guidance slice: no external tool execution, no network
calls in product code, no target mutation, no daemon behavior, no schema
changes, and no new dependencies.

## Decision Gate

- **Simpler/Faster**: Keep the slice as profile documentation plus bounded
  context guidance. Rejected broader implementation because importer work,
  schema changes, or producer execution would solve a different problem.
- **Blocking Edge Cases**: Candidate tools can require package installation,
  write caches inside target repositories, install hooks/MCP surfaces, start
  watchers/daemons, contact networks, or emit LLM-authored summaries. Those
  risks require approval boundaries and stale-profile labeling.
- **Existing Open Source**: The reviewed OSS projects are the subject of this
  slice. Portolan will compose deterministic local outputs later if a future
  importer spec proves fit; it will not reimplement their scanners here.

## Technical Context

**Language/Version**: Go for existing context-pack tests; markdown for profile
artifacts.

**Primary Dependencies**: Standard library only. No new dependency.

**Storage**: Committed documentation and generated context-pack artifacts.

**Testing**: Focused `internal/contextprep` test, docs/profile checks, full
baseline.

**Target Platform**: Local CLI repository workflow.

**Project Type**: Go CLI plus documentation.

**Performance Goals**: No new runtime path. Context-pack additions must remain
bounded text output.

**Constraints**: Local-first/read-only defaults. No installs, network access in
product code, producer execution, daemon behavior, credentials, target
mutation, or graph evidence promotion.

**Scale/Scope**: Three external projects and one context-guidance surface.

## Constitution Check

*GATE: Passed before Phase 0 research. Re-checked after Phase 1 design.*

- I. Local-First And Read-Only By Default: Passed. Product code will not contact
  networks, start daemons, install tools, mutate targets, or collect
  credentials.
- II. Evidence State Honesty: Passed. Candidate profiles are planning guidance,
  not graph facts or observed evidence.
- III. Complement, Do Not Replace: Passed. The slice evaluates OSS tool fit and
  defers importer/execution work to future specs.
- IV. SpecKit Before Implementation: Passed after this plan, research,
  data-model, contract, quickstart, and tasks are created.
- V. Test-First For Behavior: Passed. Any context-pack behavior change gets a
  focused test before implementation.

## Project Structure

### Documentation (this feature)

```text
docs/specs/084-external-tool-evaluation-profiles/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
```text
docs/adapter-contracts/
└── external-tool-evaluation-profiles.md

internal/contextprep/
├── contextprep.go
└── contextprep_test.go

docs/specs/084-external-tool-evaluation-profiles/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── external-tool-profile.md
├── reviews/
└── tasks.md
```

**Structure Decision**: Keep candidate profiles in `docs/adapter-contracts/`
beside existing adapter profiles and keep implementation evidence under the
spec-local `reviews/` directory. Use `internal/contextprep` only if generated
context needs a bounded pointer to the profile artifact.

The profile `role` vocabulary is intentionally product-facing markdown
guidance. It is not a replacement for the existing producer-family
`Decision`/`SupportState` machine-readable records. Future importer or
navigation specs, including P6-085 and P6-086, must map any adopted profile
decision back to the existing producer-family contract before generated evidence
records depend on it.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations.

## Verification

```bash
go test -count=1 ./internal/contextprep
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

For generated context behavior, also run:

```bash
go run ./cmd/portolan context prepare --root . --out /tmp/portolan-084-context --force
jq empty /tmp/portolan-084-context/oss-plan.json
```

Refresh public GitHub metadata before PR readiness if more than one day has
passed since the profile `last_refreshed` date.
