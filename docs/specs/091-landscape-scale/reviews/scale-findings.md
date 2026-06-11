# Scale findings: full bigtop (spec 091)

**Date**: 2026-06-10

## Smoke C command

```bash
scripts/portolan-scan.sh ~/projects/bigtop-landscape/repos /tmp/portolan-bigtop-full \
  --no-viewer --yes --shard-timeout 600 --jscpd-memory-mb 2048
```

| Metric | Value |
| --- | --- |
| Wall time | ~23 min (START 13:56:14Z → END 14:19:26Z) |
| Repos | 18 / 18 discovered |
| Producer shards | jscpd 18, semgrep 18, syft 18 |
| Hotspots total | 29,914 (`hotspots-full.jsonl`) |
| Hotspots budgeted | 200 (truncated) |
| Kind mix (budgeted) | static-finding 100, duplication 60, dep-hub 40 |
| Kind mix (total) | static-finding 4737, duplication 24035, dep-hub 1142 |
| Shard gaps | 8 jscpd shards (see below) |
| Bundle build (re-run) | ~3.5 min on existing producers |

## Shard gaps (honest failures)

During the first wizard run, 8 jscpd shards recorded `failed` because jscpd exits non-zero when clone count exceeds default threshold (even when JSON output exists): airflow, flink, hadoop, hbase, hive, kafka, solr, spark.

**Fix applied:** `--threshold 999999` on jscpd invocations so completed scans do not false-fail.

Semgrep and syft: 18/18 shards succeeded.

## Fixes during slice

1. **Kind-quota jq**: variable binding `$k` in `map`; `sort_h` on rest pool; `jq -sc` for compact JSONL (pretty-print broke rank loop).
2. **jscpd threshold exit**: treat as success when output exists via `--threshold 999999`.
3. **Bundle build**: single-pass jq per producer file; merge `producers/_gaps.jsonl`.

## Viewer

Full bundle loads in viewer; 18 repo filter chips; truncation banner shows 200 of 29,914.

## Not assessed

- Parallel shards (`--jobs`)
- Incremental re-scan / cache
- Full jscpd on repos that OOM even with 2048MB cap (none observed this run; spark/hadoop had threshold false-fail only)
