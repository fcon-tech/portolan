# Implementation Plan: Orient Bundle Contract

## Deliverables

- `harness/contracts/orient-bundle.schema.json`
- `scripts/build-orient-bundle.sh`
- `scripts/orient-export-from-map.sh`
- `internal/testfixtures/orient-bundle/` fixture

## Verification

```bash
scripts/build-orient-bundle.sh internal/testfixtures/orient-bundle/target internal/testfixtures/orient-bundle/orient
jq empty harness/contracts/orient-bundle.schema.json
```
