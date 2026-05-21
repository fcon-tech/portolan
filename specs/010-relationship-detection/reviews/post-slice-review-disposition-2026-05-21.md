# Post-Slice Review Disposition: 010 Relationship Detection

Date: 2026-05-21

## Implementation Summary

This slice adds first-pass relationship detection to `portolan map`:

- Go source imports become `imports` edges with `source-visible` evidence.
- `go.mod` requirements become `depends-on` edges with `metadata-visible`
  evidence.
- Relationship findings replace the old `relationships` `not_assessed`
  placeholder when supported relationships are observed.
- Unsupported duplication, configuration, and technical-debt detectors remain
  `not_assessed`.
- Existing `scan --selection` claim-only, metadata-visible, and unknown
  relationship evidence remains covered by regression tests.

## Local Verification

| Check | Status |
| --- | --- |
| `go test -count=1 ./...` | verified |
| `jq empty schema/*.json corpora/apache-bigtop/manifest.json` | verified |
| `go run ./cmd/portolan map --root testdata/relationship-detection/repo --out /tmp/portolan-relationships-run --force` | verified |
| `jq empty /tmp/portolan-relationships-run/run.json /tmp/portolan-relationships-run/graph.json` | verified |
| Relationship-edge `jq` field check over `/tmp/portolan-relationships-run/graph.json` | verified |
| JSONL parse check over `/tmp/portolan-relationships-run/findings.jsonl` | verified |
| `go run ./cmd/portolan scan --selection testdata/relationship-detection/selection.json --out /tmp/portolan-relationship-selection-graph.json --force` | verified |
| `git diff --check` | verified |

## Review Lanes

| Lane | Status | Notes |
| --- | --- | --- |
| `minimax/MiniMax-M2.7` | verified | Reported no blocking findings. Noted a dead `root` parameter in `detectGoMod`; accepted and fixed. |
| `kimi-coding/kimi-for-coding` | not_assessed | The post-slice review process terminated before returning usable output. |
| `zai/glm-5.1` | not_assessed | The post-slice review process terminated before returning usable output. |
| Local review | verified | Checked diff scope, schema compatibility, evidence-state behavior, local-only parsing, deterministic sorting, and task/status alignment. |

## Findings And Disposition

| Finding | Source | Disposition |
| --- | --- | --- |
| `detectGoMod` carried an unused `root` parameter. | minimax | Accepted and fixed. |
| Need explicit supported relationship documentation. | pre-implementation review | Fixed in `docs/relationship-detection.md`. |
| Need explicit edge evidence invariant check. | pre-implementation review | Fixed with app-level relationship edge tests and final `jq` verification. |
| Need claim-only/metadata/unknown preservation coverage. | pre-implementation review | Fixed with relationship selection fixture and scan regression test. |
| Use a mature Go module parser instead of custom `go.mod` scanning. | pre-implementation review | Fixed with `golang.org/x/mod/modfile`; parsing remains local-only. |

## Residual Risk

- Relationship detection is Go-only in this slice. Non-Go source languages,
  runtime relationship inference, and service-topology inference remain
  `not_assessed`.
- GitHub checks and PR-level review are not assessed in this file; they belong
  to the PR readiness closeout after PR creation.
