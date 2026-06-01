# Producer Run Ledger: Spec 057

Date: 2026-06-02
Target root: `/home/fall_out_bug/projects/bigtop-landscape`
Stress root: `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-057-producer-expansion`

## Verified Producer Outputs

| ID | Family | Tool / version | Status | Evidence state | Scope | Output | Validation | Privacy review | Limitations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `producer-run-alluxio-all-protos-20260602` | bounded protobuf API schema/catalog | `protoc` / `libprotoc 35.0` | verified | metadata-visible | 27 Alluxio proto files under `repos/alluxio/core/transport/src/main/proto`; this supersets the bounded 2-file spec 054 protoc proof | `tool-outputs/alluxio-all-protos.descriptor.pb`, `tool-outputs/alluxio-proto-files.txt` | `protoc --decode_raw` passed; descriptor size 94,268 bytes | no credentials or private target names; committed ledger stores paths and summary only | Static descriptor only; not runtime calls; not full Bigtop API catalog. |
| `producer-run-alluxio-helm-chart-alluxio-20260602` | deployment-model | `helm` / `v3.19.4` | verified | metadata-visible | `repos/alluxio/integration/kubernetes/helm-chart/alluxio` | `tool-outputs/repos-alluxio-integration-kubernetes-helm-chart-alluxio.helm-template.yaml` | `helm template` exited 0; output size 21,988 bytes | no credentials or private target names; committed ledger stores paths and summary only | Static rendered template only; not runtime topology. |
| `producer-run-alluxio-helm-chart-monitor-20260602` | deployment-model | `helm` / `v3.19.4` | verified | metadata-visible | `repos/alluxio/integration/kubernetes/helm-chart/monitor` | `tool-outputs/repos-alluxio-integration-kubernetes-helm-chart-monitor.helm-template.yaml` | `helm template` exited 0; output size 18,644 bytes | no credentials or private target names; committed ledger stores paths and summary only | Static monitoring chart template only; not runtime topology. |
| `producer-run-alluxio-operator-chart-alluxio-20260602` | deployment-model | `helm` / `v3.19.4` | verified | metadata-visible | `repos/alluxio/integration/kubernetes/operator/alluxio/charts/alluxio-repo/alluxio` | `tool-outputs/repos-alluxio-integration-kubernetes-operator-alluxio-charts-alluxio-repo-alluxio.helm-template.yaml` | `helm template` exited 0; output size 18,214 bytes | no credentials or private target names; committed ledger stores paths and summary only | Static rendered template only; not runtime topology. |
| `producer-run-alluxio-operator-chart-pillars-20260602` | deployment-model | `helm` / `v3.19.4` | verified | metadata-visible | `repos/alluxio/integration/kubernetes/operator/alluxio/charts/pillars/pillars` | `tool-outputs/repos-alluxio-integration-kubernetes-operator-alluxio-charts-pillars-pillars.helm-template.yaml` | `helm template` exited 0; output size 28,616 bytes | no credentials or private target names; committed ledger stores paths and summary only | Static rendered template only; not runtime topology. |
| `producer-run-bigtop-jscpd-tests-20260602` | duplication | `jscpd` / `4.2.4` | verified | metadata-visible | `apache-bigtop-repo/bigtop-tests` and `apache-bigtop-repo/bigtop-test-framework` | `tool-outputs/jscpd-bigtop-tests/jscpd-report.json` | `jq empty` passed; output size 696,656 bytes | no credentials or private target names; committed ledger stores paths and summary only | Exact clone report in bounded test/framework scope; not architecture topology, dependency evidence, design recovery, or runtime layout. |

## Partial Producer Outputs

| ID | Family | Tool / version | Status | Evidence state | Scope | Output | Validation | Privacy review | Limitations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `producer-run-airflow-go-sdk-gopls-symbols-20260602` | bounded file symbol listing | `gopls` | partial | metadata-visible | 5 selected files in `apache-airflow/go-sdk` | `tool-outputs/gopls-airflow-go-sdk-selected-symbols.txt`, `tool-outputs/gopls-airflow-go-sdk-selected-status.tsv` | status TSV structure passed; all 5 selected files returned symbols | no credentials or private target names; committed ledger stores paths and summary only | File-symbol listing only; not cross-reference graph; not full Bigtop symbol/reference coverage. This does not satisfy the full symbol/reference blocker in FR-006. |

## Blocked Or Not Assessed Producer Outputs

| ID | Family | Tool | Status | Evidence state | Reason |
| --- | --- | --- | --- | --- | --- |
| `producer-run-alluxio-operator-chart-alluxio-job-20260602` | deployment-model | `helm` | blocked | cannot_verify | `helm template` failed with nil pointer at `alluxio-job/templates/job.yaml:51:27`; stderr retained under `tool-outputs/...alluxio-job.helm-template.stderr`. |
| `producer-run-bigtop-semgrep-auto-20260602` | static-analysis/security | `semgrep` | blocked | cannot_verify | `semgrep --config auto --metrics off` failed: auto config requires metrics or a specific local config. No repo-local Semgrep config was found under `apache-bigtop-repo`. Registry/default configs were not attempted because they would require remote rule resolution or telemetry that is outside this local-first slice. |
| `producer-run-bigtop-runtime-20260602` | runtime-observation | runtime export | not_assessed | not_assessed | No selected Bigtop runtime observation export; `/home/fall_out_bug/projects/bigtop-landscape/selection.json` has `runtime: null`; running Docker containers are unrelated to Bigtop. |
| `producer-run-bigtop-full-symbol-reference-20260602` | symbol-index | ctags/LSIF/global | not_assessed | not_assessed | No installed full symbol/reference producer such as ctags/LSIF was available; gopls output is bounded to selected Go files only. |

## Commands

```bash
protoc -I "$PROTO_ROOT" --include_imports --descriptor_set_out="$OUT/alluxio-all-protos.descriptor.pb" $(cat "$OUT/alluxio-proto-files.txt")
helm template <release> <chart>
jscpd "$ROOT/repos/apache-bigtop-repo/bigtop-tests" "$ROOT/repos/apache-bigtop-repo/bigtop-test-framework" --reporters json --output "$OUT/jscpd-bigtop-tests" --silent
semgrep --config auto --json --timeout 120 --metrics off --exclude .git --exclude build --exclude target "$ROOT/repos/apache-bigtop-repo"
gopls symbols <selected-go-file>
docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}'
jq '.runtime, .tool_outputs' /home/fall_out_bug/projects/bigtop-landscape/selection.json
```

## Summary

Spec 057 materially expands real producer evidence beyond Syft/CycloneDX:

- expanded API/catalog descriptor coverage from 2 proto files to 27 Alluxio
  proto files, as a bounded protobuf schema/catalog surface;
- deployment/model coverage from 1 Alluxio monitor chart to 4 verified Alluxio
  chart templates plus 1 chart blocker;
- duplication evidence through jscpd on bounded Bigtop test/framework scope;
- bounded symbol-index evidence through gopls for selected Airflow Go SDK files.

The jscpd output is code-similarity evidence only; it is not architecture,
dependency, or design recovery evidence. Spec 057 still does not verify real
Bigtop runtime topology, full Bigtop symbol or reference graph, or full
enterprise code intelligence parity.
