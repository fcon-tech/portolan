# Implementation Plan: Bigtop Architecture Understanding

**Branch**: `codex/056-bigtop-architecture-understanding` | **Date**: 2026-06-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `docs/specs/056-bigtop-architecture-understanding/spec.md`

## Summary

Create a fixed Bigtop architecture question set and rubric, run Cursor-only and
Cursor-plus-Portolan answers against the same questions, then score claim by
claim. Verified claims require cited local evidence. Runtime, symbol/reference,
and broad enterprise-intelligence parity remain weak unless the evidence exists.

## Technical Context

**Primary surfaces**:

- Bigtop workspace: `/home/fall_out_bug/projects/bigtop-landscape`
- Producer ledger: `/home/fall_out_bug/projects/bigtop-landscape/.portolan/producer-runs.jsonl`
- Spec 054 Portolan context: `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof/context/`
- Spec 054 Portolan map: `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof/map/`
- Cursor Agent `composer-2.5`

**Testing**: Cursor-only and Cursor-plus-Portolan lanes on the same question
set; rubric scoring; local docs checks; no target mutation.

**Constraints**: Local-first, read-only, no credentials, no runtime startup, no
network collection, no live telemetry. The comparison may inspect local files
and committed Portolan artifacts only.

## Constitution Check

| Principle | Status | Evidence |
| --- | --- | --- |
| Local-first/read-only | Pass | Stress uses local Bigtop checkout and local Portolan artifacts only. |
| Evidence-state honesty | Pass | Ledger requires verified/partial/failed/blocked/not_assessed per question. |
| Complement existing tools | Pass | Cursor is the acceptance client; Portolan supplies evidence context. |
| No unsupported runtime claims | Pass | Runtime questions cannot pass without runtime-visible evidence from spec 055. |
| SpecKit before implementation | Pass | This plan and tasks precede 056 scoring artifacts. |

## Structure

```text
docs/specs/056-bigtop-architecture-understanding/
  plan.md
  research.md
  data-model.md
  contracts/architecture-understanding-ledger.md
  quickstart.md
  tasks.md
  reviews/
  stress/
```

## Decision Gate

- Simpler/Faster: score Cursor answers against existing 054/055 artifacts
  before adding new Portolan features.
- Blocking Edge Cases: broad architecture understanding can overclaim; runtime
  topology remains unavailable; producer coverage is partial; Cursor may cite
  source files without Portolan evidence.
- Existing Open Source: Cursor is the comparison client; producer evidence stays
  imported from existing tools and local artifacts, not Portolan-owned scanners.

## Complexity Tracking

No approved violations. If scoring shows that the evidence packet is too weak,
record partial/failed/not_assessed instead of expanding scope inside this
feature.
