# Feature Specification: CTO Demo Bar & Eval on Apache Bigtop Corpus (108)

**Status**: Implemented via PR #71; PR #72 supersedes the old 10-repo
experiment constraint with full-corpus Bigtop acceptance.

**Input**: Product proof of the CTO scenario on a real local Apache Bigtop
landscape. The original PR #71 proof used a 10-repo bounded slice; current
product acceptance must not hard-code that slice as the default.

## Requirements

- **FR-001**: Scan `~/projects/bigtop-landscape/repos` as a full local corpus
  for strict acceptance; record bundle facts and keep `manifest.json`,
  `repos.json`, and `landscape-card.json` repository counts consistent. Bounded
  `--limit-repos N` runs are allowed only as quick samples, not as CTO
  acceptance evidence.
- **FR-002**: Agent analysis pass per SKILL: agent queries bundle, writes B/C/D claims, imports via validator; ≥1 intentionally broken-ref claim demonstrates rejection.
- **FR-003**: demo-runbook CTO scenario: repos and purposes (with knowledge tier), connections, cross-repo duplicates, riskiest repo, not assessed.
- **FR-004**: Eval artifact (Lane B via bundle-query incl. repos/relationships/claims) in `reviews/`; `run-query-eval.sh` extended with CTO questions.
- **FR-005**: `docs/product-claims.md` updated: tier-labeled LLM claims accepted via importer.
