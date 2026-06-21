# Implementation Plan: Portolan Bundle Contract

## Deliverables

- `harness/contracts/portolan-bundle.schema.json`
- `scripts/build-portolan-bundle.sh`
- `scripts/portolan-export-from-map.sh`
- `internal/testfixtures/portolan-bundle/` fixture

## Verification

```bash
scripts/build-portolan-bundle.sh internal/testfixtures/portolan-bundle/target internal/testfixtures/portolan-bundle/reference
jq empty harness/contracts/portolan-bundle.schema.json
```
