# chart-room-tangles Tasks

## 1. Core detection

- [ ] 1.1 Implement `findTangles` (Tarjan SCC, size ≥ 2, sorted members) in
      `core/src/chartroom/render.ts`, embed as `tangles` in
      `__CHART_DATA__`; verify unit tests: 2-cycle found, 3-cycle found,
      self-loop ignored, DAG → `[]`, determinism, members sorted

## 2. Rendering

- [ ] 2.1 Render whirlpool marks at member centroids (nautical), the panel
      section with tangle membership + explicit calm state (both modes),
      and the dossier "in a tangle with" line; verify headlessly on a
      synthetic cycle province and the clean zero state on Bigtop/dogfood

## 3. Verify + archive

- [ ] 3.1 Full suite green (`bun test`, tsc), regenerate both real
      artifacts from core, archive the change
