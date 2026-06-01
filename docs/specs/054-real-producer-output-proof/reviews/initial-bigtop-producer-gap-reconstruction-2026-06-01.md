# Initial Bigtop Producer Gap Reconstruction

Date: 2026-06-01
Branch: `codex/054-bigtop-architecture-proof`
Target: `/home/fall_out_bug/projects/bigtop-landscape`
Stress run: `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof`

## Purpose

Record the first post-PR #31 evidence reconstruction for specs 054-056. This is
not an architecture-understanding proof. It identifies which real local producer
outputs are available, which are missing, and which claims must stay weak before
implementation planning.

## Decision Gate

- Simpler/Faster: use existing local producer tools and existing Bigtop files
  before adding Portolan scanners, wrappers, MCP tools, or dependencies.
- Blocking Edge Cases: producer outputs can be stale, partial, scoped to one
  repo, unsafe for public excerpts, or confused with runtime topology. Runtime
  topology cannot be inferred from static model outputs.
- Existing Open Source: local tools found include Syft, Semgrep, jscpd, Docker
  Compose, Helm, kubectl, Maven, `javap`, and `protoc`. Missing symbol/API
  tools include SCIP/LSIF, Sourcebot, Zoekt, ctags, OpenAPI generator, and
  Swagger codegen.

## Local Tool Inventory

| Tool family | Local state | Evidence state | Notes |
| --- | --- | --- | --- |
| Cursor Agent / Composer 2.5 | available | verified | `cursor-agent --version` returned `2026.05.28-a70ca7c` |
| Syft/CycloneDX | available | verified | `syft version` returned `1.44.0`; already used in prior stress lanes |
| Semgrep | available | not_assessed | `semgrep --version` returned `1.164.0`; no fresh output generated in this reconstruction |
| jscpd | available | not_assessed | `jscpd --version` returned `4.2.4`; no fresh output generated in this reconstruction |
| Docker Compose | available | verified | `docker compose config` produced a deployment/model output |
| Helm | available | verified | `helm template` produced a deployment/model output |
| protoc | available | verified | `protoc` produced a protobuf descriptor output |
| OpenAPI/Swagger generators | not found | not_assessed | `openapi-generator` and `swagger-codegen` were not installed |
| Symbol-index producers | not found | not_assessed | `scip`, `scip-lsif`, Sourcebot, Zoekt, ctags, and universal-ctags were not installed |
| Runtime observation source | not found | not_assessed | No local runtime-visible observation artifact was identified |

## Bigtop Surface Inventory

| Surface | Count | Interpretation |
| --- | ---: | --- |
| Repository directories | 18 | Full landscape repo inventory under `repos/` |
| `.proto` files | 261 | Strong API/RPC producer-input candidate, not runtime topology |
| `.thrift` files | 12 | API/RPC producer-input candidate |
| OpenAPI/Swagger-named files | 30 | API/catalog candidate; needs parsing and scope verification |
| Docker Compose files | 53 | Deployment/model candidate; static model only |
| Dockerfiles | 83 | Deployment/container build candidate; static model only |
| Helm `Chart.yaml` files | 7 | Deployment/model candidate; static model only |
| Kustomization files | 8 | Deployment/model candidate; static model only |
| Java files | 65,462 | Symbol/reference producer needed for meaningful code navigation |
| Python files | 9,494 | Symbol/reference producer needed for meaningful code navigation |
| Scala files | 7,540 | Symbol/reference producer needed for meaningful code navigation |
| PHP files | 1,132 | Symbol/reference producer needed for meaningful code navigation |

## Fresh Portolan Context Baseline

Command:

```bash
go run ./cmd/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof/context \
  --profile cursor \
  --force
```

Result:

- Context pack written: verified.
- `repos.json` records 18 repositories: verified by inspection.
- `evidence-index.jsonl`: 136 records.
- `gaps.jsonl`: 10 records.
- `tool-registry.json`: no detected existing tool outputs.
- Gaps include `symbol-index`, `openapi`, `backstage`, `asyncapi`,
  `structurizr`, `semgrep`, `jscpd`, `cyclonedx`, and external completeness.

## Real Producer Attempts

### Docker Compose Deployment/Model Output

Initial command without environment failed:

```bash
docker compose -f repos/apache-bigtop-repo/provisioner/docker/docker-compose.yml config --format json
```

Failure reason:

- `DOCKER_IMAGE` was unset.
- `MEM_LIMIT` was unset and produced an invalid empty `mem_limit`.

Retry with explicit placeholder environment succeeded:

```bash
DOCKER_IMAGE=apache/bigtop-placeholder MEM_LIMIT=1g \
  docker compose -f repos/apache-bigtop-repo/provisioner/docker/docker-compose.yml \
  config --format json \
  > .portolan/stress/20260601-054-initial-proof/tool-outputs/apache-bigtop-compose.config.json
```

Evidence:

- Output path: `.portolan/stress/20260601-054-initial-proof/tool-outputs/apache-bigtop-compose.config.json`
- Size: 1,539 bytes.
- Services: `bigtop`.
- Networks: `default`.
- Evidence state: verified as deployment/model output.
- Boundary: static deployment model only; runtime topology remains
  `not_assessed`.

### Helm Deployment/Model Output

Command:

```bash
helm template alluxio-monitor \
  repos/alluxio/integration/kubernetes/helm-chart/monitor \
  > .portolan/stress/20260601-054-initial-proof/tool-outputs/alluxio-monitor.helm-template.yaml
```

Evidence:

- Output path: `.portolan/stress/20260601-054-initial-proof/tool-outputs/alluxio-monitor.helm-template.yaml`
- Size: 18,475 bytes.
- Rendered resources: 9.
- Resource kinds: ConfigMap, Deployment, Role, RoleBinding, Service,
  ServiceAccount.
- Evidence state: verified as deployment/model output.
- Boundary: static Kubernetes model only; runtime topology remains
  `not_assessed`.

### Protobuf API Descriptor Output

Command:

```bash
protoc \
  -I repos/alluxio/core/transport/src/main/proto \
  --include_imports \
  --descriptor_set_out=.portolan/stress/20260601-054-initial-proof/tool-outputs/alluxio-grpc.descriptor.pb \
  repos/alluxio/core/transport/src/main/proto/grpc/common.proto \
  repos/alluxio/core/transport/src/main/proto/grpc/block_master.proto
```

Evidence:

- Output path: `.portolan/stress/20260601-054-initial-proof/tool-outputs/alluxio-grpc.descriptor.pb`
- Size: 11,714 bytes.
- Evidence state: verified as API/RPC model output.
- Boundary: bounded Alluxio gRPC descriptor only; not full Bigtop API/catalog
  coverage and not runtime topology.

## Current Proof State

verified:

- PR #31 is merged and the post-map navigation index is on `main`.
- Specs 054, 055, and 056 exist as separate draft slices.
- Bigtop has real candidate surfaces for API/model/runtime-adjacent evidence.
- Three real non-Syft producer-output attempts succeeded:
  Docker Compose config, Helm template, and protoc descriptor.

not_assessed:

- Symbol/reference producer output for Java/Scala/Python/PHP.
- Complete API/catalog/model coverage across all 18 repositories.
- Runtime topology from runtime-visible observations.
- Cursor + Composer 2.5 answer quality using the new producer outputs.
- Whether Portolan has enough importer/normalizer support for these outputs.

blocked or failed:

- Initial Docker Compose config attempt failed without explicit environment.
  This is fixed for the bounded output by using placeholder env values, but it
  shows that producer runs need command provenance and environment capture.
- Symbol-index producers are currently unavailable locally.

## Next Planning Implications

Spec 054 should plan a minimal importer/registry path for externally generated
producer outputs before attempting architecture proof:

1. record producer-run metadata for outputs generated outside Portolan;
2. surface protobuf/API and deployment/model outputs in context packs without
   claiming runtime behavior;
3. run Cursor + Composer 2.5 on the refreshed context and compare against the
   Syft/CycloneDX-only baseline;
4. keep symbol/reference and runtime topology as `not_assessed` until real
   local outputs exist.
