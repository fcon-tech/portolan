# Research: Black-Box Profile

## File-Based Black-Box Inputs

Decision: Process black-box systems from local metadata, runtime observation,
and claim files declared in the selection document.

Rationale: This keeps Portolan local-first and read-only while allowing systems
without source code to appear in the evidence graph. Runtime observations are
exports, not live telemetry queries.

Alternatives considered: Direct service discovery, observability API calls, and
credentialed catalog queries were rejected for this slice because they would add
network, credential, and privacy boundaries before the profile model is proven.

## Existing Open Source And Patterns

Decision: Model black-box evidence as imported local exports first, using
established service-catalog and observability concepts without integrating a
specific platform.

Rationale: Backstage catalogs, OpenTelemetry-derived exports, CMDB exports, and
observability snapshots are common sources, but each has different license,
privacy, and schema stability concerns. A small local JSON fixture proves the
normalization contract before choosing adapters.

Alternatives considered: Building a native service catalog or runtime scanner
was rejected because Portolan should complement existing tools rather than
replace them.

## Graph Representation

Decision: Represent black-box systems with existing evidence graph node kinds
such as `service`, `runtime`, `claim`, and `unknown`.

Rationale: The current graph schema does not include a `black-box` node kind.
Using existing graph kinds avoids a schema migration while preserving evidence
states as the authority boundary.

Alternatives considered: Adding a new `black-box` node kind was deferred until
there is evidence that consumers need a separate type rather than state and
source metadata.

## Unknown And Cannot-Verify Handling

Decision: Emit explicit `unknown` facts for expected missing evidence and
`cannot_verify` facts for malformed, unreadable, or unattributable inputs.

Rationale: Black-box work is where false certainty is most dangerous. The graph
must show missing evidence instead of silently omitting it or converting claims
into observations.

Alternatives considered: Skipping missing fields was rejected because it hides
map gaps. Failing the whole scan for one malformed black-box input was rejected
because partial visibility is still useful when evidence quality is explicit.
