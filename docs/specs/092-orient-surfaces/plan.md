# Implementation Plan: Orient Surfaces (092)

## Slice 0 — PR #64 debt

- `repo_slug` hash in orient-wizard.sh
- spec 088 layout: hotspots-full.jsonl, manifest fields
- harness-orient-smoke: filter-bar, heat-tree, status-banner, truncation test
- CI: wizard --skip-install on fixture target

## Slice 1 — config-surfaces

- `scripts/scan-config-surfaces.sh`
- `harness/recipes/config-surfaces.md`
- wizard `run_config` + bundle jq + kind quotas
- fixture config files under orient-bundle/target

## Slice 2 — ctags

- wizard `run_ctags` with universal-ctags install
- bundle jq symbol-density aggregation
- viewer detail symbol count from summary

## Slice 3 — ship

- real-target smoke, docs, backlog P7-092, draft PR

## Slice 3.5 — gitignore hardening

- `scripts/orient-ignore.sh` + `git check-ignore` fallback patterns
- jscpd `--gitignore`, ctags `git ls-files -co --exclude-standard`, config scan filter
- bundle post-filter in `build-orient-bundle.sh`
- harness-orient-smoke: assert ignored paths excluded from fixture bundle
