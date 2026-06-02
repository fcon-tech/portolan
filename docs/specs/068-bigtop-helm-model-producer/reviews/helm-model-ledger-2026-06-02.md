# Helm Model Ledger: Spec 068

Date: 2026-06-02
External output root:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-068-helm-model-producer/tool-outputs`

## Tool Availability

verified:

```text
Helm v3.19.4+g7cfb6e4
```

Helm is the OSS producer. No Portolan-owned Helm renderer was implemented.

## Producer Inputs

verified:

- Chart path:
  `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-airflow/chart`
- Release name: `portolan-airflow`
- Namespace: `portolan-airflow`
- Source metadata copied externally: `Chart.yaml`, `Chart.lock`,
  `values.yaml`.

## Producer Results

verified:

```text
producer	exit_code	output_bytes	stderr_bytes
airflow-helm-template	0	94560	0
```

No stderr was emitted by the successful Helm template run.

## Resource Summary

verified:

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

- The resource kind counts sum to 43 Kubernetes resources.
- The rendered output contains 105 nonempty YAML document segments. Of those,
  62 are Helm-rendered non-resource/comment/template artifacts and are not
  counted as Kubernetes resources.

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

## Output Integrity

verified:

- `sha256.txt` records hashes for rendered manifests, chart metadata copies,
  summaries, stderr, and exit-code files.
- `sizes.txt` records byte sizes for generated outputs.

## Claim Boundary

verified:

- Real Helm-rendered Kubernetes desired-state model output exists for Apache
  Airflow in the local Bigtop landscape.

cannot_verify:

- Live Kubernetes resources.
- Runtime topology.
- Pod readiness, endpoint availability, container IDs, IPs, ports, and process
  state.
- Enterprise architecture parity.

blocked:

- Runtime-visible validation requires explicit approval to apply/install or
  otherwise observe live resources in a cluster. This slice does not request or
  imply that approval.
