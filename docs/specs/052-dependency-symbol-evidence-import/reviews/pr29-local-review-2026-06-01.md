# PR 29 Local Review

Date: 2026-06-01

PR: https://github.com/fcon-tech/portolan/pull/29

Head: `f6418e195a1347c1ce83a3c501223e568d948719`

Status: local repo-grounded review complete; GitHub checks pending at review
start

## Findings

No critical or major issues found in local inspection.

## Evidence Semantics

- Dependency/SBOM selected outputs are imported as `metadata-visible` producer
  evidence. Missing dependency refs become `cannot_verify`, not inferred
  success.
- Symbol-index selected outputs create document/symbol identity and `owns`
  relationships only. Summaries and reasons explicitly state this is not a
  complete call graph.
- Missing dependency/SBOM and symbol-index producer families produce explicit
  `not_assessed` relationship findings.
- Build/deploy relationship candidates in `context prepare` are
  `source-visible` navigation hints with machine-readable `count`; semantic
  parsing remains `not_assessed`.
- Generated answer-contract text forbids treating producer evidence as native
  PHP/JVM/Scala semantics or runtime topology.

## Safety And Boundaries

- No new network calls, daemons, credentials, or target mutation.
- Syft producer command remains approval-gated in `oss-plan.json`.
- Syft command excludes `./.portolan/**` and `./run/**` after stress evidence
  showed root scans could otherwise include prior run artifacts.
- Selected producer output reads are bounded by size and count limits.
- Output writes stay under the existing map/context output paths.

## Tests And Verification

Verified before PR:

- `go test -count=1 ./...`
- `go vet ./...`
- `jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json .specify/feature.json`
- `git diff --check`
- `go run ./cmd/portolan context prepare --help`
- `go run ./cmd/portolan map --help`

## Not Assessed

- GitHub checks until PR jobs complete.
- GitHub review approval.
- Merge approval.
- Real SCIP/LSIF/Serena/Sourcebot/Zoekt output.
- Runtime-visible topology.
- API/catalog/model producer outputs.

## Recommendation

Proceed with PR-level independent review lanes. If those lanes and GitHub
checks pass, PR #29 can move from draft to ready-for-review. It is not
ready-to-merge without review approval and explicit merge approval.
