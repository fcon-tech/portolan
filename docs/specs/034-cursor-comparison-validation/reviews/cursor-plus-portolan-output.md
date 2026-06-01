Cursor-plus-Portolan lane rerun for `/home/fall_out_bug/projects/bigtop-landscape`, using only the allowed context pack and map index artifacts (`summary.json`, `graph-index.json`). `findings.jsonl`, `map.md`, and `graph.json` were not read.

---

## Scope And Completeness

**Answer:** Local scope is the checkout at `/home/fall_out_bug/projects/bigtop-landscape` with **18 `source-visible` git repos** under `repos/`, discovered as “repos child repositories.” External Apache Bigtop ecosystem completeness is **`unknown`**, not provable from this scan alone.

**Evidence:**
- `repos.json`, `evidence-index.jsonl` (`repo-*` records): alluxio, apache-airflow, apache-bigtop-repo, apache-flink, apache-hadoop, apache-hbase, apache-hive, apache-kafka, apache-livy, apache-oozie, apache-phoenix, apache-ranger, apache-solr, apache-spark, apache-sqoop, apache-tez, apache-zeppelin, apache-zookeeper.
- `summary.json` `coverage`: 18 repositories `visible` / `source-visible`; `external-completeness` **`unknown`** (“no manifest or curated inventory was supplied”).
- Weak discovery at landscape root (`summary.json` `coverage.weak_records`): **1** landscape-like child **without** a `.git` boundary (`unknown`); **1** direct child file not assessed as a repo candidate (`not_assessed`).

**Map scale (local footprint, not service inventory):** `summary.json` — 172,243 graph nodes, 148,714 edges; file surfaces include ~59k source, ~65k test, ~4.8k config, 165 container, 202 workflow files.

**Unknowns:** Whether these 18 repos equal a full Bigtop product surface; what the non-git child directory is; runtime/deployment truth.

**Next local command:** Supply a curated inventory and run `portolan selection validate --selection <selection.json>` then `portolan map --selection <selection.json> --out <run-dir> --force` (per `answer-contract.md`), or refresh with `portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out <context-dir> --profile cursor --force`.

---

## Duplicate Or Component Risk

**Answer:** **Exact file-level duplication** is evidenced at scale (**283** duplication findings, **269** duplication graph nodes). **Component/SBOM duplication, near-clone duplication, and cross-repo “same component twice”** are **`not_assessed`** — no jscpd or CycloneDX/Syft outputs exist.

**Evidence:**
- `summary.json` `findings.by_kind.duplication`: **283** (430 findings `observed` overall).
- `summary.json` `skipped_surfaces`: includes `duplication-near-clone-detection`.
- `gaps.jsonl` / `tool-registry.json`: `gap-jscpd-not-assessed`, `gap-cyclonedx-not-assessed`; `tools[]` empty; `oss-plan.json` lists syft/jscpd as `not_available` on PATH.
- `graph-index.json` samples (observed, `source-visible`): e.g. alluxio exact config duplicate across **16** `log4j.properties` test files; exact config duplicates in k8s operator webhook/RBAC YAML; exact source duplicates in vagrant/ansible and k8s operator scripts; duplicate `tsconfig.json` / `tslint.json` across webui packages.

**Safely claim:** Repeated **identical** config/source files within repos (native exact-match detection), as indexed samples show — review candidates, not automatic rewrite mandates (summaries say “not an automatic rewrite plan”).

**Do not claim:** Duplicate Maven/Java components, shared transitive deps, or near-clone logic duplication without SBOM/jscpd evidence.

**Next local command:** After approval, run a producer from `oss-plan.json` (e.g. syft → CycloneDX, jscpd) into the context `tool-outputs` dir, then `portolan context prepare ... --force`; or drill down: `portolan graph slice --bundle /tmp/portolan-034-bigtop-map --finding-kind duplication --out <slice.json>`.

---

## Implicit Knowledge

**Answer:** Local evidence exposes **inventory, build/packaging manifests, CI workflows, config/doc surfaces, and Go-module subgraphs** in a subset of repos. **Service intent, ownership, production topology, and cross-language dependencies** remain mostly **`not_assessed`** or **`unknown`** unless tied to a specific artifact.

**In evidence (not mere naming):**
- **Repo inventory:** 18 visible paths (`finding-inventory-*` in `graph-index.json`).
- **Manifest surfaces:** e.g. alluxio — “78 package or dependency manifest surface(s)” (`pom.xml`, `go.mod`); apache-airflow — “146” (`pyproject.toml`, `package.json`, `go.mod`, etc.) (`graph-index.json` configuration finding samples).
- **CI/automation:** workflow YAML surfaces (e.g. alluxio `.github/workflows/*`; airflow extensive `.github/workflows/*` in configuration samples).
- **Operational/config catalogs:** e.g. alluxio `dev/github/component_owners.yaml`, docs `_config.yml` / metrics tables (`graph-index.json` configuration node samples).
- **Bigtop packaging repo present locally:** `apache-bigtop-repo` (`repos.json`) — packaging/distribution context exists in checkout; semantic correctness **`not_assessed`** without deeper analysis.
- **Go subgraph (limited repos):** alluxio — 428 Go import relationships, 97 `go.mod` deps; airflow — 328 imports, 48 `go.mod` deps (`graph-index.json` relationship samples).

**Claim-only (must not treat as verified facts):**
- That repo names imply a running “Hadoop + Kafka + …” cluster topology.
- That duplicated test `log4j.properties` imply production misconfiguration.
- Technical-debt rollup summaries in `graph-index.json` (e.g. “136 runtime or configuration surface finding(s) should be reviewed”) — metadata-visible **follow-up hints**, not readiness verdicts.

**Next local command:** `portolan graph slice --bundle /tmp/portolan-034-bigtop-map --repo apache-bigtop-repo --out <slice.json>` for packaging surfaces; or `--finding-kind configuration` for config/manifest drill-down.

---

## Service Relationships

**Answer:** Only **Go import edges** and **`go.mod` `depends-on` package edges** are safely stated, and only where the map observed them. **Service-to-service, runtime, non-Go, lifecycle, and topology relationships** are **`not_assessed`**. Contract/catalog families (OpenAPI, AsyncAPI, Backstage, Structurizr) have **no local outputs**.

**Evidence:**
- `summary.json` `warnings`: relationship detection supports **Go imports and go.mod only**; other sub-surfaces are placeholders `not_assessed`.
- `graph-index.json` `edge_slices`: `imports` **756** total; `depends-on` **145** total (samples are Go module/package edges, e.g. alluxio k8s operator `go.mod`).
- Observed per-repo relationship findings in index **samples**: **alluxio** and **apache-airflow** have `source-imports-observed` and `manifest-dependencies-observed`; **apache-bigtop-repo** and **apache-flink** samples show `relationships-not-assessed` (“no supported relationship inputs were observed” for Go/go.mod).
- Placeholder findings (all sampled repos): `non-go-source-not-assessed`, `runtime-inference-not-assessed`, `service-topology-not-assessed`, `lifecycle-modeling-not-assessed`.
- `gaps.jsonl`: openapi, asyncapi, backstage, structurizr — all **`not_assessed`**.

**Safely state:** Local Go module dependency and import graphs exist for repos with Go tooling (at least alluxio and airflow per samples); **not** Java Maven inter-service wiring, **not** Kafka→HBase data flows, **not** production ports/endpoints.

**Next local command:** `portolan graph slice --bundle /tmp/portolan-034-bigtop-map --edge-kind imports --out <slice.json>` or `--repo alluxio`; for Java stacks, user-supplied OpenAPI/Backstage artifacts or approved OSS import — not inventable from current pack.

---

## Next Local Actions

1. **Reduce completeness unknown:** Provide a curated corpus manifest / `selection.json`, then `portolan selection validate` + `portolan map --selection ...` (per `answer-contract.md`).
2. **Drill duplication without full graph:**
   `portolan graph slice --bundle /tmp/portolan-034-bigtop-map --finding-kind duplication --out /tmp/alluxio-dup-slice.json`
   and/or `--repo apache-bigtop-repo` for packaging-focused slices.
3. **Drill relationships where Go exists:**
   `portolan graph slice --bundle /tmp/portolan-034-bigtop-map --repo alluxio --edge-kind depends-on --out <slice.json>`.
4. **Close OSS gaps (only with approval):** Install/run syft or jscpd per `oss-plan.json`, write under context `tool-outputs`, rerun `portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /tmp/portolan-034-bigtop-context --profile cursor --force`.
5. **Refresh baseline artifacts:**
   `portolan map --root /home/fall_out_bug/projects/bigtop-landscape --out /tmp/portolan-034-bigtop-map --force` after context/tool changes.

Do **not** open `findings.jsonl` / `map.md` / `graph.json` in this bounded rerun; use targeted `graph slice` outputs instead.

---

## Unknowns And Not Assessed

| Surface | State | Source |
|--------|--------|--------|
| External ecosystem completeness | **unknown** | `gaps.jsonl` `gap-external-completeness`, `summary.json` coverage |
| OpenAPI, AsyncAPI, Backstage, Structurizr, code-index | **not_assessed** | `gaps.jsonl` |
| jscpd, CycloneDX/Syft, Semgrep outputs | **not_assessed** / tools **not_available** | `tool-registry.json`, `oss-plan.json` |
| Near-clone duplication | **not_assessed** | `summary.json` `skipped_surfaces` |
| Semantic configuration analysis | **not_assessed** | `summary.json` `skipped_surfaces` |
| Non-Go relationships, runtime, service topology, lifecycle | **not_assessed** | `summary.json` warnings, `graph-index.json` relationship placeholders |
| Java/Maven inter-repo dependency graph | **not_assessed** (for most repos; Go-only detector) | relationship finding samples |
| 118 findings overall | **not_assessed** | `summary.json` `findings.not_assessed_total` |
| 6 findings | **cannot_verify** | `summary.json` (e.g. apache-bigtop-repo configuration sample in `graph-index.json`) |
| Large-file scan limits | partial **cannot_verify** / skipped | `summary.json` `warnings` (generated thrift/swagger files, etc.) |
| Production/runtime behavior | **not_assessed** | `answer-contract.md` hard boundaries |

**Not assessed in this answer:** Per-repo relationship status for all 18 repos beyond what appears in the **truncated** `graph-index.json` finding samples (budget: 20 samples/kind); full duplication catalog beyond index samples; anything that would require `findings.jsonl`, `map.md`, or `graph.json`.
