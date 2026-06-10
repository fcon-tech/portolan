# PR #64 — requirements lane (replacement)

- **Lane**: requirements-reviewer
- **Requested model**: `zai-coding-plan/glm-5.1`
- **Actual harness**: `ce-correctness-reviewer` (codex-subagent/opencode hung; empty output after 600s)
- **Status**: assessed (replacement)
- **Verdict**: partial

## Accepted findings (fixed in review-fix pass)

| ID | Severity | Fix |
| --- | --- | --- |
| REQ-001 | major | `build-orient-bundle.sh`: `ORIENT_GAP_BUDGET` default 20, sort + cap gaps |
| REQ-002 | major | dep-hub `paths: ["(dependency-hub)"]` |
| REQ-003 | major | shard gaps map to `cannot_verify` (schema enum) |
| REQ-004 | major | `harness-orient-smoke.sh` validates hotspot/gap records |
| REQ-007 | minor | semgrep: no `p/default` fallback; gap when local rules missing |

## Rejected / deferred

| ID | Disposition | Reason |
| --- | --- | --- |
| REQ-005 | deferred | viewer filter/heat/banner smoke — manual demo evidence sufficient for MVP; follow-up spec |
| REQ-006 | accepted risk | full bigtop remains manual gate (documented in scale-findings) |
| REQ-008 | deferred | doc-only: add `hotspots-full.jsonl` to spec 088 layout in follow-up |
