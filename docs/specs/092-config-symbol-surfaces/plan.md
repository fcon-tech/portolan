# Implementation Plan: Config And Symbol Surfaces (092)

## Slice 0 — PR #64 debt

- `repo_slug` hash in portolan-scan.sh
- spec 088 layout: hotspots-full.jsonl, manifest fields
- harness-portolan-smoke: filter-bar, heat-tree, status-banner, truncation test
- CI: portolan-scan --skip-install on fixture target

## Slice 1 — config-surfaces

- `scripts/scan-config-surfaces.sh`
- `harness/recipes/config-surfaces.md`
- portolan-scan `run_config` + bundle jq + kind quotas
- fixture config files under portolan-bundle/target

## Slice 2 — ctags

- portolan-scan `run_ctags` with universal-ctags install
- bundle jq symbol-density aggregation
- viewer detail symbol count from summary

## Slice 3 — ship

- real-target smoke, docs, backlog P7-092, draft PR

## Slice 3.5 — gitignore hardening

- `scripts/portolan-ignore.sh` + `git check-ignore` fallback patterns
- jscpd `--gitignore`, ctags `git ls-files -co --exclude-standard`, config scan filter
- bundle post-filter in `build-portolan-bundle.sh`
- harness-portolan-smoke: assert ignored paths excluded from fixture bundle
