## ADDED Requirements

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
