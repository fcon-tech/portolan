# Bounded Slice Follow-Up

Date: 2026-06-01

Spec: `docs/specs/052-dependency-symbol-evidence-import/`

PR: https://github.com/fcon-tech/portolan/pull/29

Stress run: `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-163735`

## Trigger

Cursor + Composer 2.5 was given only bounded follow-up artifacts from the
post-readiness stress run:

- `followup/relationships-slice.json`
- `followup/query-relationships.json`
- `followup/query-gaps.json`
- `followup/depends-on-slice.json`
- `followup/cursor-composer25-bounded-slice-output.md`

The lane found the bounded workflow useful for evidence posture and gap
triage, but weak for concrete topology drill-down.

## Accepted Findings

- `graph slice --finding-kind relationships` returned matching findings only,
  with zero nodes and edges. That is correct behavior, but the slice did not
  explain that finding-kind slices are finding samples rather than topology
  samples.
- `graph slice --edge-kind depends-on --limit 50` selected the first sorted
  matching edges. In Bigtop this biased the sample toward the first dependency
  family and made the bounded slice too easy to overread.
- `query findings --kind relationships --limit 20` exposed truncation but not
  the full matching record count.
- The relationship `not_assessed` summary said no supported relationship
  inputs were observed, which was ambiguous in mixed-language landscapes. The
  limitation is specifically native Go import and `go.mod` relationship
  detection unless local producer evidence supplies more.

## Corrections

- Bounded edge samples are now spread across the sorted matching edge set.
- Slice rules now state that finding-kind slices contain matching findings and
  that truncated samples must not be extrapolated.
- Query JSON now includes `total_records`.
- `finding-relationships-not-assessed` now names the Go/go.mod scope and keeps
  primary-language coupling `not_assessed` unless producer evidence is present.

## Verification

verified:

- `go test ./internal/graphslice ./internal/query ./internal/maprun ./internal/app`
- `go test ./...`
- `go vet ./...`
- `jq empty .specify/feature.json schema/*.json internal/testfixtures/oss-adapter-contract/*.json`
- `git diff --check`
- `go run ./cmd/portolan graph slice --bundle "$RUN_DIR/map" --edge-kind depends-on --out "$RUN_DIR/followup/depends-on-slice-after-fix.json" --limit 50 --force`
- `go run ./cmd/portolan query findings --bundle "$RUN_DIR/map" --kind relationships --limit 20 > "$RUN_DIR/followup/query-relationships-after-fix.json"`

after-fix graph-slice smoke:

- nodes: 50
- edges: 50
- findings: 0
- truncated nodes: 10,744
- truncated edges: 32,815
- sampled `depends-on` edges now span Maven, NPM, and PyPI producer records
  instead of staying in the first sorted family.
- rules include: bounded slice warning, graph-index guidance, evidence-state
  preservation, no-extrapolation warning, and narrower-criteria guidance.

after-fix query smoke:

- records: 20
- total_records: 99
- truncated: true
- truncated_records: 79

## Not Assessed

- Cursor UI behavior outside headless Cursor Agent.
- Whether the bounded follow-up prompt should become a first-class CLI command.
- 053 runtime/symbol/API/catalog producer implementation. This follow-up only
  tightens 052 bounded navigation and evidence wording.
- Merge approval for PR #29.

## PR Readiness Impact

The correction keeps PR #29 in the same product scope: local-first, read-only
evidence import and bounded navigation for agents. It improves the
ready-for-review surface but does not make the PR ready-to-merge. Merge
approval remains `not_assessed`.
