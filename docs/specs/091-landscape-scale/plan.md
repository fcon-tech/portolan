# Implementation Plan: Landscape Scale

**Date**: 2026-06-10

## Verification

```bash
scripts/harness-portolan-smoke.sh
scripts/portolan-scan.sh ~/projects/bigtop-landscape/repos /tmp/portolan-bigtop-full \
  --no-viewer --yes --shard-timeout 600
```
