# Implementation Plan: Orient Wizard

**Date**: 2026-06-10

## Deliverables

- [`scripts/portolan-scan.sh`](../../../scripts/portolan-scan.sh)
- Fixes to [`scripts/build-portolan-bundle.sh`](../../../scripts/build-portolan-bundle.sh)
- Smoke evidence in `reviews/`

## Verification

```bash
bash -n scripts/portolan-scan.sh
scripts/portolan-scan.sh --help
scripts/harness-portolan-smoke.sh
scripts/portolan-scan.sh . /tmp/portolan-portolan --no-viewer --yes
```
