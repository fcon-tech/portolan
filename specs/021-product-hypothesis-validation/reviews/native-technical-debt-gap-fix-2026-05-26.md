# Product Hypothesis Ledger: Native Technical-Debt Gap Fix

Date: 2026-05-26

## Hypothesis

Cursor-plus-Portolan becomes more useful for CTO-level repository questions
when `portolan map` turns observed and unresolved evidence into candidate
technical-debt follow-ups without making readiness or modernization verdicts.

## Change

- Spec `013-technical-debt-findings` now derives rule-light technical-debt
  candidates from relationship, duplication, configuration, coverage, and
  unresolved finding evidence.
- `portolan map` marks `technical-debt-findings` as an enabled surface.
- Debt findings remain candidate follow-ups; they do not prescribe rewrites,
  release gates, or modernization status.

## Evidence

- verified: `go test -count=1 ./internal/app -run 'TestRunMapDerivesConcreteTechnicalDebtFindings|TestRunMapDerivesCoverageBackedUnresolvedDebtFinding|TestRunMapUnsupportedDetectorFindingsRemainNotAssessed'`
- verified: `go run ./cmd/portolan map --root testdata/technical-debt-findings/repo --out /tmp/portolan-013-debt --force`
- verified: JSONL parse over `/tmp/portolan-013-debt/findings.jsonl`
- verified: verdict-language check over `/tmp/portolan-013-debt/findings.jsonl`

## Updated Gap State

| Gap | Before | After |
| --- | --- | --- |
| `GAP-DUP-CFG-DEBT` | native debt detector absent | rule-light debt candidate derivation partially addressed |
| relationship-backed debt | absent | candidate follow-up from observed relationship findings |
| duplication/config-backed debt | count-based but narrow | retained and aligned with no-verdict language |
| unresolved evidence debt | coverage-only and generic | split into coverage-backed and findings-backed unresolved evidence candidates |

## Product Interpretation

This improves the Cursor augmentation story by making map output more directly
answerable for CTO triage. Cursor should answer:

- debt candidates: from `technical-debt` findings in `findings.jsonl`;
- unresolved evidence: from `technical-debt` unknown findings plus
  `coverage.json`;
- modernization, rewrite, release, or readiness status: not assessed by
  Portolan.
