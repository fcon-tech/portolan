# Prototype Current Behavior Review

Date: 2026-06-01

Mode: DESIGN_REVIEW

## Purpose

Ground the E2E scan-report spec in current Portolan behavior instead of
guessing from product intent.

## Prototype Target

Local synthetic landscape:

```text
/tmp/portolan-e2e-story-jzcoqx/landscape
|-- service-a/.git
|-- service-a/go.mod
|-- service-a/src/http.go
|-- service-a/src/http_copy.go
|-- service-b/.git
|-- service-b/package.json
|-- service-b/src/server.js
|-- service-b/.github/workflows/ci.yml
|-- mobile-app/.git
|-- mobile-app/Package.swift
`-- docs/openapi.yaml
```

## Commands

```bash
go run ./cmd/portolan context prepare --root /tmp/portolan-e2e-story-jzcoqx/landscape --out /tmp/portolan-e2e-story-jzcoqx/out/context --profile cursor --force
go run ./cmd/portolan map --root /tmp/portolan-e2e-story-jzcoqx/landscape --out /tmp/portolan-e2e-story-jzcoqx/out/map --force
go run ./cmd/portolan query findings --bundle /tmp/portolan-e2e-story-jzcoqx/out/map --kind duplication --limit 10
go run ./cmd/portolan query findings --bundle /tmp/portolan-e2e-story-jzcoqx/out/map --kind relationships --limit 10
```

## Observed Evidence

- `verified`: `context prepare` wrote the context pack.
- `verified`: `map` wrote the map bundle.
- `verified`: duplication query returned
  `service-a-finding-duplication-exact-source-001`.
- `verified`: relationship query returned bounded `not_assessed` records.
- `verified`: `summary.json` reported 32 findings: 5 configuration, 1
  duplication, 3 inventory, 20 relationships, and 3 technical-debt findings.
- `verified`: `map.md` included visible repositories, configuration,
  duplication, technical-debt candidates, unknowns, skipped surfaces, and next
  agent tasks.

## Product Gap

Current behavior produces useful lower-level artifacts but not the requested
E2E user result. A non-expert harness user still needs the agent to manually
assemble a first report from several files. The missing product surface is a
single scan-report workflow that produces a human-readable report and
machine-readable report summary.

## Not Assessed

- Real Cursor UI behavior.
- Real customer iOS repository behavior.
- Public single-repo and multi-repo acceptance lanes for this new E2E story.
- Optional OSS producer execution during this prototype.
