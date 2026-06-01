# Quickstart: E2E Agent Scan Report

This quickstart defines the intended acceptance path. It is expected to fail
until the feature is implemented.

## Synthetic Multi-Repo Target

Prepare or reuse a local target shaped like:

```text
landscape/
  service-a/.git/
  service-a/go.mod
  service-a/src/http.go
  service-a/src/http_copy.go
  service-b/.git/
  service-b/package.json
  service-b/src/server.js
  service-b/.github/workflows/ci.yml
  mobile-app/.git/
  mobile-app/Package.swift
  docs/openapi.yaml
```

## Expected User Request

```text
Scan this repository folder with Portolan and prepare a first report:
stack, relationships, architecture diagram, duplication, technical debt,
unknowns, and next actions.
```

## Intended Command

The final command name may change during implementation, but the E2E surface
must support one user-facing scan-report workflow equivalent to:

```bash
portolan report scan \
  --root <target-root> \
  --out <output-dir> \
  --profile agent \
  --force
```

## Expected Artifacts

```text
<output-dir>/context/agent-brief.md
<output-dir>/context/answer-contract.md
<output-dir>/context/evidence-index.jsonl
<output-dir>/map/summary.json
<output-dir>/map/graph-index.json
<output-dir>/map/findings.jsonl
<output-dir>/map/map.md
<output-dir>/report/first-report.md
<output-dir>/report/report-summary.json
```

## Validation

```bash
test -s <output-dir>/report/first-report.md
test -s <output-dir>/report/report-summary.json
jq empty <output-dir>/report/report-summary.json
```

The report must contain:

- run status;
- visible scope;
- visible stack;
- relationships and architecture;
- architecture diagram;
- duplication;
- configuration surfaces;
- technical-debt candidates;
- unknowns and gaps;
- ranked next actions.

The agent response must summarize or relay `<output-dir>/report/first-report.md`
instead of asking the user to inspect internal artifacts first.

The summary must report zero unsupported positive claims.
