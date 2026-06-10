# Implementation Plan: Landscape Report Viewer (093)

## Slice 1–2 (done) — interim UX

Portolan naming, explainers, folder tree + list (superseded by tabbed report).

## Slice 3b — CLI naming

- `portolan-scan.sh`, `build-portolan-bundle.sh`, `harness-portolan-smoke.sh`, `portolan-ignore.sh`
- Deprecation wrappers for legacy `orient-*` names

## Slice 4 — Report artifacts

- `scripts/scan-landscape-card.sh` → `landscape-card.json`
- `build-portolan-bundle.sh` → `landscape-report.json` + enriched `graph-slice.json`
- `harness/contracts/landscape-card.schema.json`, `landscape-report.schema.json`

## Slice 5 — Report viewer shell

- Tabs: Overview | Findings | Gaps (default Overview)
- Overview renders card + repo matrix + next steps

## Slice 6 — Findings tab

- Sections by kind, folder map, inspector, load-all findings, source preview

## Slice 7 — Ship

- Smoke, demo evidence, PR #66 ready-for-review
