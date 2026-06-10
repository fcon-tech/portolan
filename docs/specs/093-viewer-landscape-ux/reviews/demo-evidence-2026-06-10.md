# Demo evidence — spec 093 (2026-06-10)

## Verification

| Check | Result |
| --- | --- |
| `scripts/harness-portolan-smoke.sh` | **ok** |
| `go test ./...` | **ok** |
| `jq empty harness/contracts/landscape-*.schema.json` | **ok** |
| Viewer default tab | Overview (`#report-overview`) |
| Bundle artifacts | `landscape-card.json`, `landscape-report.json`, `graph-slice.json` |

## Fixture smoke bundle (`orient-smoke`)

- **Identity**: fixture target name from `landscape-card.json`
- **Findings**: 7 shown / 7 total (no truncation in fixture)
- **Gaps**: 1 (`dependencies` not_assessed when syft skipped)
- **Tabs**: Overview loads card + next steps; Findings has sections + tree; Gaps lists gap row

## Demo bar (operator questions)

| Question | Evidence |
| --- | --- |
| What is this target? | Overview → language, files, LOC, maturity badges |
| How many repos? | Overview → repo table (1 in fixture) |
| Top problems? | Overview → “Where to look first” (ranked from report) |
| What was not checked? | Gaps tab → syft/dependencies `not_assessed` |

## Comparison notes

- **sdp_lab scout**: card fields mirror simplified `ProjectCard` (identity, scale, maturity, health_signals) without runtime `sdp scout` dependency.
- **map.md**: `landscape-report.json` sections `repos`, `findings_by_kind`, `gaps`, `next_steps` align with `writeMap` section intent; full Go `portolan map` bridge deferred to spec 094.

## Not assessed

- Live bigtop re-scan for this slice (use `docs/demo-runbook.md` full landscape command).
- Independent PR review lanes (pending PR readiness closeout).
