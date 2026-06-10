# Implementation Plan: Harness-First Product

**Branch**: `codex/087-harness-first-product` | **Date**: 2026-06-10

## Summary

Reposition Portolan around harness artifacts, OSS recipes, orient bundle contract,
and a local evidence-backed viewer. Publish governance (constitution amendment,
Go freeze policy) before expanding harness and viewer slices.

## Technical Context

**Primary delivery**: `harness/` skills, recipes, guardrails, contracts; `viewer/`
local orient UI; `docs/adr/` decision records.

**Legacy**: Go CLI frozen; optional `scripts/orient-export-from-map.sh` bridge.

**Constraints**: Local-first, read-only default; viewer session may use local static
serve only.

## Constitution Check

| Principle | Status | Notes |
| --- | --- | --- |
| Local-first | Pass | Recipes and viewer are local. |
| Evidence honesty | Pass | Hotspots require producer refs. |
| Complement OSS | Pass | jscpd, Semgrep, Syft are producers. |
| SpecKit | Pass | This spec anchors the pivot. |

## Verification

```bash
test -f harness/SKILL.md
test -f docs/harness/GO-FREEZE-POLICY.md
jq empty harness/contracts/orient-bundle.schema.json
git diff --check
```
