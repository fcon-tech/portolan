# chart-room-craft Design

Six fixes, one per gap found in the screenshot review; each keeps the
encoding discipline (one visual variable, one meaning) and determinism.

1. **Figure-ground** — sea `#b9cfc7`-family (deeper than the panel),
   halo band steps re-anchored: measured coast band clearly darker than
   sea; unsurveyed stays paper-pale. Panel colors untouched.
2. **Tapered lanes** — each lane renders as a filled path between offset
   curves (width 3.4 at source → 0.9 near target); curvature factor and
   side from the lane id hash (existing seeded discipline); a 5px paper-
   colored casing path underneath lifts lanes off texture; hub fan-in
   spreads target approaches by index hash so arrows land side by side.
   Trust still encoded by stroke color/dash on the fill's outline stroke.
3. **Label ladder** — small tier 11.5px full-ink with letterspaced caps;
   mid unchanged; big unchanged. Labels keep halo stroke ordering.
4. **Port glyph** — anchor drawn just off the coast on the side opposite
   the label anchor point; protocol text in an 8.5px letterspaced chip.
5. **Rhumb + rose** — rhumb opacity to .16 with hairlines; rose center
   moved inside the neatline corner block.
6. **Legend** — trust swatches gain inner border and 2px separation;
   legend card opacity 1.

Excluded on purpose: named seas (fabricated semantics), island clustering
at far zoom (deferred until needed), extra chrome beyond brief (north
arrow enough — no scale bar cosplay).
