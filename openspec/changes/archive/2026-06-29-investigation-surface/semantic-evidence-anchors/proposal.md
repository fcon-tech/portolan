## Why

A semantic claim without an evidence anchor is an assertion. Today semantic
pages can carry agent or derived claims without a machine-checkable backing (a
source card, a local source anchor, or a command receipt). To keep the
investigation honest, every semantic claim SHALL be tied to concrete evidence or
explicitly marked `not_assessed` — never presented as verified without backing.

## What Changes

- Require every semantic claim to carry one of: a source card, a local source
  anchor, or a command receipt — or be explicitly marked `not_assessed`.
- A claim without any anchor MUST NOT render as verified; the atlas MUST surface
  the missing anchor, not hide it.

## Capabilities

### Modified Capabilities

- `semantic-investigation`: every claim SHALL carry an evidence anchor or an
  explicit `not_assessed` state.

## Impact

- Composes with `semantic-investigation-producer` (18): generated pages must
  attach anchors to the claims they emit.
- Extends (does not replace) the living requirement "Source boundary labels
  every semantic assertion" in `openspec/specs/semantic-investigation/`, which
  already requires source-boundary labels and resolvable source cards for
  curated claims. This change ADDS a command-receipt anchor type and the
  never-render-unanchored-as-verified enforcement.
- Out of scope: the anchor storage format (design TBD).
