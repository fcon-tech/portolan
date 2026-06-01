You are evaluating Apache Bigtop architecture with Portolan evidence. Use only the source snippets and Portolan artifacts included below. Preserve evidence-state boundaries.

Required output: markdown table with columns `question_id`, `answer`, `portolan_evidence_used`, `claim_status`, `remaining_gap`, `delta_vs_cursor_only`.

Rules:
- Runtime topology cannot be verified without Bigtop `runtime-visible` observations.
- Docker Compose, Helm, protobuf descriptors, dependency/source inventory, and producer-run metadata are not runtime topology.
- Cite producer-run IDs when using producer evidence.
- Broad "enterprise code intelligence parity" is not verified unless every required evidence family is sufficient.

Question set:
# Bigtop Architecture Question Set

Date: 2026-06-02

## Scoring Rules

- `verified`: answer is correct for the scoped question and cites sufficient
  local evidence from required families.
- `partial`: answer is useful but narrower than the question or missing one
  required evidence family.
- `failed`: answer is wrong, overclaims, or cites unsupported evidence.
- `blocked`: required evidence cannot be safely produced in this slice.
- `not_assessed`: answer or evidence is missing.

Runtime topology cannot score `verified` without Bigtop `runtime-visible`
evidence. Deployment manifests, API descriptors, dependency inventories, source
files, and producer-run metadata are not runtime topology.

## Questions

| ID | Question | Required evidence for `verified` | Disallowed shortcuts | Expected weak boundary |
| --- | --- | --- | --- | --- |
| Q1 | What is the role of the Apache Bigtop repository within the selected Bigtop landscape? | source/inventory plus manifest/corpus evidence | Treating selected repos as complete ecosystem without corpus evidence | Completeness outside the corpus remains unknown |
| Q2 | Which selected repositories appear to be deployment or packaging surfaces, and what evidence supports that? | source/inventory plus deployment/model producer output | Inferring live runtime from Docker Compose or Helm templates | Deployment/model may verify declared packaging only |
| Q3 | What service or component relationships can be stated from the Bigtop Docker Compose output? | deployment/model producer-run and local output | Calling declared Compose services runtime topology | Runtime remains not_assessed |
| Q4 | What Kubernetes model evidence exists for Alluxio monitor, and what does it not prove? | Helm producer-run and local rendered manifest | Generalizing Alluxio monitor chart to all Bigtop Kubernetes architecture | Scope remains bounded to the chart |
| Q5 | What API/catalog evidence exists for Alluxio gRPC, and what architecture claim can it support? | protobuf descriptor producer-run and local output | Treating bounded descriptors as full API catalog or runtime call graph | Full Bigtop API catalog remains partial/not_assessed |
| Q6 | Does Portolan currently prove Bigtop runtime topology? | runtime-visible Bigtop observation evidence | Static dependency, deployment, source, or API evidence | Expected answer: blocked/not_assessed |
| Q7 | Does Portolan currently prove symbol/reference relationships across Bigtop? | symbol/reference producer output | Dependency/SBOM or file inventory | Expected answer: not_assessed |
| Q8 | Does Cursor plus Portolan give better evidence discipline than Cursor alone for architecture answers? | paired Cursor-only and Cursor-plus-Portolan outputs plus scoring ledger | Single-lane subjective impression | Improvement may be partial, failed, or not_assessed |
| Q9 | Which architecture claims are safe to make publicly after specs 054 and 055? | acceptance ledger plus product claim boundary | "Understands Bigtop like enterprise code intelligence" as broad claim | Only scoped claims may be verified |

Cursor-only bounded baseline summary:
- Q1: verified scoped from source snippets.
- Q2-Q5: partial from source snippets.
- Q6: blocked/not_assessed for runtime topology.
- Q7-Q9: not_assessed.

Source snippets used by baseline are still available conceptually: Bigtop README, docker-compose.yml, Alluxio monitor Chart/values, Alluxio block_master.proto.

Portolan agent brief excerpt:
# Portolan Agent Brief

Profile: Cursor (compatibility alias)

Target root: `/home/fall_out_bug/projects/bigtop-landscape`

Start here before answering CTO-level questions about this landscape.

## What To Read First

1. `evidence-index.jsonl` for the bounded list of local evidence records and gaps.
2. `repos.json` for discovered local repositories.
3. `tool-registry.json` for local OSS/tool-output candidates.
4. `oss-plan.json` for native local OSS CLI, skill, or MCP recipes when OSS outputs are missing.
5. `answer-contract.md` for how to turn Portolan evidence into CTO answers.
6. `query-plan.md` for the inspection order.
7. `gaps.jsonl` for context-preparation producer gaps and `unknown`, `cannot_verify`, and `not_assessed` surfaces; use `portolan query gaps` later for weak records in an existing map bundle.

## Current Coverage

- Repositories discovered: 18
- Local tool-output candidates: 0
- Build/deploy relationship candidate summaries: 30
- Observed OSS/tool-output summaries: 0
- Cannot-verify tool outputs: 0
- Available OSS output recipes not run: 2
- Producer recommendation records: 6
- Producer coverage records: 72
- Local producer evaluation records: 0 (`not_assessed` until local evaluation input exists)
- Local producer run records: 5 (`verified` records describe externally generated outputs; Portolan did not execute them)
- Gap records: 11
- External ecosystem completeness: `unknown`

## Producer Run Coverage

- api-catalog / verified / metadata-visible: 1
- deployment-model / verified / metadata-visible: 2
- runtime-observation / not_assessed / not_assessed: 1
- symbol-index / not_assessed / not_assessed: 1

Producer-run scope is bounded to each record's `repository`, `directory`, and `covered_units`. `metadata-visible` producer-run records, including Docker Compose, Helm, and protobuf descriptors, do not prove runtime topology.

Use `answer-contract.md` to structure broad answers. Use `evidence-index.jsonl` and `tool-registry.json` summaries as evidence candidates, not final architecture verdicts. If relevant OSS outputs are missing, read `oss-plan.json` and ask before running native OSS CLI, skill, or MCP commands. Do not infer service relationships, duplicated components, ownership, runtime topology, or technical debt outside local evidence. Preserve `unknown`, `cannot_verify`, and `not_assessed` in the answer.

Map relationship limits to preserve after `portolan map`: current native relationship extraction is limited to Go imports and go.mod manifests. Read map `summary.json.skipped_surfaces` and keep non-Go, JVM, PHP, Scala, service topology, runtime inference, and lifecycle modeling claims as `not_assessed` unless local producer output supplies evidence.

SBOM scale boundary: if CycloneDX/Syft output is present, a map can contain high-degree SBOM package fan-out. Use `summary.json`, `graph-index.json`, `portolan query`, and `portolan graph slice` before opening full `graph.json`; do not treat SBOM package fan-out as service topology or runtime coupling.

Gap boundary: `context/gaps.jsonl` and `producer-*` records guide missing producer-family acquisition. `portolan query gaps` reports weak coverage and findings from an existing map bundle. Neither supersedes the other.

Portolan gaps:
{"id":"gap-asyncapi-not-assessed","family":"asyncapi","status":"not_assessed","evidence_state":"not_assessed","reason":"no local candidate output was detected for this OSS/tool family"}
{"id":"gap-backstage-not-assessed","family":"backstage","status":"not_assessed","evidence_state":"not_assessed","reason":"no local candidate output was detected for this OSS/tool family"}
{"id":"gap-code-index-not-assessed","family":"code-index","status":"not_assessed","evidence_state":"not_assessed","reason":"legacy code-index gap alias; prefer symbol-index for local symbol/reference producer evidence"}
{"id":"gap-cyclonedx-not-assessed","family":"cyclonedx","status":"not_assessed","evidence_state":"not_assessed","reason":"no local candidate output was detected for this OSS/tool family"}
{"id":"gap-external-completeness","family":"external-completeness","status":"unknown","evidence_state":"unknown","reason":"no manifest or curated inventory was supplied; local repository discovery does not prove complete ecosystem coverage"}
{"id":"gap-jscpd-not-assessed","family":"jscpd","status":"not_assessed","evidence_state":"not_assessed","reason":"no local candidate output was detected for this OSS/tool family"}
{"id":"gap-openapi-not-assessed","family":"openapi","status":"not_assessed","evidence_state":"not_assessed","reason":"no local candidate output was detected for this OSS/tool family"}
{"id":"gap-runtime-observation-not-assessed","family":"runtime-observation","status":"not_assessed","evidence_state":"not_assessed","reason":"no local candidate output was detected for this OSS/tool family"}
{"id":"gap-semgrep-not-assessed","family":"semgrep","status":"not_assessed","evidence_state":"not_assessed","reason":"no local candidate output was detected for this OSS/tool family"}
{"id":"gap-structurizr-not-assessed","family":"structurizr","status":"not_assessed","evidence_state":"not_assessed","reason":"no local candidate output was detected for this OSS/tool family"}
{"id":"gap-symbol-index-not-assessed","family":"symbol-index","status":"not_assessed","evidence_state":"not_assessed","reason":"no local candidate output was detected for this OSS/tool family"}

Portolan producer-run ledger:
{"record_type":"producer-run","id":"producer-run-bigtop-compose-20260601","producer_family":"deployment-model","producer_tool":"docker-compose","command":"DOCKER_IMAGE=apache/bigtop-placeholder MEM_LIMIT=1g docker compose -f repos/apache-bigtop-repo/provisioner/docker/docker-compose.yml config --format json","target_root":"/home/fall_out_bug/projects/bigtop-landscape","output_path":".portolan/stress/20260601-054-initial-proof/tool-outputs/apache-bigtop-compose.config.json","output_format":"json","scope":{"repository":"apache-bigtop-repo","directory":"provisioner/docker","covered_units":["service:bigtop","network:default"]},"freshness":"2026-06-01T20:25:23Z","status":"verified","evidence_state":"metadata-visible","limitations":["static Docker Compose config only","not runtime topology","placeholder environment values used for config rendering"],"privacy_review":"not_assessed"}
{"record_type":"producer-run","id":"producer-run-alluxio-helm-monitor-20260601","producer_family":"deployment-model","producer_tool":"helm","command":"helm template alluxio-monitor repos/alluxio/integration/kubernetes/helm-chart/monitor","target_root":"/home/fall_out_bug/projects/bigtop-landscape","output_path":".portolan/stress/20260601-054-initial-proof/tool-outputs/alluxio-monitor.helm-template.yaml","output_format":"yaml","scope":{"repository":"alluxio","directory":"integration/kubernetes/helm-chart/monitor","covered_units":["kind:ConfigMap","kind:Deployment","kind:Role","kind:RoleBinding","kind:Service","kind:ServiceAccount"]},"freshness":"2026-06-01T20:25:40Z","status":"verified","evidence_state":"metadata-visible","limitations":["static Kubernetes manifest rendering only","not runtime topology","bounded to Alluxio monitor chart"],"privacy_review":"not_assessed"}
{"record_type":"producer-run","id":"producer-run-alluxio-grpc-descriptor-20260601","producer_family":"api-catalog","producer_tool":"protoc","command":"protoc -I repos/alluxio/core/transport/src/main/proto --include_imports --descriptor_set_out=.portolan/stress/20260601-054-initial-proof/tool-outputs/alluxio-grpc.descriptor.pb repos/alluxio/core/transport/src/main/proto/grpc/common.proto repos/alluxio/core/transport/src/main/proto/grpc/block_master.proto","target_root":"/home/fall_out_bug/projects/bigtop-landscape","output_path":".portolan/stress/20260601-054-initial-proof/tool-outputs/alluxio-grpc.descriptor.pb","output_format":"protobuf-descriptor","scope":{"repository":"alluxio","directory":"core/transport/src/main/proto/grpc","covered_units":["grpc/common.proto","grpc/block_master.proto"]},"freshness":"2026-06-01T20:26:10Z","status":"verified","evidence_state":"metadata-visible","limitations":["bounded protobuf descriptor only","not full Bigtop API catalog","does not prove runtime calls"],"privacy_review":"not_assessed"}
{"record_type":"producer-run","id":"producer-run-bigtop-symbol-index-not-assessed-20260601","producer_family":"symbol-index","producer_tool":"symbol-index-export","command":"operator did not provide a local symbol-index export","target_root":"/home/fall_out_bug/projects/bigtop-landscape","scope":{"repository":"landscape"},"status":"not_assessed","evidence_state":"not_assessed","limitations":["no local symbol/reference producer output supplied","symbol/reference relationships remain not_assessed"],"privacy_review":"not_assessed"}
{"record_type":"producer-run","id":"producer-run-bigtop-runtime-not-assessed-20260601","producer_family":"runtime-observation","producer_tool":"runtime-observation-export","command":"operator did not provide a local runtime observation export","target_root":"/home/fall_out_bug/projects/bigtop-landscape","scope":{"repository":"landscape"},"status":"not_assessed","evidence_state":"not_assessed","limitations":["no runtime-visible local observation supplied","runtime topology remains not_assessed"],"privacy_review":"not_assessed"}

Portolan map summary excerpt:
{
  "graph": {
    "nodes": 171974,
    "edges": 148714,
    "evidence_states": {
      "metadata-visible": 267,
      "source-visible": 320421
    },
    "node_kinds": {
      "configuration": 23872,
      "package": 271,
      "repository": 18,
      "unknown": 147813
    }
  },
  "findings": {
    "total": null,
    "by_status": null,
    "by_evidence_state": null,
    "not_assessed_total": null
  },
  "coverage": {
    "records": null,
    "by_status": null,
    "by_evidence_state": null,
    "weak_records": null
  },
  "navigation": {
    "read_order": null,
    "do_not_open_first": null,
    "warnings": [
      "relationship sub-surfaces beyond Go imports and go.mod manifests are not implemented; placeholder findings are not_assessed",
      "duplication detection is OSS/tool-output backed; placeholder findings are not_assessed when no supported local duplication output is observed",
      "external ecosystem completeness is unknown without a manifest or explicit inventory",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/alluxio",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-airflow",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-flink",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-hadoop",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-hbase",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-hive",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-kafka",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-livy",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-oozie",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-phoenix",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-ranger",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-solr",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-spark",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-sqoop",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-tez",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-zeppelin",
      "repository discovery: repos child repository /home/fall_out_bug/projects/bigtop-landscape/repos/apache-zookeeper",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/alluxio/webui/master/npm-shrinkwrap.json: candidate file exceeds 1048576 byte native configuration limit",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/alluxio/webui/worker/npm-shrinkwrap.json: candidate file exceeds 1048576 byte native configuration limit",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-bigtop-repo/bigtop-packages/src/charm/zeppelin/layer-zeppelin/resources/flume-tutorial/note.json: cannot scan candidate file: bufio.Scanner: token too long",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-hbase/hbase-thrift/src/main/java/org/apache/hadoop/hbase/thrift/generated/Hbase.java: candidate file exceeds 1048576 byte native configuration limit",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-hbase/hbase-thrift/src/main/java/org/apache/hadoop/hbase/thrift2/generated/THBaseService.java: candidate file exceeds 1048576 byte native configuration limit",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-hive/standalone-metastore/metastore-common/src/gen/thrift/gen-javabean/org/apache/hadoop/hive/metastore/api/ThriftHiveMetastore.java: candidate file exceeds 1048576 byte native configuration limit",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-hive/standalone-metastore/metastore-common/src/gen/thrift/gen-py/hive_metastore/ThriftHiveMetastore.py: candidate file exceeds 1048576 byte native configuration limit",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-hive/standalone-metastore/metastore-common/src/gen/thrift/gen-py/hive_metastore/ttypes.py: candidate file exceeds 1048576 byte native configuration limit",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-kafka/group-coordinator/src/test/java/org/apache/kafka/coordinator/group/GroupMetadataManagerTest.java: candidate file exceeds 1048576 byte native configuration limit",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-ranger/agents-common/src/test/resources/policyengine/comparison/success/myServiceTags.json: cannot scan candidate file: bufio.Scanner: token too long",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-ranger/agents-common/src/test/resources/policyengine/comparison/success/otherServiceTags.json: cannot scan candidate file: bufio.Scanner: token too long",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-ranger/docs/src/site/resources/swagger-ui-bundle.js: candidate file exceeds 1048576 byte native configuration limit",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-ranger/docs/src/site/resources/swagger-ui-es-bundle-core.js: cannot scan candidate file: bufio.Scanner: token too long",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-ranger/docs/src/site/resources/swagger-ui-es-bundle.js: candidate file exceeds 1048576 byte native configuration limit",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-ranger/docs/src/site/resources/swagger-ui-standalone-preset.js: cannot scan candidate file: bufio.Scanner: token too long",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-ranger/docs/src/site/resources/swagger-ui.js: cannot scan candidate file: bufio.Scanner: token too long",
      "configuration detection: /home/fall_out_bug/projects/bigtop-landscape/repos/apache-ranger/ranger-tools/testdata/test_servicepolicies_hive.json: candidate file exceeds 1048576 byte native configuration limit"
    ]
  }
}
