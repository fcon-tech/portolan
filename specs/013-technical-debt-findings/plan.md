# Implementation Plan: Technical Debt Findings

## Decision Gate

- Simpler/Faster: extend the existing `deriveTechnicalDebtFindings` layer with
  transparent, rule-light aggregation. Do not add a rule DSL, scoring engine,
  modernization model, or external scanner execution.
- Blocking Edge Cases: technical-debt language can overclaim. Findings must be
  candidates backed by observed or unresolved local evidence, not readiness,
  merge, modernization, or rewrite verdicts.
- Existing Open Source: Semgrep, jscpd, SBOM producers, and config scanners
  remain upstream evidence sources. Portolan derives debt candidates from their
  local outputs and native findings instead of replacing them.

## Technical Approach

- Treat observed relationship, duplication, and configuration findings as
  candidate debt signals.
- Treat `unknown`, `cannot_verify`, and `not_assessed` findings or coverage
  records as unresolved-evidence debt signals.
- Add relationship-backed technical-debt follow-up finding.
- Split unresolved evidence into coverage-backed and findings-backed debt
  candidates so agents can distinguish missing inventory from unsupported
  analysis surfaces.
- Remove `technical-debt-findings` from skipped surfaces and expose
  `technical-debt-findings` as an enabled map surface.
- Keep summaries neutral and free of readiness/pass/fail/rewrite language.

## Verification

Run:

```bash
go test ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan map --root testdata/technical-debt-findings/repo --out /tmp/portolan-013-debt --force
while IFS= read -r line; do printf '%s\n' "$line" | jq empty; done </tmp/portolan-013-debt/findings.jsonl
rg -i 'ready|readiness|pass|fail|rewrite|moderni' /tmp/portolan-013-debt/findings.jsonl && exit 1 || true
```
