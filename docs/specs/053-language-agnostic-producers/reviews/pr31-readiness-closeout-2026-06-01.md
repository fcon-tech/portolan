# PR 31 Readiness Closeout

Date: 2026-06-01

PR: https://github.com/fcon-tech/portolan/pull/31

Branch: `codex/post-merge-navigation-guidance`

## Scope

Post-merge guidance and post-map navigation correction after PR #30 and
Cursor + Composer 2.5 Bigtop stress:

- clarify generated `agent-brief.md`, `answer-contract.md`, and
  `query-plan.md` around Go/go.mod-only native relationship extraction;
- keep missing producer evaluations as `not_assessed` without synthetic
  evaluation records;
- separate `context/gaps.jsonl` producer acquisition gaps from `portolan query
  gaps` map-bundle weak records;
- add observed CycloneDX component/dependency counts and SBOM fan-out guidance
  to the agent brief;
- add `summary.json.navigation` and `graph-index.json.navigation` so agents can
  use bounded post-map navigation before opening `graph.json`;
- expose high-degree hubs, unknown-node surface buckets, and SBOM package
  fan-out warnings as machine-readable navigation guardrails;
- record stress output, model review, and review disposition under spec 053.

## Verification

Local verification:

- `go test -count=1 ./internal/app ./internal/contextprep ./internal/query`:
  verified
- `go test -count=1 ./...`: verified
- `go vet ./...`: verified
- `jq empty schema/*.json`: verified
- `git diff --check`: verified
- `go run ./cmd/portolan context prepare --help`: verified
- `go run ./cmd/portolan query --help`: verified
- `go run ./cmd/portolan map --selection internal/testfixtures/landscape-map/selection.json --out /tmp/portolan-nav-smoke-*/run --force`: verified
- `jq -e '.navigation.read_order and .navigation.unknown_nodes' /tmp/portolan-nav-smoke-*/run/summary.json`: verified
- `jq -e '.navigation.next_drill_down and .navigation.high_degree_hubs' /tmp/portolan-nav-smoke-*/run/graph-index.json`: verified

Stress verification:

- Cursor + Composer 2.5 corrected run `20260601-191803`: verified
- Cursor + Composer 2.5 navigation-index run `20260601-194753`: verified
- Root `/home/fall_out_bug/projects/bigtop-landscape/run`: absent after the
  corrected runs
- Syft/CycloneDX output preserved in refreshed context:
  18,769 components and 5,357 dependency records
- Final Cursor verdict: conditional pass for the navigation harness and complete
  anti-adapter guidance
- Final navigation-index Cursor verdict: conditionally adequate for post-map,
  agent-first traversal of a 190k-node / 164 MB-graph landscape at SBOM scale;
  external producer outputs remain outside this navigation slice and
  `not_assessed`
- `summary.json.navigation`: verified with read order, `graph.json`
  first-read guardrail, high-degree hubs, unknown-node buckets, and SBOM
  fan-out warning
- `graph-index.json.navigation`: verified with matching drill-down guidance

Review evidence:

- Kimi no-tools review lane: assessed
- GLM no-tools review lane: assessed
- MiMo no-tools review lane: assessed
- Cursor + Composer 2.5 stress lane for navigation-index behavior: assessed
- Accepted review findings fixed:
  - local producer evaluation count now includes `not_assessed` wording;
  - CycloneDX component wording no longer implies every CycloneDX file was
    produced by Syft;
  - native map relationship extraction wording no longer implies roadmap
    intent with "currently";
  - `unknown_nodes.surface_buckets` now explicitly says it is an unknown-node
    breakdown, not all-file inventory, and tests assert bucket totals.
- Rejected review findings dispositioned in
  `post-merge-guidance-review-disposition-2026-06-01.md`.
- Navigation-index follow-up evidence is recorded in
  `post-merge-navigation-stress-2026-06-01.md`; navigation-index model review
  disposition is recorded in
  `post-navigation-index-review-disposition-2026-06-01.md`. No blocking
  correction remains for the post-map navigation harness slice.

GitHub checks:

- `Baseline`: verified passing before this closeout update
- `Analyze (actions)`: verified passing before this closeout update
- `Analyze (go)`: verified passing before this closeout update
- `Analyze (python)`: verified passing before this closeout update
- `CodeQL`: verified passing before this closeout update

Because this closeout updates the PR head, GitHub checks must be refreshed after
the final push before treating PR #31 as current ready-for-review or
ready-to-merge evidence.

## Readiness Matrix

- Implementation: verified
- Local verification: verified
- Review evidence: verified
- Requirements drift: verified; this remains a guidance correction for spec 053,
  not a new scanner, producer runner, or per-language adapter
- Product vision drift: verified; local-first/read-only and evidence-state
  honesty preserved
- PR state: ready-for-review after final push and refreshed checks
- GitHub checks: refresh required after this closeout commit
- Merge readiness: not ready-to-merge until refreshed PR head/checks are
  verified; GitHub review approval remains `not_assessed`; explicit merge
  approval for the restored PR #31 head is `not_assessed`
- Stop reason: merge may proceed only after the pushed PR head, mergeability,
  GitHub checks, and explicit merge approval are refreshed; otherwise keep PR
  #31 open and report the blocker
