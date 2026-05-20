# Pre-Implementation Review Disposition

Date: 2026-05-20
Spec: `specs/005-black-box-profile/`
Mode: REVIEW before IMPLEMENT

## Status Reconstruction

- Backlog row: `docs/product-backlog.md` marks P1-005 as `Ready for implementation`.
- Spec status: `spec.md` marks the feature as `Ready for implementation`.
- Task ledger: `tasks.md` exists and all tasks T001-T029 are open.
- Review artifacts: no prior review artifacts existed under this spec before this file.
- Implementation history: recent git history prepares this spec but does not implement it.

Result: surfaces agree that P1-005 is the next implementable spec. Work may start
after this review, with status kept explicit through task and review ledgers.

## Decision Gate

- Simpler/Faster: extend existing `scan --selection --out` and packet rendering
  rather than adding a new command or scanner workflow.
- Blocking Edge Cases: black-box evidence is easy to overstate; malformed,
  missing, claim-only, and source-unavailable cases must remain visible as
  `cannot_verify`, `unknown`, or `claim-only`, and no black-box-derived fact may
  use `source-visible`.
- Existing Open Source: common OSS and ecosystem sources such as Backstage
  catalogs and OpenTelemetry exports are adapter candidates, but this slice
  should normalize local file exports first and defer platform-specific adapters
  to importer review.

## Findings

### major: Selection schema alignment must be part of implementation

The spec introduces `black_boxes[]`, but the current selection loader rejects
unknown fields and the JSON schema only models existing selection fields.
Implementation must update both parser validation and `schema/selection.schema.json`
or CLI validation and docs will drift.

Disposition: accepted, to fix in implementation.

### major: Packet wording must avoid source-analysis implication

The current packet has source, claim, unknown, and cannot-verify sections, but
no explicit grouping for metadata/runtime black-box facts. Black-box facts can be
rendered in relationships today, but node sections need metadata/runtime wording
so packet readers do not infer source inspection.

Disposition: accepted, to fix in implementation.

### minor: Runtime endpoints may include URLs as observed values, not input paths

Selection input paths must reject URL-like strings. Runtime observation payloads
may contain endpoint URLs as evidence values and attribution only; the scanner
must not fetch or validate them over the network.

Disposition: accepted, to enforce by implementation shape and tests.

## Review Evidence

- Local repo-grounded review: completed from `AGENTS.md`, constitution, backlog,
  spec, plan, data model, contract, quickstart, tasks, and existing app/scan/
  packet/selection code.
- `kimi-coding/kimi-for-coding`: not_assessed before first implementation slice.
- `minimax/MiniMax-M2.7`: not_assessed before first implementation slice.
- `zai/glm-5.1`: not_assessed before first implementation slice.

The subscription lanes remain required after the implementation slice unless
they are unavailable, empty, malformed, stale, or off-task.
