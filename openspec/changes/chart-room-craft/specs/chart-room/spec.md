## ADDED Requirements

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

#### Scenario: Determinism survives the craft pass
- **WHEN** the same chart is rendered twice after the re-styling
- **THEN** the files are byte-identical
