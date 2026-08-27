# fleet-review Specification

## Purpose
TBD - created by archiving change fleet-review. Update Purpose after archive.

## Requirements

### Requirement: The fleet review assembles named provinces on one page
The fleet review SHALL be a single self-contained HTML file written to
`<first-target>/.portolan/fleet-review.html`, listing exactly the targets
named explicitly on the command line (in order). It SHALL never discover
targets by scanning the filesystem. Every target SHALL be read-only input;
the only write is the one artifact inside the first target's perimeter.

#### Scenario: Two provinces assemble into one review
- **WHEN** the CLI renders a fleet review over two charted provinces
- **THEN** `<first>/.portolan/fleet-review.html` exists, lists both
  provinces in the given order with per-province entry counts and trust
  shares derived from their indexes, and links to each province's Chart
  Room

#### Scenario: A non-charted target fails loudly
- **WHEN** any named target lacks `.portolan/chart/index.jsonl`
- **THEN** the render fails naming that target's expected chart path and no
  artifact is written

### Requirement: The review renders facts, never fabrication
Each province row SHALL carry only arithmetic over that province's machine
index: entry counts by kind, trust shares, stale count, top hub by fan-in,
danger count. When `chart-room.html` does not exist for a province, its
link SHALL be shown honestly as not-yet-rendered rather than omitted or
guessed otherwise.

#### Scenario: Counts come from the index alone
- **WHEN** a province's index holds known entries
- **THEN** the review row shows exactly those counts; an absent Chart Room
  artifact is labelled "not rendered yet"

### Requirement: The export is deterministic and CLI-only
Rendering the same target list over unchanged charts SHALL produce
byte-identical output. The MCP surface SHALL NOT expose a fleet tool: a
server is bound to one province by contract.

#### Scenario: Same fleet, same bytes
- **WHEN** the review is rendered twice over unchanged provinces
- **THEN** the two files are byte-identical

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
