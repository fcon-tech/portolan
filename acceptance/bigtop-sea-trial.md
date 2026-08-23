# Bigtop Sea Trial — draft calibration questions

Status: DRAFT v0 (2026-08-23), to be finalized with the first expedition.
Corpus: an Apache Bigtop landscape checkout (18-repo shape: hadoop, spark,
flink, solr, zookeeper, hive, hbase, oozie, bigtop-packages, bigtop.bom, …).

Rules for every answer:

- Must carry an anchor (path[:line], manifest key, or log receipt).
- Must carry a trust label (`measured` / `charted` / `reported` /
  `doubtful` / `unsurveyed`).
- A fabricated anchor fails the whole trial automatically.
- Where a machine check exists, the gate runner verifies it, not the model.

## Vessels (units)

- **Q1.** List the component vessels of the province with their versions as
  pinned by the BOM. *(machine-check: `bigtop.bom` entries)*
- **Q2.** Which vessels are retired (attic) and what is the honest trust
  label for their sheets? *(expected: Oozie — sheets mostly `charted`/
  `reported`, runtime `unsurveyed`)*

## Fairways (dependencies)

- **Q3.** Which components depend on Apache Hadoop, and via what — manifest
  declaration, source import, or both? *(machine-check: manifests; sample
  imports via `sound.edge`)*
- **Q4.** Describe the Spark ↔ Flink relationship: overlap axes and the
  decisive contrast. *(expert-judged; claims must be `reported` with
  anchors)*
- **Q5.** Does Solr depend on ZooKeeper, and for what capability?
  *(anchors: solr config/source)*
- **Q6.** Find at least one dependency that is declared but unused in code,
  or used in code but not declared. *(drift finding; any trust label, but the
  anchor must prove the drift)*

## Ports of entry & beacons

- **Q7.** How is one component (e.g. Spark) built and packaged from source
  in this province? *(anchors: build files under `bigtop-packages/src/spark`)*
- **Q8.** Where are the smoke tests defined and which components do they
  cover? *(anchors: `bigtop-smoke-tests`)*
- **Q9.** Which env vars and ports does a minimal Hadoop/YARN deployment
  require according to the packaged configs? *(anchors: config templates)*

## Lights (API contracts)

- **Q10.** What public HTTP surfaces does Solr expose, per the packaged
  config/source? *(anchors required)*

## Dangers (smells)

- **Q11.** Report at least three dangers with anchors: e.g. duplication
  across package recipes, version skew between BOM and component POMs, a
  retired component still packaged. *(jscpd/semgrep corroboration counts as
  `measured`; model-only findings are `reported`)*

## Unsurveyed (honesty)

- **Q12.** What could the expedition NOT determine statically? *(expected at
  minimum: real runtime topology, actual deployed versions. The trial FAILS
  if the chart guesses instead of marking `unsurveyed`)*

## Metrics (gate-runner computed)

- Fairway completeness vs the BOM-derived dependency list.
- Trust distribution across the chart (% `measured` / `charted` /
  `reported` / `unsurveyed`).
- After editing one file: the affected sheet must flip to
  `pending correction` (and nothing else must).

## Governor's read (final sign)

The Governor reads the Spark and Solr sheets and answers one question:
"Is this the real Bigtop?" — yes = trial passed.
