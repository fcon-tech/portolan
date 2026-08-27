## ADDED Requirements

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
