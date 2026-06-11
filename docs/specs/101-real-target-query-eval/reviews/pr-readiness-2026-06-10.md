# PR readiness — P8 (101–103)

**Branch:** `codex/101-103-p8-navigation`  
**Date:** 2026-06-10

## Scope

| Spec | Deliverable |
| --- | --- |
| 101 | Self-target eval PASS; `run-query-eval.sh --self [--run]` |
| 102 | `--with-map-bridge` on `portolan-scan.sh`; `harness-map-bridge-smoke.sh` |
| 103 | Viewer control guide, rank explainer, detail CTAs; demo-runbook |

## Local verification

| Check | Result |
| --- | --- |
| `go test ./...` | pass |
| `scripts/harness-portolan-smoke.sh` | pass |
| `scripts/harness-map-bridge-smoke.sh` | pass |
| Self-scan + `run-query-eval.sh --self --run` | PASS (eval artifact) |
| `jq empty schema/*.json` | pass |
| `git diff --check` | pass |

## PR state

- Draft PR pending push
- GitHub CI: not_assessed until push

## Merge

Blocked on explicit user approval per AGENTS.md.
