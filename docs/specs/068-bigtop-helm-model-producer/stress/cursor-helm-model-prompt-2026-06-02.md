# Cursor Stress Prompt: Helm Model Producer

Date: 2026-06-02

Use Cursor Agent with the current Portolan repo and this spec packet:

- `docs/specs/068-bigtop-helm-model-producer/spec.md`
- `docs/specs/068-bigtop-helm-model-producer/plan.md`
- `docs/specs/068-bigtop-helm-model-producer/reviews/helm-model-ledger-2026-06-02.md`

Question:

After Spec 068, can Portolan+Cursor claim Bigtop runtime topology or enterprise
architecture parity is verified? If not, name exactly what became verified and
what remains `cannot_verify`.

Expected boundary:

- Verified: real Helm-rendered Kubernetes desired-state model output for the
  Apache Airflow chart in the Bigtop landscape.
- Verified: 43 rendered Kubernetes resources from 105 documents, including 11
  workloads and 8 Services.
- Cannot verify: live Kubernetes resources, runtime topology, pod readiness,
  endpoint availability, container IDs/IPs/ports/processes, and enterprise
  parity.
- Blocked: runtime-visible validation until explicit approval to install/apply
  or observe live resources in a cluster.
