# chart-write-shrink-guard Design

## Decision 1: guard at the store, not the callers

`writeChart(targetRoot, entries, options?)` is the single choke point every
surface (MCP, future CLIs) already routes through; a guard there protects
all of them at once. The MCP schema gains `allowShrink` (boolean, optional,
default false) and passes it through.

## Decision 2: 75 % threshold, total-count comparison

Compare `entries.length` against the existing index's entry count (the
raw previous line count — no staleness subtleties). Reject when
`entries.length < Math.floor(existing * 0.75)`. Rationale: legitimate
expedition writes carry the whole chart plus their corrections; a drop
past a quarter is not an edit, it is a different chart. The message reads:
`chart.write refused: N entries would shrink the chart from M
(allowShrink to override)` — the override is taught by the error.

## Decision 3: first write and growth are free

No existing index ⇒ nothing to shrink ⇒ no guard. Equal or larger writes
pass unchanged. Staleness/uniqueness validation order stays as today (the
guard runs first, cheap, before any validation work).
