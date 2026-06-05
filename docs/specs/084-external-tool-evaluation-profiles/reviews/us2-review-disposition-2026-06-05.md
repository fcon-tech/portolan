# US2 Review Disposition: Candidate State Separation

Date: 2026-06-05

## Verification

- `go test -count=1 ./internal/contextprep`: passed.
- Local context smoke:
  `go run ./cmd/portolan context prepare --root . --out /tmp/portolan-084-context --force`: passed.
- `jq empty /tmp/portolan-084-context/oss-plan.json`: passed.
- `answer-contract.md` contains external profile guidance and stale-profile
  language: verified.
- `evidence-index.jsonl` does not contain CodeGraph, Understand-Anything, or
  Claude-ast-index-search profile candidates as evidence records: verified.

## Review

- Opencode GLM lane with repo-grounded sub-review, raw output
  `raw-us2-zai-glm51-2026-06-05.md`: PASS, no defects found.

## Decision

US2 accepted. Context guidance can mention profile candidates, but the
candidates do not become evidence-index facts and do not promote evidence
states.

## Not Assessed

- Real external tool output import.
- GitHub PR checks.
