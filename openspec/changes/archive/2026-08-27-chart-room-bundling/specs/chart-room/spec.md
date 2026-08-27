## ADDED Requirements

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

#### Scenario: Determinism survives
- **WHEN** the province renders twice
- **THEN** the files are byte-identical
