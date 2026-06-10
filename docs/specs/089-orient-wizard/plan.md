# Implementation Plan: Orient Wizard

**Date**: 2026-06-10

## Deliverables

- [`scripts/orient-wizard.sh`](../../../scripts/orient-wizard.sh)
- Fixes to [`scripts/build-orient-bundle.sh`](../../../scripts/build-orient-bundle.sh)
- Smoke evidence in `reviews/`

## Verification

```bash
bash -n scripts/orient-wizard.sh
scripts/orient-wizard.sh --help
scripts/harness-orient-smoke.sh
scripts/orient-wizard.sh . /tmp/orient-portolan --no-viewer --yes
```
