# Data Model: Agent Adapter Layer

## Adapter Candidate

- `name`: Graphify, SCIP, Serena, Repomix
- `source_url`: upstream source
- `license_state`: accepted, narrowed, blocked, or not_assessed
- `maintenance_state`: accepted, narrowed, blocked, or not_assessed
- `privacy_state`: accepted, narrowed, blocked, or not_assessed
- `integration_decision`: accepted, narrowed, rejected, blocked, or not_assessed

## Producer Fact

- `id`: producer-local identifier
- `kind`: node, edge, symbol, file, context, claim
- `source`: local producer output path
- `producer_confidence`: producer-specific confidence label
- `portolan_evidence_state`: mapped evidence state
- `reason`: required for weak states

## Adapter Profile

- `tool`: producer name
- `supported_fields`: normalized subset
- `unsupported_fields`: fields ignored or marked not_assessed
- `privacy_limits`: snippet/path/credential rules
- `validation_command`: command that validates a local fixture
