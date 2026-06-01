# Data Model: Human-Readable Evidence Packet

## Packet Input

The input is an evidence graph matching `schema/evidence-graph.schema.json`.

Required graph fields:

- `schema_version`
- `generated_by`
- `nodes`
- `edges`

## Packet Sections

The Markdown packet contains:

- title and graph metadata;
- aggregate node and edge counts;
- evidence-state counts;
- visible source facts;
- claim-only facts;
- unknown and cannot-verify areas;
- graph id references for every non-aggregate node or edge statement.

## Evidence State Handling

- `source-visible` is described as visible source evidence.
- `metadata-visible` and `runtime-visible` are grouped separately when present.
- `claim-only` is described as claimed, not observed.
- `unknown` and `cannot_verify` are called out as gaps.

## Output Rules

- Packet generation does not add facts.
- Packet generation does not scan target repositories.
- Packet generation writes only the explicit `--out` path.
