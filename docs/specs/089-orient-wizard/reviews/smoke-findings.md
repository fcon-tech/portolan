# Smoke findings: Orient Wizard (spec 089)

**Date**: 2026-06-10

## Smoke A — portolan repo

```bash
scripts/portolan-scan.sh . /tmp/portolan-portolan --no-viewer --yes
```

| Metric | Value |
| --- | --- |
| Runtime | ~18s (jscpd ~7s, semgrep/syft fast on single repo) |
| Hotspots | 128 (0 gaps) |
| Top kinds | duplication (jscpd), static-finding (semgrep) |
| Viewer | `node viewer/scripts/serve.js --bundle /tmp/portolan-portolan` — page loads, hotspots.jsonl served |

### Fixes applied during smoke

1. **jscpd**: `--noSymlinks true` passed `true` as a path; replaced with `--noSymlinks` + ignore globs.
2. **CLI flags**: options after positionals (`target bundle-dir --no-viewer`) were ignored; positional/flag parsing fixed.
3. **jscpd output**: read from `producers/jscpd/**/jscpd-report.json` (wizard layout).

## Smoke B — bigtop-landscape (bounded)

```bash
scripts/portolan-scan.sh ~/projects/bigtop-landscape/repos /tmp/portolan-bigtop \
  --no-viewer --yes --limit-repos 3 --producers semgrep,syft
```

| Metric | Value |
| --- | --- |
| Repos scanned | alluxio, apache-airflow, apache-bigtop-repo |
| Semgrep outputs | 3 shard JSON files (405KB–1.2MB) |
| Syft outputs | 3 cyclonedx JSON (91KB–8.9MB airflow) |
| Bundle | 830 hotspots before budget; **200 after** (`hotspots_truncated=true`) |
| Bundle build time | ~18s after dep-hub jq optimization (was hung >12min) |

### Fixes applied during smoke

1. **dep-hub loop**: per-component `jq` on large SBOMs was O(n²); replaced with single-pass jq per SBOM file.
2. **dep-hub threshold**: raised from 5 → 8 transitive deps to reduce noise.
3. **Hotspot budget**: default 200 with `hotspots_total` / `hotspots_truncated` in manifest.

### Not assessed (by design)

- Full jscpd on bigtop (OOM risk per spec 079) — omitted via `--producers semgrep,syft`.
- Runtime evidence, call graphs, enterprise parity.

## Regression

- `scripts/harness-portolan-smoke.sh` — **ok** after bundle ranking/budget changes.

## Skip-install path

With `PATH=/usr/bin:/bin` and `--skip-install`, producers missing from PATH log to
`producers/_failures.log` and surfaces remain `not_assessed` in gaps.jsonl.
