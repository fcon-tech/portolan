# Implementation Plan: Viewer Demo UX

**Date**: 2026-06-10

## Deliverables

- [viewer/src/](../../../viewer/src/) — search, filters, heat tree, detail + source
- [viewer/scripts/serve.js](../../../viewer/scripts/serve.js) — `/source` endpoint
- [docs/demo-runbook.md](../../../docs/demo-runbook.md)
- Smoke extensions in [scripts/harness-orient-smoke.sh](../../../scripts/harness-orient-smoke.sh)

## Verification

```bash
node viewer/scripts/build-static.js
scripts/harness-orient-smoke.sh
scripts/orient-wizard.sh . /tmp/orient-portolan --no-viewer --yes
```
