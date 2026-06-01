# Data Model: Runtime Security Boundary

## Runtime Observation

- `id`: stable observation ID
- `source`: local file path
- `observed_at`: optional timestamp
- `subjects`: services, processes, endpoints, or systems observed
- `relationships`: observed communications or dependencies
- `coverage`: complete, partial, unknown, or not_assessed
- `schema_version`: optional schema marker; when present, must be `0.1.0`

## Runtime Relationship

- `from`: observed source
- `to`: observed target
- `kind`: producer-specific observation kind retained in evidence reason; graph
  edge kind remains `observes`
- `evidence_state`: `runtime-visible`
- `reason`: why the observation supports the relationship

## Threat Record

- `risk`: prompt injection, path traversal, secret leakage, unsafe query/MCP exposure
- `surface`: artifact or command surface
- `mitigation`: implementation or documentation control
- `verification`: command/test/review evidence
- `state`: verified, failed, blocked, or not_assessed
