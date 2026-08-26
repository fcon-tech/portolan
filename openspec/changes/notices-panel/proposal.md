## Why

The Chart Room shows the province as it stands, but the Governor returning
to a charted province needs what changed since the last visit. That report
already exists — Notices to Mariners (`notices.txt`, written by every
`chart.write`) — but only as plain text in the chart directory. The room
where charts are read should carry it.

## What Changes

- The Chart Room gains a **Notices panel**: the parsed content of
  `<target>/.portolan/chart/notices.txt` (action, entry key, note,
  anchors), listed in the briefing side panel with per-action styling.
- An empty or absent notices file renders as an honest empty state ("no
  outstanding notices"), never a missing section.
- Engineering mode uses its lexicon for the section title ("Change log");
  action labels stay the canonical ADDED / CORRECTED / MARKED STALE /
  RETIRED.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `chart-room`: adds a requirement (delta uses ADDED — no standing chart-room
  requirement changes text): the export embeds and surfaces the Notices to
  Mariners of the charted province, honestly when there are none.

## Impact

- Code: `core/src/chartroom/render.ts` gains `parseNotices` + embedding;
  `template.html` gains the panel section. CLI/MCP contracts unchanged.
- Storage untouched: notices.txt is read-only input like everything else.
