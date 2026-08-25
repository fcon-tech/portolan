# Spike: Chart Room — a map of the province

Throwaway prototype. Proves whether Portolan can render a chart as a
**high-quality map**, before any openspec change is cut. Not part of the
product contract; deleted once the capability is built in `core/` (or kept as
reference until then). The Governor's verdict — and only the Governor's —
decides the outcome; "good enough" self-certified by an agent is the v2
failure mode and counts for nothing.

## Job

A technical leader (the Governor, or a stranger) opens an **unfamiliar
province** and, in ~5 minutes, can answer: what is this system; what is it
made of; where do I enter; where are the risks; what on this map must I not
trust. Secondary job: demo — the map is one file that can be sent and opened
anywhere with zero install.

## Form

- One self-contained static HTML file, `<target>/.portolan/chart-room.html`,
  generated on demand from the chart. No server, no network, no dependencies
  beyond the browser. Interactivity lives inside the file.
- Input (read-only, the only data source): `<target>/.portolan/chart/index.jsonl`
  and `<target>/.portolan/sailing-directions.md`. If data is not in the chart,
  it is not rendered. Derived arithmetic over the index is allowed (fan-in,
  transitive dependents, trust shares, derelict detection).

## The map

Archipelago, not a node-link graph:

- **Vessel = island**; area encodes `signature.files` (sqrt scale, clamped;
  label laddering follows rank). Retired hulls (derelicts — unreachable from
  any port of entry) sit in a "graveyard" margin, hulled-down.
- **Fairway = curved shipping lane** from `from` to `to`; lane style encodes
  trust (`measured` solid dark, `charted` solid mid, `reported` dashed,
  `doubtful` faint dashed; `unsurveyed` edges extend blast radius "into the
  unknown" with a dotted fade).
- **Danger = Chart No. 1 symbol** on the owning island's coast: rock `+`,
  shallow `*`-style, wreck fishbone with dotted danger circle.
- **Port of entry = anchor symbol** + protocol letter.
- **Trust of waters**: stepped bathymetric bands (sequential sand→teal→indigo
  ramp, never rainbow); island coastal halo band = vessel trust; the trust
  legend is always visible and cannot be toggled off.
- **Badges**: god-hub (fan-in ≥ 5, with dependent count), derelict.
- **Deterministic**: seeded PRNG (mulberry32), fixed iteration counts; the
  same chart always renders the same map.

## First screen

Map as the hero; side panel = briefing from `sailing-directions.md`
(the waters, top findings, unsurveyed waters). The panel and the trust legend
are part of the screen, not hidden chrome.

## Interactions

- Pan / zoom (wheel, drag); zoom levels control label density (generalization:
  small islands group into labelled clusters at far zoom — but nothing is ever
  hidden, only summarized).
- Click island → dossier: name, trust, note, dangers, fairways in/out with
  trust and anchors, ports of entry, beacons/lights if present, unsurveyed
  section, file count.
- Click = **blast radius**: transitive dependents highlighted, rest dimmed;
  unsurveyed edges marked as unknown reach.
- **Nautical ↔ engineering toggle**: one button swaps the representation AND the
  lexicon (vessel→component, fairway→dependency, danger→risk, port of entry→entry
  point, beacon→config, light→API contract, unsurveyed→unknown, pending
  correction→stale). Nautical mode renders the archipelago map (parchment,
  bathymetry, Chart No. 1 chrome); engineering mode renders a **layered
  dependency graph** (dependents above, foundations below, barycenter-ordered,
  flat dark tokens) — same data, same clicks (dossier, impact set), two
  representations. Default nautical; choice persists (localStorage); UI
  language is English. Pan/zoom is clipped to the neatline in both modes.

## Craft bar (the previous atlas died on these)

- Visual hierarchy: islands → lanes → dangers → labels → marginalia; all
  decoration sits below the data. Figure-ground: water recedes, land advances.
- Bathymetric trust: stepped bands + isobath-like halo rings, sequential ramp.
- Label ladders by island rank; thin paper-colored halos; placement
  right→above→below→left.
- Lanes are curved filled paths with taper, never full-length straight lines.
- Marginalia does work: cartouche title block, legend keyed to Chart No. 1
  symbols, scale bar calibrated in files, neatline. One dragon, one corner,
  maximum ("HIC SVNT DRACONES" in the margin — blankness, not monsters, is
  the real convention for the unknown).
- Parchment/ink textures only via SVG filters with fixed seeds (`feTurbulence`),
  no raster assets. WCAG ≥ 4.5:1 on all text (halos/plates under labels).
- Information first, ornament as the reward. Taste anchors: xkcd "Online
  Communities 2", first-edition DDIA illustrations; explicitly NOT
  Stamen-style beauty-without-information.

## Out of scope for the spike

Search; lights/beacons map layers (dossier only); notices timeline; harbor /
night-watch history; ship's log; multi-province index; cycle/tangle
highlighting.

## Acceptance (Governor's verdict, all three required)

1. **Stranger test**: a technically literate reader, unfamiliar with the
   province, answers the five questions above in ~5 minutes unaided.
2. **Demo portability**: the single file opens and works on a clean machine.
3. **"Want to explore"**: the map invites investigation instead of "ok, close".

## Run

```bash
bun experiments/map-spike/render.ts --target <province-root>
# writes <province-root>/.portolan/chart-room.html
```
