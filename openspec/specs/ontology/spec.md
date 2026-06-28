# Ontology Specification

## Purpose

Defines the discovered ontology of the landscape: the minimal kernel of unit,
surface, finding, external node, grouping, and typed edge. Structure is
discovered, not prescribed; a fixed taxonomy is not imposed.

(migrated).

## Requirements

### Requirement: Landscape unit promotion
A landscape unit SHALL be promoted from raw source material when the
deterministic core can name it and locate it (a repository path, a package
coordinate, a service identifier). A unit's sub-type SHALL be drawn from a
closed vocabulary (`application`, `library`, `platform`, `package`,
`deployment`, `runtime`, `external`, `unknown`) and set only when the core has
evidence; otherwise it MUST be `unknown`.

#### Scenario: Unknown over false precision
- GIVEN a unit cannot be confidently sub-typed from evidence
- WHEN the core sets its sub-type
- THEN the sub-type is `unknown`

### Requirement: Repository is a unit, not a surface
A repository SHALL be modelled as a unit. A repository-unit SHALL be
self-backing (its evidence is its own source tree). All other units SHALL name
their backing repository-unit(s). A repository source MUST NOT be modelled as a
surface.

#### Scenario: Self-backing repository unit
- GIVEN the admiral names a repository root
- WHEN the core promotes it
- THEN it is a unit whose evidence is its own source tree

### Requirement: Surfaces attach to units
A surface (docs, issue tracker, chat, mailing list, deploy target) SHALL attach
to its owning unit. Surfaces MUST NOT appear as peer nodes on the behaviour map.

#### Scenario: Surface is not a peer node
- GIVEN a unit has a docs surface
- WHEN the behaviour map renders
- THEN the docs surface is attached to its owning unit
- AND it is not rendered as a peer node

### Requirement: Findings carry confidence
Every finding SHALL be attached to one or more units and SHALL carry its own confidence level. A finding (duplication, dead code, architectural-principle violation, confidence disagreement) MAY be produced by the deterministic core (ironclad) or agent producers (hypothesis).

#### Scenario: Finding is unit-attached
- GIVEN a producer discovers a duplication problem
- WHEN it emits the finding
- THEN the finding is attached to the affected unit(s)
- AND it carries a confidence level per the trust contract

### Requirement: External nodes inferred from out-of-perimeter edges
An external node SHALL be a unit that lies outside the expedition perimeter,
inferred from `depends-on`/`references` edges whose target resolves outside the
perimeter. External nodes MUST be recorded with an `external` flag and MUST NOT
be crawled.

#### Scenario: Dependency outside perimeter is external
- GIVEN a unit depends-on `org.apache:commons-lang3` not under the named roots
- WHEN the core resolves the edge
- THEN the target is recorded as an external node flagged external
- AND it is not crawled

### Requirement: Groupings are discovered, not declared
Groupings SHALL be the connected components of the `depends-on`/`references`
edge graph among units, further bucketed by dominant unit sub-type. Grouping is
a deterministic computation over the behaviour map. The legacy role taxonomy
MAY survive as one optional grouping lens layered on top; it MUST NOT be the
spine and is not required.

#### Scenario: Grouping derived from edges
- GIVEN units connected by depends-on and references edges
- WHEN groupings are computed
- THEN each connected component forms a grouping
- AND it is bucketed by the dominant sub-type within the component

### Requirement: Typed edges always set
Edges SHALL be typed: `depends-on`, `references`, `deployed-on`. An edge whose
type cannot be resolved MUST be typed `unknown`, never guessed.

#### Scenario: Unresolvable edge is unknown
- GIVEN an edge whose type cannot be determined from evidence
- WHEN the core sets its type
- THEN the type is `unknown`

### Requirement: Deterministic core wins conflicts
The deterministic core SHALL win on its domain when it disagrees with an agent
producer about a unit's type, an edge, or a grouping, and the disagreement MUST
be recorded as a finding with the agent's claim attached at `hypothesis`
confidence, so it is never silently dropped.

#### Scenario: Disagreement is visible, not dropped
- GIVEN the core says a unit is type X and an agent says type Y
- WHEN the snapshot merges the assertions
- THEN the unit is typed X (core wins)
- AND a finding records the agent's Y claim at hypothesis confidence
