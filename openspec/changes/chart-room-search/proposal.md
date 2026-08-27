## Why

On a chart past a screenful of islands, orientation needs a query: "where is
livy?", "show me only untrusted waters", "what carries dangers?". The data
is already embedded in every export; only the search surface is missing.

## What Changes

- The top bar gains a **find field** (matches vessel id or display name,
  case-insensitive; the best match is selected and centered) and two
  **filters**: per-trust toggles (measured/charted/reported/doubtful/
  unsurveyed) and a **dangers-only** toggle. Filtering dims non-matching
  islands/edges/nodes in both representations but hides nothing — labels
  stay, selection still works on dimmed vessels (an honesty-boundary
  filter: never hide facts, only focus attention).
- Filters combine with find; a visible state pill shows active filters with
  one-click reset.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `chart-room`: adds requirements (ADDED deltas): find-by-name-or-id, trust
  filters, dangers-only filter, combined display-only focusing.

## Impact

- Code: `template.html` only (top bar controls + dimming logic). Core,
  CLI, MCP contracts untouched — no new embedded data.
