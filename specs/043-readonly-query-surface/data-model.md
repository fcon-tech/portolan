# Data Model: Readonly Query Surface

## Query Request

- `bundle`: map bundle directory
- `family`: findings, gaps, coverage, or summary
- `filter`: kind, evidence state, status, or record ID
- `limit`: max records returned

Validation:

- Bundle must be a local directory.
- Limit must be positive and capped.

## Query Result

- `schema_version`
- `query`
- `records`
- `truncated`
- `warnings`

## Portolan Reference

- `uri`: `portolan://bundle/<artifact>/<record-id>`
- `bundle_path`: local bundle directory
- `artifact`: source artifact file
- `record_id`: stable record or derived ID
