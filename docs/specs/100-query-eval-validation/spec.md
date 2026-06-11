# Feature Specification: Query Eval Validation (100)

**Status**: Implemented

**Input**: Record lane A vs lane B scores using `docs/specs/095-bundle-query-surface/reviews/query-eval-rubric.md` on a real bundle.

## Requirements

- **FR-001**: Eval run on portolan self-scan or fixture bundle with 10 rubric questions.
- **FR-002**: Lane B MUST use `portolan-bundle-query` per question; Lane A without query tools.
- **FR-003**: Artifact `reviews/eval-run-YYYY-MM-DD.md` with per-question scores and verdict.
- **FR-004**: Optional `scripts/run-query-eval.sh` scaffold for bundle path + question list.
