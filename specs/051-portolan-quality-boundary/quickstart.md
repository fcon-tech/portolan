# Quickstart: Portolan Quality Boundary

This quickstart defines the intended validation route.

## Inspect Product Surfaces

```bash
rg -n "portolan .*context|portolan .*map|portolan .*query|report|MCP|LSP" README.md docs specs
```

Every user-facing surface found should map to a maturity entry.

## Validate JSON Schemas

```bash
jq empty schema/*.json
```

## Validate Report Quality Fixtures

```bash
portolan report quality \
  --summary <output-dir>/report/report-summary.json
```

The command validates required sections, evidence references, weak states, and
unsupported positive claims from a local summary file.

## Expected Failure Fixtures

- report with missing required section;
- report with positive claim and no evidence reference;
- report that hides an `unknown`, `cannot_verify`, or `not_assessed` state;
- report that claims complete runtime topology from source-visible evidence.
