# Pre-Implementation Analyze: Spec 054

Date: 2026-06-01
Branch: `codex/054-bigtop-architecture-proof`

## Scope

Cross-artifact check across:

- `spec.md`
- `plan.md`
- `research.md`
- `data-model.md`
- `contracts/producer-run-record.md`
- `quickstart.md`
- `tasks.md`
- `.specify/memory/constitution.md`

## Decision Gate

- Simpler/Faster: implement a Go validator and context surfacing for selected
  external producer-run JSONL records before adding a new public JSON Schema or
  parser for every producer format.
- Blocking Edge Cases: runtime-visible state must not be allowed for static
  producer families; verified records must point to existing outputs; partial
  coverage must remain scoped; Cursor stress cannot verify broad architecture
  claims without local evidence.
- Existing Open Source: use existing producer tools and output formats
  externally. Do not add producer execution wrappers or new dependencies in
  Portolan.

## Findings

| ID | Category | Severity | Finding | Disposition |
| --- | --- | --- | --- | --- |
| A1 | Coverage | low | FR-008 privacy/redaction is represented in tasks via producer-run privacy review and PR readiness, but not as a dedicated implementation task. | Accepted as sufficient for this slice because no public excerpt is produced; revisit if Cursor/output excerpts become public artifacts. |
| A2 | Contract | medium | `tasks.md` leaves schema vs Go validator open in T006. | Resolved before implementation: use Go validator tests first; defer JSON Schema until the producer-run contract stabilizes or an external consumer requires it. |
| A3 | Scope | low | 055/056 depend on 054, but their draft specs exist in the same branch. | Accepted. They are planning slices only; active implementation remains 054 via `.specify/feature.json`. |
| A4 | Evidence semantics | high | Runtime topology could be overclaimed if deployment/model outputs are surfaced without explicit limitation text. | Covered by T015, T016, T018, T020, and quickstart validation expectations. Must be rechecked after implementation. |

## Coverage Summary

| Requirement | Covered By Tasks | Notes |
| --- | --- | --- |
| FR-001 acquire/disposition non-Syft outputs | T002, T008-T014 | Uses initial Bigtop outputs plus fixtures. |
| FR-002 record command/source/path/freshness/state | T004-T014 | Core US1 scope. |
| FR-003 surface outputs through context/map contracts | T011, T012, T017, T018, T020 | US1 surfaces first; US2 broadens summary. |
| FR-004 no new scanner/wrapper/network/daemon | T019, T025-T026 | Must also be checked by diff review. |
| FR-005 scoped coverage | T004-T018 | Producer coverage summary planned in US2. |
| FR-006 weak states for missing/unsafe outputs | T009, T010, T013, T016 | Runtime and symbol gaps preserved. |
| FR-007 Cursor stress distinguishes navigation from proof | T021-T024 | US3 scope. |
| FR-008 privacy-safe excerpts | T002, T003, T023, T026 | No public artifact in US1/US2; review required before PR. |
| SC-001 two producer families dispositioned | T014, T020 | Initial reconstruction already has Compose/Helm/protoc evidence. |
| SC-002 fresh context/map bundle includes outputs | T014, T020 | Requires implementation. |
| SC-003 Cursor reviewed answer | T021-T023 | Requires US3. |
| SC-004 answer quality comparison | T023 | Requires US3. |
| SC-005 no Portolan-owned wrapper | T019, T026 | Requires diff/review evidence. |

## Constitution Alignment

- Local-first/read-only: aligned. Planned implementation imports selected
  metadata; it does not execute producer tools.
- Evidence-state honesty: aligned, with high-risk area A4 called out.
- Complement, do not replace: aligned. Producer tools stay external.
- SpecKit before implementation: aligned. Active spec now has spec, plan,
  research, data model, contracts, quickstart, tasks, and analyze.
- Test-first for behavior: aligned. Tasks require focused tests before behavior
  changes.

## Implementation Gate

Implementation may proceed with US1 only. Do not implement US2/US3 until US1
producer-run metadata is locally verified and the Bigtop context smoke records
the result.
