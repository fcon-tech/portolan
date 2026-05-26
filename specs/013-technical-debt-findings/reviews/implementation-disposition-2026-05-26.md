# Review Disposition: Technical Debt Findings

Date: 2026-05-26

## Scope

- Spec: `specs/013-technical-debt-findings/`
- Implementation: rule-light technical-debt candidate derivation from observed
  relationship, duplication, configuration, coverage, and unresolved finding
  evidence in `portolan map`.
- Explicit non-scope: modernization scoring, rewrite planning, release
  readiness, merge gating, semantic config policy, and external scanner
  execution.

## Decision Gate

- Simpler/Faster: extend existing `deriveTechnicalDebtFindings`; do not add a
  rule DSL, policy engine, or new dependency.
- Blocking Edge Cases: technical-debt wording can overclaim. Findings remain
  candidates and preserve `unknown`, `cannot_verify`, and `not_assessed`
  evidence states.
- Existing Open Source: Semgrep, jscpd, SBOM producers, and config scanners
  remain upstream evidence sources. Portolan derives candidates from local
  outputs rather than replacing those tools.

## Review Lanes

- `zai/glm-5.1`: verified. Returned minor findings.
- `minimax/MiniMax-M2.7`: not_assessed. Provider returned `404 404 page not
  found`.
- `kimi-coding/kimi-for-coding`: not_assessed. Lane produced no output and was
  terminated after hanging.

## Findings Disposition

| Finding | Source | Disposition |
| --- | --- | --- |
| Unresolved finding signals could be hidden behind the `technical-debt-not-assessed` fallback when all signals were unresolved. | Zai | Accepted/fixed. `finding-technical-debt-unresolved-findings` now emits whenever unresolved map findings exist. |
| No dedicated test for the unresolved-only fallback edge. | Zai | Accepted/fixed by updating `TestRunMapUnsupportedDetectorFindingsRemainNotAssessed` to require the unresolved technical-debt finding. |

## Verification

- verified: `go test -count=1 ./internal/app -run 'TestRunMapDerivesConcreteTechnicalDebtFindings|TestRunMapDerivesCoverageBackedUnresolvedDebtFinding|TestRunMapUnsupportedDetectorFindingsRemainNotAssessed'`
- verified: `go test -count=1 ./...`
- verified: `jq empty schema/*.json`
- verified: `git diff --check`
- verified: `go run ./cmd/portolan map --root testdata/technical-debt-findings/repo --out /tmp/portolan-013-debt --force`
- verified: JSONL parse over `/tmp/portolan-013-debt/findings.jsonl`
- verified: `/tmp/portolan-013-debt/summary.json` reports four
  technical-debt findings.
- verified: verdict-language check over technical-debt summaries for
  `ready`, `readiness`, `pass`, `fail`, `rewrite`, and `moderni`.
- verified: `scripts/bootstrap-portolan --help`

## Status

- Implementation: local implementation complete for rule-light technical-debt
  candidates.
- Local verification: passed.
- Review evidence: Zai lane dispositioned; Kimi and MiniMax degraded as
  `not_assessed`.
- PR state: not_assessed.
- GitHub checks: not_assessed.
- Merge readiness: not_assessed.
- Stop reason: local slice ready to commit; PR/readiness/merge surfaces are out
  of scope for this local commit.
