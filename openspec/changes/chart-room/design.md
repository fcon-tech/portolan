# chart-room Design

## Context

The spike (2026-08-25, Governor-accepted after one iteration) rendered the
Bigtop chart as one self-contained HTML file: nautical archipelago map +
engineering layered graph, dossier + impact set on click, deterministic
layout, zero runtime dependencies. This change ports that spike into `core/`
under the product contract. The spike's BRIEF (`experiments/map-spike/`
until deletion) is the visual contract; this design records the structural
decisions.

## Decision 1: byproduct export, not a surface

The Chart Room is generated **on demand**; nothing in the write path changes.
`chart.write` keeps regenerating sheets only. The export reads `index.jsonl`
plus (if present) `sailing-directions.md` and writes exactly one file:
`<target>/.portolan/chart-room.html`. No server, no network, no daemon — the
non-goal in MANIFEST ("HTML atlas at most a byproduct") is the binding frame.

## Decision 2: one core function, two entry points

- `core/src/chartroom/render.ts` — `renderChartRoom(target): { path, counts }`,
  the single implementation (reads the chart, embeds data, writes the file).
- `core/src/chartroom/template.ts` — the HTML template (data placeholders
  `__CHART_DATA__`, `__BRIEF_HTML__`, `__META__`; substitution uses function
  replacements so `$`-sequences in chart notes cannot corrupt the script —
  a bug found and fixed in the spike).
- `core/src/chartroom/cli.ts` — `render --target <t>` for humans/schedulers.
- `chart.render` MCP tool — so the Cartographer can produce it when the
  Governor asks; registry entry only, like every other tool.

Both entry points fail loudly (exit 1 / tool error) when the target has no
chart.

## Decision 3: layout and interaction live in the page

The artifact embeds the raw chart JSON and computes everything (islands,
lanes, ranks, impact sets) in deterministic in-page JS (seeded PRNG, fixed
iteration counts). Rationale: the file must work from `file://` offline on
any machine; core stays free of DOM code; and byte-determinism is testable
end-to-end (same chart in → same bytes out) without a browser in the loop.

## Decision 4: two representations, one truth

Nautical mode = the archipelago map (the product's identity). Engineering
mode = a layered dependency graph (the Governor's explicit iteration
request). Both are views over the same embedded data with the same clicks
(vessel dossier, transitive impact set) and the same honesty rules; the
toggle swaps representation and lexicon, persists in `localStorage`, and
clips to the neatline in both modes. This replaces the spike BRIEF's earlier
"frozen geometry" wording — representations may differ, data and clicks may
not.

## Decision 5: honesty rules are render rules

- The trust legend is always visible; nothing renders trust-free.
- `unsurveyed` renders as blankness/pale band, never as an invented shape.
- `stale` renders as a hatched "pending correction" overlay.
- The map renders only what the chart contains plus arithmetic over it
  (fan-in, transitive dependents, trust shares); no new facts are invented.

## What is deliberately NOT here (v1 boundaries, recorded)

Search; lights/beacons as map layers (dossier only); Notices timeline;
harbor/night-watch history layers; multi-province index; cycle/tangle
highlighting. Each is a future change with its own scenario, not a TODO
here.
