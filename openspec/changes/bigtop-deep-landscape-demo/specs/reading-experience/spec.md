# Spec Delta — reading-experience

## ADDED Requirements

### Requirement: Landscape view shows connected structure, not a flat inventory
The atlas SHALL render the landscape as a connected system. Typed relationships —
including structural `references` edges and shared-dependency clusters — SHALL
connect components into legible groupings, hubs, and cross-cutting flows, so the
system shape is readable at a glance rather than as a flat list of repositories.
When only shared-dependency edges are available and no structural edges exist,
the atlas MUST state this limitation in plain language and MUST NOT present
dependency sharing as if it were code-level architecture.

#### Scenario: Landscape shows connected groupings and cross-component edges
- GIVEN a snapshot contains structural reference edges and shared-dependency
  clusters across multiple components
- WHEN the admiral opens the landscape view
- THEN components are connected by typed edges into groupings and hubs
- AND the system shape (clusters, cross-cutting flows) is legible at a glance
- AND the view is not a flat list of repositories

#### Scenario: Dependency-only landscape is admitted, not disguised
- GIVEN a snapshot contains only shared-dependency edges and no structural edges
- WHEN the admiral opens the landscape view
- THEN the atlas states in plain language that only dependency-level structure is
  available
- AND it does not present shared dependencies as code-level architecture

### Requirement: A realistic ecosystem is the deep-landscape acceptance showcase
The atlas SHALL be proven at depth on a realistic multi-component ecosystem
corpus. The Apache Bigtop corpus SHALL serve as that showcase: a multi-component
ecosystem (storage, processing, orchestration, SQL, security, messaging) rendered
with structural edges, shared-dependency clusters, surfaces, findings, and
journeys — not a flat list of repositories. The showcase SHALL be regenerable
from a real scan and SHALL be the artifact a reviewer opens to judge whether the
atlas reads as a system atlas.

#### Scenario: The showcase reads as a connected ecosystem
- GIVEN the Bigtop showcase is generated from a scan that includes structural
  edges
- WHEN a reviewer opens it
- THEN the landscape shows cross-component structural relationships and
  groupings
- AND it does not read as a list of repositories that share libraries

#### Scenario: The showcase is regenerable from a scan
- GIVEN the Bigtop corpus is scanned
- WHEN the showcase is regenerated
- THEN the landscape view, journeys, findings, and coverage are produced from the
  scan output
- AND the showcase is not hand-shaped data disconnected from a real scan
