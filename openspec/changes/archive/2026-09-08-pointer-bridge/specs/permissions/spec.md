# permissions Specification

## Purpose

Defines the perimeter a Portolan expedition never crosses: the one
approval a session may ask, the only directory anything may be written to,
and the rule that a province read — however it is cited — never resolves
outside the target.

## MODIFIED Requirements

### Requirement: Writes stay under the province
Every file Portolan writes SHALL land under `<target>/.portolan/`: the
Chart, the ship's log, the harbor snapshot and history, the Sailing
Directions archive, and the Chart Room export. The single exception is the
Pointer: the Cartographer SHALL place or refresh the marker-delimited
Pointer block in `<target>/AGENTS.md` as the pointer capability mandates —
one block, in one file, replacing or appending only between the markers.
Nothing else outside the province is ever written. The target's own sources
SHALL never be mutated: Portolan is a reader, not a surgeon. A needed
source change is charted as a danger with an anchor, never performed or
proposed as an edit.

#### Scenario: A survey mutates nothing but its own waters
- **WHEN** an expedition charts, receipts, renders, or archives anything
- **THEN** every written path resolves under `<target>/.portolan/` except
  the Pointer block in `<target>/AGENTS.md`, and the target's tracked
  sources other than that block are byte-identical before and after

#### Scenario: The Pointer is the one outside write
- **WHEN** the expedition's close-out Pointer step refreshes the block
- **THEN** only the text between the harbor markers changes in
  `AGENTS.md`, and no other file outside `<target>/.portolan/` is touched

#### Scenario: A needed source change is charted, not made
- **WHEN** a survey establishes that the target needs a source change
- **THEN** the expedition charts a danger carrying an anchor to the lines
  that exhibit the need, and performs no edit
