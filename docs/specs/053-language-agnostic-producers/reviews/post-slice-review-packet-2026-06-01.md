# Post-Slice Review Packet

Date: 2026-06-01

Spec: `docs/specs/053-language-agnostic-producers/`

Branch: `codex/053-language-agnostic-producers`

Review scope:

- `internal/contextprep/contextprep.go`
- `internal/app/app_test.go`
- `internal/producerfamily/producerfamily.go`
- `internal/producerfamily/producerfamily_test.go`
- `internal/testfixtures/language-agnostic-producers/*.jsonl`
- `schema/producer-family.schema.json`

## Decision Gate

- Simpler/Faster: extend the existing `context prepare` evidence-index path
  with recommendation, evaluation, and coverage records. Do not add a new CLI,
  MCP surface, producer runner, or language adapter.
- Blocking Edge Cases: candidate tools can be overread as verified support;
  static producer evidence can be overextended to runtime topology; partial
  producer coverage can be overextended to a whole repository or estate;
  candidate tools may require network, credentials, daemon behavior, mutation,
  or source export.
- Existing Open Source: preserve OSS/tool composition. Candidate examples are
  Syft/CycloneDX, SCIP/LSIF, Serena, Sourcebot/Zoekt, Backstage, OpenAPI,
  AsyncAPI, Structurizr, Semgrep, jscpd, and runtime observation exports.

## Implemented Behavior

- Added `internal/producerfamily` allow-listed validation for JSONL records:
  `producer-recommendation`, `producer-evaluation`, and `producer-coverage`.
- Validation rejects plain-string `candidate_tools`, undeclared fields such as
  `runtime_topology`, unsupported enum values, and accepted/narrowed
  evaluations whose `evidence_source` is `not_assessed`.
- Added `schema/producer-family.schema.json` and JSONL fixtures covering valid
  recommendation, evaluation, and coverage records plus invalid guardrail
  cases.
- `context prepare` now adds `producer-recommendation` records to
  `evidence-index.jsonl` when producer families are missing. These records stay
  `status: not_assessed`, `evidence_state: not_assessed`, and candidate tools
  use object form with `verification_state: not_assessed` and
  `support_state: candidate_only`.
- `context prepare` now adds repository-scoped `producer-coverage` records for
  dependency, symbol-index, API/catalog, and runtime-observation families.
  Manifest visibility alone does not upgrade language or producer coverage.
- `context prepare` now reads local `producer-family-records.jsonl` or
  `producer-evaluations.jsonl` from the root, root `.portolan/`, root
  `reports/`, repository root, repository `.portolan/`, or repository
  `reports/`. It validates and surfaces only evaluation records; malformed
  files become `cannot_verify` evidence-index records. It does not score, rank,
  probe, install, run, or fetch producer tools.
- `answer-contract.md` now states producer recommendations are options, not
  observed evidence, and forbids defaulting to Portolan-owned PHP/JVM/Scala
  adapters for language coverage gaps.
- `query-plan.md` now tells agents to inspect `producer-coverage` and
  `producer-recommendation` before making mixed-language coverage claims.

## Verification

verified:

- `go test -count=1 ./...`
- `go vet ./...`
- `jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json internal/testfixtures/language-agnostic-producers/*.jsonl .specify/feature.json`
- `git diff --check`
- `go run ./cmd/portolan context prepare --help`

Review request:

- Check requirements drift, evidence-state honesty, schema/contract safety,
  path/output safety, and CLI/user behavior.
- Classify findings as `critical`, `major`, or `minor`.
- Return `pass`, `pass_with_changes`, or `fail`.
- Treat absent evidence as `not_assessed`; do not infer support from candidate
  tool names.
