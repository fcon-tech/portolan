# fleet-review Tasks

## 1. Core

- [x] 1.1 Implement `buildFleetReview(targets)` + template in
      `core/src/chartroom/review.ts` (per-target index arithmetic: kinds,
      trust shares, top hub, dangers, stale; file:// link to each Chart
      Room; loud failure naming any non-charted target) and verify unit
      tests: two-fixture render, counts correct, determinism, failure path
- [x] 1.2 Add the `review` CLI subcommand (repeatable `--target`, artifact
      into the first target's `.portolan/`) and verify the printed path +
      usage error when fewer than one charted target is given

## 2. Contract + archive

- [x] 2.1 Extend the MANIFEST glossary with **Fleet review** and verify
      `openspec validate --strict`; live-render over Bigtop + dogfood and
      check the page headlessly (rows, links, no console errors); archive
