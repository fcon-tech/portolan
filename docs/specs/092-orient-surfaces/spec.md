# Feature Specification: Orient Surfaces

**Feature Branch**: `codex/092-orient-surfaces`

**Created**: 2026-06-10

**Status**: Implemented (local); PR ready-for-review pending

**Input**: Add config-surfaces inventory and ctags symbol-density layers to the orient harness path; close PR #64 deferred debt items.

## User Scenarios

### User Story 1 - Config surface inventory (Priority: P1)

An agent runs orient-wizard and sees `config` hotspots grouped by surface kind (Dockerfile, compose, k8s, env, CI, terraform) without installing external tools.

### User Story 2 - Symbol-dense files (Priority: P1)

When ctags is available, the bundle includes `debt-candidate` hotspots for symbol-dense files; when missing, gaps record `not_assessed`.

### User Story 3 - PR #64 debt closure (Priority: P2)

repo_slug hash, spec 088 layout docs, extended harness smoke, wizard orchestration in CI.

## Requirements

- **FR-001**: `scripts/scan-config-surfaces.sh` emits `producers/config/<slug>.jsonl`.
- **FR-002**: Wizard default producers include `config` and `ctags`; config needs no install.
- **FR-003**: Bundle maps config → kind `config`, ctags density → kind `debt-candidate`.
- **FR-004**: Kind-quota budget: static-finding 45%, duplication 25%, dep-hub 15%, config 15%, remainder debt-candidate.
- **FR-005**: repo_slug includes path hash suffix to avoid basename collisions.
- **FR-006**: harness-orient-smoke checks viewer DOM markers and truncation; CI runs wizard with `--skip-install`.

## Success Criteria

- **SC-001**: Fixture bundle includes `config` hotspot; smoke passes.
- **SC-002**: With ctags installed, fixture or portolan smoke includes `debt-candidate` or honest gap.
- **SC-003**: Real-target smoke recorded in `reviews/smoke-findings.md`.
