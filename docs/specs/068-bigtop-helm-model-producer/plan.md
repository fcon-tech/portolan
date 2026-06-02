# Implementation Plan: Bigtop Helm Model Producer

**Branch**: `codex/068-bigtop-helm-model-producer`

**Spec**: `docs/specs/068-bigtop-helm-model-producer/spec.md`

## Summary

Use Helm's `template` producer to render the Apache Airflow chart from the local
Bigtop landscape into Kubernetes desired-state model output without contacting a
cluster.

## Decision Gate

- **Simpler/Faster**: Count chart templates or read `Chart.yaml`. Rejected
  because raw chart files are source-visible inputs, while `helm template` is a
  real OSS producer output.
- **Blocking Edge Cases**: Rendered manifests are desired-state metadata. They
  do not prove any pod, Service, endpoint, port, process, or dependency is live.
  Helm install/upgrade/apply would mutate cluster state and is out of scope.
- **Existing Open Source**: Use Helm v3.19.4. Do not implement a Helm renderer
  in Portolan.

## Scope

In scope:

- Helm template render of Apache Airflow chart.
- Resource kind, workload, and Service summaries.
- Hashes and sizes for output integrity.
- Cursor boundary stress and independent review.

Out of scope:

- Helm install/upgrade.
- Kubernetes cluster contact.
- Runtime topology validation.
- Portolan Helm importer implementation.

## External Outputs

External output root:

```text
/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-068-helm-model-producer/tool-outputs/
```

Key files:

- `airflow-helm-template.yaml`
- `airflow-helm-template.stderr.txt`
- `airflow-helm-template.exit-code.txt`
- `helm-run-summary.tsv`
- `helm-resource-kind-counts.tsv`
- `helm-resources.tsv`
- `helm-workloads.tsv`
- `helm-service-surfaces.tsv`
- `helm-summary.json`
- `sha256.txt`
- `sizes.txt`

## Producer Results

verified:

```text
producer	exit_code	output_bytes	stderr_bytes
airflow-helm-template	0	94560	0
```

Resource kind counts:

```text
kind	count
ConfigMap	3
Deployment	5
Job	2
Role	2
RoleBinding	2
Secret	7
Service	8
ServiceAccount	10
StatefulSet	4
```

Workload surfaces:

```text
Deployment	portolan-airflow-api-server	apps/v1
Deployment	portolan-airflow-dag-processor	apps/v1
Deployment	portolan-airflow-otel-collector	apps/v1
Deployment	portolan-airflow-scheduler	apps/v1
Deployment	portolan-airflow-statsd	apps/v1
StatefulSet	portolan-airflow-postgresql	apps/v1
StatefulSet	portolan-airflow-redis	apps/v1
StatefulSet	portolan-airflow-triggerer	apps/v1
StatefulSet	portolan-airflow-worker	apps/v1
Job	portolan-airflow-create-user	batch/v1
Job	portolan-airflow-run-airflow-migrations	batch/v1
```

Service surfaces:

```text
Service	portolan-airflow-postgresql-hl	v1
Service	portolan-airflow-postgresql	v1
Service	portolan-airflow-api-server	v1
Service	portolan-airflow-otel-collector	v1
Service	portolan-airflow-redis	v1
Service	portolan-airflow-statsd	v1
Service	portolan-airflow-triggerer	v1
Service	portolan-airflow-worker	v1
```

Summary:

```json
{
  "documents": 105,
  "raw_yaml_documents": 106,
  "nonempty_yaml_documents": 105,
  "empty_or_null_yaml_documents": 1,
  "non_resource_nonempty_documents": 62,
  "resources": 43,
  "service_surface_count": 8,
  "workload_count": 11
}
```

Interpretation:

- The kind counts sum to 43 Kubernetes resources.
- The rendered file has 105 nonempty YAML document segments; 62 nonempty
  segments are Helm-rendered non-resource/comment/template artifacts and are not
  counted as Kubernetes resources.

## Evidence Boundary

verified:

- Real Helm-rendered Kubernetes desired-state model output exists for the
  Airflow chart in the local Bigtop landscape.

cannot_verify:

- Live Kubernetes resources.
- Runtime topology.
- Pod readiness, endpoint availability, container IDs, IPs, ports, and process
  state.
- Enterprise architecture parity.

## Verification

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
