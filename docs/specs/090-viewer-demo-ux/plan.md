# Implementation Plan: Viewer Demo UX

**Date**: 2026-06-10

## Deliverables

- [viewer/src/](../../../viewer/src/) — search, filters, heat tree, detail + source
- [viewer/scripts/serve.js](../../../viewer/scripts/serve.js) — `/source` endpoint
- [docs/demo-runbook.md](../../../docs/demo-runbook.md)
- Smoke extensions in [scripts/harness-portolan-smoke.sh](../../../scripts/harness-portolan-smoke.sh)

## Verification

```bash
node viewer/scripts/build-static.js
scripts/harness-portolan-smoke.sh
scripts/portolan-scan.sh . /tmp/portolan-portolan --no-viewer --yes
```
