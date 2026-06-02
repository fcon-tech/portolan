# Feature Specification: jscpd Sharded Duplication Plan

**Feature Branch**: `codex/079-jscpd-sharded-duplication-plan`

**Created**: 2026-06-02

**Status**: Merged via PR #57; local baseline, fresh Bigtop context smoke,
Cursor Composer 2.5 sharded-plan stress, three assessed non-GPT review lanes,
GitHub checks, explicit user merge approval, squash merge `f4a4951`, and remote
branch cleanup verified; GitHub review approval remains `not_assessed`

**Input**: The Bigtop stress report shows full-root jscpd failed with Node OOM.
That failure is useful evidence about the producer attempt, but it is not clone
evidence. Portolan currently gives a single root-level jscpd command, which can
push agents back into the same failed path on large landscapes.

## User Scenarios & Testing

### User Story 1 - Sharded jscpd Next Actions (Priority: P1)

An agent preparing context for a multi-repo landscape sees repository-sharded
jscpd commands instead of one full-root command.

**Why this priority**: The active Bigtop gap is code duplication evidence. A
full-root jscpd OOM must not become a dead end or an overclaimed result.

**Independent Test**: Run `context prepare` on a fixture with two discovered
repositories and a fake local `jscpd`; verify `oss-plan.json` has one jscpd
plan with per-repository commands whose writes stay under `tool-outputs`.

**Acceptance Scenarios**:

1. **Given** two or more repositories are discovered, **When** context is
   prepared, **Then** the jscpd plan emits one command per repository shard and
   no full-root command.
2. **Given** a single repository is discovered, **When** context is prepared,
   **Then** the existing single-target bounded jscpd command remains available.
3. **Given** no jscpd output exists, **When** agents read the plan, **Then**
   duplication remains `not_assessed` until a local output is produced and
   imported.

### User Story 2 - Large Landscape Failure Discipline (Priority: P1)

An agent reading the context pack understands that failed shards or failed
full-root jscpd runs are failed producer attempts, not duplication metrics.

**Independent Test**: Inspect generated guidance and plan limits; verify they
tell agents to run shards sequentially, preserve native exit status, and not
aggregate missing/failed shards into success.

### User Story 3 - Bigtop Smoke Recheck (Priority: P2)

A maintainer can refresh Bigtop context and see repository-sharded jscpd
commands without running jscpd.

**Independent Test**: Fresh Bigtop `context prepare` writes an `oss-plan.json`
with repository-sharded jscpd commands and no `tool-outputs` jscpd report.

## Requirements

- **FR-001**: For multi-repo context packs, jscpd recipes MUST be sharded by
  discovered repository.
- **FR-002**: Sharded jscpd commands MUST write only under the context
  `tool-outputs` directory.
- **FR-003**: Sharded commands MUST preserve existing jscpd safety bounds:
  max source size, max lines, generated/vendor/output exclusions, no symlink
  following, gitignore use, silent mode, no forced native exit-code override.
- **FR-004**: The plan MUST require user approval and MUST NOT execute jscpd
  during context preparation.
- **FR-005**: Existing jscpd output MUST still make the plan `input_present`.
- **FR-006**: Agent-facing guidance MUST say failed or missing shards keep
  duplication `failed`, `not_assessed`, or `cannot_verify`; no clone metrics may
  be claimed from absent output.

## Success Criteria

- **SC-001**: A two-repo fixture produces two jscpd commands, each scoped to one
  repo and one output shard under `tool-outputs/jscpd/<repo-id>/`.
- **SC-002**: A fresh Bigtop context contains repository-sharded jscpd commands
  and no executed jscpd output.
- **SC-003**: Local baseline checks pass and no duplication claim is upgraded.

## Assumptions

- Repository-level sharding is the smallest useful default for Bigtop-scale
  first evidence acquisition.
- Cross-repo clone detection remains a future, explicitly approved producer
  workflow. This slice improves acquisition ergonomics without inventing a
  Portolan duplicate scanner.
