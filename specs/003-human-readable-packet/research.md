# Research: Human-Readable Evidence Packet

## Markdown Packet Format

Decision: Use Markdown for the first packet format.

Rationale: Markdown is local, diffable, readable in terminals and GitHub, and
requires no rendering dependency.

Alternatives considered: HTML/PDF were rejected for this slice because they add
layout/rendering concerns before the evidence packet contract is proven.

## Graph-Only Input

Decision: Render only from `schema/evidence-graph.schema.json` shaped graph
data.

Rationale: The packet must not become a second collector or source of truth.
Every non-aggregate packet statement should trace back to a graph node or edge.

Alternatives considered: Re-reading selection inputs or target repositories was
rejected because it would blur scan and packet responsibilities.

## Existing Open Source

Decision: Use Go standard-library string/JSON rendering for this slice.

Rationale: Markdown generation is simple enough and dependency-free. A template
engine or reporting framework is not justified until layout complexity appears.

Alternatives considered: Markdown/report generators were rejected for now due
integration cost and the risk of making packet generation look like a full
consulting report engine.
