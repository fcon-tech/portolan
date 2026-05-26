Answers below are grounded only in Portolan context (`/tmp/portolan-034-bigtop-context/`) and map artifacts (`/tmp/portolan-034-bigtop-map/summary.json`, `graph-index.json`, `findings.jsonl`, `map.md`). No `graph.json` was loaded.

---

## Scope And Completeness

**Local scope (observed):** Portolan mapped `/home/fall_out_bug/projects/bigtop-landscape` and found **18 Git repositories** under `repos/`, all `source-visible` with local paths present (`summary.json` coverage, `repos.json`, `evidence-index.jsonl`).

| Repository | Role in local checkout |
|---|---|
| `alluxio`, `apache-airflow`, `apache-bigtop-repo`, `apache-flink`, `apache-hadoop`, `apache-hbase`, `apache-hive`, `apache-kafka`, `apache-livy`, `apache-oozie`, `apache-phoenix`, `apache-ranger`, `apache-solr`, `apache-spark`, `apache-sqoop`, `apache-tez`, `apache-zeppelin`, `apache-zookeeper` | Locally visible component source trees |

**Scan scale (observed):** `portolan map` produced **172,243 graph nodes**, **148,714 edges**, **555 findings**, and classified file surfaces including ~59k source, ~65k test, ~6.7k doc, ~4.8k config, ~1.1k manifest, 165 container, 202 workflow (`summary.json`).

**Completeness (unknown / not_assessed):**

- **Apache Bigtop ecosystem completeness is `unknown`.** No manifest or curated inventory was supplied; discovery of 18 repos does not prove the full upstream Bigtop component set (`external-completeness` in `summary.json`, `gaps.jsonl` `gap-external-completeness`).
- **1 landscape-like child directory** under the root had no `.git` boundary (`non-git-child-directories`, status `unknown`).
- **1 direct child file** at the landscape root was `not_assessed` as a repository candidate (`non-repository-children`).
- **No local OSS/tool outputs** were ingested (Backstage, OpenAPI, AsyncAPI, Structurizr, CycloneDX, jscpd, Semgrep, code-index all `not_assessed` in `gaps.jsonl`; `tool-registry.json` is empty).

This is a **local multi-repo checkout scope**, not a verified inventory of everything Apache Bigtop ships or deploys in production.

---

## Duplicate Or Component Risk

**Safely claimable (observed, `source-visible`):**

- **269 exact-duplicate clusters** across source and config files (`summary.json` findings: 283 duplication records, 269 observed exact clusters; graph has 269 `duplication` nodes).
- Duplication is predominantly **within-repo, byte-identical** copies—not near-clone or semantic copy/paste. Examples:
  - **Alluxio:** repeated `log4j.properties` across 16 test paths; duplicated K8s operator webhook/RBAC YAML; parallel vagrant/ansible UFS role task files (`graph-index.json` duplication samples, `alluxio-finding-duplication-exact-*`).
  - **apache-bigtop-repo:** identical Juju test YAML across `hadoop-hbase`, `hadoop-kafka`, `hadoop-processing`, `spark-processing` bundles; duplicated charm `tests.yaml` across hadoop/hbase/hive/kafka/spark/zeppelin/zookeeper layers; shared smoke-test `log4j.properties` for alluxio/hive/phoenix (`apache-bigtop-repo-finding-duplication-exact-config-*`).
  - **apache-hadoop:** large clusters of identical test `log4j.properties` and some mapreduce counter property files (`apache-hadoop-finding-duplication-exact-config-*`).
- Pattern: much “duplication” is **test/logging boilerplate and deployment/charm scaffolding**, which is maintainability noise rather than proof of duplicate runtime components.

**Cannot safely claim:**

- **Duplicate ecosystem components** (e.g., “two Hadoops in production”)—`cannot_verify` without SBOM/CycloneDX (`gap-cyclonedx-not-assessed`, skipped near-clone detection in `summary.json` `skipped_surfaces`).
- **Near-clone / copy-paste risk** across Java/Python bodies—`not_assessed` (`duplication-near-clone-detection` skipped; `gap-jscpd-not-assessed`).
- **Cross-repo duplicate components** as packaged artifacts—no component identity graph beyond file hashes.

Several large generated/vendor files exceeded the 1 MiB scan limit and are **`not_assessed`** for duplication (e.g., Alluxio `npm-shrinkwrap.json`, Hive/HBase thrift outputs, Ranger swagger bundles—`summary.json` warnings).

---

## Implicit Knowledge

**Visible in local evidence (not claims about production behavior):**

| Evidence type | What it shows | Example sources |
|---|---|---|
| **Bigtop packaging & deployment intent** | Puppet modules, Juju bundles/charms, smoke-tests, Docker provisioner configs | `apache-bigtop-repo`: `bigtop-deploy/puppet/`, `bigtop-deploy/juju/hadoop-*`, `bigtop-packages/src/charm/*`, `bigtop-tests/smoke-tests/` |
| **Named stack bundles** | Co-deployed Hadoop + satellite stacks as bundle definitions | Juju paths: `hadoop-hbase`, `hadoop-kafka`, `hadoop-processing`, `hadoop-spark` (`apache-bigtop-repo-finding-configuration-config-file-observed`) |
| **Operational configuration surfaces** | Env var names, ports, manifests, workflows, secret *references* (no values) | Per-repo `*-finding-configuration-*-observed` in `findings.jsonl` / `map.md` |
| **Go toolchain islands** | Small Go subsystems with import/mod graphs | **Alluxio** (428 Go imports, 97 `go.mod` deps); **Airflow** (328 imports, 48 `go.mod` deps)—`findings.jsonl` |
| **Repository size / coupling proxy** | Highest graph degree repos: spark (~26.5k edges), flink (~26k), hive (~22k), hadoop—`graph-index.json` `high_degree_nodes` | File/configuration graph density, not service calls |

**Claim-only (do not treat as verified facts):**

- That Juju bundles or charms reflect **current production topology**—they are **source-visible deployment recipes**, not runtime-visible evidence.
- That env vars, ports, or secret reference names imply **live wiring** between services—names only; semantics and correctness are `not_assessed` without Semgrep/IaC analysis (`gap-semgrep-not-assessed`, `configuration-semantic-analysis` skipped).
- **Ownership, SLOs, on-call boundaries, upgrade policy**—no Backstage/catalog evidence (`gap-backstage-not-assessed`).
- **API/event contracts between services**—no OpenAPI/AsyncAPI artifacts (`gap-openapi-not-assessed`, `gap-asyncapi-not-assessed`).

---

## Service Relationships

**Safely stated (observed):**

1. **Go module/import relationships** exist only where Go code exists:
   - **Alluxio:** 428 `source-visible` import edges + 97 `metadata-visible` `go.mod` dependency edges.
   - **Apache Airflow:** 328 import + 48 manifest edges.
   - Evidence: `alluxio-finding-relationships-source-imports-observed`, `apache-airflow-finding-relationships-manifest-dependencies-observed`, `graph-index.json` edge slices `imports` (756 total) and `depends-on` (145 total)—almost entirely within those repos’ Go subtrees (K8s operator, build scripts, `go-sdk`, etc.).

2. **Documented deployment groupings** in `apache-bigtop-repo` (source-visible config, not runtime proof):
   - Separate Juju bundles for **Hadoop + HBase**, **Hadoop + Kafka**, **Hadoop processing**, **Hadoop + Spark**.
   - Charm layers for **hadoop, hbase, hive, kafka, spark, zeppelin, zookeeper** with port declarations in `layer.yaml` files.

**Not safely stated (`not_assessed` for 16/18 repos on code relationships):**

- For **apache-bigtop-repo, flink, hadoop, hbase, hive, kafka, livy, oozie, phoenix, ranger, solr, spark, sqoop, tez, zeppelin, zookeeper**: “Relationship detection currently supports Go imports and go.mod manifests; **no supported relationship inputs were observed**” (`apache-*-finding-relationships-not-assessed` pattern in `findings.jsonl`).
- **Service topology, runtime inference, non-Go source imports, lifecycle modeling**—explicitly `not_assessed` placeholders per repo (`relationship-service-topology-inference`, `relationship-runtime-inference`, etc. in `summary.json` `skipped_surfaces`).

**Do not infer** inter-service RPC/dataflow (e.g., “Spark calls Hive metastore”) from this map alone; that would be **claim-only** without OpenAPI/AsyncAPI/runtime evidence.

---

## Next Local Actions

Ordered by uncertainty reduction, all read-only unless you approve OSS producers:

1. **Define ecosystem completeness boundary** — add a curated `selection.json` or corpus manifest, then `portolan map --selection …` so `external-completeness` can move from `unknown` (`answer-contract.md`, `gaps.jsonl`).
2. **Drill into Bigtop integration hub** — `portolan graph slice --bundle /tmp/portolan-034-bigtop-map --repo apache-bigtop-repo --finding-kind configuration --out <slice.json>` to bound puppet/juju/charm surfaces without loading full `graph.json`.
3. **Resolve landscape root gaps** — inspect the one `non-git-child-directories` and `non-repository-children` entries in `summary.json` `weak_records` (manual listing only; Portolan did not classify them).
4. **Prioritize duplication review** — start with `apache-bigtop-repo` charm/test YAML clones and cross-smoke-test `log4j.properties` clusters (highest packaging-maintainability leverage); use `findings.jsonl` filters on `kind=duplication` + `status=observed`.
5. **If approved, run OSS producers into context output dir** — jscpd (near-clone), syft/CycloneDX (component identity), optional Semgrep (config semantics) per `oss-plan.json`, then refresh context (`tool-registry.json` is currently empty).
6. **For service relationships beyond Go islands** — import or generate local OpenAPI/AsyncAPI/Structurizr/Backstage artifacts, or accept that Java/Python inter-service graphs remain `not_assessed`.

---

## Unknowns And Not Assessed

| Surface | Status | Reason |
|---|---|---|
| Full Apache Bigtop / upstream component catalog | `unknown` | No manifest; 18 local repos ≠ ecosystem complete |
| Non-git child under landscape root | `unknown` | No `.git` boundary detected |
| Root-level non-repo child file(s) | `not_assessed` | Not evaluated as repo candidates |
| Near-clone / semantic duplication | `not_assessed` | Detector not implemented; jscpd absent |
| Component/SBOM duplicate risk | `not_assessed` | CycloneDX/syft not run |
| Service topology & runtime wiring | `not_assessed` | No runtime inference; no catalog/API docs |
| Non-Go code relationships (Java/Python/Scala bulk) | `not_assessed` | 16 repos lack Go relationship inputs |
| Semantic IaC/config correctness | `not_assessed` | Semgrep absent; semantic config analysis skipped |
| Large files (>1 MiB) and some oversized JSON | `not_assessed` / `cannot_verify` | Native scan limits (`summary.json` warnings) |
| Backstage, OpenAPI, AsyncAPI, Structurizr, code-index | `not_assessed` | No local tool outputs |
| **124 map findings** with unresolved evidence states | `unknown` / mixed | `finding-technical-debt-unresolved-findings` |
| Production behavior, readiness, modernization verdicts | **out of scope** | Portolan evidence only; not a gate |

**Evidence anchors:** `/tmp/portolan-034-bigtop-map/summary.json`, `/tmp/portolan-034-bigtop-map/graph-index.json`, `/tmp/portolan-034-bigtop-map/findings.jsonl`, `/tmp/portolan-034-bigtop-map/map.md`, `/tmp/portolan-034-bigtop-context/{repos.json,gaps.jsonl,agent-brief.md,answer-contract.md}`.
