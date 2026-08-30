# Sailing Directions — fixture-province

Expedition 2026-08-23 · Cartographer: portolan dry-run · Chart: <target>/.portolan/chart/

## The waters

fixture-province is a 3-vessel province (apps/api, apps/cli, packages/lib). 2 measured fairways connect them; 1 claimed fairway is doubtful.

## Top findings

- **Request handler swallows errors** — trust: measured — anchor: apps/api/server.ts:14 — chart: danger/api-swallow
- **Docs name an export the source does not have** — trust: measured — anchor: README.md:6; packages/lib/src/parse.ts:1 — chart: danger/docs-drift
- **A claimed fairway has no deterministic support** — trust: doubtful — anchor: README.md:5 — chart: fairway/cli-api
- **Declared fairways converge on packages/lib** — trust: measured — anchor: apps/api/package.json#dependencies.@fixture/lib; apps/api/package.json:4; apps/api/server.ts:1 — chart: fairway/api-lib

## Verification summary

- trust labels: measured 12 · charted 2 · reported 0 · doubtful 1 · unsurveyed 1
- pending correction: none
- anchor re-sounding: 24/24 anchors sounded, 21 confirmed — refuted: `cli`, `lib`, `lib`

## The Chart

The Chart lives at `<target>/.portolan/chart/` — 3 sheets (one per vessel) plus the machine index `index.jsonl`. Read the trust labels before trusting anything: `measured` taken from source, `charted` from manifests, `reported` a claim from docs, `doubtful` unvalidated, `unsurveyed` not determined.

## Unsurveyed waters

- runtime topology — where each vessel actually runs is not determinable statically
- deployed versions — what is actually deployed is not determinable statically
- run-time behavior of apps/api and apps/cli — no observation; receipts cover the rest
- the apps/cli configuration key — built at run time — chart: beacon/cli-env-dynamic

## Notices to Mariners

- First Expedition: the Chart is new; every entry is an addition (chart/notices.txt).
