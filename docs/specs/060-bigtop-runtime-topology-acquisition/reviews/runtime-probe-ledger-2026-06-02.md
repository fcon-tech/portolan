# Runtime Probe Ledger: Spec 060

Date: 2026-06-02
Target root: `/home/fall_out_bug/projects/bigtop-landscape`
Stress root: `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-060-runtime-topology`

## Probe Outputs

| ID | Surface | Command family | Status | Evidence state | Output | Result |
| --- | --- | --- | --- | --- | --- | --- |
| `runtime-probe-selection-20260602` | Portolan selection | `jq` | cannot_verify | cannot_verify | `tool-outputs/selection-runtime.tsv` | `runtime: null`, `tool_outputs: null`, `target_count: 15`; no selected runtime export exists. |
| `runtime-probe-existing-portolan-files-20260602` | Existing `.portolan` outputs | `find` | cannot_verify | cannot_verify | `tool-outputs/existing-portolan-files.txt` | Existing outputs include maps, context, producer/stress artifacts, but no selected runtime-visible Bigtop export was identified by this slice. |
| `runtime-probe-docker-20260602` | Docker containers/images/networks | `docker ps`, `docker images`, `docker network ls` | cannot_verify | cannot_verify | `tool-outputs/docker-ps.tsv`, `tool-outputs/docker-images.tsv`, `tool-outputs/docker-networks.tsv` | 5 running containers; none match Bigtop/Hadoop ecosystem runtime names. Running containers are Faust, bot, Tika, and minikube. |
| `runtime-probe-kubernetes-20260602` | Kubernetes context, namespaces, pods, services | `kubectl` | cannot_verify | cannot_verify | `tool-outputs/kubectl-current-context.txt`, `tool-outputs/kubectl-namespaces.txt`, `tool-outputs/kubectl-pods.txt`, `tool-outputs/kubectl-services.txt` | Current context is `minikube`; pod/service match count for Bigtop/Hadoop ecosystem runtime names is 0. |
| `runtime-probe-processes-20260602` | Local process list | `ps` | cannot_verify | cannot_verify | `tool-outputs/processes.txt` | Bigtop/Hadoop ecosystem name matches were kube-apiserver command flags or the probe command itself, not Bigtop runtime workloads. |

## Summary

`runtime-probe-summary.json` records:

- `selection_runtime`: `null`
- `selection_tool_outputs`: `null`
- `selection_target_count`: 15
- `docker_container_count`: 5
- `kubernetes_context`: `minikube`
- `bigtop_docker_matches`: 0
- `bigtop_kubernetes_pod_matches`: 0
- `bigtop_kubernetes_service_matches`: 0

## Classification

Bigtop runtime topology is `cannot_verify` for the inspected local surfaces.

This slice confirms that no Bigtop runtime observations were found in the
inspected local surfaces at probe time on 2026-06-02 in the probing user's local
Docker/Kubernetes/process context. It does not prove that no Bigtop runtime
could exist elsewhere, and it does not start or provision Bigtop.

Kubernetes itself is runtime-visible as a local minikube control plane, but it is
not Bigtop runtime topology. The Bigtop-specific pod and service match counts
are 0.

## Claim Boundary

Allowed:

- "No Bigtop runtime-visible observation was found in the inspected local Docker,
  Kubernetes, process, selection, or existing Portolan runtime surfaces."
- "Runtime topology is `cannot_verify` for the inspected local Bigtop surfaces."

Forbidden:

- "Bigtop runtime topology is verified."
- "Docker Compose or Helm static deployment models prove runtime topology."
- "The local minikube control plane is a Bigtop runtime."
- "Enterprise code-intelligence parity is verified."

## Privacy And Mutation Review

- No credentials were read.
- No target repositories were mutated.
- No Docker/Kubernetes state was changed.
- No Bigtop services were started.
- External outputs remain under the local Bigtop stress root; committed files
  contain summaries only.

## Output Integrity

The external stress root also contains:

- `tool-outputs/probe-output-sha256.txt`
- `tool-outputs/probe-output-sizes.txt`

These files record hashes and sizes for the runtime probe outputs used by this
ledger.
