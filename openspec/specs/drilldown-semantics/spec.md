# Drilldown Decision Semantics Specification

## Purpose

Defines the reader-facing navigation labels and the click/destination contract
that makes every primary atlas object answer a decision question: every visible
click either opens a meaningful dossier/detail, hands off to external evidence
with an explanation, or is disabled with a reason. Also defines the honest-empty
C4 contract and the separation of evidence usability from artifact validation.

(migrated).

## Requirements

### Requirement: Reader-facing navigation labels
Top navigation SHALL use reader-facing labels that are understandable without
knowledge of internals. Each section MUST begin with a one-sentence explanation
of what the section is, why the admiral would open it, what can be clicked, and
what clicking should reveal. Unexplained internal labels such as bare `Fleet`,
`Probes`, or `Receipt` MUST NOT be primary navigation labels.

#### Scenario: A cold reader understands the labels
- GIVEN a navigation atlas bundle is present
- WHEN the admiral opens /portolan:map
- THEN the top navigation uses reader-facing labels
- AND each section carries a one-sentence explanation
- AND unexplained internal labels are not the primary labels

### Requirement: Every primary click declares a destination
Every visible primary object SHALL declare exactly one of these outcomes: a
Dossier (full explanation for a major object), a Detail (bounded explanation for
a relation, risk, probe, stage, or evidence anchor), an External-evidence
handoff (only after the atlas has explained what the user is leaving to
inspect), or a Disabled-with-reason state. No click MAY silently fall back to a
generic repository or component page.

#### Scenario: No silent fallback to a generic page
- GIVEN a primary clickable object is visible
- WHEN the admiral activates it
- THEN it opens a dossier or detail, hands off to external evidence with explanation, or is disabled with a reason
- AND it does not land on a generic repository or component page without explaining the clicked object

### Requirement: Repository or component dossier answers placement and participation
Clicking a repository or component SHALL open a dossier that answers what it is,
why it is present, whether it participates in any system route, its coverage
state, relationships in and out, attached hazards, attached next checks,
evidence anchors, C4 placement or honest absence, and the next useful action.
If the object has no routes, hazards, probes, or evidence, the dossier MUST say
so explicitly and explain why it still appears.

#### Scenario: An object with nothing attached is explained
- GIVEN a component has no routes, hazards, probes, or evidence
- WHEN its dossier opens
- THEN it states this explicitly and explains why the component still appears

### Requirement: Relationship detail explains the edge
Clicking a relationship SHALL open a relationship detail that answers source
object, target object, relationship type, direction, whether it is
deterministic, fixture-backed, inferred, or unknown, its evidence state and
evidence refs, any route or stage context, attached hazards or probes, what the
relationship proves, and what it does not prove. When the data cannot support a
relationship detail, the click MUST be disabled or routed to a `not_assessed`
detail — never to a generic component dossier.

#### Scenario: A weak relationship is not dressed up
- GIVEN current data cannot support a relationship detail
- WHEN the admiral encounters the relationship
- THEN the click is disabled or opens a not_assessed detail
- AND it does not fall through to a generic component dossier

### Requirement: Route dossier supports stage focus
Clicking a system route SHALL open a route dossier that answers the system
question the route addresses, shows an ordered route diagram, marks the
source/build/deploy/test/runtime confidence boundary, gives stage details,
attached hazards, attached next checks, an evidence usability status for the
route, and a next expedition. The dossier MUST additionally allow focusing
individual stages.

#### Scenario: A route dossier focuses a single stage
- GIVEN a route diagram is visible
- WHEN the admiral clicks a stage
- THEN the dossier focuses that stage's detail without leaving the route context

### Requirement: Route stage detail states what it proves and does not
A route stage detail SHALL answer the stage's role, subject, source path and
anchor, line range if precise, a source excerpt if safe and available, a
missing or ambiguous explanation when the anchor is not precise, evidence state,
runtime/build/test status, attached hazards and probes, what the stage proves,
and what it does not prove. Source-visible stages MUST NOT be presented as
runtime/build/test proof.

#### Scenario: A missing anchor is explained in the stage detail
- GIVEN a route stage has a missing or ambiguous anchor
- WHEN its stage detail opens
- THEN the detail explains the missing or ambiguous anchor in plain language
- AND it does not present source visibility as runtime/build/test proof

### Requirement: Hazard or finding detail explains the risk
Clicking a hazard or finding SHALL open a risk detail that answers what the
hazard is, where it attaches, why it matters for navigation or decision-making,
its severity and confidence, evidence refs, the related route, stage, or
component, and a next check to reduce uncertainty. Findings MUST NOT be rendered
as a flat field dump.

#### Scenario: A finding opens as a risk explanation
- GIVEN a hazard or finding is visible
- WHEN the admiral opens it
- THEN a risk detail explains the hazard, why it matters, its confidence, evidence, and a next check

### Requirement: Unknown probe detail retains route context
Clicking a next check or unknown probe SHALL open a probe detail that answers
what is unknown, why the atlas cannot claim it, its status, the required
permission class, the exact next probe text, the expected output or artifact if
the probe runs, whether the probe is safe by default, and linked route, stage,
finding, or evidence context. Linked context MUST be derived in reverse from
route stages when the probe row itself lacks direct references.

#### Scenario: A probe keeps the context that made it matter
- GIVEN a next check appears without direct references
- WHEN the admiral opens its probe detail
- THEN the detail shows the linked route, stage, or finding context derived in reverse
- AND it names the required permission class and expected output

### Requirement: Evidence anchor detail states what it proves
Clicking an evidence chip or source anchor SHALL open an evidence detail that
answers the local path, anchor type, line range when precise, an excerpt of at
most twelve lines, evidence state, anchor quality, what the evidence proves,
what it does not prove, and linked route, stage, finding, or probe. Anchor
quality MUST be one of `precise`, `ambiguous`, `missing`, `missing-file`, or
`unresolved`. Source-visible evidence MUST NEVER imply runtime/build/test
verification.

#### Scenario: An evidence anchor reports its quality and limits
- GIVEN an evidence chip or anchor is visible
- WHEN the admiral opens it
- THEN the detail shows path, anchor quality, a bounded excerpt or missing explanation, and what the evidence does not prove

### Requirement: C4 is an honest-empty map, not a renamed graph
The C4 map SHALL be an optional decomposition view. The Context level MUST
always be present. The Container level MUST appear only with observed
runtime/deploy evidence; when that evidence is absent, Container MUST render
honestly empty with a plain explanation, greyed-out and never hidden. The
Component level MUST use promoted evidence only. C4 MUST NOT infer containers
from repository names, family colors, or visual grouping. C4 boxes MUST click
to dossiers or be disabled with an explanation.

#### Scenario: Container is honest-empty without runtime evidence
- GIVEN no runtime or deploy evidence is present
- WHEN the admiral opens the C4 map
- THEN Context is present
- AND Container is shown as honest-empty with an explanation, not hidden or fabricated

### Requirement: Evidence usability is distinct from artifact validation
The atlas SHALL surface an evidence-usability readout distinct from artifact
validation. Artifact validation MUST mean the artifact files parse and
references resolve; evidence usability MUST separately reflect whether route
stages have precise, partial, weak, or no source anchors, and whether
runtime/build/test claims were executed. A validated artifact MUST NOT be
displayed as if the atlas is evidence-rich.

#### Scenario: A validated artifact with weak anchors is not dressed up
- GIVEN the bundle validates structurally but key route anchors are missing or ambiguous
- WHEN the admiral opens the run log
- THEN artifact validation is shown separately from evidence usability
- AND the atlas does not imply that validated artifacts mean evidence-rich routes
