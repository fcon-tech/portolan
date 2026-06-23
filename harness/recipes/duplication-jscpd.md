# Recipe: jscpd Duplication Scan

## Prerequisites

- Node.js and `npx jscpd` or global `jscpd` install (operator-approved).
- Target path is read-only for Portolan; jscpd must not modify source.
- Bounded profile is defined in `scripts/lib/jscpd-bounded.sh`.

## Bounded profile (required for `portolan-scan`)

`portolan-scan.sh` sources `scripts/lib/jscpd-bounded.sh`. Do not duplicate flags in
one-off commands unless you source the same helper.

| Flag | Value |
| --- | --- |
| `--min-lines` | 50 |
| `--min-tokens` | 100 |
| `--max-size` | 100kb |
| `--max-lines` | 1000 |
| `--gitignore` | on |
| `--noSymlinks` | on |
| `--absolute` | on |

Large repos may be **sub-sharded** by top-level directory when file count exceeds
`PORTOLAN_JSCPD_SUBSHARD_THRESHOLD` (default 3000). A repo succeeds when at least
one sub-shard produces `jscpd-report.json`, but `producers/jscpd/<repo>/_coverage.json`
records whether the result is complete or stratified.

## Single repository

```bash
# shellcheck source=scripts/lib/jscpd-bounded.sh
. scripts/lib/jscpd-bounded.sh
TARGET=<absolute-target-root>
OUT=<bundle-dir>/producers/jscpd/<repo-slug>
mkdir -p "$OUT"
SHARD_TIMEOUT=600 JSCPD_MEMORY_MB=2048 jscpd_run_bounded "$TARGET" "$OUT"
```

## Multi-repo (sharded)

Discover git repos under the landscape root, then run one bounded jscpd command per
repo (or sub-shard) via `portolan-scan.sh`:

```bash
scripts/portolan-scan.sh <landscape-root> <bundle-dir> --yes --producers jscpd
```

Failed shards record `shard-jscpd-<slug>` gaps; the Bigtop stress gate requires
zero failed-shard gaps and explicit degraded coverage for sampled sub-shards.

## Cross-repo (pairwise)

Use `--cross-repo-dup` on multi-repo landscapes. Each repo pair runs a separate
bounded jscpd pass on **staged symlink slices** (default 1500 gitignore-aware
files per repo via `PORTOLAN_CROSS_JSCPD_FILES_PER_REPO`) so large repos do not
OOM. Completion and coverage mode are recorded in
`producers/jscpd-cross/_scan.json`. A stratified run is useful, but absence of
clone pairs outside staged files remains `cannot_verify`.

```bash
scripts/portolan-scan.sh <landscape-root> <bundle-dir> --cross-repo-dup --yes
```

## Re-ingest

```bash
scripts/build-portolan-bundle.sh "$TARGET" "$BUNDLE_DIR"
```

## Failure modes

| Failure | Result |
| --- | --- |
| OOM / timeout | Sub-shard or pair retry; `cannot_verify` gap for that shard/pair |
| No JSON output | Per-repo `gap-duplication-<id>` or `shard-jscpd-*` |
| Missing jscpd | Preflight / `--yes` abort (exit 2) |
| Stratified repo coverage | `gap-duplication-stratified-<id>` with selected/total segment counts |
| Stratified cross-repo coverage | `gap-cross-repo-dup-stratified` with staged-file limits |
| Cross pair failure | `gap-cross-repo-dup` when `pairs_failed > 0` in `_scan.json` |

## Smoke

```bash
scripts/harness-jscpd-bounded-smoke.sh
scripts/harness-cross-repo-smoke.sh
```
