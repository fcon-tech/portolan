# chart-room-search Design

## Decision 1: dim, never hide

Filters focus attention; they never remove vessels from the page. A dimmed
island keeps its label and stays clickable. Rationale: the honesty rule
says nothing on the map may be hidden; hiding facts behind a default-on
filter is how generated diagrams start lying.

## Decision 2: no new embedded data

Find matches `id` and the display name already present in the embedded
vessel list; trust filters read the per-record `trust`; dangers-only reads
the chart's danger entries. Core changes nothing — this change cannot
affect determinism (no data bytes move).

## Decision 3: semantics

- Trust toggles are a whitelist: active set T → vessel shows full opacity
  iff its record trust ∈ T (records of other kinds inherit their owner
  vessel's fate for marks/lanes). Empty active set = all shown.
- Dangers-only: vessels with ≥1 danger entry stay bright.
- Find: best match by exact id, then prefix, then substring; selecting it
  opens the dossier + impact highlight (existing select()).
- Filter pills render inside the top bar as toggle chips; one "reset" chip
  clears all. State is session-only (not persisted) so a shared file always
  opens unfiltered.
