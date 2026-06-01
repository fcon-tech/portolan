# Research: Relationship Evidence Taxonomy

## Decision: Publish taxonomy in docs and generated answer contract

Relationship taxonomy should live in `docs/evidence-model.md` and
`docs/relationship-detection.md`, then be repeated in condensed form in the
generated `answer-contract.md`.

**Rationale**: Agents read the context pack before opening docs. Putting the
taxonomy only in docs would not protect the main CTO-answer workflow.

**Alternatives considered**:

- New CLI command for taxonomy output. Rejected because this is static product
  guidance and would add command surface without improving evidence.
- Schema changes for relationship categories. Rejected for this slice because
  existing graph edges already carry `kind` and `evidence.state`; changing the
  graph contract is higher risk than needed.

## Decision: Use relationship kinds, not strength labels, for product language

The taxonomy distinguishes dependency, declared service/API, runtime
communication, ownership, and lifecycle relationships. Evidence state remains a
separate axis.

**Rationale**: "Service relationship" is ambiguous unless the report says both
what kind of relationship is claimed and how it was evidenced.

**Alternatives considered**:

- Treat every relationship as `depends-on`. Rejected because it hides runtime,
  ownership, lifecycle, and declaration differences.
- Create a single ordered strength ladder. Rejected because a runtime
  observation and ownership declaration answer different questions.

## Decision: Keep OSS posture as import-first

Backstage, OpenAPI, AsyncAPI, Structurizr, OpenTelemetry exports, and similar
local outputs should be normalized as evidence when supplied; this slice does
not invoke those tools or parse new formats.

**Rationale**: The constitution says to compose mature tools before native
scanners. The immediate product gap is claim language, not missing producers.

**Alternatives considered**:

- Add a native OpenAPI or Backstage parser now. Rejected because importer
  details, license posture, and adapter contract belong in a separate slice.
- Infer service topology from ports, names, directories, or manifests. Rejected
  because that would upgrade weak evidence into runtime-like claims.
