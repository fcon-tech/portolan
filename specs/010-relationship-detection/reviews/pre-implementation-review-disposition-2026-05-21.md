# Pre-Implementation Review Disposition: 010 Relationship Detection

Date: 2026-05-21

## Scope

Reviewed the newly promoted `010-relationship-detection` SpecKit packet before
implementation:

- `spec.md`
- `research.md`
- `data-model.md`
- `plan.md`
- `tasks.md`
- `docs/product-backlog.md`
- `specs/007-apache-bigtop-corpus/reviews/acceptance-smoke-ledger-2026-05-20.md`

## Local Checks Before Implementation

| Check | Status | Notes |
| --- | --- | --- |
| `go test -count=1 ./...` | verified | Passed after planning-only edits. |
| `jq empty schema/*.json corpora/apache-bigtop/manifest.json` | verified | Passed after planning-only edits. |
| `git diff --check` | verified | Passed after planning-only edits. |
| SpecKit prerequisites | verified | `check-prerequisites.sh --json --require-tasks --include-tasks` found `research.md`, `data-model.md`, `quickstart.md`, and `tasks.md`. |

## Review Lanes

| Lane | Status | Disposition |
| --- | --- | --- |
| `kimi-coding/kimi-for-coding` | verified | Found major blockers around `go.mod` parser fit, missing unknown/claim coverage, claim overlap semantics, output exclusion, and negative tests. Accepted where actionable. Focused re-review returned `NO REMAINING BLOCKERS`. |
| `minimax/MiniMax-M2.7` | verified for initial review | Found FR-005 documentation, edge evidence invariant, placeholder finding format, `go.mod` block parsing, and graph edge validation gaps. Accepted where actionable. |
| `minimax/MiniMax-M2.7` focused re-review | not_assessed | Returned tool-call narration instead of a usable review result. |
| `zai/glm-5.1` | not_assessed | Returned off-repo/hallucinated findings referencing non-existent `schema/graph-schema.json`, `findings-schema.json`, and an old edge model. Not counted as evidence. |
| Local review | verified | Confirmed actual schema already supports `imports`, `depends-on`, and structured edge evidence; confirmed `finding-relationships-not-assessed` exists in current `internal/maprun/maprun.go`. |

## Accepted Fixes Before Implementation

| Finding | Disposition |
| --- | --- |
| FR-005 lacked a concrete documentation task. | Accepted and fixed. Added `docs/relationship-detection.md` task and explicit supported-type documentation requirement. |
| SC-003 lacked an explicit invariant check. | Accepted and fixed. Added edge evidence invariant test and `jq` verification task. |
| Relationship placeholder replacement was under-specified. | Accepted and fixed. Documented `finding-relationships-not-assessed` -> `finding-relationships-observed` behavior in `data-model.md`. |
| Custom `go.mod` parsing conflicted with the OSS/parser preference. | Accepted and fixed. Plan now uses `golang.org/x/mod/modfile`, with OSS fit and integration-risk rationale. |
| Claim-only and unknown relationship coverage were not explicit enough. | Accepted and fixed. Tasks now require a relationship selection fixture and scan regression tests for claim-only, metadata-visible, and unknown relationship evidence. |
| Claim-only overlap semantics were undefined. | Accepted and fixed. Tasks now require an overlap regression where claim-only evidence is not overwritten by observed evidence. |
| `go.mod` block-form parsing was ambiguous. | Accepted and fixed. Tasks now require single-line and block-form `require` coverage through `modfile`. |
| Graph edge structure validation was only `jq empty`. | Accepted and fixed. Verification now includes relationship-edge field checks. |

## Rejected Or Not Counted

| Finding | Disposition |
| --- | --- |
| Existing graph schema lacks `imports` / `depends-on`. | Rejected with local evidence. `schema/evidence-graph.schema.json` already includes both edge kinds. |
| Existing graph edge model lacks structured evidence. | Rejected with local evidence. `internal/graph/graph.go` uses `Evidence` with `state` and `source`; the schema matches that shape. |
| Duplication/configuration/technical-debt placeholder findings are impossible because no findings schema supports them. | Rejected with local evidence. `internal/maprun.Finding` supports `relationships`, `duplication`, `configuration`, and `technical-debt`; there is no `schema/findings-schema.json` in this repo. |
| Dynamic output directory exclusion beyond `.portolan`. | Rejected for this slice. Current map validation only permits output inside the mapped root when it is under `.portolan`; `.portolan` pruning is the relevant active safety boundary. |

## Implementation Go/No-Go

Go for implementation.

Constraints:

- Keep `cmd/portolan` thin.
- Put parser behavior in `internal/relationships`.
- Use `golang.org/x/mod/modfile` only for local `go.mod` bytes.
- Do not add network access, module resolution, daemon behavior, credentials, or target mutation.
- Preserve `claim-only`, `unknown`, `cannot_verify`, and `not_assessed` semantics.
