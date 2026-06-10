# Demo findings: Viewer UX (spec 090)

**Date**: 2026-06-10

## Smoke regression

`scripts/harness-orient-smoke.sh` — **ok**

New checks:
- `id="search-input"` in HTML
- `/source?path=sample.go&line=1` returns fixture content
- `/source?path=../../../etc/passwd` → **403**

## Demo A — portolan bundle

Bundle: `/tmp/orient-portolan` (128 hotspots, 0 gaps)

| Check | Result |
| --- | --- |
| Search UI | Present |
| Directory heat tree | Groups `docs/`, `.specify/`, `pkg/` etc. |
| Source preview | Loads `sample.go` via `/source` |
| Truncation banner | Hidden (not truncated) |

## Demo B — bigtop bundle (bounded)

Bundle: `/tmp/orient-bigtop` (200 of 830 hotspots, truncated)

| Check | Result |
| --- | --- |
| Truncation banner | Shows "200 of 830" with budget |
| Repo filter chips | Visible (3 repos in repos.json) |
| Heat tree | Usable at 200 nodes (vs flat tiles before) |
| Gaps banner | 1 gap surface shown in header |

## Demo flow verdict

Suitable for live demo on single repo + bounded multi-repo without "this is raw MVP" caveat for navigation. Source preview works for file-backed hotspots; dep-hubs show without source snippet (expected).
