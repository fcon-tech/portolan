# Cursor Stress Prompt: Runtime Execution Gate

Date: 2026-06-02

Use Cursor Agent with the current Portolan repo and this spec packet:

- `docs/specs/065-bigtop-runtime-capture-execution-gate/spec.md`
- `docs/specs/065-bigtop-runtime-capture-execution-gate/plan.md`
- `docs/specs/065-bigtop-runtime-capture-execution-gate/reviews/runtime-execution-gate-ledger-2026-06-02.md`
- Previous runtime specs 060, 061, and 062.

Question:

Can Portolan claim Bigtop runtime topology is verified after this slice? If not,
name the exact evidence boundary, rejected substitutes, and the next action that
would be required to produce runtime-visible evidence.

Expected boundary:

- Preserve Bigtop runtime topology as `cannot_verify`.
- Treat Docker/Kubernetes/process absence as verified blocker evidence, not
  topology proof.
- Treat runbook existence, Docker Compose files, Helm charts, Puppet manifests,
  ctags, Semgrep, and SBOM outputs as insufficient for runtime topology.
- Name explicit runtime execution approval before `docker-hadoop.sh --create 1`
  as the next required action.
