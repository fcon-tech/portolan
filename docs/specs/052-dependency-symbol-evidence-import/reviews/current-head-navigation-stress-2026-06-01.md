# Current-Head Navigation Stress

Date: 2026-06-01

Spec: `docs/specs/052-dependency-symbol-evidence-import/`

PR: https://github.com/fcon-tech/portolan/pull/29

Initial current-head run:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-171336`

After-navigation-fix run:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-172124`

Cursor model: `composer-2.5`

## Purpose

Refresh the Cursor + Composer 2.5 navigation-harness stress evidence on the
current PR head after the bounded graph/query corrections. The goal was not UX
polish and not native JVM/PHP/Scala parsing; it was to verify whether agents
can use Portolan as a local-first navigation substrate without overclaiming.

## Clean-Start Boundary

- Root `/home/fall_out_bug/projects/bigtop-landscape/run` was removed before
  each lane and remained absent after the lanes.
- Each lane used a new stress directory.
- Syft was run with source-relative exclusions:
  `--exclude './.portolan/**' --exclude './run/**'`.
- Context preparation was rerun after Syft wrote
  `context/tool-outputs/syft.cyclonedx.json`.
- Cursor prompts forbade older stress runs, no-Portolan baselines,
  consolidated reports, previous Cursor outputs, and root `run/`.
- Contamination checks found no references to older run IDs or forbidden
  artifacts in the final Cursor output.

## Initial Current-Head Result

Output:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-171336/cursor-composer25-current-head-output.md`

Composer verdict:

- Portolan was narrowly but materially useful as a local-first navigation
  harness.
- The run was useful for scope, configuration surfaces, evidence-bounded gaps,
  and bounded graph drill-down.
- The run was not sufficient for primary JVM/Scala/PHP coupling, symbol
  navigation, or runtime topology without local producer artifacts.

Accepted navigation corrections:

- Make graph-index/map output explicitly warn that large graph size is not
  semantic coverage when `unknown` node kinds dominate.
- Clarify that `query gaps` returns weak map coverage and finding records,
  while `context/gaps.jsonl` is the context-preparation producer-gap registry.
- Direct agents from truncated graph-index samples to narrower
  `graph slice --repo`, `--edge-kind`, or `--finding-kind` calls with explicit
  limits before precise claims.

Not accepted as 052 scope:

- Implement native JVM/PHP/Scala relationship scanners.
- Implement runtime/service topology.
- Implement symbol-index/API/catalog/duplication producers inside Portolan.

## Corrections Applied

- `graph-index.json` rules now include:
  - the count of `unknown` node-kind records;
  - a warning when unknown nodes are the graph majority;
  - guidance to rerun `graph slice` with `--repo`, narrower kind filters, and
    explicit `--limit` for truncated samples.
- `map.md` machine artifact summary now states that `unknown` node kinds are
  unclassified inventory and not semantic architecture coverage.
- `query gaps` JSON now includes a warning that it returns weak map
  coverage/finding records, while `context/gaps.jsonl` contains context
  producer gaps.
- The 052 quickstart records the same query and graph-index interpretation
  rules.

## After-Fix Verification

Stress run:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-172124`

Verified metrics:

- coverage records: 19
- repositories: 18
- graph nodes: 190,748
- graph edges: 200,203
- findings: 274
- node kinds:
  - configuration: 23,872
  - package: 19,044
  - repository: 18
  - tool-output-sbom: 1
  - unknown: 147,813
- `query-gaps.json`:
  - records: 20
  - total_records: 113
  - truncated_records: 93
  - warning present for map weak records vs `context/gaps.jsonl`
- `graph-index.json` rules include the unknown-majority warning and narrower
  slice guidance.
- `map.md` includes the unknown-node semantic-coverage warning.

Cursor output:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-172124/cursor-composer25-after-navigation-fix-output.md`

Composer verdict:

- Portolan is narrowly useful as a first-pass local navigation harness for the
  18-repo Bigtop checkout.
- The after-fix artifacts make graph-size, query-gap, truncation, and producer
  evidence boundaries clear enough for a first-pass agent.
- PR #29 is reviewable as a navigation-harness slice when scoped to bounded
  local evidence plus explicit gaps.
- PR #29 is not a Bigtop architecture map and does not provide service
  topology, native cross-language dependency semantics, or symbol-level
  coupling without additional local producer outputs.

## Verification Commands

verified:

- `go test ./internal/query ./internal/maprun ./internal/app`
- current-head clean stress run `20260601-171336`
- after-navigation-fix clean stress run `20260601-172124`
- Cursor Agent + Composer 2.5 on `20260601-171336`
- Cursor Agent + Composer 2.5 on `20260601-172124`
- root Bigtop `run/` absent after both lanes
- `go test ./...`
- `go vet ./...`
- `jq empty .specify/feature.json schema/*.json internal/testfixtures/oss-adapter-contract/*.json`
- `git diff --check`

## Remaining Not Assessed / Next Evidence

- Real symbol/reference producer output such as SCIP, LSIF, Serena, Sourcebot,
  or Zoekt.
- Curated corpus/landscape manifest to reduce external-completeness
  `unknown`.
- Declared service/API/catalog/model producers such as OpenAPI, AsyncAPI,
  Backstage, or Structurizr.
- Duplication producer output such as jscpd.
- Runtime-visible topology.
- Cursor UI behavior outside headless Cursor Agent.
- GitHub review approval and merge approval.

These are next evidence families for later slices, not required corrections for
052 as a navigation-harness slice.
