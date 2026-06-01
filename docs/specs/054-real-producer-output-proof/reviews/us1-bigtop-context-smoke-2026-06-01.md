# US1 Bigtop Context Smoke: Producer Run Records

Date: 2026-06-01
Branch: `codex/054-bigtop-architecture-proof`

## Scope

Validate User Story 1 for spec 054: selected local producer-run JSONL records
can be read into a fresh Bigtop context pack, while unavailable symbol/reference
and runtime topology evidence remains weak.

## Inputs

Target root:

```text
/home/fall_out_bug/projects/bigtop-landscape
```

Selected producer-run input:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/producer-runs.jsonl
```

Referenced local outputs:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof/tool-outputs/apache-bigtop-compose.config.json
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof/tool-outputs/alluxio-monitor.helm-template.yaml
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof/tool-outputs/alluxio-grpc.descriptor.pb
```

## Verification

Command:

```bash
go test -count=1 ./internal/producerfamily ./internal/app
```

Result: `verified`; focused validator and app/context tests passed.

Command:

```bash
go run ./cmd/portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof/context --profile cursor --force
```

Result: `verified`; context pack was written successfully.

Context evidence:

- `evidence-index.jsonl`: 142 records.
- `gaps.jsonl`: 11 records.
- `producer-run` records surfaced: 5.

Verified producer-run records:

| ID | Family | Tool | State | Boundary |
| --- | --- | --- | --- | --- |
| `producer-run-bigtop-compose-20260601` | `deployment-model` | `docker-compose` | `verified` / `metadata-visible` | Static Docker Compose config only; not runtime topology. |
| `producer-run-alluxio-helm-monitor-20260601` | `deployment-model` | `helm` | `verified` / `metadata-visible` | Static Kubernetes manifest rendering only; bounded to Alluxio monitor chart. |
| `producer-run-alluxio-grpc-descriptor-20260601` | `api-catalog` | `protoc` | `verified` / `metadata-visible` | Bounded protobuf descriptor only; not full Bigtop API catalog. |

Weak producer-run records:

| ID | Family | State | Reason |
| --- | --- | --- | --- |
| `producer-run-bigtop-symbol-index-not-assessed-20260601` | `symbol-index` | `not_assessed` | No local symbol/reference producer output supplied. |
| `producer-run-bigtop-runtime-not-assessed-20260601` | `runtime-observation` | `not_assessed` | No runtime-visible local observation supplied. |

Gap evidence preserved:

- `gap-symbol-index-not-assessed`: `not_assessed` / `not_assessed`
- `gap-runtime-observation-not-assessed`: `not_assessed` / `not_assessed`

Agent brief evidence:

- `Local producer run records: 5`
- The brief explicitly states that verified records describe externally
  generated outputs and Portolan did not execute them.

## Assessment

- US1 behavior: `verified`.
- Portolan execution boundary: `verified`; no producer execution wrapper was
  added for Docker, Helm, or protoc.
- Runtime topology: `not_assessed`; static Compose/Helm/protoc outputs do not
  prove runtime communication.
- Full symbol/reference evidence: `not_assessed`; no symbol-index output was
  supplied.
- Full Bigtop API/catalog/model coverage: `not_assessed`; protoc evidence is
  bounded to selected Alluxio descriptors.
- Cursor answer improvement: `not_assessed`; US3 has not run.

## Stop/Next

US1 can move forward to US2. The next slice should add bounded coverage summary
and answer-contract wording for producer-run outputs before Cursor stress.
