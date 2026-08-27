## ADDED Requirements

### Requirement: The fleet review draws the archipelago of provinces
Above the standing table, the fleet review SHALL render each named
province as a compact island group: vessels as seeded islands sized by
code volume with the shared trust-halo language, intra-province fairways
as thin curved lanes, dangers as the chart's danger marks, under a
province-name caption. Layout SHALL be deterministic (seeded relaxation,
fixed iterations) and re-derive everything from that province's embedded
index entries — nothing new is computed or invented. The sheet SHALL share
the fleet review's single self-contained file.

#### Scenario: Two provinces render as two groups
- **WHEN** the review covers two charted provinces
- **THEN** the sheet shows two island groups in target order, each drawn
  from its province's own entries

#### Scenario: The same fleet renders byte-identically
- **WHEN** the review renders twice over unchanged charts
- **THEN** the files are byte-identical

### Requirement: A province group links to its Chart Room honestly
Clicking a province group SHALL open that province's Chart Room artifact;
when the artifact has not been rendered, the group SHALL show an explicit
not-rendered state and SHALL NOT link anywhere.

#### Scenario: Rendered room opens from the group
- **WHEN** a province's `chart-room.html` exists and its group is clicked
- **THEN** the Chart Room opens

#### Scenario: Not-rendered stays non-clickable
- **WHEN** a province lacks its Chart Room artifact
- **THEN** its group displays the not-rendered state without a link
