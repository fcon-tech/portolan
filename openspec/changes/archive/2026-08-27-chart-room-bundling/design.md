# chart-room-bundling Design

## Decision 1: braid by bend staggering, not new waypoints

True bundling (a shared trunk polyline) changes lane geometry classes and
complicates the taper/casing renderer. Instead, lanes sharing a target AND
an approach sector get index-staggered curvature: `bend *= 1 + slot*0.4`,
sign alternating within the sector. Parallel stripes become separated arcs
that only meet at the (already fanned) landing. Fully deterministic from
the id hashes; no new waypoints; casing/taper/arrow logic untouched.

## Decision 2: sector = 8 direction buckets on the source-to-target vector

Bucket = floor(angle/45°) of the source→target unit vector, computed per
lane; the stagger index is the lane's position among same-(target,bucket)
lanes sorted by id. Cheap and stable under layout jitter because buckets
derive from final island positions — computed after layout, before drawing.

## Decision 3: label pass mirrors the fleet sheet

Two passes over label boxes (measured via getBBox after insertion), big
first; an overlapping label shifts vertically 7px away from the box it hit,
never horizontally, and never onto another island's area (labels start
below their own blob and only move further down/up within free water; a
moved-up label stops at its original row if that re-collides). Deterministic
order: draw order equals volume rank.
