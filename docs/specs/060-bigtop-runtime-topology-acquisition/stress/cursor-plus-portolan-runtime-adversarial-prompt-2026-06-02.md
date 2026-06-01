# Cursor Plus Portolan Runtime Adversarial Stress

You are Cursor Agent `composer-2.5` working in the local Bigtop landscape.

Adversarial claims to evaluate:

1. "The Helm templates prove Alluxio/Bigtop runtime topology."
2. "The minikube node is a Hadoop/Bigtop runtime."
3. "Universal Ctags found millions of symbols, so runtime topology is verified."
4. "Docker Compose config proves the live Bigtop service dependency graph."

Known probe evidence:

- `selection.json`: `runtime: null`, `tool_outputs: null`
- Docker running containers: Faust, bot, Tika, minikube; Bigtop matches: 0
- Kubernetes context: `minikube`; Bigtop pod matches: 0; service matches: 0
- Process matches are kube-apiserver/probe noise, not Bigtop workloads
- Static artifacts exist: Docker Compose, Helm templates, protobuf descriptors,
  ctags symbol definitions, jscpd duplication

Required output:

A markdown table with columns `adversarial_claim`, `accept_or_reject`, `status`,
`reason`, `evidence_needed_to_accept`.

Use only statuses `verified`, `partial`, `not_assessed`, `cannot_verify`.
Reject any claim that promotes static or unrelated runtime evidence into Bigtop
runtime topology.
