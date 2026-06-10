# Smoke findings: Orient Surfaces (spec 092)

**Date**: 2026-06-10  
**Branch**: `codex/092-orient-surfaces`

## Smoke A — portolan (self)

```bash
scripts/orient-wizard.sh . /tmp/orient-smoke-a --no-viewer --skip-install --yes
```

| Metric | Value |
| --- | --- |
| hotspots | 163 |
| gaps | 0 |
| config | 4 |
| debt-candidate | 30 |
| duplication | 125 |
| static-finding | 4 |
| truncated | no |

ctags JSONL ingested. **Pre-FR-007 note:** smoke A initially listed symbol-dense paths under `.codex-subagents/`; after slice 3.5 those paths are excluded (`grep -c codex-subagents hotspots.jsonl` → 0).

## Smoke A post-FR-007 (2026-06-10)

Re-run on harness-only head: ignored agent artifact paths no longer appear in bundle output; debt-candidate counts may differ from pre-gitignore smoke A table above.

## Smoke B — bigtop bounded (3 repos)

```bash
scripts/orient-wizard.sh ~/projects/bigtop-landscape/repos /tmp/orient-smoke-b \
  --no-viewer --skip-install --yes --limit-repos 3
```

| Metric | Value |
| --- | --- |
| repos | 3 (alluxio, apache-airflow, apache-bigtop-repo) |
| hotspots | 200 (budget) |
| hotspots_total | 4169 |
| truncated | yes |
| gaps | 1 (jscpd shard cannot_verify on apache-airflow) |

config + ctags producers ran per repo; bundle kind mix includes duplication, config, debt-candidate after budget.

## Fixture smoke (CI)

`scripts/harness-orient-smoke.sh` — **verified** locally:

- kind `config` and `debt-candidate` in fixture bundle
- viewer DOM: `filter-bar`, `heat-tree`, `status-banner`
- `ORIENT_HOTSPOT_BUDGET=2` truncation manifest + full list length

## Wizard CI orchestration

`orient-wizard.sh` on fixture with `--skip-install --no-viewer` — gaps non-empty (`not_assessed` for missing syft when tools skipped).
