# Three Truths Specification

## Purpose

Defines how the landscape is understood through three versions of the truth
(behaviour, intentions, representations) and how triangulation highlights where
they disagree, with graceful degradation when only one truth is present.

Source authority: `docs/captain-atlas/08-portolan-product-charter.md` § The
Three Truths (migrated); Gherkin: feature-p1a-honest-absence.feature.

## Requirements

### Requirement: Behaviour is the primary truth
Behaviour (what the code actually does, declares, and depends on) SHALL be the
primary truth and the backbone of the atlas. Intentions and representations are
additional axes, not the goal.

#### Scenario: Behaviour-only atlas is valid
- GIVEN intake names only repositories
- WHEN the snapshot builds
- THEN the atlas is behaviour-only
- AND this is a complete, valid Part-1 result

### Requirement: Three truths
The landscape SHALL be understood through three truths: Behaviour (primary),
Intentions (tickets, roadmaps, planning artefacts), and Representations
(documentation, architecture notes).

#### Scenario: Intentions and representations enter via intake as sources
- GIVEN the admiral names a ticket source and a docs location
- WHEN intake completes
- THEN intentions and representations are recorded as sources
- AND deterministic producers parse ticket metadata and index doc text

### Requirement: Triangulation finds disagreements
Portolan's uniqueness SHALL be triangulation: where behaviour, intentions, and
representations agree there is reliable ground; where they disagree there is a
finding. A triangulation finding SHALL link a behaviour assertion to a
conflicting or stale intention/representation via resolvable evidence pointers.

#### Scenario: Stale doc becomes a finding
- GIVEN a doc describes a service removed in a known commit
- WHEN triangulation runs
- THEN a finding links the doc to the behaviour with the commit cited

### Requirement: Graceful degradation when truths are absent
If the admiral names only repositories (no tickets, no docs), the atlas SHALL be
behaviour-only and this MUST NOT be a failure. The triangulation overlay MUST be
absent or show "no intentions/representations ingested; behaviour-only atlas."
The acceptance bar's triangulation step SHALL be conditional on the relevant
truths being present in intake.

#### Scenario: Behaviour-only overlay state
- GIVEN a behaviour-only atlas
- WHEN the admiral views the overlay control
- THEN it shows "no intentions/representations ingested; behaviour-only atlas"
- AND no failure is indicated

### Requirement: 0.2.0 schema addition for triangulation
Triangulation data contract SHALL require a 0.2.0 schema addition for
intention/representation objects and a finding shape referencing both sides.
Until that migration ships, triangulation SHALL be target-state and the
behaviour-only atlas SHALL be the shippable Part-1 minimum.

#### Scenario: Behaviour-only ships before 0.2.0
- GIVEN the 0.2.0 migration has not shipped
- WHEN Part-1 acceptance is evaluated
- THEN the behaviour-only atlas satisfies the Part-1a bar
- AND triangulation is gated as Part-1b
