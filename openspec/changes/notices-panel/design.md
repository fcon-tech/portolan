# notices-panel Design

## Decision 1: parse in core, render in the page

`render.ts` parses `notices.txt` (the exact plain-text grammar produced by
`renderNotices`: label padded to 14 columns, entry key, optional " — note",
indented `anchor:` lines) into structured JSON and embeds it next to the
chart entries. The page renders it like every other embedded fact. Parsing
the file — not re-diffing indexes — keeps this a pure byproduct read with
zero coupling to the write path.

## Decision 2: panel-only scope

The notices appear as a briefing-panel section. No new map marks, no
timeline layout, no history depth beyond what the file holds (the store
replaces notices.txt on each write — it is the current report, not an
archive). Map-layer treatment stays out per the chart-room v1 boundary.

## Decision 3: honesty for the empty case

The store deletes `notices.txt` when empty, so absence means "no
outstanding notices" and MUST render as a stated empty line, not a hidden
section (the honesty invariant: unknown/empty stays visible).

## Parser notes

- Header line `NOTICES TO MARINERS` and blank lines are skipped.
- Entry lines match `^(ADDED|CORRECTED|MARKED STALE|RETIRED)\s+(.*)$`;
  the remainder splits on the first ` — ` into key and note.
- Continuation lines `\s+anchor: <formatted anchor>` append to the current
  notice verbatim (already formatted strings — the page never resolves
  them).
