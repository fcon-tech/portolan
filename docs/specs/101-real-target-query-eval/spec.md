# Feature Specification: Real-Target Query Eval (101)

**Status**: Ready for implementation

**Input**: Lane A vs B eval on a real `portolan-scan` self-target bundle (not smoke fixture).

## Requirements

- **FR-001**: Run `portolan-scan.sh` on portolan repo; record bundle path.
- **FR-002**: Lane B uses `portolan-bundle-query.sh` only (SKILL primary; not MCP).
- **FR-003**: Artifact `reviews/eval-run-*-self-target.md` with rubric scores and verdict.
- **FR-004**: `run-query-eval.sh` supports `--self` preset for `/tmp/portolan-self`.
