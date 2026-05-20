# Status Reconstruction: 007 Apache Bigtop Corpus

Date: 2026-05-20

## Surfaces Checked

| Surface | Status | Evidence |
| --- | --- | --- |
| Backlog row | verified | `docs/product-backlog.md` lists P1-007 as `Ready for acceptance-smoke planning`. |
| Spec status | verified | `specs/007-apache-bigtop-corpus/spec.md` says `Ready for acceptance-smoke planning`. |
| Plan | verified | `specs/007-apache-bigtop-corpus/plan.md` scopes 007 as documentation and data, with no scanner implementation. |
| Task ledger | verified | T001-T013 are complete; T014-T018 are open Phase 5 smoke tasks. |
| Review artifacts | verified | No existing `reviews/` files were present before this reconstruction. |
| Implementation state | verified | `portolan map` is not implemented in `internal/app/app.go`; current CLI supports scan, packet, import, and diff. |

## Decision

The nearest ready work is Phase 5 of `specs/007-apache-bigtop-corpus/`, not
`specs/009-map-command-artifacts/`. Spec 009 is prepared but explicitly gated
by the Bigtop smoke.

## Consequence

Proceed with a local-first Bigtop smoke fixture, runbook, and gap ledger. Do
not implement `portolan map` or detector behavior in this slice.
