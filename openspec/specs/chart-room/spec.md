# chart-room Specification

## Purpose
TBD - created by archiving change chart-room. Update Purpose after archive.

## Requirements

### Requirement: The Chart Room is a byproduct export of the Chart
The Chart Room SHALL be a single self-contained HTML file written to
`<target>/.portolan/chart-room.html`, generated only on demand from the
Chart's machine index (and, when present, the Sailing Directions). It SHALL
read the Chart and write exactly that one file, create no server, open no
network connection, and add no runtime dependency. When the target has no
Chart, generation SHALL fail loudly, naming the missing path.

#### Scenario: On-demand render writes one file
- **WHEN** the Chart Room is rendered for a charted province
- **THEN** `<target>/.portolan/chart-room.html` exists, is self-contained
  (opens from `file://` with no network or installation), and no other file
  outside `.portolan/` is written

#### Scenario: No chart, no export
- **WHEN** the Chart Room is rendered for a target without
  `.portolan/chart/index.jsonl`
- **THEN** generation fails with an error naming the expected chart path and
  no artifact is written

### Requirement: One truth, two representations
The Chart Room SHALL offer the nautical representation (an archipelago map:
vessels as islands sized by code volume, fairways as lanes styled by trust,
dangers as Chart No. 1 style symbols, ports of entry marked) and the
engineering representation (a layered dependency graph: dependents above,
foundations below). Both SHALL be computed from the same embedded chart
data, expose the same dossier per vessel (notes, trust, anchors, fairways,
dangers) and the same transitive impact set on selection, and differ only
in representation and lexicon.

#### Scenario: The same vessel answers in both modes
- **WHEN** a vessel is selected in either representation
- **THEN** the dossier shows the same trust label, note, and anchor list,
  and the same set of transitive dependents is highlighted

#### Scenario: The toggle swaps the world, not the facts
- **WHEN** the representation toggle is used
- **THEN** the lexicon switches (vessel/component, fairway/dependency,
  danger/risk, port of entry/entry point, unsurveyed/unknown) and the
  rendering switches, while the underlying data and interactions are
  unchanged

### Requirement: Honesty is rendered, never hidden
The Chart Room SHALL keep a trust legend visible in every representation.
`unsurveyed` SHALL render as absence (blank or pale water), never as an
invented shape; `stale` SHALL render as a visible pending-correction
treatment. Nothing on the map MAY present a fact the Chart does not
contain; derived numbers (fan-in, transitive dependents, trust shares)
SHALL be arithmetic over the index only.

#### Scenario: The trust legend survives every mode
- **WHEN** either representation is active
- **THEN** a legend explaining the trust vocabulary is visible without any
  user action

#### Scenario: Unknown water stays empty
- **WHEN** a chart region or record is `unsurveyed`
- **THEN** it renders as blankness or a pale band with no invented detail,
  and an `unsurveyed` vessel shows its unsurveyed sections in the dossier

### Requirement: The export is deterministic
Rendering the same Chart state twice SHALL produce byte-identical files:
layout randomness SHALL come from a seed derived from the chart content,
iteration counts SHALL be fixed, and no timestamps SHALL be embedded.

#### Scenario: Same chart, same bytes
- **WHEN** the Chart Room is rendered twice over an unchanged
  `index.jsonl` and Sailing Directions
- **THEN** the two `chart-room.html` files are byte-identical

### Requirement: Two entry points over one implementation
The Chart Room SHALL be reachable as the MCP tool `chart.render` (using the
server's bound target) and as a CLI render command taking `--target`; both
SHALL call the same core function and report the written path and entry
counts.

#### Scenario: The Governor asks, the Cartographer renders
- **WHEN** the `chart.render` tool is called on a charted province
- **THEN** it returns the artifact path and the rendered entry counts,
  having written only `<target>/.portolan/chart-room.html`

#### Scenario: The CLI renders the same artifact
- **WHEN** the CLI renders a province the MCP tool just rendered
- **THEN** the produced file is byte-identical to the tool's output

### Requirement: The Chart Room surfaces the Notices to Mariners
The Chart Room SHALL embed the parsed content of the province's Notices to
Mariners (`<target>/.portolan/chart/notices.txt`) and list it in the
briefing panel: every notice's action (ADDED, CORRECTED, MARKED STALE,
RETIRED), entry key (`kind/id`), note when present, and anchors. A missing
or empty notices file SHALL render as a visible "no outstanding notices"
state, not an absent section. The file is read-only input; rendering SHALL
change no storage.

#### Scenario: Outstanding notices are listed
- **WHEN** the Chart Room is rendered for a province whose chart carries
  outstanding notices
- **THEN** the briefing panel lists each notice with its action label,
  entry key, note, and anchors

#### Scenario: No notices stay visible as empty
- **WHEN** the rendered province has an empty or absent `notices.txt`
- **THEN** the briefing panel shows an explicit no-outstanding-notices
  state in both representations

#### Scenario: Engineering mode renames the section, not the facts
- **WHEN** the engineering representation is active
- **THEN** the section title uses the change-log lexicon while action
  labels remain ADDED / CORRECTED / MARKED STALE / RETIRED
