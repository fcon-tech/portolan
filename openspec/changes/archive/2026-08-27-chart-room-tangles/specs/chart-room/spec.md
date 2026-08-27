## ADDED Requirements

### Requirement: The Chart Room exposes dependency tangles as data
Rendering SHALL compute the tangles of the province — strongly connected
components of size ≥ 2 in the fairway graph over vessel ids, discovered
deterministically — and embed them in the export. Self-loops and
single-vessel components SHALL NOT count as tangles. The computation is
arithmetic over the machine index; nothing is inferred from names,
density, or note text.

#### Scenario: A two-vessel cycle is one tangle
- **WHEN** the chart holds fairways a→b and b→a
- **THEN** the export embeds exactly one tangle whose members are a and b

#### Scenario: A clean province embeds an empty list
- **WHEN** the fairway graph is acyclic (including self-loops only)
- **THEN** the export embeds zero tangles

### Requirement: Tangles render loudly or state their absence
When tangles exist, the nautical representation SHALL place a whirlpool
mark at each tangle's member centroid, the briefing panel SHALL list every
tangle with its members in both representations, and a member vessel's
dossier SHALL name its tangle-mates. When none exist, the panel SHALL show
an explicit calm state ("no dependency tangles") — silence is not an
honest answer to a structural question.

#### Scenario: A tangled province is unmissable
- **WHEN** the Chart Room renders a province whose chart contains a cycle
- **THEN** both representations surface the tangle (mark plus listed
  members) and clicking a member vessel shows its tangle-mates

#### Scenario: A clean sea says so
- **WHEN** the rendered province has zero embedded tangles
- **THEN** the briefing panel states "no dependency tangles" instead of
  omitting the section
