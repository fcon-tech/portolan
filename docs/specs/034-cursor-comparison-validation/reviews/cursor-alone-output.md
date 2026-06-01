Evaluation is based only on direct inspection of `/home/fall_out_bug/projects/bigtop-landscape` (excluding `run/*` Portolan outputs). The prompt file path cited in your query is **not present** under this target (`cannot_verify` locally).

## Scope And Completeness

**Local scope (observed):**
- Top-level layout: `selection.json`, `repos/` (18 source trees), and `run/` (Portolan map artifacts — excluded here).
- **18 repositories** under `repos/`: `alluxio`, `apache-airflow`, `apache-bigtop-repo`, `apache-flink`, `apache-hadoop`, `apache-hbase`, `apache-hive`, `apache-kafka`, `apache-livy`, `apache-oozie`, `apache-phoenix`, `apache-ranger`, `apache-solr`, `apache-spark`, `apache-sqoop`, `apache-tez`, `apache-zeppelin`, `apache-zookeeper`.
- **`apache-bigtop-repo`** is the integration hub: stack BOM (`bigtop.bom` at version `3.7.0-SNAPSHOT`), RPM/DEB packaging (`bigtop-packages/`), Docker provisioner (`provisioner/docker/`), and integration tests (`bigtop-tests/`).

**`selection.json` mismatch (observed):**
- Lists **15** repository targets; **does not list** `apache-livy`, `apache-oozie`, or `apache-sqoop`, though all three exist on disk.
- Sets `require_full_corpus: true` and points `corpus_manifest` to a path **outside** this target (`/home/fall_out_bug/projects/sdp/portolan/internal/testfixtures/corpus-manifests/apache-bigtop/manifest.json`). Full-corpus membership and missing upstream repos are **`unknown`** from target-only inspection.

**Declared Bigtop stack vs local trees (from `bigtop.bom` `components` block):**
- **In current BOM (17 packaged components):** zookeeper, hadoop, hbase, hive, tez, solr, spark, flink, phoenix, kafka, zeppelin, livy, ranger, airflow, alluxio, plus bigtop-groovy/utils/select/jsvc (packaged from `apache-bigtop-repo`, not separate repos).
- **On disk but absent from current BOM:** `apache-oozie`, `apache-sqoop` (release notes in `apache-bigtop-repo` cite removal: BIGTOP-4032 Oozie, BIGTOP-3770 Sqoop).
- **No separate local repos** for many historical Bigtop ecosystem pieces (Ambari, binary repos, Docker image registries, support matrix, etc.) — **`not_assessed`** / **`unknown`** for full Apache Bigtop ecosystem coverage.

**Version alignment (major completeness gap):**
Local checkouts are largely **development SNAPSHOT** trees, while `bigtop.bom` pins **release** versions for packaging. Examples:

| Component | `bigtop.bom` | Local root version |
|-----------|--------------|-------------------|
| hadoop | 3.4.3 | 3.6.0-SNAPSHOT |
| hbase | 2.6.5 | 4.0.0-alpha-1-SNAPSHOT |
| hive | 4.0.1 | 4.3.0-SNAPSHOT |
| tez | 0.10.5 | 1.0.0-SNAPSHOT |
| spark | 3.5.6 | 5.0.0-SNAPSHOT |
| flink | 1.20.1 | 2.4-SNAPSHOT |
| kafka | 3.4.1 | 4.4.0-SNAPSHOT |
| zookeeper | 3.8.4 | 3.10.0-SNAPSHOT |
| phoenix | 5.2.1 | 5.4.0-SNAPSHOT |
| ranger | 2.8.0 | 3.0.0-SNAPSHOT |
| livy | 0.8.0 | 0.10.0-incubating-SNAPSHOT |

Cross-repo runtime/build compatibility from this checkout set is **`cannot_verify`** without building or running tests.

## Duplicate Or Component Risk

**Safely claimable from local evidence:**

1. **Retired-but-present trees:** `apache-oozie` and `apache-sqoop` remain on disk while current `bigtop.bom` and RPM specs under `bigtop-packages/src/rpm/` have **no** oozie/sqoop specs (19 specs match BOM components only). Risk: stale analysis scope, false “in-stack” assumptions.

2. **Workflow orchestration overlap:** `airflow` is in current BOM and has an RPM spec; Oozie README describes Hadoop workflow scheduling (MapReduce/Pig/Hive). Historical stack removal is documented; **functional overlap** between Airflow and Oozie is inferable, but **operational duplication in a deployed cluster** is **`not_assessed`** locally.

3. **Compute engine overlap:** Spark and Flink are both in BOM with separate specs — overlapping batch/stream processing roles; not proof both would run in one deployment.

4. **SQL / analytics overlap:** Hive, Phoenix (“SQL layer over HBase”), Spark (`spark-hive` module), Solr, Zeppelin — multiple query/notebook surfaces; overlap is architectural, not measured duplication.

5. **Storage overlap:** Alluxio (memory-centric distributed FS per BOM) alongside Hadoop HDFS packaging — potential storage-layer overlap; integration depth **`not_assessed`**.

6. **Package naming conflicts (packaging layer):** e.g. `hive.spec` `Conflicts: %{hadoop_pkg_name}-hive` — RPM-level conflict rules exist; code duplication scan is **`not_assessed`** (no local dedup tooling output).

## Implicit Knowledge

**Present in local evidence (not merely asserted):**

- **Build-order graph** in `bigtop.bom` `dependencies` (e.g. hadoop before hbase/hive/tez/spark/…; zookeeper required by hadoop/hbase/kafka; spark before livy/zeppelin).
- **Packaging service decomposition** in `hadoop.spec`: HDFS, YARN, MapReduce history, HttpFS, KMS service names.
- **Package Requires** in `hive.spec`: `hadoop-client`, `zookeeper`, `bigtop-utils`.
- **Hive → Tez** Maven dependencies in `apache-hive` POMs (`tez-mapreduce`, `tez-dag`, etc.).
- **Phoenix → HBase** compat modules and description in `apache-phoenix/pom.xml`.
- **Tez → Hadoop** compile dependency (`hadoop.version` 3.4.2 in `apache-tez/pom.xml`).
- **Stack churn** in `release-notes.xml` (Oozie/Sqoop/Ambari removals).
- **Default smoke scope** in `bigtop-tests/test-execution/smokes/pom.xml`: hive, hadoop, hbase, hcatalog, phoenix (spark/solr smokes exist as sibling modules but are not in that default `<modules>` list).

**Claims only (not established from target files alone):**

- That this checkout represents a **coherent, shippable Bigtop 3.7.0** stack.
- Full corpus completeness (`require_full_corpus` vs actual disk).
- Production deployment topology, Ambari/Mpack current state (referenced historically in release notes; Ambari removal noted BIGTOP-4031).
- Any relationship graph beyond build/spec/README signals.

## Service Relationships

**Safely stated (packaging + source dependency level):**

| Relationship | Evidence |
|--------------|----------|
| **ZooKeeper → coordination for Hive packages** | `hive.spec` Requires `zookeeper` |
| **Hadoop (HDFS/YARN/MR/HttpFS/KMS) as platform** | `hadoop.spec` service lists; many components’ build deps list `hadoop` in BOM |
| **HBase ← Phoenix** | Phoenix POM: “SQL layer over HBase”, hbase-compat modules |
| **Hive ← Tez (execution)** | Hive POMs depend on Tez artifacts |
| **Tez ← Hadoop** | Tez POM `hadoop-common` at `${hadoop.version}` |
| **Spark ← Livy, Zeppelin (build order)** | `bigtop.bom`: `spark:['livy','zeppelin']` |
| **HBase ← Phoenix, Hive (build order)** | `hbase:['phoenix','hive']` |
| **Oozie → Hadoop workloads (if used)** | Oozie README: schedules MR/Pig/Hive via servlet app |
| **Sqoop → DB ↔ HDFS (if used)** | Sqoop README: SQL-to-Hadoop import/export |

**Weak or `not_assessed` for runtime:**
- Kafka–ZooKeeper coupling at runtime (Kafka 4.x may differ; local tree is `4.4.0-SNAPSHOT` — **`cannot_verify`** KRaft-only vs ZK without deeper config read).
- Ranger enforcing policies across services — product intent in README/description only; no local deployed cluster.
- Docker pseudo-cluster (`provisioner/docker/docker-compose.yml`) mounts `apache-bigtop-repo` and uses `${DOCKER_IMAGE}` — **does not enumerate** inter-service wiring in compose; cluster topology **`not_assessed`**.

## Next Local Actions

1. **Reconcile inventory:** Align `selection.json` with the 18 dirs on disk; explicitly tag `oozie`/`sqoop` as out-of-stack (per `release-notes.xml`) or remove from scope.
2. **Version alignment pass:** Checkout tags matching `bigtop.bom` `version.base` per component, or document intentional SNAPSHOT drift in a local manifest (target-only).
3. **Extract authoritative edges:** Parse `bigtop.bom` `dependencies` + RPM `Requires:` from all 19 specs into a small local adjacency list (no Portolan).
4. **Expand integration tests scope:** Compare `smokes/pom.xml` default modules vs BOM components; run available smokes for spark/solr if environment permits (**`not_assessed`** here).
5. **Retired-component audit:** Grep `apache-bigtop-repo` for remaining oozie/sqoop references in gradle/packages vs absent specs.
6. **Corpus gap analysis:** If full corpus is required, inventory what `corpus_manifest` expects vs `repos/` — needs reading manifest outside target or copying manifest into target (**currently `unknown`**).
7. **Ignore `run/` for Cursor-alone baselines** — treat as Portolan-derived, not primary evidence.

## Unknowns And Not Assessed

- Full Apache Bigtop ecosystem (binary repos, CI images, support matrix, all manifest targets).
- Contents of external `corpus_manifest` and whether `require_full_corpus: true` is satisfied.
- Whether any local repo builds or tests pass together.
- Runtime cluster topology, ports, and live service dependencies.
- Code duplication / shared-library conflict analysis (no dedup tool output in target).
- Docker image contents and `${DOCKER_IMAGE}` service graph.
- Kafka 4.x metadata layer (ZK vs KRaft) in this checkout.
- Spec prompt file at `docs/specs/034-cursor-comparison-validation/...` (**not present** in target).
- Anything inferred only from `run/map.md`, `run/graph.json`, `run/coverage.json`, or other Portolan artifacts (**excluded by constraint**).
