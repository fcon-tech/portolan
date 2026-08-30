## Why

The trust deficit on AI-written code is measured: in the Stack Overflow
Developer Survey 2025, 66% of developers call AI output "almost right" and
46% say they distrust its accuracy (`measured`; survey.stackoverflow.co/2025/ai).
Portolan already holds the answer — anchors are mandatory on every entry,
trust labels are closed-vocabulary, the ship's log receipts every command,
and staleness is tracked per vessel — but none of it is *queryable* as one
property, and the product's public claims never state it. Competitor
inspection found no surveyed tool that markets verified anchors, trust
labels, receipts, and staleness (`charted`; argument from absence — the
trials task below must pass before any differentiation claim ships).

This is the contract, not a feature: the trust vocabulary is postulate 2 of
docs/MANIFEST.md, and the cost is small because everything promoted already
exists in the code.

## What Changes

- **`trust.report` tool** (the thirteenth served tool): one call returns the
  province's verification summary — trust-label distribution, per-kind
  counts, staleness (vessels pending correction and their entry counts),
  a live re-sounding of chart anchors through the `sound.anchor` machinery
  (deterministic sample above a fixed cap) reporting confirmed/refuted with
  the refuted list, and a ship's-log tail summary. Read-only toward the
  source and the Chart; deterministic on an unchanged province.
- **Skill mandate**: Sailing Directions gain a verification summary section
  produced by calling `trust.report`; the tool desk lists the tool.
- **Positioning with receipts**: README and `docs/landing.html` state the
  verification spine, and every differentiation claim anchors to a receipt
  committed in this repository: `docs/demo/trust-report.md` — the tool's
  output over Portolan's own Chart (this repo is a charted province),
  reproducible by a committed command — and `docs/verification-trials.md` —
  the competitor trials page (Serena, Sourcegraph MCP), each finding labeled
  and anchored to the inspected source with a trial date.
- **Manifest alignment**: the tool table grows to thirteen; the glossary
  gains the verification summary.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `tools`: adds the `trust.report` requirement (ADDED delta) — the aggregate
  verification report with live re-sounding, read-only, deterministic.
- `expedition`: Sailing Directions are extended (MODIFIED delta) to include
  the verification summary from `trust.report`.

## Impact

- Code: `core/src/tools/trust-report.ts` (new; reuses `readChart`,
  `refreshStaleness`, and the `sound.anchor` verification path),
  `core/src/server/registry.ts` (one tool spec), a small deterministic
  renderer for the committed receipt (`docs/demo/trust-report.md`).
- Docs: README, `docs/landing.html`, `docs/MANIFEST.md` (tool table,
  glossary), new `docs/verification-trials.md`, `skill/SKILL.md`.
- Non-goals respected: no filters on `chart.read` (deferred to the staleness
  lifecycle change), no adoption analytics (separate invocation-contract
  change), no HTML dashboard (passive surfaces are contraindicated).
