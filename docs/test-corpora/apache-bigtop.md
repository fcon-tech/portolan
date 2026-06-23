# Apache Bigtop Test Corpus

Apache Bigtop is a named stress corpus for Portolan acceptance work, not the
default product path. It is useful because it is already an integration project
for big-data components, not a synthetic list of repositories. The corpus
should stress the parts of Portolan that matter most:
multi-repo source evidence, integration metadata, package/runtime surfaces,
legacy projects, and honest unknowns.

Bigtop now starts immediately after the generic agent path can be tested
honestly. The first real operator pass is a cheap acceptance smoke, not a full
corpus analysis: Cursor + Composer 2.5 receives only the target-agnostic
Portolan bootstrap inputs and maps a local Bigtop checkout. Local fixtures may
preflight Portolan commands, but they are not proof that the operator lane
passed. Larger Bigtop runs come later, after proven gaps are addressed. Cursor
and Composer are evaluation context; they are not default runtime dependencies
for Portolan scans.

## Why This Corpus

- It is an Apache project explicitly focused on packaging, testing, and
  configuration for open source big-data components.
- The Bigtop 3.5.0 release publishes a concrete BOM with component versions.
- The support matrix exposes runtime dependencies, package CI, and smoke-test
  coverage surfaces.
- The ecosystem has overlapping tools: Spark/Flink/Tez for processing, Hive and
  Phoenix for SQL, Airflow/Oozie for orchestration, Zeppelin for notebooks, and
  Ranger for security.
- Retired projects such as Oozie and Sqoop give Portolan a useful legacy
  lifecycle control without inventing fake deprecated systems.

## Scope Layers

1. **Seed root**: Apache Bigtop repository, 3.5.0 release BOM, and 3.5.0 support
   matrix.
2. **Source repositories**: Bigtop 3.5.0 component repositories for Hadoop,
   HBase, Hive, Spark, Flink, Kafka, ZooKeeper, Tez, Phoenix, Ranger, Solr,
   Zeppelin, Livy, Airflow, and Alluxio.
3. **Internal support packages**: Bigtop-owned BOM entries such as
   `bigtop-groovy`, `bigtop-jsvc`, `bigtop-select`, and `bigtop-utils` as
   package metadata rather than independent ecosystem repositories.
4. **Legacy expansion**: Oozie and Sqoop as retired Hadoop-era projects.
5. **Runtime and package surfaces**: Bigtop binary repositories, Docker images,
   CI, and smoke-test outputs as metadata/runtime targets for later black-box
   profiles.

The committed machine-readable profile is
`internal/testfixtures/corpus-manifests/apache-bigtop/manifest.json`; the schema is
`schema/corpus-manifest.schema.json`.

## Test Strategy

Use the corpus in layers. Start the real smoke after the generic agent
bootstrap and blind acceptance protocol exist; expand only when the previous
layer has produced concrete product decisions.

### Phase 0 - Agent Bootstrap And Blind Acceptance

- Use the Cursor Composer first-run contract in
  `docs/captain-atlas/01-cursor-composer-first-run.md`.
- Use the shared product contract in
  `docs/captain-atlas/00-product-contract.md`.
- Run Cursor + Composer 2.5 with only the generic Portolan path, target path,
  output path, and mapping request.
- Use a real local Apache Bigtop checkout for the real operator lane.
- Use prepared local Bigtop fixture inputs only as command preflight; fixture
  success is not a passed Bigtop operator lane.
- Record what the agent could not do without target-specific prompting.
- Record missing Portolan capabilities as product gaps, not as free-form agent
  advice.
- Keep the handoff aligned with the packaging and local-first contract in
  `docs/captain-atlas/05-packaging-qol-security.md`.
- If the external Cursor + Composer 2.5 operator lane or local Bigtop checkout
  is unavailable, run the local fallback smoke against
  `internal/testfixtures/apache-bigtop-smoke/selection.json` only as preflight and mark the
  real operator lane blocked or `not_assessed`.

Current reproducible gate:

```bash
scripts/portolan-product-acceptance.sh --skip-agent-runtime
```

That command runs the local Bigtop-shaped fixture, the second non-JVM fixture,
and repo-cap/gap-truncation checks. It does not claim full Apache Bigtop
coverage. Without an explicit bundle path, full Bigtop corpus acceptance is
reported as `not_assessed`.

Strict full-corpus acceptance is only this validation command against an already
generated local bundle:

```bash
scripts/harness-bigtop-acceptance.sh <bundle-dir>
```

The strict harness rejects repo-capped or gap-truncated bundles. Those states are
valid degraded evidence for navigation, but they are not full Bigtop proof.

### Phase 1 - Manifest Acceptance

- Validate that the manifest is parseable and matches the schema once schema
  validation is wired.
- Generate a local selection fixture from a small subset:
  - `apache-bigtop-repo`
  - `apache-hadoop`
  - `apache-hbase`
  - `apache-hive`
  - `apache-spark`
  - `apache-oozie`
  - `bigtop-binary-repos`
- Expected evidence states: `source-visible`, `metadata-visible`,
  `claim-only`, `unknown`, and `cannot_verify`.

### Phase 2 - Local Source Fixture

- Clone or vendor only a deliberately small local subset outside normal scan
  execution.
- Run Portolan against local paths only.
- Verify repository nodes, lifecycle metadata, and dependency edges.
- Keep upstream URLs as attribution, not as live scan inputs.

### Phase 3 - Runtime Profile

- Use prepared Docker or package metadata exports as local input files.
- Represent runtime/package facts as `metadata-visible` or `runtime-visible`.
- Keep unavailable or unobserved services as `unknown` or `cannot_verify`.

### Phase 4 - Larger Corpus Stress

- Expand beyond the minimal subset only after the smoke and local fixture phases
  prove the agent workflow and map artifacts are useful.
- Use Bigtop to prioritize relationship, duplication, configuration, debt, diff,
  and adapter work.

## Initial Acceptance Checks

- The Bigtop release BOM components and versions are represented.
- Runtime dependencies from the support matrix can become graph edges.
- Retired Oozie and Sqoop are not presented as healthy active projects.
- The same source can create both strong and weak evidence without flattening
  everything into a pass/fail result.
- Portolan does not clone repositories or query upstream services during a
  default scan.
- A Cursor + Composer 2.5 operator run can use the generic blind protocol on a
  local Bigtop checkout to produce reviewable Portolan artifacts without
  treating the agent transcript as stronger evidence than source, metadata, or
  runtime observations.
- The local fallback smoke can generate a graph and packet from fixture inputs
  while confirming that the real Bigtop operator lane remains unproven until a
  local Bigtop checkout is mapped through the blind protocol. Findings,
  detector output, and richer lifecycle semantics remain backlog gaps until the
  operator smoke or later implementation slices exercise them directly.

## Source References

- Apache Bigtop overview: https://bigtop.apache.org/index.html
- Bigtop 3.5.0 release BOM: https://cwiki.apache.org/confluence/display/BIGTOP/Bigtop%2B3.5.0%2BRelease
- Bigtop 3.5.0 support matrix: https://cwiki.apache.org/confluence/display/BIGTOP/Overview%2Bof%2BBigtop%2B3.5.0%2BSupport%2BMatrix
- Apache Bigtop repository: https://github.com/apache/bigtop
- Apache Oozie Attic entry: https://attic.apache.org/projects/oozie.html
- Apache Sqoop retired site: https://sqoop.apache.org/

## Risks

- The full corpus is large. A minimal local fixture must exist before broad
  clone-based testing.
- Bigtop release metadata and component HEAD state can diverge. Release BOM
  version facts must stay metadata-bound unless the exact local source checkout
  is present.
- Upstream CI is useful context, but it is not Portolan verification evidence.
- Retired projects can still have source repositories. Lifecycle and source
  visibility must be represented as separate facts.
