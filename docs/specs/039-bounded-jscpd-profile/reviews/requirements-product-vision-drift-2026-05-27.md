# Requirements And Product Vision Drift Review

Date: 2026-05-27

## Decision Gate

- Simpler/Faster: update the existing `oss-plan.json` jscpd recipe instead of
  adding a producer runner, daemon, dependency, or native clone detector.
- Blocking Edge Cases: prior full Bigtop run was unbounded; partial,
  interrupted, malformed, or missing output must not become verified evidence.
- Existing Open Source: use `jscpd`; do not reimplement near-clone detection.

## Requirements Drift

| Surface | Assessment |
| --- | --- |
| Backlog | P4-039 added after PR #18 because no later ready spec existed. |
| Spec | Requires bounded local jscpd profile and honest claim updates. |
| Plan | Keeps behavior in existing context preparation path. |
| Tasks | Tracks reconstruction, bounded profile, smoke evidence, claims, review, and PR readiness. |
| Code | Changes only jscpd producer recipe and tests. |

No blocking mismatch found after updating status from ready-for-implementation
to local-implementation-complete.

## Product Vision Drift

- Local-first/read-only: aligned. The recipe reads local target paths and writes
  only under the selected context output directory.
- Evidence honesty: aligned. Bigtop near-clone evidence remains unproven; the
  verified smoke is scoped to the Portolan repository.
- OSS composition posture: aligned. The feature composes `jscpd` and does not
  add a native detector.
- Agent-facing toolbox: aligned. The generated `oss-plan.json` now gives agents
  a safer bounded command.

## Not Assessed

- Full Bigtop bounded `jscpd` run.
- UI Cursor/Composer behavior.
- Semgrep producer evidence.
