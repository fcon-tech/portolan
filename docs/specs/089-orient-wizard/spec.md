# Feature Specification: Orient Wizard

**Feature Branch**: `codex/089-orient-wizard`

**Created**: 2026-06-10

**Status**: Implemented (local verification + smoke evidence in reviews/).

**Input**: One-command orient workflow: check tools, consent install, run recipes,
build bundle, open viewer. Real-target smoke on portolan and bounded bigtop.

## User Scenarios

### User Story 1 - One Command Orient (Priority: P1)

An operator runs `scripts/orient-wizard.sh <target> <orient-dir>` and receives
a ranked hotspot bundle plus optional local viewer without manual recipe steps.

### User Story 2 - Consent-Gated Tool Install (Priority: P1)

Missing jscpd, Semgrep, or Syft triggers y/N install prompt. Refusal skips the
producer and leaves `not_assessed` in gaps.jsonl.

### User Story 3 - Bounded Multi-Repo Stress (Priority: P2)

`--limit-repos N` shards jscpd/syft/semgrep across discovered git repos for
large landscapes without full-root OOM.

## Requirements

- **FR-001**: `orient-wizard.sh` orchestrates tool check, recipes, bundle build, summary.
- **FR-002**: Install only after explicit y/N or `--yes`; `--skip-install` never installs.
- **FR-003**: Shard failures log to `producers/_failures.log` and do not abort the run.
- **FR-004**: Flags: `--yes`, `--skip-install`, `--no-viewer`, `--port`, `--limit-repos`, `--producers`.
- **FR-005**: Real-target smoke evidence recorded under `reviews/`.

## Success Criteria

- **SC-001**: `orient-wizard.sh . /tmp/orient-portolan --no-viewer` produces hotspots on portolan repo.
- **SC-002**: Bounded bigtop smoke completes without crash.
- **SC-003**: `harness-orient-smoke.sh` regression still passes.
