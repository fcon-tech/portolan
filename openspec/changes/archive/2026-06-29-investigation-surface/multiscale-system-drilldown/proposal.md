## Why

The atlas drills from the behaviour map into a dossier and into evidence, but it
lacks a multiscale model that lets the reader move across ecosystem → capability
→ component → module/package/concept. Without these scales, the reader cannot
zoom from "what does this landscape do" down to "what does this module mean"
within one coherent model; each level is ad-hoc.

## What Changes

- Introduce a multiscale drill-down model: ecosystem → capability → component →
  module/package/concept.
- Each scale SHALL be backed by evidence and SHALL connect to the scales above
  and below; a scale with no evidence MUST render honestly empty, not fabricated.

## Capabilities

### Modified Capabilities

- `navigation`: adds the multiscale drill-down model and the honest-empty rule
  per scale.

## Impact

- Composes with `semantic-investigation-producer` (semantic pages live at the
  capability/concept scales) and `overlap-duplication-and-alternatives`
  (capabilities cluster at the capability scale).
- Out of scope: the visual interaction per scale (design TBD).
