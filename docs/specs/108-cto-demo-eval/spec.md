# Feature Specification: CTO Demo Bar & Eval on bigtop-10 (108)

**Status**: Ready for implementation

**Input**: Product proof of the CTO scenario on a real 10-repo landscape.

## Requirements

- **FR-001**: Scan `~/projects/bigtop-landscape/repos` with `--limit-repos 10` (+ optional `--cross-repo-dup`); record bundle facts.
- **FR-002**: Agent analysis pass per SKILL: agent queries bundle, writes B/C/D claims, imports via validator; ≥1 intentionally broken-ref claim demonstrates rejection.
- **FR-003**: demo-runbook CTO scenario: repos and purposes (with knowledge tier), connections, cross-repo duplicates, riskiest repo, not assessed.
- **FR-004**: Eval artifact (Lane B via bundle-query incl. repos/relationships/claims) in `reviews/`; `run-query-eval.sh` extended with CTO questions.
- **FR-005**: `docs/product-claims.md` updated: tier-labeled LLM claims accepted via importer.
