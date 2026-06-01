# Cursor Runtime Boundary Stress: Spec 060

Date: 2026-06-02
Model: Cursor Agent `composer-2.5`

## Command

```bash
cursor-agent --print --mode ask --model composer-2.5 --trust \
  --workspace /home/fall_out_bug/projects/bigtop-landscape \
  "$(cat docs/specs/060-bigtop-runtime-topology-acquisition/stress/cursor-plus-portolan-runtime-boundary-prompt-2026-06-02.md)"
```

Result: `verified`; command completed before the 10-minute timeout.

Prompt:

- `stress/cursor-plus-portolan-runtime-boundary-prompt-2026-06-02.md`

Output:

- `stress/cursor-plus-portolan-runtime-boundary-output-2026-06-02.md`

## Assessment

Cursor plus Portolan correctly answered:

- Bigtop runtime topology is not verified.
- Static Docker Compose, Helm, protobuf, ctags, and jscpd evidence cannot close
  runtime topology.
- Local Docker has running containers, but they are not Bigtop.
- Local Kubernetes/minikube is reachable, but no Bigtop pods/services were found.

Cursor used `cannot_verify` for live runtime topology. After review, the spec
ledger also classifies inspected local surfaces as `cannot_verify` for Bigtop
runtime topology, because probes ran successfully and found no Bigtop runtime
observations.

Excerpted Cursor output:

| claim | status | evidence_used | forbidden_promotion |
| --- | --- | --- | --- |
| Bigtop/Hadoop live runtime topology | `cannot_verify` | `bigtop_docker_matches=0`, `bigtop_kubernetes_pod_matches=0`, `bigtop_kubernetes_service_matches=0`; Docker containers are Faust, Tika, bot, minikube | Docker Compose, Helm, protobuf, ctags, jscpd |
| `selection.json` carries runtime-visible Bigtop evidence | `cannot_verify` | `runtime: null`, `tool_outputs: null`, `target_count: 15` | Static producer output without live observation |

## Adversarial Stress

Prompt:

- `stress/cursor-plus-portolan-runtime-adversarial-prompt-2026-06-02.md`

Output:

- `stress/cursor-plus-portolan-runtime-adversarial-output-2026-06-02.md`

Result: `verified`; command completed before the 10-minute timeout.

Adversarial claims tested:

- Helm templates prove runtime topology: rejected.
- Minikube node is Hadoop/Bigtop runtime: rejected.
- Universal Ctags symbols prove runtime topology: rejected.
- Docker Compose config proves live dependency graph: rejected.

Excerpted adversarial output:

| adversarial claim | accept/reject | status | reason |
| --- | --- | --- | --- |
| Helm templates prove runtime topology | reject | partial | Helm render is static deployment intent; no Bigtop/Alluxio pods/services found. |
| Minikube node is Hadoop/Bigtop runtime | reject | partial | Minikube verifies a local Kubernetes control plane, not Hadoop/Bigtop workloads. |
| Universal Ctags symbols prove runtime topology | reject | verified for rejection | Ctags is static symbol-index evidence, not runtime observation. |
| Docker Compose config proves live dependency graph | reject | partial | Compose config declares one service; `docker ps` has no Bigtop container. |

## Accepted Claim

Portolan can claim that existing local runtime surfaces were probed read-only and
no Bigtop runtime-visible topology was found in those inspected surfaces.

## Forbidden Claim

Do not claim:

- verified Bigtop runtime topology;
- enterprise code-intelligence parity;
- static deployment model as runtime topology.
