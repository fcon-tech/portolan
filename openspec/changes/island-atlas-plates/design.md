# island-atlas-plates Design

## Decision 1: hover plate, not permanent chrome

A plate on every island at rest would bury the map (the v2 lesson:
exhaustive literalism). The hover keeps every island carrying its atlas
piece while the resting sea stays clean; click remains the deep dive.
Touch: first tap selects (dossier), so plates are pointer-driven.

## Decision 2: facts = already-embedded chart bytes only

Identity/trust/stale/note/behavior/files from the vessel entry; counters
from embedded fairway/portOfEntry/beacon/light/danger entries; newest
notice from the embedded `notices` (first match where
`key === "vessel/<id>"`); role tags are the existing arithmetic (fan-in,
fan-out, entry reachability) with fixed thresholds. Nothing fetched,
nothing invented.

## Decision 3: SVG plate in world coordinates

Built as one `<g id="plate">` above labels: rect stack (paper fill, double
frame via two strokes), left trust ribbon 6px, text rows at a compact type
scale. Anchored to the island's bounding circle: default right of the
island, flipped left when `x > W-320`, raised/lowered when near top/bottom;
never overlaps its own island (offset ≥ r+18). World-coordinate sizing is
acceptable — it reads as an inset pasted on the chart.

## Decision 4: dismissal & interplay

`pointerleave` hides it; selection (click) hides the plate and opens the
dossier as today; `Escape`/clear also clears it. During blast dimming the
plate follows the lit island's z-order (drawn last anyway).
