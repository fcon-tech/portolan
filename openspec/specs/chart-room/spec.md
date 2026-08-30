# chart-room Specification

## Purpose
The Chart Room is Portolan's one-file visual export: a single self-contained
HTML rendering of a province's Chart, offering the same data in two
representations — the nautical archipelago and the layered engineering
graph — with per-vessel dossiers, a visible trust legend, the Notices to
Mariners, dependency tangles, and honest empty states. It is a byproduct:
generated only on demand, deterministic byte-for-byte, reading the Chart and
writing nothing but its own file.

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

### Requirement: The reader can focus without hiding
The Chart Room top bar SHALL offer a find field matching vessel ids and
display names case-insensitively (best match: exact id, then prefix, then
substring; the best match is selected with its dossier), per-trust filter
chips, and a dangers-only chip. Filtering SHALL only dim non-matching
vessels in both representations — dimmed vessels keep their labels and
stay clickable — and SHALL never remove data from the page. A visible
state indicator SHALL show active filters with a one-click reset; a fresh
export always opens unfiltered.

#### Scenario: Find by name fragment selects and opens the dossier
- **WHEN** "zoo" is typed into the find field on the Bigtop export
- **THEN** zookeeper is selected, its dossier opens, and its impact set is
  highlighted

#### Scenario: A trust chip dims the rest but hides nothing
- **WHEN** only `measured` is active among trust chips
- **THEN** vessels whose records are measured render at full attention,
  all others are dimmed but remain labeled and clickable

#### Scenario: Dangers-only focuses risk carriers
- **WHEN** the dangers-only chip is toggled on
- **THEN** vessels carrying at least one danger stay bright and clean
  waters dim in both representations

#### Scenario: Reset restores full attention
- **WHEN** any combination of filters is active and reset is pressed
- **THEN** every vessel returns to normal rendering

### Requirement: The nautical representation reads as a chart
The archipelago rendering SHALL follow the craft contract: the sea visibly
recedes behind the land (deeper field, coast-ward halo steps); fairways
render as tapered curved lanes lifted off the water, fanned apart at hub
approaches instead of collapsing into one point; the label ladder keeps
every vessel legible at overview zoom; ports of entry, the rhumb net, and
the compass rose sit within the neatline without colliding with labels.
Every trust distinction SHALL stay visible after the re-styling.

#### Scenario: A clean-sea screenshot passes the checklist
- **WHEN** a charted province is rendered and reviewed against the six
  gaps (figure-ground, lane taper and fan spread, label legibility, port
  glyph placement, rhumb/rose placement, legend separation)
- **THEN** no listed gap remains in the rendering

### Requirement: Busy arrivals braid, labels keep their plane
Lanes arriving at one hub from the same rough direction SHALL stagger
their curvature deterministically (index within the target-and-direction
group, alternating sides), so parallel stripes read as separated arcs
that land in the existing fan. After layout, island labels SHALL resolve
their mutual overlaps in two deterministic passes (largest first,
vertical shifts only); a label never moves onto another island. The
trust encodings and the tapered/cased lane geometry are unchanged.

#### Scenario: The mid-map stripes become a braid
- **WHEN** a hub receives several lanes from neighboring waters on the
  same side
- **THEN** their curves separate mid-run (staggered bends) instead of
  running as parallel lines

#### Scenario: Labels do not stack
- **WHEN** two island labels would overlap at overview zoom
- **THEN** after the render they occupy distinct vertical bands without
  leaving their own island's vicinity

### Requirement: Pointing at an island raises its atlas plate
Hovering an island SHALL raise an anchored atlas plate beside it — a
parchment inset with double frame and a trust ribbon on its left edge —
carrying, from the already-embedded chart data only: the vessel's display
name and id; file volume and source-path count; counters of fairways in,
fairways out, ports of entry, beacons, lights, and risks (with the map's
mini glyphs); the behavior line ("measured behavior" with its citation
kind when charted, else "runtime unsurveyed"); a pending-correction strip
when `stale`; the newest standing Notice to Mariners touching this vessel
when one exists; and a derived role tag (Hub ≥5 inbound, Gateway ≥3 in and
≥3 out, Leaf without outbound fairways, Derelict unreachable from any port
of entry). Engineering mode SHALL swap the lexicon only.

#### Scenario: A hub shows its load honestly
- **WHEN** the largest hub is hovered
- **THEN** the plate names it, carries the Hub tag, counts both fairway
  directions and every risk, and states its behavior truth

#### Scenario: The plate obeys the frame
- **WHEN** an island near the right neatline is hovered
- **THEN** the plate flips to stay fully inside the frame without covering
  its own island

#### Scenario: Leaving clears the plate
- **WHEN** the pointer leaves the island or the selection is cleared
- **THEN** no plate remains; clicking still opens the dossier and impact
  set as before

#### Scenario: Honesty is not optional on the plate
- **WHEN** a stale or unsurveyed vessel is hovered
- **THEN** the pending-correction strip / runtime-unsurveyed line appears
  exactly as it would in the dossier

### Requirement: The dossier carries an epistemic ledger
Each vessel dossier SHALL open with a four-lamp ledger — **OBSERVED**
(runtime: `behavior` present, or a receipt-type anchor on the vessel's
own entries), **VERIFIED** (trust `measured`), **DECLARED** (trust
`charted`), **CLAIMED** (trust `reported` or `doubtful`) — each counting
that vessel's associated entries, with a one-line footnote mapping the
lamps to the trust vocabulary. The briefing panel SHALL be at least 520px
wide. All counts SHALL derive arithmetically from embedded fields only.

#### Scenario: A hub's ledger separates its evidence tiers
- **WHEN** the dossier of a vessel with measured and charted entries is
  opened
- **THEN** VERIFIED and DECLARED show distinct non-zero counts taken from
  those entries, and the footnote names the mapping

#### Scenario: Observed needs a receipt or it is not observed
- **WHEN** no receipt anchor backs the vessel's behavior or entries
- **THEN** OBSERVED reads zero/absent with the unsurveyed statement, even
  when other lamps are high

#### Scenario: Claims name their carriers
- **WHEN** any entry of the vessel carries reported or doubtful trust
- **THEN** CLAIMED lists each such kind/id instead of a bare count

#### Scenario: Sounded verdicts ride their fairway rows
- **WHEN** a stored fairway note records a sounded verdict
- **THEN** the corresponding fairway row shows it in the dossier
