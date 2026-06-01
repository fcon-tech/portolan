# PR 29 Readiness Closeout

Date: 2026-06-01

PR: https://github.com/fcon-tech/portolan/pull/29

Branch: `codex/052-dependency-symbol-evidence-import`

Base: `main`

Navigation implementation and stress head verified before this status-only
closeout refresh:
`8dc34627c506b4b9ec3ac386620ae07205974f3d`

## Implementation

- Spec 052 implementation is complete against `tasks.md`.
- Selected `tool_outputs[].kind` accepts `symbol-index`.
- Selected dependency/SBOM outputs create metadata-visible package and
  `depends-on` evidence.
- Selected symbol-index outputs create bounded document/symbol metadata and
  `owns` relationships only.
- Missing dependency/SBOM and symbol-index producer families stay
  `not_assessed`.
- Malformed or oversized selected producer outputs become `cannot_verify`.
- `context prepare` emits bounded source-visible build/deploy
  `relationship-candidate` records with semantic parsing still
  `not_assessed`.
- Generated answer-contract/query guidance forbids inferring native
  PHP/JVM/Scala semantics or runtime topology from producer evidence alone.

## Local Verification

verified:

- `go test -count=1 ./internal/maprun ./internal/selection ./internal/app`
- `go test ./internal/graphslice ./internal/query ./internal/maprun ./internal/app`
- `go test ./internal/query ./internal/maprun ./internal/app`
- `go test -count=1 ./...`
- `go test ./...`
- `go vet ./...`
- `jq empty schema/*.json internal/testfixtures/oss-adapter-contract/*.json .specify/feature.json`
- `git diff --check`
- `git diff --cached --check`
- `go run ./cmd/portolan context prepare --help`
- `go run ./cmd/portolan map --help`

## Stress Evidence

verified:

- Earlier clean stress run:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-154329`
- Post-readiness clean stress run:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-163735`
- Current-head clean stress run:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-171336`
- After-navigation-fix clean stress run:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-172124`
- Cursor + Composer 2.5 used only the fresh run named in each lane.
- Syft/CycloneDX producer evidence used source-relative exclusions for
  `./.portolan/**` and `./run/**`.
- Final current-head map contained 190,748 nodes, 200,203 edges, and 274
  findings.
- Final finding states preserved `source-visible`, `metadata-visible`,
  `not_assessed`, `unknown`, and `cannot_verify`.
- `graph-index.json` and `map.md` now warn that 147,813 `unknown` node-kind
  records are unclassified inventory, not semantic architecture coverage.
- `query-gaps.json` now distinguishes weak map records from
  context-preparation producer gaps in `context/gaps.jsonl`.
- Cursor + Composer 2.5 verdict on `20260601-172124`: PR #29 is reviewable as
  a navigation-harness slice when scoped to bounded local evidence plus
  explicit gaps; it is not a Bigtop architecture oracle.

not_assessed:

- Real local symbol-index output for Bigtop Java/Scala.
- API/catalog/model/runtime producer outputs beyond existing context surfaces.
- Complete runtime topology.
- Cursor UI behavior outside headless Cursor Agent.

## Review Evidence

verified:

- Local repo-grounded PR review:
  `pr29-local-review-2026-06-01.md`
- PR review packet:
  `pr29-review-packet-2026-06-01.md`
- Kimi lane: `kimi-coding/kimi-for-coding`, usable `pass_with_changes`.
- GLM lane: `zai/glm-5.1`, usable `pass_with_changes`.
- MiMo lane: `openrouter/xiaomi/mimo-v2.5-pro`, usable
  `pass_with_changes`.
- Review disposition:
  `pr29-review-disposition-2026-06-01.md`
- Accepted review findings were fixed or narrowed with local evidence before
  this closeout.

not_assessed:

- GitHub review approval.

## Requirements Drift

verified:

- `docs/product-backlog.md`, `spec.md`, `plan.md`, `tasks.md`, review
  dispositions, schema changes, and implementation files agree that this slice
  imports standard local dependency and symbol producer outputs rather than
  adding per-language scanners.
- Current-head navigation stress is recorded in
  `current-head-navigation-stress-2026-06-01.md`.
- `docs/specs/051-portolan-quality-boundary/tasks.md` intentionally records
  that UX/report polish depends on this evidence-import slice.

not_assessed:

- Whether a later UX/report slice should be 053 or reordered after another
  evidence-producing slice.

## Product Vision Drift

verified:

- Local-first/read-only boundary preserved.
- No network access, daemon behavior, credentials, or target repository
  mutation added.
- OSS/tool output composition posture preserved.
- Evidence states remain explicit; unknown and cannot-verify states are not
  collapsed into success.
- Portolan remains harness-independent; Cursor + Composer 2.5 is only the
  current stress client.

## PR State

verified before this status-only closeout refresh:

- PR #29 open.
- Draft: false.
- Merge state: `CLEAN`.
- Head:
  `8dc34627c506b4b9ec3ac386620ae07205974f3d`.
- Review decision: empty.
- Reviews: none.

required after this status-only closeout refresh:

- Push the closeout/status update.
- Refresh `gh pr view 29` and `gh pr checks 29` on the new head.
- Keep PR #29 non-draft only if refreshed checks pass and merge state remains
  clean or otherwise non-blocking for review.

## GitHub Checks

verified on `8dc34627c506b4b9ec3ac386620ae07205974f3d`:

- CI / Baseline: pass
- CodeQL / Analyze (actions): pass
- CodeQL / Analyze (go): pass
- CodeQL / Analyze (python): pass
- aggregate CodeQL status: pass

## Merge Readiness

- Ready-for-review PR: yes.
- Ready-to-merge PR: no.
- GitHub review approval: `not_assessed`.
- Merge approval: `not_assessed`.

## Stop Reason

PR #29 is ready for review as a navigation-harness slice. Stop before merge
because GitHub review approval and merge approval are `not_assessed`.
