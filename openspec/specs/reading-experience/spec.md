# Reading Experience Specification

## Purpose

Defines how the atlas reads as a system atlas rather than a repository map: a
first screen of system journeys, route diagrams, reading dossiers, evidence
snippets, risks, unknown probes as expedition steps, scale-bearing coverage, and
the repository graph demoted to a supporting Fleet map.

(migrated).

## Requirements

### Requirement: First screen is a system walkthrough, not a graph
`/portolan:map` SHALL open to a system walkthrough when a navigation atlas is
present. The first viewport MUST show target identity, a one-paragraph summary
of what the system appears to be, three to five named system journeys, the top
risks or unknowns attached to those journeys, a clear next-expedition section,
and a secondary affordance to open the Fleet map. The repository/component graph
MUST NOT be the default hero or primary body.

#### Scenario: Walkthrough replaces the repo graph as the first screen
- GIVEN a target landscape and a navigation atlas bundle are present
- WHEN the admiral opens /portolan:map
- THEN the first screen shows named system journeys and a system summary
- AND it shows top risks or unknowns and a next-expedition section
- AND the Fleet map is available only as a secondary affordance
- AND the repository graph is not the primary first-screen content

### Requirement: Journey cards teach the system
Each journey card SHALL answer what the journey is, why it matters, which
files or repositories are involved, what is known, what is not assessed or
blocked, and what an agent should do next. A card that only echoes a route
identifier, family label, and stage count MUST NOT be accepted.

#### Scenario: A journey card conveys meaning, not metadata
- GIVEN a named system journey exists
- WHEN the admiral reads its card on the first screen
- THEN the card explains what the journey is and why it matters
- AND it states what is known and what is not assessed
- AND it names a concrete next action

### Requirement: Route screen is a diagram, not a table
Opening a journey or route SHALL present a route diagram before any table-like
detail. The diagram MUST render ordered stages, directional flow, stage
type/role, evidence state, runtime/build/test assessment, attached finding
badges, and attached unknown-probe badges. The diagram MUST depict a system
path, not a repository graph.

#### Scenario: A route opens to an ordered diagram
- GIVEN the admiral opens a system route
- WHEN the route screen renders
- THEN an ordered stage diagram appears before any tabular detail
- AND stages show evidence state and runtime/build/test assessment
- AND attached findings and unknown probes appear as badges

### Requirement: Route dossier is a reading surface
The route dossier SHALL be organized as route thesis, an ordered diagram, one
stage card per stage, evidence, risks, unknowns, and a next expedition. Stage
cards MUST show the stage title, its role, subject or repository, source path
and anchor, line range when precise, a visible snippet when safe and available,
evidence state, runtime/build/test status, and why the stage matters. When a
source anchor is ambiguous or missing, the dossier MUST state this in plain
language rather than hiding it in a badge.

#### Scenario: The dossier reads as prose with stage cards
- GIVEN a route dossier is opened
- WHEN the admiral reads it
- THEN it presents thesis, diagram, stage cards, evidence, risks, unknowns, and next expedition in order
- AND each stage card shows role, source anchor, evidence state, and why it matters
- AND ambiguous or missing anchors are explained in plain language

### Requirement: Evidence snippets prove source visibility only
The generated atlas SHALL show a short excerpt for each route stage with a
resolvable source path and precise anchor. Snippets MUST be at most twelve
lines and preserve line numbers. When the anchor is ambiguous, the atlas MUST
say so and show no fabricated precise lines; when the file is missing, it MUST
show the missing path and keep the stage visible. Snippets MUST NOT require
network or fetch remote URLs, and MUST NOT be presented as proof of runtime
behavior — only of source visibility.

#### Scenario: Ambiguous anchor is admitted, not fabricated
- GIVEN a route stage has an ambiguous source anchor
- WHEN its evidence renders
- THEN the atlas states the anchor is ambiguous in plain language
- AND it does not display fabricated precise line ranges

#### Scenario: Missing file keeps the stage visible
- GIVEN a route stage references a missing file
- WHEN its evidence renders
- THEN the missing path is shown
- AND the stage remains visible

### Requirement: Findings explain system risk where they matter
Findings SHALL appear on first-screen journey cards, on route diagrams, in route
dossiers, and in a separate findings index. Each finding card SHALL answer what
the risk is, where it attaches, why the admiral should care, what evidence
supports it, and what next check would reduce uncertainty. Findings MUST NOT be
rendered as a flat list of raw fields.

#### Scenario: A finding reads as a risk explanation
- GIVEN a route carries a finding
- WHEN the admiral reads the finding card
- THEN it explains the risk, where it attaches, why it matters, supporting evidence, and a next check

### Requirement: Unknown probes become expedition steps
Unknown probes SHALL appear as a plan rather than a passive list. Each probe
card SHALL show what is unknown, why the atlas cannot claim it, the required
permission class, the exact next probe text, the expected output or artifact if
the probe runs, and a link to the related route, stage, or finding. The first
screen MUST show the top next probes.

#### Scenario: A probe card reads as an actionable step
- GIVEN an unknown probe exists
- WHEN the admiral reads the probe card
- THEN it states what is unknown and why it cannot be claimed
- AND it names the required permission class and exact next probe text
- AND it links to the related route, stage, or finding

### Requirement: Coverage shows system scale
The coverage surface SHALL show covered regions, partial regions, missing or
route-less regions, a central versus peripheral distinction when derivable,
counts by route status, and the routes, findings, and unknowns attached to each
region. Coverage MUST NOT be only a flat subject table.

#### Scenario: Coverage distinguishes scale and gaps
- GIVEN the target corpus has multiple subjects
- WHEN the admiral opens coverage
- THEN covered, partial, missing, and route-less regions are visible
- AND representative regions link to routes, findings, or unknown probes

### Requirement: Fleet map is supporting, not primary
The existing repository/component graph SHALL remain available as a Fleet map
that is one click away from the walkthrough, is not the default first screen
when a navigation atlas exists, links back to journeys and routes, and does not
present weak or empty graph nodes as system understanding.

#### Scenario: The graph is secondary to the walkthrough
- GIVEN a navigation atlas exists
- WHEN the admiral opens /portolan:map
- THEN the Fleet map is reachable as a secondary map
- AND it is not the default first screen

### Requirement: Follow-up agent handoff is visible
The generated atlas SHALL include a visible next-expedition or agent-handoff
area with copyable command or query affordances for the supported journeys,
routes, probes, findings, receipt validation, and coverage gaps.

#### Scenario: Handoff queries are copyable
- GIVEN the atlas is generated
- WHEN the admiral opens the next-expedition area
- THEN copyable commands or queries for journeys, routes, probes, findings, receipt validation, and coverage gaps are visible
